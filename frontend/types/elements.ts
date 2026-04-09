// types/elements.ts
// Sistema de elementos financieros mexicanos — estilo Pokémon

export type Element =
  | 'fire'    // Inflación   🔥
  | 'ice'     // Ahorro      ❄️
  | 'thunder' // Transacción ⚡
  | 'earth'   // Inversión   🌿
  | 'water'   // Flujo caja  💧
  | 'dark'    // Deuda       🌑
  | 'light'   // Crédito sano✨

export const ELEMENT_INFO: Record<Element, { label: string; emoji: string; color: string; description: string }> = {
  fire:    { label: 'Inflación',     emoji: '🔥', color: '#FF6B35', description: 'Daño continuo, quema recursos' },
  ice:     { label: 'Ahorro',        emoji: '❄️', color: '#00D4FF', description: 'Congela, reduce velocidad del jefe' },
  thunder: { label: 'Transacción',   emoji: '⚡', color: '#FFD700', description: 'Daño instantáneo y rápido' },
  earth:   { label: 'Inversión',     emoji: '🌿', color: '#22C55E', description: 'Daño lento pero acumulativo' },
  water:   { label: 'Flujo de caja', emoji: '💧', color: '#3B82F6', description: 'Cura y regenera' },
  dark:    { label: 'Deuda',         emoji: '🌑', color: '#8B5CF6', description: 'Maldice, aplica efectos negativos' },
  light:   { label: 'Crédito Sano',  emoji: '✨', color: '#F59E0B', description: 'Purifica estados alterados' },
}

// Tabla de multiplicadores: ELEMENT_CHART[attacker][defender] = multiplier
// Si no existe la combinación → 1.0 (neutro)
export const ELEMENT_CHART: Record<Element, Partial<Record<Element, number>>> = {
  ice:     { fire: 2.0, dark: 1.2 },
  thunder: { dark: 2.0, water: 1.2 },
  earth:   { water: 1.5, fire: 0.5 },
  water:   { fire: 1.5, dark: 0.5 },
  light:   { dark: 2.5, fire: 1.2 },
  dark:    { ice: 2.0, water: 0.5 },
  fire:    { earth: 1.5, ice: 0.5 },
}

// Elemento primario y secundario por clase de personaje
export const CLASS_ELEMENTS: Record<string, { primary: Element; secondary: Element }> = {
  mage:    { primary: 'ice',     secondary: 'light'   },   // Mago Ahorrador
  archer:  { primary: 'earth',   secondary: 'thunder' },   // Arquero Inversor
  warrior: { primary: 'thunder', secondary: 'earth'   },   // Guerrero Pagador
  rogue:   { primary: 'water',   secondary: 'dark'    },   // Pícaro Cashback
  banker:  { primary: 'light',   secondary: 'ice'     },   // Banquero
  kitsune: { primary: 'water',   secondary: 'light'   },   // Kitsune
}

// Elemento de cada tipo de jefe
export const BOSS_ELEMENTS: Record<string, { primary: Element; secondary?: Element }> = {
  credit_card:   { primary: 'dark',  secondary: 'fire'   },
  service:       { primary: 'thunder' },
  loan:          { primary: 'dark' },
  overdraft:     { primary: 'dark',  secondary: 'ice'    },
  toka_despensa: { primary: 'fire' },
  toka_fuel:     { primary: 'fire',  secondary: 'earth'  },
  toka_connect:  { primary: 'thunder' },
}

export class ElementEngine {
  static getMultiplier(attackerElement: Element, defenderElement: Element): number {
    return ELEMENT_CHART[attackerElement]?.[defenderElement] ?? 1.0
  }

  static getEffectivenessLabel(multiplier: number): string {
    if (multiplier >= 2.5) return '🌟 ¡¡APLASTANTE!!'
    if (multiplier >= 2.0) return '⚡ ¡SÚPER EFECTIVO!'
    if (multiplier >= 1.5) return '✨ ¡Efectivo!'
    if (multiplier <= 0.5) return '🛡️ Poco efectivo...'
    return ''
  }

  static getEffectivenessColor(multiplier: number): string {
    if (multiplier >= 2.5) return '#FF6B35'
    if (multiplier >= 2.0) return '#FFD700'
    if (multiplier >= 1.5) return '#22C55E'
    if (multiplier <= 0.5) return '#6B7280'
    return '#FFFFFF'
  }
}
