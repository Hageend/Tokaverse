import { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { League, Tournament, Challenge, UserLeagueStats, UserProfile } from './models/League';

// Mock DB Temporal para Usuario
const users_db: Record<string, UserProfile> = {
  'user_123': {
    id: 'user_123',
    xp: 0,
    level: 1
  }
};

// Quests (Basados en Toka Products)
export const QUESTS = {
  'q_despensa': { id: 'q_despensa', name: '🛒 Compras de Despensa', points: 100 },
  'q_combustible': { id: 'q_combustible', name: '⛽ Carga de Gasolina', points: 150 },
  'q_connect': { id: 'q_connect', name: '📋 Comprobación de Gasto', points: 200 },
  'q_total': { id: 'q_total', name: '💰 Dispersión Recibida', points: 300 }
};

const END_DATE = Date.now() + (3 * 24 * 60 * 60 * 1000);

// Las 4 Ligas Oficiales (Rebrandeadas para Toka)
let leagues: League[] = [
  {
    id: 'league_1',
    name: 'Liga Cobre (Starter)',
    description: 'Empieza tu camino en Tokaverse descubriendo tus finanzas básicas.',
    tier: 'cobre',
    minLevel: 1,
    users: [],
    tournaments: [],
    ranking: [],
    endDate: END_DATE
  },
  {
    id: 'league_2',
    name: 'Liga Despensa Toka',
    description: 'Ahorradores consistentes optimizando sus vales de despensa.',
    tier: 'plata',
    minLevel: 2,
    users: [],
    tournaments: [],
    ranking: [],
    endDate: END_DATE
  },
  {
    id: 'league_3',
    name: 'Liga Corporativa Connect',
    description: 'Élite financiera. Control de viáticos y gastos operativos eficientes.',
    tier: 'oro',
    minLevel: 3,
    users: [],
    tournaments: [],
    ranking: [],
    endDate: END_DATE
  },
  {
    id: 'league_4',
    name: 'Liga Total Toka',
    description: 'Los reyes del Tokaverse. Máxima trazabilidad y privilegios VIP en dispersión.',
    tier: 'estrella',
    minLevel: 4,
    users: [],
    tournaments: [],
    ranking: [],
    endDate: END_DATE
  }
];

export async function leagueRoutes(fastify: FastifyInstance, io: Server) {
  const emitLeagueUpdated = (league: League) => io.emit('leagueUpdated', league);
  const emitUserUpdated = (profile: UserProfile) => io.emit('userUpdated', profile);

  // --- Perfil XP del Usuario ---
  fastify.get('/users/:id/profile', async (request) => {
    const { id } = request.params as { id: string };
    return users_db[id] || { id, xp: 0, level: 1 };
  });

  // --- Simular Transacciones Reales (Incremento de XP Global) ---
  fastify.post('/users/:id/transaction', async (request) => {
    const { id } = request.params as { id: string };
    const { amountXp, source } = request.body as { amountXp: number, source: string };

    if (!users_db[id]) {
      users_db[id] = { id, xp: 0, level: 1 };
    }

    const user = users_db[id];
    user.xp = Math.max(0, user.xp + amountXp);

    let leveledUp = false;
    // Logica RPG (Sincronizada con Frontend): 2.5k (Genin), 10k (Chunin), 35k (Jonin)
    const newLevel =
      user.xp >= 35000 ? 4 :
        user.xp >= 10000 ? 3 :
          user.xp >= 2500 ? 2 : 1;

    if (newLevel > user.level) {
      user.level = newLevel;
      leveledUp = true;
    }

    emitUserUpdated(user);

    return {
      success: true,
      xpGained: amountXp,
      newTotalXp: user.xp,
      currentLevel: user.level,
      msg: leveledUp ? `¡Subiste al Nivel ${user.level}!` : `+${amountXp} XP obtenidos.`
    };
  });

  // --- Ligas ---
  fastify.get('/leagues', async () => leagues);

  fastify.post('/leagues/:id/join', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.body as { userId: string };

    const league = leagues.find(l => l.id === id);
    
    // Auto-Inicializar si no existe (v0.2 Bug Fix)
    if (!users_db[userId]) {
      users_db[userId] = { id: userId, xp: 0, level: 1 };
    }
    const user = users_db[userId];

    if (!league) return reply.status(404).send({ success: false, message: 'Liga no encontrada' });

    // Validar Requisito de Nivel
    if (user.level < league.minLevel) {
      return reply.send({ success: false, message: `Requieres Nivel ${league.minLevel} para unirte.` });
    }

    if (!league.users.includes(userId)) {
      league.users.push(userId);
      const position = league.ranking.length + 1;
      league.ranking.push({ 
        userId, 
        leagueId: id, 
        points: 0, 
        position, 
        rewards: [],
        xp: user.xp,
        xpToNext: 2500 // Threshold para el siguiente nivel desde el inicio
      });
      emitLeagueUpdated(league);
      return { success: true, message: `Unido a la ${league.name} exitosamente.` };
    }

    return { success: false, message: 'Ya eres miembro de esta liga.' };
  });

  // Cumplir misión (Sube PUNTOS de liga Y XP GLOBAL)
  fastify.post('/leagues/:id/quests/complete', async (request) => {
    const { id } = request.params as { id: string };
    const { userId, questId } = request.body as { userId: string, questId: keyof typeof QUESTS };
    const league = leagues.find(l => l.id === id);

    const quest = QUESTS[questId];
    if (!quest) return { success: false, message: 'Misión inválida.' };

    const user = users_db[userId];
    if (league && user) {
      const stats = league.ranking.find(r => r.userId === userId);
      if (stats) {
        // 1. Puntos de Liga
        stats.points += quest.points;
        league.ranking.sort((a, b) => b.points - a.points).forEach((r, i) => (r.position = i + 1));
        emitLeagueUpdated(league);
        
        // 2. XP Global (Mismo que puntos de misión)
        user.xp += quest.points;
        const newLevel = 
          user.xp >= 35000 ? 4 :
            user.xp >= 10000 ? 3 :
              user.xp >= 2500 ? 2 : 1;
        
        if (newLevel > user.level) {
           user.level = newLevel;
        }
        emitUserUpdated(user);

        return { 
          success: true, 
          message: `¡Misión cumplida! +${quest.points} pts de Liga y +${quest.points} Global XP.`,
          level: user.level
        };
      }
    }
    return { success: false, message: 'Participación no encontrada.' };
  });

  fastify.post('/leagues/:id/resolve', async (request) => {
    const { id } = request.params as { id: string };
    const league = leagues.find(l => l.id === id);
    if (league) {
      league.ranking.sort((a, b) => b.points - a.points).forEach((r, i) => (r.position = i + 1));

      for (const stats of league.ranking) {
        if (stats.position === 1 && stats.points > 0) {
          stats.rewards.push('Corona Campeón');
        } else if (stats.position === 2 && stats.points > 0) {
          stats.rewards.push('Insignia SubCampeón');
        }
      }
      emitLeagueUpdated(league);
      return { success: true, message: 'Torneo cerrado. Recompensas entregadas.' };
    }
    return { success: false, message: 'Liga no encontrada' };
  });
}
