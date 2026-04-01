// types/combat.ts

export type CharacterClass = 'mage' | 'archer' | 'warrior' | 'rogue'

export interface Fighter {
  id: string
  name: string
  class: CharacterClass
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  attack: number
  defense: number
  speed: number
  statusEffects: StatusEffect[]
  skills: Skill[]
  sprite?: string | number   // string = URL, number = require('../assets/...')
}

export interface Boss {
  id: string
  name: string
  debtType: 'credit_card' | 'service' | 'loan' | 'overdraft' | 'toka_despensa' | 'toka_fuel' | 'toka_connect'
  hp: number
  maxHp: number
  attack: number
  defense: number
  phase: 1 | 2 | 3
  phaseThresholds: [number, number, number]
  skills: BossSkill[]
  weaknesses: DebtWeakness[]
  sprite: string | number    // string = URL, number = require('../assets/...')
  debtAmount: number
  statusEffects: StatusEffect[]   // efectos aplicados al jefe (stun, burn, etc.)
}

export interface Skill {
  id: string
  name: string
  manaCost: number
  damage?: number
  heal?: number
  effect?: StatusEffect
  targetType: 'enemy' | 'self' | 'all_enemies' | 'all_allies'
  financialTrigger?: FinancialAction
}

export interface BossSkill {
  id: string
  name: string
  damage: number
  effect?: StatusEffect
  usableAtPhase: number[]
}

export type StatusEffect =
  | { type: 'poison';  duration: number; damagePerTurn: number }
  | { type: 'stun';    duration: number }
  | { type: 'shield';  duration: number; reduction: number }
  | { type: 'burn';    duration: number; damagePerTurn: number }
  | { type: 'boost';   duration: number; multiplier: number }

export type FinancialAction =
  | 'payment_made'
  | 'savings_deposit'
  | 'budget_respected'
  | 'early_payment'
  | 'goal_completed'

export type DebtWeakness = {
  action: FinancialAction
  multiplier: number
}

export interface DebtData {
  id: string
  type: 'credit_card' | 'service' | 'loan' | 'overdraft' | 'toka_despensa' | 'toka_fuel' | 'toka_connect'
  amount: number
  daysOverdue: number
  interestRate?: number
}
