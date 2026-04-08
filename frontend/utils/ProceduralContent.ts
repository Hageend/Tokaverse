// TokaVerse — Generación procedural de contenido (eventos, misiones, enemigos)
import type { Element } from '../types/elements'
import type { MapNode, NodeType, WorldZone } from '../components/league/ProgressMap'
import { LORE_ENTRIES, NPCS } from '../data/lore'

export interface ProceduralEvent {
  id:          string
  title:       string
  description: string
  emoji:       string
  type:        'bonus_xp' | 'bonus_coins' | 'enemy_weakened' | 'boss_enraged' | 'weather_change' | 'lore_reveal'
  value:       number
  duration:    number   // turnos
  color:       string
}

export interface ProceduralEnemy {
  id:          string
  name:        string
  emoji:       string
  hp:          number
  attack:      number
  defense:     number
  element:     Element
  xpReward:    number
  coinReward:  number
  description: string
}

const ENEMY_PREFIXES = ['Pequeño', 'Gran', 'Antiguo', 'Corrupto', 'Furioso', 'Sombrío', 'Dorado']
const ENEMY_TYPES    = ['Interés', 'Cargo', 'Comisión', 'Mora', 'Recargo', 'Penalización', 'Deuda']
const ENEMY_SUFFIXES = ['Menor', 'Mayor', 'Eterno', 'Voraz', 'Silencioso', 'Implacable']

const EVENT_TEMPLATES: Omit<ProceduralEvent, 'id'>[] = [
  {
    title:       '¡Oferta Especial!',
    description: 'Una oportunidad financiera aparece. +50% XP por 3 turnos.',
    emoji:       '⭐',
    type:        'bonus_xp',
    value:       1.5,
    duration:    3,
    color:       '#FFD700',
  },
  {
    title:       'Lluvia de Monedas',
    description: 'El mercado está en alza. +30% monedas por 2 turnos.',
    emoji:       '🪙',
    type:        'bonus_coins',
    value:       1.3,
    duration:    2,
    color:       '#F59E0B',
  },
  {
    title:       'Punto Débil Revelado',
    description: 'Has encontrado la debilidad del enemigo. -25% defensa del jefe.',
    emoji:       '🎯',
    type:        'enemy_weakened',
    value:       0.75,
    duration:    2,
    color:       '#22C55E',
  },
  {
    title:       '¡El Jefe se Enfurece!',
    description: 'La deuda crece. +20% ataque del jefe por 1 turno.',
    emoji:       '😤',
    type:        'boss_enraged',
    value:       1.2,
    duration:    1,
    color:       '#EF4444',
  },
]

export class ProceduralContent {
  static generateEvent(playerLevel: number): ProceduralEvent {
    const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)]
    return {
      ...template,
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    }
  }

  static generateEnemy(playerLevel: number): ProceduralEnemy {
    const prefix  = ENEMY_PREFIXES[Math.floor(Math.random() * ENEMY_PREFIXES.length)]
    const type    = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]
    const suffix  = ENEMY_SUFFIXES[Math.floor(Math.random() * ENEMY_SUFFIXES.length)]
    const name    = `${prefix} ${type} ${suffix}`
    const elements: Element[] = ['fire', 'ice', 'thunder', 'earth', 'water', 'dark', 'light']
    const element  = elements[Math.floor(Math.random() * elements.length)]
    const baseHp  = 50 + playerLevel * 10 + Math.floor(Math.random() * 30)
    const baseAtk = 8  + playerLevel * 2  + Math.floor(Math.random() * 5)
    const baseDef = 3  + playerLevel      + Math.floor(Math.random() * 3)
    return {
      id:          `proc_${Date.now()}`,
      name,
      emoji:       '👾',
      hp:          baseHp,
      attack:      baseAtk,
      defense:     baseDef,
      element,
      xpReward:    Math.floor(baseHp * 0.8),
      coinReward:  Math.floor(baseHp * 0.5),
      description: `Un ${type.toLowerCase()} generado por el caos financiero.`,
    }
  }

  static shouldTriggerEvent(turn: number, probability = 0.15): boolean {
    const bonus = turn % 5 === 0 ? 0.10 : 0
    return Math.random() < (probability + bonus)
  }

  static generateWorldZones(playerLevel: number): WorldZone[] {
    const zones: WorldZone[] = []
    const zoneThemes = [
      { name: 'Bosque de Ahorro', color: '#16a34a', tileType: 'grass' as const },
      { name: 'Distrito Neón',     color: '#7c3aed', tileType: 'neon' as const },
      { name: 'Abismo de Deuda',   color: '#1e1e24', tileType: 'dark' as const },
      { name: 'Cumbres de Inversión', color: '#2563eb', tileType: 'sky' as const },
    ]
    let currentId = 1
    zoneThemes.forEach((theme, index) => {
      const nodes: MapNode[] = []
      const nodesPerZone = 5
      for (let i = 0; i < nodesPerZone; i++) {
        const isBoss = i === nodesPerZone - 1
        const type: NodeType = isBoss ? 'boss' : (i === 0 && index === 0 ? 'start' : ['puzzle', 'lore', 'reward'][Math.floor(Math.random() * 3)] as NodeType)
        
        const nodeId = currentId++
        // Patrón zig-zag: nodos pares arriba, impares abajo, con margen
        const Y_POSITIONS = [25, 55, 25, 60, 30] // % del MAP_HEIGHT
        const x = 15 + (i * 18)                  // 15, 33, 51, 69, 87
        const y = Y_POSITIONS[i]
        const node: MapNode = {
          id: nodeId,
          label: isBoss ? 'Jefe' : `${type.toUpperCase()} ${nodeId}`,
          icon: this.getIconForType(type),
          x,
          y,
          state: (index === 0 && i === 0) ? 'active' : 'locked',
          type,
        }
        if (type === 'puzzle') node.puzzle = this.generateFinancialPuzzle(playerLevel)
        else if (type === 'lore') {
          const entry = LORE_ENTRIES[Math.floor(Math.random() * LORE_ENTRIES.length)]
          node.lore = { title: entry.title, content: entry.content, npc: 'Guía Toka', emoji: '🧑🏫' }
        }
        else if (type === 'reward') node.reward = { coins: 100, xp: 50 }
        else if (type === 'boss') {
          const boss = this.generateEnemy(playerLevel)
          node.boss = {
            name: boss.name,
            emoji: boss.emoji,
            hp: boss.hp,
            difficulty: 'Normal',
            diffColor: '#ef4444',
            bossType: 'random',
            xp: boss.xpReward
          }
          node.label = 'Jefe: ' + boss.name
        }
        nodes.push(node)
      }
      zones.push({
        id: `zone_${index}`,
        name: theme.name,
        themeColor: theme.color,
        tileType: theme.tileType,
        nodes,
      })
    })
    return zones
  }

  private static getIconForType(type: NodeType): string {
    switch (type) {
      case 'puzzle': return '🧩'
      case 'lore':   return '📖'
      case 'reward': return '🎁'
      case 'boss':   return '👹'
      default:       return '⚪'
    }
  }

  private static generateFinancialPuzzle(level: number) {
    const puzzles = [
      {
        question: '¿Qué es el CAT en un crédito?',
        options: ['Costo Anual Total', 'Crédito de Ahorro Temporal', 'Comisión de Apertura Total'],
        answer: 0,
        hint: 'Incluye todos los costos y comisiones del crédito.'
      },
      {
        question: '¿Cuál es el beneficio de pagar a tiempo?',
        options: ['Evitar recargos', 'Gastar más', 'Perder puntos'],
        answer: 0,
        hint: 'Mantienes un buen historial crediticio.'
      },
      {
        question: '¿Qué significa ser "totalero" con tu tarjeta?',
        options: ['Pagar el total de tu deuda cada mes', 'Pagar solo el mínimo', 'No pagar nada'],
        answer: 0,
        hint: 'Es la mejor forma de evitar pagar intereses.'
      }
    ]
    const p = puzzles[Math.floor(Math.random() * puzzles.length)]
    return {
      ...p,
      xp: 100 + level * 10
    }
  }
}
