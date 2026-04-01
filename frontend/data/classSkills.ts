// data/classSkills.ts
// Clases de personaje JRPG + skills + fighters configurados con sprites locales

import { Skill } from '../types/combat'
import { StatusEffectRich } from '../engine/StatusEngine'

// ── Refs a assets locales ────────────────────────────────────────────────────
export const CHAR_SPRITES = {
  mage:    require('../assets/images/char_mage.png'),
  warrior: require('../assets/images/char_warrior.png'),
  rogue:   require('../assets/images/char_rogue.png'),
  archer:  require('../assets/images/char_archer.png'),
  banker:  require('../assets/images/char_banker.png'),
  kitsune: require('../assets/images/char_kitsune.png'),
} as const

export const BOSS_SPRITES = {
  credit_card:   require('../assets/images/boss_credit_card.png'),
  service:       require('../assets/images/boss_bill.png'),
  loan:          require('../assets/images/boss_loan.png'),
  overdraft:     require('../assets/images/boss_overdraft.png'),
  toka_despensa: require('../assets/images/boss_bill.png'),
  toka_fuel:     require('../assets/images/boss_overdraft.png'),
  toka_connect:  require('../assets/images/boss_credit_card.png'),
} as const

// ── Helpers de efectos ───────────────────────────────────────────────────────
const stunEffect:    StatusEffectRich = { type: 'stunned',     duration: 1 }
const shieldEffect:  StatusEffectRich = { type: 'shielded',    duration: 2 }
const shieldHeavy:   StatusEffectRich = { type: 'shielded',    duration: 3 }
const boostEffect:   StatusEffectRich = { type: 'blessed',     duration: 2 }
const boostLong:     StatusEffectRich = { type: 'strengthened',duration: 2, multiplier: 1.3 }
const poisonEffect:  StatusEffectRich = { type: 'poison',      duration: 3, value: 12 }
const regenEffect:   StatusEffectRich = { type: 'regenerating',duration: 2, value: 20 }
const frozenEffect:  StatusEffectRich = { type: 'frozen',      duration: 1 }
const focusEffect:   StatusEffectRich = { type: 'focused',     duration: 1 }

// ── Skills por clase ─────────────────────────────────────────────────────────
export const CLASS_SKILLS: Record<string, Skill[]> = {

  mage: [
    {
      id: 'frost_save', name: '❄️ Congelación de Gasto',
      manaCost: 20,
      effect:   frozenEffect,
      targetType: 'enemy',
      financialTrigger: 'savings_deposit',
    },
    {
      id: 'mana_shield', name: '🔵 Escudo de Maná',
      manaCost: 15,
      effect:   shieldEffect,
      targetType: 'self',
    },
    {
      id: 'xp_storm', name: '🌩️ Tormenta de XP',
      manaCost: 35, damage: 80,
      targetType: 'enemy',
      financialTrigger: 'goal_completed',
    },
  ],

  archer: [
    {
      id: 'dividend_arrow', name: '🏹 Flecha de Dividendo',
      manaCost: 25, damage: 60,
      targetType: 'enemy',
      financialTrigger: 'savings_deposit',
    },
    {
      id: 'longterm_shot', name: '🎯 Disparo a Largo Plazo',
      manaCost: 30, damage: 90,
      targetType: 'enemy',
    },
    {
      id: 'scout', name: '🔍 Reconocimiento',
      manaCost: 10,
      effect: focusEffect,
      targetType: 'self',
    },
  ],

  warrior: [
    {
      id: 'punctual_strike', name: '⚡ Golpe Puntual',
      manaCost: 20, damage: 70,
      targetType: 'enemy',
      financialTrigger: 'early_payment',
    },
    {
      id: 'iron_shield', name: '🛡️ Escudo de Hierro',
      manaCost: 15,
      effect: shieldHeavy,
      targetType: 'self',
    },
    {
      id: 'rally', name: '⚔️ Batalla Campal',
      manaCost: 40, damage: 100,
      targetType: 'enemy',
    },
  ],

  rogue: [
    {
      id: 'double_cashback', name: '💰 Doble Robo',
      manaCost: 20, damage: 50,
      targetType: 'enemy',
      financialTrigger: 'payment_made',
    },
    {
      id: 'smoke_screen', name: '💨 Cortina de Humo',
      manaCost: 15,
      effect: shieldEffect,
      targetType: 'self',
    },
    {
      id: 'backstab', name: '🗡️ Puñalada Trapera',
      manaCost: 35, damage: 120,
      targetType: 'enemy',
    },
  ],

  // ── NUEVAS CLASES ────────────────────────────────────────────────────────

  banker: [
    {
      id: 'compound_interest', name: '📈 Interés Compuesto',
      manaCost: 25, damage: 65,
      targetType: 'enemy',
      financialTrigger: 'savings_deposit',
    },
    {
      id: 'hedge_fund', name: '💼 Fondo de Cobertura',
      manaCost: 20,
      effect: shieldEffect,
      targetType: 'self',
    },
    {
      id: 'market_crash', name: '📉 Crash del Mercado',
      manaCost: 45, damage: 110,
      targetType: 'enemy',
      financialTrigger: 'goal_completed',
    },
  ],

  kitsune: [
    {
      id: 'spirit_coin', name: '🪙 Moneda del Espíritu',
      manaCost: 15, damage: 55,
      targetType: 'enemy',
      financialTrigger: 'payment_made',
    },
    {
      id: 'fox_barrier', name: '🦊 Barrera del Zorro',
      manaCost: 20,
      effect: regenEffect,
      heal: 20,
      targetType: 'self',
    },
    {
      id: 'yen_curse', name: '💮 Maldición del Yen',
      manaCost: 30,
      effect: poisonEffect,
      targetType: 'enemy',
      financialTrigger: 'budget_respected',
    },
  ],
}

// ── Fighters pre-configurados por clase ──────────────────────────────────────
export const CLASS_FIGHTERS = {
  mage: {
    id: 'player_mage',
    name: 'Mahōtsukai',
    class: 'mage' as const,
    hp: 120, maxHp: 120,
    mana: 80, maxMana: 80,
    stamina: 100, maxStamina: 100,
    attack: 55, defense: 10, speed: 8,
    statusEffects: [],
    skills: CLASS_SKILLS.mage,
    sprite: CHAR_SPRITES.mage,
  },
  warrior: {
    id: 'player_warrior',
    name: 'Samurai',
    class: 'warrior' as const,
    hp: 200, maxHp: 200,
    mana: 50, maxMana: 50,
    stamina: 100, maxStamina: 100,
    attack: 40, defense: 30, speed: 5,
    statusEffects: [],
    skills: CLASS_SKILLS.warrior,
    sprite: CHAR_SPRITES.warrior,
  },
  rogue: {
    id: 'player_rogue',
    name: 'Shinobi',
    class: 'rogue' as const,
    hp: 140, maxHp: 140,
    mana: 60, maxMana: 60,
    stamina: 100, maxStamina: 100,
    attack: 65, defense: 15, speed: 15,
    statusEffects: [],
    skills: CLASS_SKILLS.rogue,
    sprite: CHAR_SPRITES.rogue,
  },
  archer: {
    id: 'player_archer',
    name: 'Yushu',
    class: 'archer' as const,
    hp: 160, maxHp: 160,
    mana: 65, maxMana: 65,
    stamina: 100, maxStamina: 100,
    attack: 50, defense: 20, speed: 12,
    statusEffects: [],
    skills: CLASS_SKILLS.archer,
    sprite: CHAR_SPRITES.archer,
  },
  banker: {
    id: 'player_banker',
    name: 'Shōnin',
    class: 'mage' as const,
    hp: 130, maxHp: 130,
    mana: 90, maxMana: 90,
    stamina: 100, maxStamina: 100,
    attack: 48, defense: 18, speed: 10,
    statusEffects: [],
    skills: CLASS_SKILLS.banker,
    sprite: CHAR_SPRITES.banker,
  },
  kitsune: {
    id: 'player_kitsune',
    name: 'Kitsune',
    class: 'rogue' as const,
    hp: 150, maxHp: 150,
    mana: 75, maxMana: 75,
    stamina: 100, maxStamina: 100,
    attack: 52, defense: 22, speed: 13,
    statusEffects: [],
    skills: CLASS_SKILLS.kitsune,
    sprite: CHAR_SPRITES.kitsune,
  },
}

export type ClassKey = keyof typeof CLASS_FIGHTERS
