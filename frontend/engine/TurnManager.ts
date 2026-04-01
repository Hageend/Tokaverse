// engine/TurnManager.ts

import { Fighter, Boss, Skill, StatusEffect } from '../types/combat'

export type CombatAction =
  | { type: 'ATTACK' }
  | { type: 'SKILL';             skillId: string }
  | { type: 'DEFEND' }
  | { type: 'FINANCIAL_ACTION'; action: string; multiplier: number }

export interface CombatLog {
  turn:        number
  actor:       'player' | 'boss'
  action:      string
  damage?:     number
  heal?:       number
  effect?:     StatusEffect
  isCritical?: boolean
  isWeakness?: boolean
  message:     string
}

export interface CombatState {
  player:       Fighter
  boss:         Boss
  turn:         number
  phase:        'player_turn' | 'boss_turn' | 'victory' | 'defeat'
  log:          CombatLog[]
  comboCounter: number
}

export class TurnManager {

  static initCombat(player: Fighter, boss: Boss): CombatState {
    return {
      player,
      boss,
      turn:         1,
      phase:        player.speed >= 10 ? 'player_turn' : 'boss_turn',
      log:          [{
        turn: 0, actor: 'boss', action: 'spawn',
        message: `⚠️ ¡${boss.name} ha aparecido! Monto: $${boss.debtAmount.toLocaleString('es-MX')} MXN`,
      }],
      comboCounter: 0,
    }
  }

  // ─── TURNO DEL JUGADOR ───────────────────────────────────────────────────
  static executePlayerAction(state: CombatState, action: CombatAction): CombatState {
    let newState = { ...state, log: [...state.log] }

    switch (action.type) {

      case 'ATTACK': {
        const { damage, isCritical } = this.calculateDamage(state.player.attack, state.boss.defense)
        newState.boss         = { ...state.boss, hp: Math.max(0, state.boss.hp - damage) }
        newState.comboCounter += 1
        newState.log.push({
          turn: state.turn, actor: 'player', action: 'ATTACK',
          damage, isCritical,
          message: isCritical
            ? `⚡ ¡Golpe crítico! ${state.player.name} inflige ${damage} de daño`
            : `⚔️ ${state.player.name} ataca por ${damage} de daño`,
        })
        break
      }

      case 'SKILL': {
        const skill = state.player.skills.find(s => s.id === action.skillId)
        if (!skill || state.player.mana < skill.manaCost) {
          newState.log.push({ turn: state.turn, actor: 'player', action: 'SKILL_FAIL',
            message: '❌ Mana insuficiente para usar esa habilidad.' })
          break
        }
        newState = this.applySkill(newState, skill)
        newState.player = { ...newState.player, mana: newState.player.mana - skill.manaCost }
        break
      }

      case 'DEFEND': {
        const shield: StatusEffect = { type: 'shield', duration: 1, reduction: 0.5 }
        newState.player = {
          ...state.player,
          statusEffects: [...state.player.statusEffects, shield],
        }
        newState.log.push({
          turn: state.turn, actor: 'player', action: 'DEFEND',
          message: `🛡️ ${state.player.name} se prepara — DMG reducido 50% este turno`,
        })
        break
      }

      case 'FINANCIAL_ACTION': {
        const weakness    = state.boss.weaknesses.find(w => w.action === action.action)
        const multiplier  = weakness ? weakness.multiplier : action.multiplier
        const { damage }  = this.calculateDamage(state.player.attack * multiplier, state.boss.defense)
        newState.boss     = { ...state.boss, hp: Math.max(0, state.boss.hp - damage) }
        newState.comboCounter += 2
        newState.log.push({
          turn: state.turn, actor: 'player', action: 'FINANCIAL_ACTION',
          damage, isWeakness: !!weakness,
          message: weakness
            ? `💥 ¡DÉBILIDAD! Tu pago real inflige ${damage} DMG (x${multiplier.toFixed(1)})`
            : `💳 Tu acción financiera inflige ${damage} de daño`,
        })
        break
      }

      default: break
    }

    if (newState.boss.hp <= 0) {
      newState.phase = 'victory'
      newState.log.push({ turn: newState.turn, actor: 'player', action: 'VICTORY',
        message: `🏆 ¡${newState.boss.name} ha sido derrotado!` })
      return newState
    }

    newState.boss  = this.checkBossPhase(newState.boss, state.boss.phase)
    newState.phase = 'boss_turn'
    return newState
  }

  // ─── TURNO DEL JEFE (automático) ─────────────────────────────────────────
  static executeBossTurn(state: CombatState): CombatState {
    let newState = { ...state, log: [...state.log] }

    // Aplica efectos de estado pasivos al jugador (veneno/quemadura)
    let playerHp = state.player.hp
    const activePoisons = state.player.statusEffects.filter(
      e => e.type === 'poison' || e.type === 'burn'
    ) as Array<{ type: 'poison' | 'burn'; duration: number; damagePerTurn: number }>
    for (const eff of activePoisons) {
      playerHp -= eff.damagePerTurn
    }

    // ¿Stun activo en el JEFE? El jefe pierde su turno
    const isStunned = state.boss.statusEffects?.some((e: StatusEffect) => e.type === 'stun') ?? false
    if (isStunned) {
      newState.log.push({ turn: state.turn, actor: 'boss', action: 'STUN',
        message: `😵 ${state.boss.name} está aturdido y pierde su turno.` })
    } else {
      const availableSkills = state.boss.skills.filter(s => s.usableAtPhase.includes(state.boss.phase))
      const chosen          = availableSkills[Math.floor(Math.random() * availableSkills.length)]

      // Verificar escudo del jugador
      const shield = state.player.statusEffects.find(e => e.type === 'shield') as
        (Extract<StatusEffect, { type: 'shield' }> | undefined)
      let dmg = chosen.damage
      if (shield) dmg = Math.floor(dmg * (1 - shield.reduction))

      playerHp -= dmg
      newState.log.push({
        turn: state.turn, actor: 'boss', action: chosen.id, damage: dmg,
        effect: chosen.effect,
        message: shield
          ? `🛡️ ${state.boss.name} usa ${chosen.name} — bloqueado parcialmente: ${dmg} DMG`
          : `💢 ${state.boss.name} usa ${chosen.name}: ${dmg} DMG`,
      })

      if (chosen.effect) {
        newState.player = { ...state.player, statusEffects: [...state.player.statusEffects, chosen.effect] }
      }
    }

    // Tick de efectos de estado del jugador (decrementa duration, filtra expirados)
    const updatedPlayerEffects = (newState.player.statusEffects ?? state.player.statusEffects)
      .map(e => ({ ...e, duration: e.duration - 1 }))
      .filter(e => e.duration > 0) as StatusEffect[]

    // Tick de efectos de estado del jefe
    const updatedBossEffects = (newState.boss.statusEffects ?? [])
      .map(e => ({ ...e, duration: e.duration - 1 }))
      .filter(e => e.duration > 0) as StatusEffect[]

    newState.boss   = { ...newState.boss,   statusEffects: updatedBossEffects }
    newState.player = {
      ...state.player,
      ...newState.player,
      hp: Math.max(0, playerHp),
      statusEffects: updatedPlayerEffects,
    }

    if (newState.player.hp <= 0) {
      newState.phase = 'defeat'
      newState.log.push({ turn: newState.turn, actor: 'boss', action: 'DEFEAT',
        message: `💀 ${state.player.name} ha caído. La deuda prevalece...` })
      return newState
    }

    newState.turn  = state.turn + 1
    newState.phase = 'player_turn'
    return newState
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  private static calculateDamage(attack: number, defense: number): { damage: number; isCritical: boolean } {
    const safeAttack  = isNaN(attack) ? 10 : attack
    const safeDefense = isNaN(defense) ? 0 : defense
    const isCritical  = Math.random() < 0.15
    const base        = Math.max(1, Math.floor(safeAttack) - Math.floor(safeDefense))
    const variance    = Math.floor(base * 0.2)
    const damage      = base
      + Math.floor(Math.random() * (variance + 1))
      + (isCritical ? Math.floor(base * 0.5) : 0)
    return { damage: isNaN(damage) ? base : damage, isCritical }
  }

  private static applySkill(state: CombatState, skill: Skill): CombatState {
    let newState = { ...state, log: [...state.log] }

    if (skill.damage) {
      const { damage, isCritical } = this.calculateDamage(skill.damage, state.boss.defense)
      newState.boss = { ...state.boss, hp: Math.max(0, state.boss.hp - damage) }
      newState.log.push({
        turn: state.turn, actor: 'player', action: skill.id, damage, isCritical,
        message: isCritical
          ? `⚡ ¡CRÍTICO! ${state.player.name} usa ${skill.name} por ${damage} DMG`
          : `✨ ${state.player.name} usa ${skill.name} por ${damage} DMG`,
      })
    }

    if (skill.heal) {
      const healed    = Math.min(skill.heal, state.player.maxHp - state.player.hp)
      newState.player = { ...state.player, hp: state.player.hp + healed }
      newState.log.push({
        turn: state.turn, actor: 'player', action: skill.id, heal: healed,
        message: `💚 ${state.player.name} se cura ${healed} HP con ${skill.name}`,
      })
    }

    if (skill.effect) {
      if (skill.targetType === 'enemy' || skill.targetType === 'all_enemies') {
        // Aplicar efecto al jefe (stun, burn, etc.)
        newState.boss = {
          ...newState.boss,
          statusEffects: [...(newState.boss.statusEffects ?? []), skill.effect],
        }
        newState.log.push({
          turn: state.turn, actor: 'player', action: skill.id, effect: skill.effect,
          message: `✨ ${skill.name} aplica ${skill.effect.type} al jefe por ${skill.effect.duration} turnos`,
        })
      } else {
        newState.player = {
          ...newState.player,
          statusEffects: [...(newState.player.statusEffects ?? []), skill.effect],
        }
        newState.log.push({
          turn: state.turn, actor: 'player', action: skill.id, effect: skill.effect,
          message: `✨ ${skill.name} aplica efecto: ${skill.effect.type} (${skill.effect.duration} turnos)`,
        })
      }
    }

    return newState
  }

  private static checkBossPhase(boss: Boss, previousPhase: number): Boss {
    const hpPercent = (boss.hp / boss.maxHp) * 100
    let newPhase    = boss.phase

    if      (hpPercent <= 25) newPhase = 3
    else if (hpPercent <= 50) newPhase = 2
    else if (hpPercent <= 75) newPhase = 1

    if (newPhase !== previousPhase) {
      console.log(`⚠️ ¡${boss.name} entra en FASE ${newPhase}! Se vuelve más peligroso.`)
    }

    return { ...boss, phase: newPhase as 1 | 2 | 3 }
  }
}
