// utils/EnemyMapper.ts
// TokaVerse RPG — Transformador de enemigos simples a JRPG Bosses
import { SimpleEnemy } from '../store/useCombatStore';
import { Boss, BossSkill } from '../types/combat';

/**
 * Mapea un enemigo de la pestaña de Quests (SimpleEnemy) al formato completo de Jefe (Boss)
 * permitiendo que sea procesado por el motor TurnManager.
 */
export const EnemyMapper = {
  simpleToBoss: (enemy: SimpleEnemy): Boss => {
    // Definimos habilidades por defecto para mobs simples
    const defaultMobSkills: BossSkill[] = [
      {
        id: 'mob_attack',
        name: 'Ataque Directo',
        damage: enemy.attack,
        usableAtPhase: [1, 2, 3, 4],
        telegraphMsg: `💢 ${enemy.name} se prepara para embestir...`,
      },
      {
        id: 'mob_pressure',
        name: 'Presión de Gasto',
        damage: Math.floor(enemy.attack * 1.2),
        usableAtPhase: [2, 3, 4],
        telegraphMsg: `⚠️ ¡${enemy.name} está acumulando intereses!`,
      }
    ];

    // Mapeo de tipos de deuda basado en el bossType o ID del enemigo
    // Si no tiene uno asignado, usamos 'toka_despensa' como genérico
    const debtType = (enemy.bossType as any) || 'toka_despensa';

    return {
      id: enemy.id,
      name: enemy.name,
      debtType: debtType,
      hp: enemy.hp,
      maxHp: enemy.hp, // Initial hp is max hp for mobs
      attack: enemy.attack,
      defense: enemy.defense,
      phase: 1,
      // Los mobs simples tienen umbrales de fase simplificados (o ninguno)
      phaseThresholds: [75, 50, 25, 0],
      skills: defaultMobSkills,
      weaknesses: [
        { action: 'payment_made', multiplier: 1.5 },
        { action: 'budget_respected', multiplier: 1.2 }
      ],
      sprite: (enemy as any).sprite || 0, // Fallback si no tiene sprite (usará emoji en UI)
      debtAmount: enemy.hp * 10,           // Deuda ficticia para el log
      statusEffects: [],
      element: 'dark',                     // Elemento por defecto para mobs
    };
  }
};
