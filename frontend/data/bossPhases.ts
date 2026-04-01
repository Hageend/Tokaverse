// data/bossPhases.ts
// Configuración de fases de jefes — Sistema de 4 fases

import type { Element } from '../types/elements'

export interface UniqueMechanic {
  id:               string
  name:             string
  triggerCondition: string
  effect:           string
  warningMessage:   string
}

export interface BossPhase {
  phaseNumber:      1 | 2 | 3 | 4
  hpThreshold:      number        // % de HP para activar esta fase (100, 75, 50, 25)
  name:             string
  description:      string
  attackSpeed:      number        // multiplicador de velocidad de ataque
  attacksPerTurn:   number
  availableSkills:  string[]
  uniqueMechanic:   UniqueMechanic
  spawnsMinions:    boolean
  weakpoints:       boolean
  visualTheme:      'golden_glow' | 'dark_glow' | 'red_arena' | 'inferno'
  themeColor:       string        // color principal del tema visual
  bossEnrageBonus:  number        // % de bonus de ataque en esta fase
}

// ─── La Tarjeta Maldita — 4 fases ────────────────────────────────────────────
export const TARJETA_MALDITA_PHASES: BossPhase[] = [
  {
    phaseNumber:   1,
    hpThreshold:   100,
    name:          'Modo Tentación',
    description:   'La deuda parece manejable...',
    attackSpeed:   1.0,
    attacksPerTurn: 1,
    availableSkills: ['interest_bite'],
    uniqueMechanic: {
      id:               'temptation',
      name:             '💛 Oferta Irresistible',
      triggerCondition: 'Si no usas cartas por 2 turnos',
      effect:           'El jefe recupera 50 HP — ¡usa tus cartas!',
      warningMessage:   '⚠️ La Tarjeta te tienta... ¡usa tus cartas antes de que se recupere!',
    },
    spawnsMinions:  false,
    weakpoints:     false,
    visualTheme:    'golden_glow',
    themeColor:     '#FFD700',
    bossEnrageBonus: 0,
  },
  {
    phaseNumber:   2,
    hpThreshold:   75,
    name:          'Modo Interés Compuesto',
    description:   'Los intereses empiezan a crecer sin control...',
    attackSpeed:   1.3,
    attacksPerTurn: 1,
    availableSkills: ['interest_bite', 'credit_drain'],
    uniqueMechanic: {
      id:               'compound_interest',
      name:             '📈 Cargo por Mora',
      triggerCondition: 'Después de recibir 3 ataques seguidos del jugador',
      effect:           'Siguiente ataque del jefe hace x2 daño',
      warningMessage:   '😤 ¡La Tarjeta acumula intereses! Su próximo golpe será devastador',
    },
    spawnsMinions:  false,
    weakpoints:     true,
    visualTheme:    'dark_glow',
    themeColor:     '#8B5CF6',
    bossEnrageBonus: 30,
  },
  {
    phaseNumber:   3,
    hpThreshold:   50,
    name:          'Modo Deuda Crítica',
    description:   '¡La deuda se sale de control!',
    attackSpeed:   1.6,
    attacksPerTurn: 2,
    availableSkills: ['interest_bite', 'credit_drain', 'debt_spiral'],
    uniqueMechanic: {
      id:               'collector_spawn',
      name:             '👻 El Cobrador',
      triggerCondition: 'Cada 3 turnos',
      effect:           'Aparece mini-enemigo que avanza hacia ti — ¡elimínalo!',
      warningMessage:   '💀 ¡El Cobrador ha llegado! Tienes 2 turnos para neutralizarlo',
    },
    spawnsMinions:  true,
    weakpoints:     true,
    visualTheme:    'red_arena',
    themeColor:     '#EF4444',
    bossEnrageBonus: 50,
  },
  {
    phaseNumber:   4,
    hpThreshold:   25,
    name:          'Modo Quiebra Total',
    description:   '¡TODO O NADA! La Tarjeta desata su poder final',
    attackSpeed:   2.0,
    attacksPerTurn: 2,
    availableSkills: ['interest_bite', 'credit_drain', 'debt_spiral', 'bankruptcy'],
    uniqueMechanic: {
      id:               'bankruptcy',
      name:             '💀 Bancarrota',
      triggerCondition: 'Una vez por combate, HP < 25%',
      effect:           'Daño del 40% de tu HP máximo. Solo se bloquea con Bloqueo Perfecto o fusión "Escudo Familiar"',
      warningMessage:   '🌋 ¡¡BANCARROTA!! — Prepara tu defensa más fuerte ahora mismo',
    },
    spawnsMinions:  true,
    weakpoints:     true,
    visualTheme:    'inferno',
    themeColor:     '#FF6B35',
    bossEnrageBonus: 75,
  },
]

// ─── Datos de fases para otros tipos de jefe ─────────────────────────────────
export const SIMPLE_BOSS_PHASES: BossPhase[] = [
  {
    phaseNumber:   1,
    hpThreshold:   100,
    name:          'Fase Normal',
    description:   'El jefe toma forma...',
    attackSpeed:   1.0,
    attacksPerTurn: 1,
    availableSkills: [],
    uniqueMechanic: {
      id: 'none', name: '', triggerCondition: '', effect: '', warningMessage: '',
    },
    spawnsMinions:  false,
    weakpoints:     false,
    visualTheme:    'golden_glow',
    themeColor:     '#FFD700',
    bossEnrageBonus: 0,
  },
  {
    phaseNumber:   2,
    hpThreshold:   75,
    name:          'Fase Enrarecida',
    description:   'El jefe se enreda con rabia...',
    attackSpeed:   1.3,
    attacksPerTurn: 1,
    availableSkills: [],
    uniqueMechanic: {
      id: 'enrage', name: '😤 Enrarecido',
      triggerCondition: 'Al 50% HP',
      effect:           '+30% ataque del jefe',
      warningMessage:   '😤 ¡El jefe entra en modo enrarecido!',
    },
    spawnsMinions:  false,
    weakpoints:     true,
    visualTheme:    'dark_glow',
    themeColor:     '#8B5CF6',
    bossEnrageBonus: 30,
  },
  {
    phaseNumber:   3,
    hpThreshold:   50,
    name:          'Fase Crítica',
    description:   'Peligro extremo...',
    attackSpeed:   1.6,
    attacksPerTurn: 1,
    availableSkills: [],
    uniqueMechanic: {
      id: 'desperate', name: '😡 Furia Final',
      triggerCondition: 'Al 25% HP',
      effect:           'El jefe ataca con desesperación',
      warningMessage:   '😡 ¡EL JEFE DESATA SU FURIA FINAL!',
    },
    spawnsMinions:  false,
    weakpoints:     true,
    visualTheme:    'red_arena',
    themeColor:     '#EF4444',
    bossEnrageBonus: 50,
  },
  {
    phaseNumber:   4,
    hpThreshold:   25,
    name:          'Fase Final',
    description:   '¡Último esfuerzo!',
    attackSpeed:   2.0,
    attacksPerTurn: 2,
    availableSkills: [],
    uniqueMechanic: {
      id: 'last_stand', name: '💀 Último Aliento',
      triggerCondition: 'Al 10% HP',
      effect:           'El jefe usa todo su poder',
      warningMessage:   '💀 ¡¡ÚLTIMO ALIENTO!! El jefe combate con todo',
    },
    spawnsMinions:  false,
    weakpoints:     true,
    visualTheme:    'inferno',
    themeColor:     '#FF6B35',
    bossEnrageBonus: 75,
  },
]

export function getPhasesForBoss(bossType: string): BossPhase[] {
  if (bossType === 'credit_card') return TARJETA_MALDITA_PHASES
  return SIMPLE_BOSS_PHASES
}
