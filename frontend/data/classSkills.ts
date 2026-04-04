// data/classSkills.ts
// Clases de personaje JRPG + skills + fighters configurados con sprites locales

import { Skill } from '../types/combat'
import { StatusEffectRich } from '../engine/StatusEngine'

// ── Refs a assets locales ────────────────────────────────────────────────────
export const CHAR_SPRITES = {
  mage:     require('../assets/images/chars/char_mage.png'),
  warrior:  require('../assets/images/chars/char_warrior.png'),
  rogue:    require('../assets/images/chars/char_rogue.png'),
  archer:   require('../assets/images/chars/char_archer.png'),
  banker:   require('../assets/images/chars/char_banker.png'),
  kitsune:  require('../assets/images/chars/char_kitsune.png'),
  hacker:   require('../assets/images/chars/char_hacker.png'),
  knight:   require('../assets/images/chars/char_knigh.png'),
  thief:    require('../assets/images/chars/char_thief.png'),
  magedark: require('../assets/images/chars/char_magedark.png'),
  cat:      require('../assets/images/chars/char_cat.png'),
  dog:      require('../assets/images/chars/char_dog.png'),
  fox:      require('../assets/images/chars/char_fox.png'),
  elf:      require('../assets/images/chars/char_elf.png'),
  knigh_girl: require('../assets/images/chars/char_knigh_girl.png'),
  knigh_red: require('../assets/images/chars/char_knigh_red.png'),
  leona:    require('../assets/images/chars/char_leona.png'),
  maid:     require('../assets/images/chars/char_maid.png'),
  mermaid:  require('../assets/images/chars/char_mermaid.png'),
  santa:    require('../assets/images/chars/char_santa.png'),
  witch:    require('../assets/images/chars/char_witch.png'),
  hero_base: require('../assets/images/chars/char_hero.png'),
} as const

export const BOSS_SPRITES = {
  credit_card:   require('../assets/images/bosses/boss_credit_card.png'),
  service:       require('../assets/images/bosses/boss_bill.png'),
  loan:          require('../assets/images/bosses/boss_loan.png'),
  overdraft:     require('../assets/images/bosses/boss_overdraft.png'),
  toka_despensa: require('../assets/images/bosses/boss_bill.png'),
  toka_fuel:     require('../assets/images/bosses/boss_overdraft.png'),
  toka_connect:  require('../assets/images/bosses/boss_credit_card.png'),
  abyss:         require('../assets/images/bosses/boss_abyss.png'),
  golem:         require('../assets/images/bosses/boss_golem.png'),
  tickets:       require('../assets/images/bosses/boss_tickets.png'),
  cash:          require('../assets/images/bosses/boss_cash.png'),
} as const

export const MINION_SPRITES = {
  bill:        require('../assets/images/bosses/minion_bill.png'),
  credit_card: require('../assets/images/bosses/minion_credit_card.png'),
  loan:        require('../assets/images/bosses/minion_loan.png'),
  overdraft:   require('../assets/images/bosses/minion_overdraft.png'),
} as const

export const ITEM_SPRITES = {
  potion:          require('../assets/images/items/item_potion_HP.png'),
  potion_energy:   require('../assets/images/items/item_potion_energy.png'),
  potion_mana:     require('../assets/images/items/item_potion_mana.png'),
  potion_strong:   require('../assets/images/items/item_potion_strong.png'),
  ring_mana:       require('../assets/images/items/item_ring_mana.png'),
  ring_shield:     require('../assets/images/items/item_ring_shield.png'),
  ring_strong:     require('../assets/images/items/item_ring_strong.png'),
  ritual_incense:  require('../assets/images/items/item_ritual_incense.png'),
  shield:          require('../assets/images/items/item_shield.png'),
  shield_chest:    require('../assets/images/items/item_shield_chest.png'),
  shield_elemental:require('../assets/images/items/item_shield_elemental.png'),
  sword:           require('../assets/images/items/item_sword.png'),
  sword_thunder:   require('../assets/images/items/item_sword_Thunder.png'),
  sword_diamond:   require('../assets/images/items/item_sword_diamond.png'),
  sword_infernal:  require('../assets/images/items/item_sword_infernal.png'),
  card_hp:         require('../assets/images/items/item_card_hp.png'),
  card_mana:       require('../assets/images/items/item_card_mana.png'),
  card_xp:         require('../assets/images/items/item_card_xp.png'),
  card_energy:     require('../assets/images/items/item_card_energy.png'),
  card_strong:     require('../assets/images/items/item_card_strong.png'),
  chest:           require('../assets/images/items/item_chest.png'),
  compass:         require('../assets/images/items/item_compass.png'),
} as const

export const COIN_SPRITES = {
  star:  require('../assets/images/coin_estrella.png'),
  gold:  require('../assets/images/coin_oro.png'),
  silver:require('../assets/images/coin_plata.png'),
  bronze:require('../assets/images/coin_cobre.png'),
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

  hacker: [
    {
      id: 'cyber_attack', name: '💻 Ataque Cibernético',
      manaCost: 20, damage: 65,
      targetType: 'enemy',
      financialTrigger: 'payment_made',
    },
    {
      id: 'firewall', name: '🛡️ Firewall de Datos',
      manaCost: 25,
      effect: shieldEffect,
      targetType: 'self',
    },
    {
      id: 'system_overload', name: '⚡ Sobrecarga de Sistema',
      manaCost: 40, damage: 110,
      targetType: 'enemy',
      financialTrigger: 'goal_completed',
    },
  ],

  knight: [
    {
      id: 'shield_bash', name: '🛡️ Embestida de Escudo',
      manaCost: 15, damage: 45,
      effect: stunEffect,
      targetType: 'enemy',
    },
    {
      id: 'holy_strike', name: '✨ Golpe Sagrado',
      manaCost: 25, damage: 75,
      targetType: 'enemy',
      financialTrigger: 'early_payment',
    },
    {
      id: 'immovality', name: '🏛️ Inmortalidad Financiera',
      manaCost: 50,
      effect: shieldHeavy,
      targetType: 'self',
    },
  ],

  thief: [
    {
      id: 'steal', name: '🧤 Robar Recursos',
      manaCost: 10, damage: 35,
      targetType: 'enemy',
    },
    {
      id: 'poison_dagger', name: '🐍 Daga Envenenada',
      manaCost: 20, damage: 40,
      effect: poisonEffect,
      targetType: 'enemy',
    },
    {
      id: 'swift_escape', name: '💨 Escape Veloz',
      manaCost: 30,
      effect: boostEffect,
      targetType: 'self',
    },
  ],

  magedark: [
    {
      id: 'dark_void', name: '🌑 Vacío de Deuda',
      manaCost: 35, damage: 100,
      targetType: 'enemy',
      financialTrigger: 'late_payment',
    },
    {
      id: 'life_drain', name: '🩸 Drenaje de Vida',
      manaCost: 25, damage: 40, heal: 30,
      targetType: 'enemy',
    },
  ],

  cat: [
    {
      id: 'scratch', name: '🐾 Zarpazo Ágil',
      manaCost: 15, damage: 45,
      targetType: 'enemy',
    },
    {
      id: 'purr_heal', name: '🐱 Maullido Curativo',
      manaCost: 25,
      effect: regenEffect, heal: 35,
      targetType: 'self',
    },
  ],

  dog: [
    {
      id: 'bite', name: '🦴 Mordisco de Cobro',
      manaCost: 20, damage: 55,
      targetType: 'enemy',
    },
    {
      id: 'warn_bark', name: '🐕‍🦺 Ladrido de Alerta',
      manaCost: 20,
      effect: shieldEffect,
      targetType: 'self',
    },
  ],

  fox: [
    {
      id: 'spirit_dash', name: '🔥 Evasión Espiritual',
      manaCost: 15,
      effect: focusEffect,
      targetType: 'self',
    },
    {
      id: 'fox_fire_ball', name: '🏮 Fuego Fatuo de Zorro',
      manaCost: 35, damage: 85,
      targetType: 'enemy',
    },
  ],
  elf: [
    { id: 'wind_arrow', name: '🍃 Flecha de Viento', manaCost: 20, damage: 65, targetType: 'enemy' },
    { id: 'nature_heal', name: '🌿 Abrazo del Bosque', manaCost: 30, heal: 50, targetType: 'self', effect: regenEffect },
  ],
  witch: [
    { id: 'shadow_curse', name: '🔮 Maldición Sombría', manaCost: 25, damage: 50, effect: poisonEffect, targetType: 'enemy' },
    { id: 'dark_pact', name: '🌙 Pacto Oscuro', manaCost: 40, damage: 120, targetType: 'enemy' },
  ],
  santa: [
    { id: 'gift_box', name: '🎁 Regalo Sorpresa', manaCost: 30, heal: 40, effect: boostEffect, targetType: 'self' },
    { id: 'snow_storm', name: '❄️ Tormenta Invernal', manaCost: 45, damage: 95, effect: frozenEffect, targetType: 'enemy' },
  ],
  maid: [
    { id: 'perfect_clean', name: '🧹 Limpieza Impecable', manaCost: 15, heal: 30, effect: focusEffect, targetType: 'self' },
    { id: 'service_strike', name: '☕ Golpe de Servicio', manaCost: 25, damage: 70, targetType: 'enemy' },
  ],
  mermaid: [
    { id: 'aqua_song', name: '🧜‍♀️ Canto de Sirena', manaCost: 25, effect: stunEffect, targetType: 'enemy' },
    { id: 'tidal_wave', name: '🌊 Ola de Marea', manaCost: 40, damage: 100, targetType: 'enemy' },
  ],
  leona: [
    { id: 'lion_roar', name: '🦁 Rugido de León', manaCost: 20, effect: boostLong, targetType: 'self' },
    { id: 'claw_slash', name: '🐾 Garra Feroz', manaCost: 30, damage: 90, targetType: 'enemy' },
  ],
  knigh_girl: [
    { id: 'holy_shield', name: '✨ Escudo Sagrado', manaCost: 25, effect: shieldHeavy, targetType: 'self' },
    { id: 'light_blade', name: '⚔️ Hoja de Luz', manaCost: 35, damage: 85, targetType: 'enemy' },
  ],
  knigh_red: [
    { id: 'blood_rage', name: '🔥 Furia Roja', manaCost: 30, damage: 110, targetType: 'enemy' },
    { id: 'red_armor', name: '🛡️ Armadura Carmesí', manaCost: 20, effect: shieldEffect, targetType: 'self' },
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
  hacker: {
    id: 'player_hacker',
    name: 'Hacker',
    class: 'mage' as const,
    hp: 130, maxHp: 130,
    mana: 100, maxMana: 100,
    stamina: 80, maxStamina: 80,
    attack: 60, defense: 12, speed: 18,
    statusEffects: [],
    skills: CLASS_SKILLS.hacker,
    sprite: CHAR_SPRITES.hacker,
  },
  knight: {
    id: 'player_knight',
    name: 'Caballero',
    class: 'warrior' as const,
    hp: 220, maxHp: 220,
    mana: 40, maxMana: 40,
    stamina: 120, maxStamina: 120,
    attack: 45, defense: 40, speed: 4,
    statusEffects: [],
    skills: CLASS_SKILLS.knight,
    sprite: CHAR_SPRITES.knight,
  },
  thief: {
    id: 'player_thief',
    name: 'Ladrón',
    class: 'rogue' as const,
    hp: 140, maxHp: 140,
    mana: 50, maxMana: 50,
    stamina: 110, maxStamina: 110,
    attack: 55, defense: 10, speed: 20,
    statusEffects: [],
    skills: CLASS_SKILLS.thief,
    sprite: CHAR_SPRITES.thief,
  },
  magedark: {
    id: 'player_magedark', name: 'Ankoku', class: 'mage' as const,
    hp: 120, maxHp: 120, mana: 100, maxMana: 100, stamina: 80, maxStamina: 80,
    attack: 70, defense: 8, speed: 12, statusEffects: [], skills: CLASS_SKILLS.magedark, sprite: CHAR_SPRITES.magedark,
  },
  elf: {
    id: 'player_elf', name: 'Erufu', class: 'archer' as const,
    hp: 150, maxHp: 150, mana: 70, maxMana: 70, stamina: 110, maxStamina: 110,
    attack: 55, defense: 18, speed: 20, statusEffects: [], skills: CLASS_SKILLS.elf, sprite: CHAR_SPRITES.elf,
  },
  witch: {
    id: 'player_witch', name: 'Majo', class: 'mage' as const,
    hp: 130, maxHp: 130, mana: 120, maxMana: 120, stamina: 70, maxStamina: 70,
    attack: 65, defense: 10, speed: 10, statusEffects: [], skills: CLASS_SKILLS.witch, sprite: CHAR_SPRITES.witch,
  },
  santa: {
    id: 'player_santa', name: 'Klaus', class: 'warrior' as const,
    hp: 250, maxHp: 250, mana: 60, maxMana: 60, stamina: 90, maxStamina: 90,
    attack: 50, defense: 25, speed: 6, statusEffects: [], skills: CLASS_SKILLS.santa, sprite: CHAR_SPRITES.santa,
  },
  maid: {
    id: 'player_maid', name: 'Meido', class: 'rogue' as const,
    hp: 140, maxHp: 140, mana: 60, maxMana: 60, stamina: 100, maxStamina: 100,
    attack: 45, defense: 20, speed: 15, statusEffects: [], skills: CLASS_SKILLS.maid, sprite: CHAR_SPRITES.maid,
  },
  mermaid: {
    id: 'player_mermaid', name: 'Ningyo', class: 'mage' as const,
    hp: 160, maxHp: 160, mana: 100, maxMana: 100, stamina: 90, maxStamina: 90,
    attack: 50, defense: 15, speed: 12, statusEffects: [], skills: CLASS_SKILLS.mermaid, sprite: CHAR_SPRITES.mermaid,
  },
  leona: {
    id: 'player_leona', name: 'Leona', class: 'warrior' as const,
    hp: 180, maxHp: 180, mana: 50, maxMana: 50, stamina: 120, maxStamina: 120,
    attack: 60, defense: 25, speed: 14, statusEffects: [], skills: CLASS_SKILLS.leona, sprite: CHAR_SPRITES.leona,
  },
  knigh_girl: {
    id: 'player_knigh_girl', name: 'Valquiria', class: 'warrior' as const,
    hp: 210, maxHp: 210, mana: 55, maxMana: 55, stamina: 110, maxStamina: 110,
    attack: 48, defense: 35, speed: 8, statusEffects: [], skills: CLASS_SKILLS.knigh_girl, sprite: CHAR_SPRITES.knigh_girl,
  },
  knigh_red: {
    id: 'player_knigh_red', name: 'Búfalo', class: 'warrior' as const,
    hp: 230, maxHp: 230, mana: 45, maxMana: 45, stamina: 100, maxStamina: 100,
    attack: 70, defense: 20, speed: 5, statusEffects: [], skills: CLASS_SKILLS.knigh_red, sprite: CHAR_SPRITES.knigh_red,
  },
  cat: {
    id: 'player_cat',
    name: 'Gato Suertudo',
    class: 'rogue' as const,
    hp: 120, maxHp: 120,
    mana: 60, maxMana: 60,
    stamina: 100, maxStamina: 100,
    attack: 40, defense: 10, speed: 15,
    statusEffects: [],
    skills: CLASS_SKILLS.cat,
    sprite: CHAR_SPRITES.cat,
  },
  dog: {
    id: 'player_dog',
    name: 'Perro Guardián',
    class: 'warrior' as const,
    hp: 160, maxHp: 160,
    mana: 40, maxMana: 40,
    stamina: 120, maxStamina: 120,
    attack: 35, defense: 25, speed: 10,
    statusEffects: [],
    skills: CLASS_SKILLS.dog,
    sprite: CHAR_SPRITES.dog,
  },
  fox: {
    id: 'player_fox',
    name: 'Pequeño Zorro',
    class: 'mage' as const,
    hp: 130, maxHp: 130,
    mana: 80, maxMana: 80,
    stamina: 90, maxStamina: 90,
    attack: 50, defense: 12, speed: 13,
    statusEffects: [],
    skills: CLASS_SKILLS.fox,
    sprite: CHAR_SPRITES.fox,
  },
}

export type ClassKey = keyof typeof CLASS_FIGHTERS
