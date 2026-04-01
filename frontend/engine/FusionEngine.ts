// engine/FusionEngine.ts
// Motor de fusión de cartas Toka

import { FusionResult, PlayerCard } from '../types/fusion'
import { Element } from '../types/elements'

// ─── Inventario demo de cartas (usado hasta tener backend de inventario) ──────
export const DEMO_CARDS: PlayerCard[] = [
  {
    cardId: 'c001', name: '🛒 Despensa Común', rarity: 'common', product: 'despensa',
    element: 'ice',
    passiveBonus: { type: 'damage', value: 0.10, element: 'ice' },
  },
  {
    cardId: 'r001', name: '⛽ Combustible Rara', rarity: 'rare', product: 'fuel',
    element: 'fire',
    passiveBonus: { type: 'speed', value: 0.15 },
  },
  {
    cardId: 'e001', name: '📋 Connect Épica', rarity: 'epic', product: 'connect',
    element: 'thunder',
    passiveBonus: { type: 'mana', value: 0.20 },
  },
  {
    cardId: 'l001', name: '💳 Total Dorada Legendaria', rarity: 'legendary', product: 'total',
    element: 'light',
    passiveBonus: { type: 'element_boost', value: 0.25, element: 'light' },
  },
  {
    cardId: 'r002', name: '🛒 Despensa Virtual Rara', rarity: 'rare', product: 'despensa',
    element: 'water',
    passiveBonus: { type: 'damage', value: 0.12 },
  },
]

// ─── Recetas de fusión ────────────────────────────────────────────────────────
interface FusionRecipe {
  cards:  string[]     // IDs de cartas requeridas (orden no importa)
  result: FusionResult
}

const FUSION_RECIPES: FusionRecipe[] = [
  {
    cards: ['c001', 'c001'],    // 2x Despensa común
    result: {
      id: 'f001', name: '🛡️ Escudo Familiar',
      description: 'Bloquea automáticamente el próximo ataque del jefe (incluyendo Bancarrota)',
      skillId: 'auto_block', element: 'ice', duration: 1,
      specialEffect: 'auto_block',
    },
  },
  {
    cards: ['r001', 'r001'],    // 2x Combustible rara
    result: {
      id: 'f002', name: '🚀 Turbo',
      description: 'Velocidad de ataque x2 — atacas dos veces en tu próximo turno',
      skillId: 'speed_boost', element: 'fire', duration: 1,
      specialEffect: 'speed_boost',
    },
  },
  {
    cards: ['e001', 'e001'],    // 2x Connect épica
    result: {
      id: 'f003', name: '🔍 Auditoría',
      description: 'Revela el próximo skill que usará el jefe — prepara tu defensa',
      skillId: 'reveal_boss', element: 'thunder', duration: 1,
      specialEffect: 'reveal_boss',
    },
  },
  {
    cards: ['l001', 'e001'],    // Total Legendaria + Connect Épica
    result: {
      id: 'f004', name: '🏢 Modo Corporativo',
      description: 'Todos tus stats +25% por 3 turnos — el poder de Toka Total',
      skillId: 'corporate_mode', element: 'light', duration: 3,
      statBoost: 1.25,
    },
  },
  {
    cards: ['c001', 'r002'],    // Despensa + Despensa Virtual
    result: {
      id: 'f005', name: '❄️⚡ Transferencia Congelada',
      description: 'Daño Hielo + efecto Rayo simultáneo — combo elemental explosivo',
      skillId: 'frozen_transfer', element: 'ice', duration: 2,
    },
  },
  {
    cards: ['r001', 'e001'],    // Combustible + Connect
    result: {
      id: 'f006', name: '📑 Reporte Express',
      description: 'Sin costo de mana en tu próximo skill — comprobación instantánea',
      skillId: 'no_mana_skill', element: 'thunder', duration: 2,
      specialEffect: 'no_mana_cost',
    },
  },
]

export const PASSIVE_BONUS_INFO: Record<string, string> = {
  damage:       '+% daño elemental',
  speed:        '+% velocidad',
  mana:         '+% mana máximo',
  element_boost: '+% en elemento específico',
}

export class FusionEngine {

  // ── Detectar fusiones posibles con cartas equipadas ───────────────────────
  static detectFusions(equippedCardIds: string[]): FusionResult[] {
    const available: FusionResult[] = []

    for (const recipe of FUSION_RECIPES) {
      const remaining = [...equippedCardIds]
      let match = true

      for (const needed of recipe.cards) {
        const idx = remaining.indexOf(needed)
        if (idx === -1) { match = false; break }
        remaining.splice(idx, 1)
      }

      if (match) available.push(recipe.result)
    }

    return available
  }

  // ── Calcular bonus pasivo total de cartas equipadas ───────────────────────
  static calculatePassiveBonus(cards: PlayerCard[]): {
    damageBonus: number
    speedBonus: number
    manaBonus: number
    elementBoosts: Partial<Record<Element, number>>
  } {
    let damageBonus = 0
    let speedBonus  = 0
    let manaBonus   = 0
    const elementBoosts: Partial<Record<Element, number>> = {}

    for (const card of cards) {
      if (!card.passiveBonus) continue
      const { type, value, element } = card.passiveBonus

      switch (type) {
        case 'damage':        damageBonus += value; break
        case 'speed':         speedBonus  += value; break
        case 'mana':          manaBonus   += value; break
        case 'element_boost':
          if (element) {
            elementBoosts[element] = (elementBoosts[element] ?? 0) + value
          }
          break
      }
    }

    return { damageBonus, speedBonus, manaBonus, elementBoosts }
  }

  // ── Obtener descripción amigable de la fusión ─────────────────────────────
  static getFusionDisplayInfo(fusion: FusionResult): {
    icon: string; color: string; badgeText: string
  } {
    const rarityMap: Record<string, { icon: string; color: string }> = {
      f001: { icon: '🛡️', color: '#3B82F6' },
      f002: { icon: '🚀', color: '#FF6B35' },
      f003: { icon: '🔍', color: '#FFD700' },
      f004: { icon: '🏢', color: '#F59E0B' },
      f005: { icon: '❄️', color: '#00D4FF' },
      f006: { icon: '📑', color: '#8B5CF6' },
    }
    const info = rarityMap[fusion.id] ?? { icon: '⚡', color: '#FFFFFF' }
    return {
      ...info,
      badgeText: fusion.duration === 1 ? '1 turno' : `${fusion.duration} turnos`,
    }
  }
}
