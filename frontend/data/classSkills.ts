// data/classSkills.ts

import { Skill } from '../types/combat'

export const CLASS_SKILLS: Record<string, Skill[]> = {

  mage: [
    {
      id: 'frost_save', name: '❄️ Congelación de Gasto',
      manaCost: 20,
      effect:   { type: 'stun', duration: 1 },
      targetType: 'enemy',
      financialTrigger: 'savings_deposit',
    },
    {
      id: 'mana_shield', name: '🔵 Escudo de Maná',
      manaCost: 15,
      effect:   { type: 'shield', duration: 2, reduction: 0.4 },
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
      effect: { type: 'boost', duration: 2, multiplier: 1.3 },
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
      effect: { type: 'shield', duration: 3, reduction: 0.6 },
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
      effect: { type: 'shield', duration: 1, reduction: 0.7 },
      targetType: 'self',
    },
    {
      id: 'backstab', name: '🗡️ Puñalada Trapera',
      manaCost: 35, damage: 120,
      targetType: 'enemy',
    },
  ],
}

// Fighters pre-configurados por clase para acceso rápido
export const CLASS_FIGHTERS = {
  mage: {
    id: 'player_mage',
    name: 'Mahōtsukai',
    class: 'mage' as const,
    hp: 120, maxHp: 120,
    mana: 80, maxMana: 80,
    attack: 55, defense: 10, speed: 8,
    statusEffects: [],
    skills: CLASS_SKILLS.mage,
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/654.gif',
  },
  warrior: {
    id: 'player_warrior',
    name: 'Samurai',
    class: 'warrior' as const,
    hp: 200, maxHp: 200,
    mana: 50, maxMana: 50,
    attack: 40, defense: 30, speed: 5,
    statusEffects: [],
    skills: CLASS_SKILLS.warrior,
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/503.gif',
  },
  rogue: {
    id: 'player_rogue',
    name: 'Shinobi',
    class: 'rogue' as const,
    hp: 140, maxHp: 140,
    mana: 60, maxMana: 60,
    attack: 65, defense: 15, speed: 15,
    statusEffects: [],
    skills: CLASS_SKILLS.rogue,
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/658.gif',
  },
  archer: {
    id: 'player_archer',
    name: 'Yushu',
    class: 'archer' as const,
    hp: 160, maxHp: 160,
    mana: 65, maxMana: 65,
    attack: 50, defense: 20, speed: 12,
    statusEffects: [],
    skills: CLASS_SKILLS.archer,
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/724.gif',
  },
}
