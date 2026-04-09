// engine/StatusEngine.ts
// Motor de estados alterados — 8 negativos, 7 positivos, 3 de jefe

export type NegativeStatus =
  | 'poison'     // ☠️ Veneno       -10 HP/turno, 3 turnos
  | 'frozen'     // 🧊 Congelado    no puede actuar, 1 turno
  | 'burning'    // 🔥 Quemado      -8 HP/turno + -10% def, 2 turnos
  | 'stunned'    // 😵 Aturdido     50% falla de acciones, 2 turnos
  | 'bleeding'   // 💸 Sangría      -5% mana/turno, 3 turnos
  | 'cursed'     // 😨 Maldito      acciones cuestan x2 mana, 3 turnos
  | 'confused'   // 🌀 Confundido   30% self-damage, 2 turnos
  | 'chained'    // ⛓️ Encadenado   no puede usar especiales, 2 turnos

export type PositiveStatus =
  | 'blessed'       // ✨ Bendecido     +20% daño, 3 turnos
  | 'shielded'      // 🛡️ Escudo        absorbe próximo ataque
  | 'accelerated'   // ⚡ Acelerado    ataca 2 veces, 1 turno
  | 'regenerating'  // 🌿 Regenerando  +15 HP/turno, 3 turnos
  | 'focused'       // 🎯 Enfocado     próximo ataque crítico garantizado
  | 'strengthened'  // 💪 Fortalecido  +30% ataque, 2 turnos
  | 'invincible'    // 🌟 Invencible   inmune a estados negativos, 1 turno

export type BossStatus =
  | 'enraged'     // 😤 al 50% HP — +50% ataque
  | 'furious'     // 😡 al 25% HP — ataca x2/turno
  | 'desperate'   // 💀 al 10% HP — skill más poderoso cada turno
  | 'exposed'     // 🎯 Expuesto      (perfect block) — todos los ataques son críticos por 2 seg

export type AnyStatus = NegativeStatus | PositiveStatus | BossStatus

export interface StatusEffectRich {
  type:        AnyStatus
  duration:    number
  value?:      number       // daño/cura por turno si aplica
  sourceSkill?: string
  multiplier?:  number      // para efectos de boost
}

export const STATUS_INFO: Record<AnyStatus, { emoji: string; label: string; color: string; isNegative: boolean }> = {
  // Negativos
  poison:      { emoji: '☠️', label: 'Veneno',       color: '#22C55E', isNegative: true  },
  frozen:      { emoji: '🧊', label: 'Congelado',    color: '#00D4FF', isNegative: true  },
  burning:     { emoji: '🔥', label: 'Quemado',      color: '#FF6B35', isNegative: true  },
  stunned:     { emoji: '😵', label: 'Aturdido',     color: '#F59E0B', isNegative: true  },
  bleeding:    { emoji: '💸', label: 'Sangría',      color: '#EF4444', isNegative: true  },
  cursed:      { emoji: '😨', label: 'Maldito',      color: '#8B5CF6', isNegative: true  },
  confused:    { emoji: '🌀', label: 'Confundido',   color: '#A78BFA', isNegative: true  },
  chained:     { emoji: '⛓️', label: 'Encadenado',   color: '#6B7280', isNegative: true  },
  // Positivos
  blessed:     { emoji: '✨', label: 'Bendecido',    color: '#F59E0B', isNegative: false },
  shielded:    { emoji: '🛡️', label: 'Escudo',       color: '#3B82F6', isNegative: false },
  accelerated: { emoji: '⚡', label: 'Acelerado',    color: '#FFD700', isNegative: false },
  regenerating:{ emoji: '🌿', label: 'Regenerando',  color: '#10B981', isNegative: false },
  focused:     { emoji: '🎯', label: 'Enfocado',     color: '#EF4444', isNegative: false },
  strengthened:{ emoji: '💪', label: 'Fortalecido',  color: '#F97316', isNegative: false },
  invincible:  { emoji: '🌟', label: 'Invencible',   color: '#FFD700', isNegative: false },
  // Jefe
  enraged:     { emoji: '😤', label: 'Enrarecido',   color: '#EF4444', isNegative: false },
  furious:     { emoji: '😡', label: 'Furibundo',    color: '#FF6B35', isNegative: false },
  desperate:   { emoji: '💀', label: 'Desesperado',  color: '#8B5CF6', isNegative: false },
  exposed:     { emoji: '🎯', label: 'Expuesto',     color: '#22C55E', isNegative: false },
}

const NEGATIVE_STATUSES = new Set<AnyStatus>([
  'poison', 'frozen', 'burning', 'stunned', 'bleeding', 'cursed', 'confused', 'chained',
])

const MAX_NEGATIVE_SIMULTANEOUS = 4

export class StatusEngine {

  static isNegative(type: AnyStatus): boolean {
    return NEGATIVE_STATUSES.has(type)
  }

  // ── Aplicar nuevo estado (regla de stack) ──────────────────────────────────
  static applyStatus(
    current:   StatusEffectRich[],
    newEffect: StatusEffectRich,
  ): { effects: StatusEffectRich[]; interactionLog?: string } {
    let updated = [...current]

    // Si ya existe el mismo tipo → refrescar duración (no acumula)
    const existingIdx = updated.findIndex(e => e.type === newEffect.type)
    if (existingIdx !== -1) {
      updated[existingIdx] = {
        ...updated[existingIdx],
        duration: Math.max(updated[existingIdx].duration, newEffect.duration),
      }
      return { effects: updated }
    }

    // Verificar interacciones especiales
    const interaction = this.checkInteraction(updated, newEffect)
    if (interaction) {
      return { effects: interaction.effects, interactionLog: interaction.log }
    }

    // Regla de Sobrecarga: si ya hay 4 negativos y llega otro → limpiar todos los negativos
    const negativeCount = updated.filter(e => this.isNegative(e.type)).length
    if (negativeCount >= MAX_NEGATIVE_SIMULTANEOUS && this.isNegative(newEffect.type)) {
      const cleaned = updated.filter(e => !this.isNegative(e.type))
      return {
        effects: cleaned,
        interactionLog: '🌀 ¡SOBRECARGA! Los estados negativos se cancelan entre sí — todos eliminados',
      }
    }

    return { effects: [...updated, newEffect] }
  }

  // ── Interacciones especiales entre estados ─────────────────────────────────
  private static checkInteraction(
    current:  StatusEffectRich[],
    incoming: StatusEffectRich,
  ): { effects: StatusEffectRich[]; log: string } | null {
    const types = current.map(e => e.type)

    // Congelado + Rayo → rompe el hielo
    if (types.includes('frozen') && incoming.type === ('thunder' as any)) {
      return {
        effects: current.filter(e => e.type !== 'frozen'),
        log: '❄️⚡ ¡El hielo se rompe! Daño de ruptura activado',
      }
    }

    // Quemado + Agua → apaga el fuego, cura
    if (types.includes('burning') && incoming.type === ('water' as any)) {
      return {
        effects: current.filter(e => e.type !== 'burning'),
        log: '🔥💧 ¡El fuego se apaga! +20 HP recuperado',
      }
    }

    // Veneno + Regenerando → se cancelan
    if (types.includes('poison') && incoming.type === 'regenerating') {
      return {
        effects: current.filter(e => e.type !== 'poison'),
        log: '☠️🌿 ¡El veneno y la regeneración se neutralizan!',
      }
    }
    if (types.includes('regenerating') && incoming.type === 'poison') {
      return {
        effects: current.filter(e => e.type !== 'regenerating'),
        log: '🌿☠️ ¡La regeneración neutraliza el veneno!',
      }
    }

    // Maldito + Escudo → el escudo absorbe la maldición
    if (types.includes('shielded') && incoming.type === 'cursed') {
      return {
        effects: current.filter(e => e.type !== 'shielded'),
        log: '🛡️😨 ¡El Escudo absorbe la Maldición! Ambos se cancelan',
      }
    }

    return null
  }

  // ── Procesar efectos al inicio del turno ───────────────────────────────────
  static processTurnEffects(
    hp:             number,
    mana:           number,
    maxHp:          number,
    maxMana:        number,
    defense:        number,
    effects:        StatusEffectRich[],
  ): {
    hp: number; mana: number; defense: number
    effects: StatusEffectRich[]
    log: string[]
    divineState: boolean    // blessed + focused → Estado Divino
  } {
    const log: string[] = []
    let newHp      = hp
    let newMana    = mana
    let newDefense = defense

    for (const effect of effects) {
      switch (effect.type) {
        case 'poison':
          const poisonDmg = effect.value ?? 10
          newHp = Math.max(0, newHp - poisonDmg)
          log.push(`☠️ Veneno: -${poisonDmg} HP`)
          break

        case 'burning':
          const burnDmg = effect.value ?? 8
          newHp = Math.max(0, newHp - burnDmg)
          newDefense = Math.floor(newDefense * 0.9)
          log.push(`🔥 Quemado: -${burnDmg} HP, -10% DEF`)
          break

        case 'bleeding':
          const manaLoss = Math.max(1, Math.floor(maxMana * 0.05))
          newMana = Math.max(0, newMana - manaLoss)
          log.push(`💸 Sangría: -${manaLoss} Mana`)
          break

        case 'regenerating':
          const healAmt = Math.min(effect.value ?? 15, maxHp - newHp)
          if (healAmt > 0) {
            newHp += healAmt
            log.push(`🌿 Regenerando: +${healAmt} HP`)
          }
          break

        case 'blessed':
          // se aplica en el cálculo de daño, no aquí
          break
        case 'strengthened':
          // se aplica en el cálculo de daño
          break
        case 'focused':
          // se aplica al próximo ataque
          break
      }
    }

    // Reducir duración de todos los estados
    const updatedEffects = effects
      .map(e => ({ ...e, duration: e.duration - 1 }))
      .filter(e => e.duration > 0)

    // Detectar Estado Divino: blessed + focused
    const hasDivine =
      updatedEffects.some(e => e.type === 'blessed') &&
      updatedEffects.some(e => e.type === 'focused')
    if (hasDivine) {
      log.push('🌟 ¡ESTADO DIVINO ACTIVO! El próximo ataque hace x4 de daño')
    }

    return { hp: newHp, mana: newMana, defense: newDefense, effects: updatedEffects, log, divineState: hasDivine }
  }

  // ── Verificar si una acción puede ejecutarse ───────────────────────────────
  static actionSucceeds(effects: StatusEffectRich[]): {
    succeeds: boolean
    redirectToSelf: boolean
    reason?: string
  } {
    if (effects.some(e => e.type === 'frozen')) {
      return { succeeds: false, redirectToSelf: false, reason: '🧊 ¡Estás congelado! No puedes moverte.' }
    }
    if (effects.some(e => e.type === 'stunned') && Math.random() < 0.5) {
      return { succeeds: false, redirectToSelf: false, reason: '😵 ¡Aturdido! La acción falla.' }
    }
    if (effects.some(e => e.type === 'confused') && Math.random() < 0.3) {
      return { succeeds: true, redirectToSelf: true, reason: '🌀 ¡Confusión! ¡Te atacas a ti mismo!' }
    }
    return { succeeds: true, redirectToSelf: false }
  }

  // ── Calcular multiplicador de daño por estados positivos ──────────────────
  static getDamageMultiplier(effects: StatusEffectRich[], isDivineState: boolean): number {
    let mult = 1.0
    if (isDivineState)                               mult *= 4.0   // Estado Divino
    else if (effects.some(e => e.type === 'blessed')) mult *= 1.2  // Bendecido
    if (effects.some(e => e.type === 'strengthened')) mult *= 1.3  // Fortalecido
    return mult
  }

  // ── Verificar si el Escudo absorbe daño ───────────────────────────────────
  static consumeShield(effects: StatusEffectRich[]): {
    absorbed: boolean;
    newEffects: StatusEffectRich[]
  } {
    const shieldIdx = effects.findIndex(e => e.type === 'shielded')
    if (shieldIdx === -1) return { absorbed: false, newEffects: effects }
    const newEffects = effects.filter((_, i) => i !== shieldIdx)
    return { absorbed: true, newEffects }
  }

  // ── Stats de ataque del jefe según su estado ──────────────────────────────
  static getBossEnrageMultiplier(bossEffects: StatusEffectRich[]): number {
    if (bossEffects.some(e => e.type === 'desperate')) return 2.0
    if (bossEffects.some(e => e.type === 'furious'))   return 1.5
    if (bossEffects.some(e => e.type === 'enraged'))   return 1.3
    return 1.0
  }

  // ── Verificar si el jefe puede usar habilidades especiales ────────────────
  static canUseSpecialSkill(effects: StatusEffectRich[]): boolean {
    return !effects.some(e => e.type === 'chained')
  }

  // ── Crear estado a partir de tipo ─────────────────────────────────────────
  static createEffect(type: AnyStatus, duration: number, value?: number): StatusEffectRich {
    return { type, duration, value }
  }
}
