// types/combat.ts
// TokaVerse RPG — Tipos base del sistema de combate JRPG financiero

import type { Element } from './elements'
import type { StatusEffectRich } from '../engine/StatusEngine'

export type CharacterClass = 'mage' | 'archer' | 'warrior' | 'rogue' | 'banker' | 'kitsune'

export interface Fighter {
  id:             string
  name:           string
  class:          CharacterClass
  hp:             number
  maxHp:          number
  mana:           number
  maxMana:        number
  stamina?:       number   // barra de stamina para esquiva (Fase B)
  maxStamina?:    number
  attack:         number
  defense:        number
  speed:          number
  statusEffects:  StatusEffectRich[]
  skills:         Skill[]
  sprite?:        string | number
  element?:       Element   // elemento primario del jugador (auto-asignado por clase)
}

export interface Boss {
  id:              string
  name:            string
  debtType:        'credit_card' | 'service' | 'loan' | 'overdraft' | 'toka_despensa' | 'toka_fuel' | 'toka_connect'
  hp:              number
  maxHp:           number
  attack:          number
  defense:         number
  phase:           1 | 2 | 3 | 4
  phaseThresholds: [number, number, number, number]
  skills:          BossSkill[]
  weaknesses:      DebtWeakness[]
  sprite:          string | number
  debtAmount:      number
  statusEffects:   StatusEffectRich[]
  element?:        Element    // elemento primario del jefe
  secondaryElement?: Element  // elemento secundario
  bankruptcyUsed?: boolean    // flag para skill único de fase 4
  consecutiveHits?: number    // contador para mecánica "Cargo por mora"
  turnsWithoutCards?: number  // contador para "Oferta irresistible"
}

export interface Skill {
  id:               string
  name:             string
  manaCost:         number
  damage?:          number
  heal?:            number
  effect?:          StatusEffectRich
  targetType:       'enemy' | 'self' | 'all_enemies' | 'all_allies'
  financialTrigger?: FinancialAction
  element?:         Element   // elemento del skill (hereda del personaje si no se define)
}

export interface BossSkill {
  id:            string
  name:          string
  damage:        number
  effect?:       StatusEffectRich
  usableAtPhase: number[]
  element?:      Element
  telegraphMsg?: string   // mensaje de warning antes de ejecutar
}

export type FinancialAction =
  | 'payment_made'
  | 'savings_deposit'
  | 'budget_respected'
  | 'early_payment'
  | 'goal_completed'

export type DebtWeakness = {
  action:      FinancialAction
  multiplier:  number
}

export interface DebtData {
  id:           string
  type:         'credit_card' | 'service' | 'loan' | 'overdraft' | 'toka_despensa' | 'toka_fuel' | 'toka_connect'
  amount:       number
  daysOverdue:  number
  interestRate?: number
}

// ── Legacy StatusEffect (mantenido para compatibilidad de tipos internos) ──────
// Usar StatusEffectRich de StatusEngine para código nuevo
export type StatusEffect =
  | { type: 'poison';  duration: number; damagePerTurn: number }
  | { type: 'stun';    duration: number }
  | { type: 'shield';  duration: number; reduction: number }
  | { type: 'burn';    duration: number; damagePerTurn: number }
  | { type: 'boost';   duration: number; multiplier: number }
