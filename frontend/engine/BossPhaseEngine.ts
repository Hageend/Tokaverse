// engine/BossPhaseEngine.ts
// Motor de fases de jefes — gestión de transiciones, minions y weakpoints

import { BossPhase, getPhasesForBoss } from '../data/bossPhases'

export interface Minion {
  id:       string
  hp:       number
  maxHp:    number
  position: number    // 0-100 (% de avance hacia el jugador)
  damage:   number
  emoji:    string
}

export class BossPhaseEngine {

  // ── Obtener fase actual según HP ──────────────────────────────────────────
  static getCurrentPhase(
    hpPercent: number,
    bossType:  string,
  ): BossPhase {
    const phases = getPhasesForBoss(bossType)
    // Las fases están ordenadas de mayor a menor umbral
    // Fase 4 activa cuando hpPercent <= 25, etc.
    const activePhase = [...phases]
      .reverse()
      .find(p => hpPercent <= p.hpThreshold) ?? phases[0]
    return activePhase
  }

  // ── Detectar transición de fase ───────────────────────────────────────────
  static checkPhaseTransition(
    hpPercent:    number,
    currentPhase: 1 | 2 | 3 | 4,
    bossType:     string,
  ): { newPhase: BossPhase | null; didTransition: boolean } {
    const targetPhase = this.getCurrentPhase(hpPercent, bossType)

    if (targetPhase.phaseNumber !== currentPhase) {
      return { newPhase: targetPhase, didTransition: true }
    }
    return { newPhase: null, didTransition: false }
  }

  // ── Invocar minion (cobrador) ─────────────────────────────────────────────
  static spawnMinion(): Minion {
    return {
      id:       `minion_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      hp:       50,
      maxHp:    50,
      position: 0,    // empieza en posición del jefe
      damage:   30,
      emoji:    '👻',
    }
  }

  // ── Actualizar minions (avanzan hacia el jugador) ─────────────────────────
  static updateMinions(
    minions:  Minion[],
    deltaMs:  number,
  ): { minions: Minion[]; reached: Minion[] } {
    const advancePerSecond = 15   // % de avance por segundo
    const delta = deltaMs / 1000
    const alive:   Minion[] = []
    const reached: Minion[] = []

    for (const minion of minions) {
      if (minion.hp <= 0) continue

      const newPosition = minion.position + advancePerSecond * delta

      if (newPosition >= 100) {
        reached.push(minion)    // llegó al jugador
        continue
      }

      alive.push({ ...minion, position: newPosition })
    }

    return { minions: alive, reached }
  }

  // ── Atacar a un minion ────────────────────────────────────────────────────
  static attackMinion(minions: Minion[], minionId: string, damage: number): {
    minions: Minion[]
    killed: boolean
    minionKilled?: Minion
  } {
    let killed = false
    let minionKilled: Minion | undefined

    const updated = minions.map(m => {
      if (m.id !== minionId) return m
      const newHp = Math.max(0, m.hp - damage)
      if (newHp <= 0) {
        killed = true
        minionKilled = { ...m, hp: 0 }
      }
      return { ...m, hp: newHp }
    }).filter(m => m.hp > 0)

    return { minions: updated, killed, minionKilled }
  }

  // ── Calcular bonus de ataque del jefe por fase ────────────────────────────
  static getPhaseAttackBonus(phase: BossPhase): number {
    return 1.0 + (phase.bossEnrageBonus / 100)
  }

  // ── Verificar si el jefe puede usar Bancarrota ────────────────────────────
  static canUseBankruptcy(phase: BossPhase, bankruptcyUsed: boolean): boolean {
    return phase.phaseNumber === 4 && !bankruptcyUsed
  }

  // ── Calcular daño de Bancarrota ───────────────────────────────────────────
  static calculateBankruptcyDamage(playerMaxHp: number): number {
    return Math.floor(playerMaxHp * 0.40)
  }

  // ── Animating weakpoints position (based on time) ─────────────────────────
  static getWeakpointOffsets(timestamp: number): { x: number; y: number }[] {
    const t = timestamp / 1000
    return [
      { x: Math.sin(t * 1.5) * 30,     y: Math.cos(t * 1.5) * 20     },
      { x: Math.sin(t * 1.5 + Math.PI) * 25, y: Math.cos(t * 1.5 + Math.PI) * 18 },
    ]
  }
}
