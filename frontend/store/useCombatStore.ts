// store/useCombatStore.ts
// TokaVerse — Sistema de Estado de Combate Unificado

import { create } from 'zustand';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type CombatPhase =
  | 'idle'
  | 'player_turn'
  | 'enemy_turn'
  | 'victory'
  | 'defeat'
  | 'death_sequence';

export type LogType =
  | 'hero_attack'
  | 'critical'
  | 'damage_received'
  | 'heal'
  | 'victory'
  | 'system';

export interface BattleLogEntry {
  id:      string;
  message: string;
  type:    LogType;
}

export type DamageKind = 'normal' | 'critical' | 'heal' | 'weakness';

export interface DamageEvent {
  id:     string;
  amount: number;
  kind:   DamageKind;
  target: 'hero' | 'enemy';
}

export interface SimpleEnemy {
  id:          string;
  name:        string;
  emoji:       string;
  hp:          number;
  maxHp:       number;
  attack:      number;
  defense:     number;
  xpReward:    number;
  bossType?:   string;   
  maxPhases?:  number;   
}

export const QUEST_ENEMIES: SimpleEnemy[] = [
  { id: 'e_gasto',    name: 'Gasto Impulsivo',    emoji: '🎰', hp: 80,  maxHp: 80,  attack: 12, defense: 4,  xpReward: 80,  bossType: 'toka_despensa', maxPhases: 2 },
  { id: 'e_mora',     name: 'Mora Acumulada',      emoji: '💸', hp: 120, maxHp: 120, attack: 18, defense: 6,  xpReward: 150, bossType: 'jefe_de_mora', maxPhases: 3 },
  { id: 'e_deuda',    name: 'Deuda Sombría',       emoji: '👾', hp: 200, maxHp: 200, attack: 25, defense: 10, xpReward: 250, bossType: 'deuda_sombria', maxPhases: 4 },
  { id: 'e_tarjeta',  name: 'Tarjeta Maldita',     emoji: '🃏', hp: 300, maxHp: 300, attack: 35, defense: 15, xpReward: 400, bossType: 'credit_card', maxPhases: 4 },
];

export const LOG_COLORS: Record<LogType, string> = {
  hero_attack:     '#fbbf24',
  critical:        '#f87171',
  damage_received: '#94a3b8',
  heal:            '#4ade80',
  victory:         '#c084fc',
  system:          'rgba(255,255,255,0.35)',
};

interface CombatState {
  // Estado básico
  currentEnemy:   SimpleEnemy | null;
  battleLog:      BattleLogEntry[];
  damageNumbers:  DamageEvent[];
  xpEarned:       number;

  // Actions (Solo para gestión visual y de logs)
  startCombat:      (enemy: SimpleEnemy) => void;
  resetCombat:      () => void;
  clearDamageEvent: (id: string) => void;
  addDamageEvent:   (amount: number, target: 'hero' | 'enemy', kind: DamageKind) => void;
  addLogMessage:    (message: string, type: LogType) => void;
}

function makeLogId()   { return `log_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; }
function makeDmgId()   { return `dmg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; }

export const useCombatStore = create<CombatState>((set, get) => ({
  currentEnemy:  null,
  battleLog:     [],
  damageNumbers: [],
  xpEarned:      0,

  startCombat(enemy) {
    set({
      currentEnemy:  enemy,
      battleLog: [{ id: makeLogId(), message: `⚔️ ¡${enemy.name} aparece!`, type: 'system' }],
      damageNumbers: [],
      xpEarned:      0,
    });
  },

  resetCombat() {
    set({
      currentEnemy: null, battleLog: [],
      damageNumbers: [], xpEarned: 0,
    });
  },

  clearDamageEvent(id) {
    set(s => ({ damageNumbers: s.damageNumbers.filter(d => d.id !== id) }));
  },
  
  addDamageEvent(amount: number, target: 'hero' | 'enemy', kind: DamageKind) {
    const dmgEvt: DamageEvent = { id: makeDmgId(), amount, kind, target };
    set(s => ({ damageNumbers: [...s.damageNumbers, dmgEvt] }));
  },

  addLogMessage(message, type) {
    const entry: BattleLogEntry = { id: makeLogId(), message, type };
    set(s => ({ battleLog: [...s.battleLog, entry].slice(-30) }));
  }
}));
