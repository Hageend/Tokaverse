// types/fusion.ts
// Sistema de fusión de cartas Toka

import { Element } from './elements'

export interface PlayerCard {
  cardId:   string      // ID de la carta (c001, r001, e001, l001, etc.)
  name:     string
  rarity:   'common' | 'rare' | 'epic' | 'legendary'
  product:  string      // 'despensa' | 'fuel' | 'connect' | 'total' | etc.
  element:  Element
  passiveBonus?: PassiveBonus
}

export interface PassiveBonus {
  type:  'damage' | 'speed' | 'mana' | 'element_boost' | 'mana_regen'
  value: number          // porcentaje: 0.10 = 10%
  element?: Element      // si es element_boost, qué elemento potencia
}

export interface FusionResult {
  id:          string
  name:        string
  description: string
  skillId:     string    // skill especial desbloqueado
  element:     Element
  duration:    number    // turnos que dura el efecto
  statBoost?:  number    // multiplicador de stats (ej: 1.25 = +25%)
  specialEffect?: 'auto_block' | 'speed_boost' | 'reveal_boss' | 'all_elements' | 'no_mana_cost'
}

export interface FusionSlot {
  index:  0 | 1 | 2
  card:   PlayerCard | null
}
