// engine/TurnManager.ts
// Orquestador central del combate JRPG — integra todos los motores

import { Fighter, Boss, Skill, BossSkill } from '../types/combat'
import { Element, ElementEngine, CLASS_ELEMENTS, BOSS_ELEMENTS, ELEMENT_INFO } from '../types/elements'
import { StatusEngine, StatusEffectRich } from './StatusEngine'
import { FusionEngine, DEMO_CARDS } from './FusionEngine'
import { BossPhaseEngine, Minion } from './BossPhaseEngine'
import { getPhasesForBoss } from '../data/bossPhases'
import type { FusionResult, PlayerCard } from '../types/fusion'

export type CombatAction =
  | { type: 'ATTACK' }
  | { type: 'SKILL';             skillId: string }
  | { type: 'DEFEND' }
  | { type: 'FINANCIAL_ACTION'; action: string; multiplier: number }
  | { type: 'FUSION';            fusionId: string }
  | { type: 'ATTACK_MINION';    minionId: string }
  | { type: 'USE_ITEM';          itemId: string; hpHeal?: number; manaHeal?: number }

export interface CombatLog {
  turn:             number
  actor:            'player' | 'boss' | 'system'
  action:           string
  damage?:          number
  heal?:            number
  effect?:          StatusEffectRich
  isCritical?:      boolean
  isWeakness?:      boolean
  elementMult?:     number
  effectLabel?:     string    // "¡SÚPER EFECTIVO!" etc.
  effectColor?:     string    // color para mostrar en UI
  message:          string
}

export interface CombatState {
  player:           Fighter
  boss:             Boss
  turn:             number
  phase:            'player_turn' | 'boss_turn' | 'victory' | 'defeat'
  log:              CombatLog[]
  comboCounter:     number
  // Estado extendido
  activeFusion?:    FusionResult          // fusión activa en este combate
  equippedCards:    PlayerCard[]          // cartas equipadas pre-combate
  availableFusions: FusionResult[]        // fusiones posibles con las cartas equipadas
  activeFusionEffect?: {                  // efecto de fusión vigente
    fusion:       FusionResult
    turnsLeft:    number
    statBoost:    number                  // multiplicador activo (ej: 1.25)
    autoBlock:    boolean
    freeSkill:    boolean                 // próximo skill sin costo de mana
  }
  minions:          Minion[]             // minions en campo
  weekpointsActive: boolean
  bossPhaseJustChanged: boolean          // flag para mostrar banner de fase
  bossPhaseData?:   ReturnType<typeof getPhasesForBoss>[number]
  bankruptcyWarning: boolean             // flag para mostrar advertencia visual
  telegraphMsg?:    string              // mensaje de telegrafía del jefe
  divineState:      boolean             // blessed + focused activos
  consecutiveBossHits: number           // para mecánica "Cargo por mora"
  turnsPlayerNotUsedCards: number       // para mecánica "Oferta irresistible"
  lastPlayerAction?: CombatAction['type']
}

// ─────────────────────────────────────────────────────────────────────────────
export class TurnManager {

  static initCombat(
    player: Fighter,
    boss:   Boss,
    equippedCards?: PlayerCard[],
  ): CombatState {
    const cards         = equippedCards ?? DEMO_CARDS.slice(0, 3)
    const fusions        = FusionEngine.detectFusions(cards.map(c => c.cardId))
    const playerElement  = CLASS_ELEMENTS[player.class]?.primary ?? 'thunder'
    const bossPhases     = getPhasesForBoss(boss.debtType)

    // Asignar elemento al jugador si no lo tiene
    const enrichedPlayer: Fighter = {
      ...player,
      element:    playerElement,
      stamina:    player.stamina    ?? 100,
      maxStamina: player.maxStamina ?? 100,
    }

    // Asignar elemento al jefe si no lo tiene
    const bossElem = BOSS_ELEMENTS[boss.debtType] ?? { primary: 'dark' as Element }
    const enrichedBoss: Boss = {
      ...boss,
      element:          boss.element          ?? bossElem.primary,
      secondaryElement: boss.secondaryElement ?? bossElem.secondary,
      bankruptcyUsed:   false,
      consecutiveHits:  0,
      turnsWithoutCards: 0,
    }

    const initialState: CombatState = {
      player:          enrichedPlayer,
      boss:            enrichedBoss,
      turn:            1,
      phase:           enrichedPlayer.speed >= 10 ? 'player_turn' : 'boss_turn',
      log: [{
        turn: 0, actor: 'system', action: 'SPAWN',
        message: boss.debtAmount > 0 
          ? `⚠️ ¡${boss.name} aparece! Monto: $${boss.debtAmount.toLocaleString('es-MX')} MXN`
          : `⚠️ ¡${boss.name} bloquea el camino!`,
      }, {
        turn: 0, actor: 'system', action: 'ELEMENT_INFO',
        message: `${ELEMENT_INFO[playerElement]?.emoji} Tu elemento: ${ELEMENT_INFO[playerElement]?.label} · Disponibles: ${fusions.length} fusión(es)`,
      }],
      comboCounter:              0,
      equippedCards:             cards,
      availableFusions:          fusions,
      activeFusion:              undefined,
      activeFusionEffect:        undefined,
      minions:                   [],
      weekpointsActive:          false,
      bossPhaseJustChanged:      false,
      bossPhaseData:             bossPhases.find(p => p.phaseNumber === 1),
      bankruptcyWarning:         false,
      telegraphMsg:              undefined,
      divineState:               false,
      consecutiveBossHits:       0,
      turnsPlayerNotUsedCards:   0,
      lastPlayerAction:          undefined,
    }

    // Predecir primer movimiento del jefe
    initialState.telegraphMsg = this.predictNextBossMove(initialState).name
    return initialState
  }

  // ─── TURNO DEL JUGADOR ────────────────────────────────────────────────────
  static executePlayerAction(state: CombatState, action: CombatAction): CombatState {
    let s = { ...state, log: [...state.log], bossPhaseJustChanged: false, bankruptcyWarning: false }

    // 1. Verificar si la acción puede ejecutarse (estados alterados)
    const { succeeds, redirectToSelf, reason } = StatusEngine.actionSucceeds(s.player.statusEffects)
    if (!succeeds) {
      s.log.push({ turn: s.turn, actor: 'player', action: 'BLOCKED', message: reason ?? '❌ Acción bloqueada.' })
      s.phase = 'boss_turn'
      return s
    }

    // 2. Obtener elemento del jugador y multiplicador elemental vs jefe
    const playerElement = s.player.element ?? CLASS_ELEMENTS[s.player.class]?.primary ?? 'thunder'
    const bossElement   = s.boss.element ?? 'dark'
    const elemMult      = ElementEngine.getMultiplier(playerElement, bossElement)
    const elemLabel     = ElementEngine.getEffectivenessLabel(elemMult)
    const elemColor     = ElementEngine.getEffectivenessColor(elemMult)

    // 3. Multiplicadores de fusión activa
    const fusionBoost = s.activeFusionEffect?.statBoost ?? 1.0
    const autoBlock   = s.activeFusionEffect?.autoBlock ?? false
    const freeSkill   = s.activeFusionEffect?.freeSkill ?? false

    // 4. Multiplicadores de estados positivos
    const damageStatMult = StatusEngine.getDamageMultiplier(s.player.statusEffects, s.divineState)

    // 5. Ejecutar acción
    switch (action.type) {

      case 'ATTACK': {
        // Ataque básico — sin redirigir a sí mismo si está confundido
        if (redirectToSelf) {
          const selfDmg = Math.floor(s.player.attack * 0.5)
          s.player      = { ...s.player, hp: Math.max(0, s.player.hp - selfDmg) }
          s.log.push({ turn: s.turn, actor: 'player', action: 'CONFUSED_HIT', damage: selfDmg, message: `${reason} — ¡${selfDmg} de daño a ti mismo!` })
          break
        }
        const { damage, isCritical } = this.calculateDamage(
          s.player.attack, s.boss.defense,
          elemMult, fusionBoost, damageStatMult,
          s.player.statusEffects.some(e => e.type === 'focused'),
        )
        s.boss         = { ...s.boss, hp: Math.max(0, s.boss.hp - damage) }
        s.comboCounter += 1
        s.consecutiveBossHits = 0   // reset contador de hits consecutivos del jefe
        s.log.push({
          turn: s.turn, actor: 'player', action: 'ATTACK',
          damage, isCritical, elementMult: elemMult, effectLabel: elemLabel, effectColor: elemColor,
          message: isCritical
            ? `⚡ ¡CRÍTICO! ${s.player.name} ataca por ${damage} DMG${elemLabel ? ` · ${elemLabel}` : ''}`
            : `⚔️ ${s.player.name} ataca por ${damage} DMG${elemLabel ? ` · ${elemLabel}` : ''}`,
        })
        // Consumir estado focused si estaba activo
        s.player = { ...s.player, statusEffects: s.player.statusEffects.filter(e => e.type !== 'focused') }
        break
      }

      case 'SKILL': {
        const skill = s.player.skills.find(sk => sk.id === action.skillId)
        if (!skill) { s.log.push({ turn: s.turn, actor: 'player', action: 'SKILL_FAIL', message: '❌ Habilidad no encontrada.' }); break }

        // Verificar si el jugador está encadenado (no puede usar especiales)
        if (s.player.statusEffects.some(e => e.type === 'chained')) {
          s.log.push({ turn: s.turn, actor: 'player', action: 'CHAINED', message: '⛓️ Estás encadenado — no puedes usar habilidades especiales.' })
          break
        }

        // Verificar costo de mana (maldición duplica el costo)
        const isCursed    = s.player.statusEffects.some(e => e.type === 'cursed')
        const manaCost    = freeSkill ? 0 : (isCursed ? skill.manaCost * 2 : skill.manaCost)
        if (s.player.mana < manaCost) {
          s.log.push({ turn: s.turn, actor: 'player', action: 'SKILL_FAIL', message: '❌ Mana insuficiente' + (isCursed ? ' (Maldición: x2 costo)' : '') + '.' })
          break
        }

        s.player = { ...s.player, mana: s.player.mana - manaCost }
        s = this.applySkill(s, skill, elemMult, fusionBoost, damageStatMult)
        s.turnsPlayerNotUsedCards = 0   // usó una habilidad → reseteamos la trampa "Oferta irresistible"

        // Consumir freeSkill si estaba activo
        if (freeSkill && s.activeFusionEffect) {
          s.activeFusionEffect = { ...s.activeFusionEffect, freeSkill: false }
        }
        break
      }

      case 'DEFEND': {
        const shieldEffect: StatusEffectRich = { type: 'shielded', duration: 1 }
        const { effects: newEffects } = StatusEngine.applyStatus(s.player.statusEffects, shieldEffect)
        s.player = { ...s.player, statusEffects: newEffects }
        s.log.push({
          turn: s.turn, actor: 'player', action: 'DEFEND',
          message: '🛡️ ' + s.player.name + ' se pone en guardia — próximo ataque absorbido',
        })
        break
      }

      case 'FINANCIAL_ACTION': {
        const weakness    = s.boss.weaknesses.find(w => w.action === action.action)
        const mult        = weakness ? weakness.multiplier : action.multiplier
        const { damage }  = this.calculateDamage(
          s.player.attack * mult, s.boss.defense,
          elemMult, fusionBoost, damageStatMult, false,
        )
        s.boss           = { ...s.boss, hp: Math.max(0, s.boss.hp - damage) }
        s.comboCounter   += 2

        // Mecánica Fase 4: TX real de Toka → bonus adicional si boss.phase === 4
        let bonusMsg = ''
        if (s.boss.phase === 4) {
          const txBonus = Math.floor(s.boss.hp * 0.20)
          s.boss        = { ...s.boss, hp: Math.max(0, s.boss.hp - txBonus) }
          bonusMsg      = ` + 💳 Acción Financiera Real: ${txBonus} HP extra`
        }

        s.log.push({
          turn: s.turn, actor: 'player', action: 'FINANCIAL_ACTION',
          damage, isWeakness: !!weakness,
          message: weakness
            ? `💥 ¡DEBILIDAD FINANCIERA! ${damage} DMG (x${mult.toFixed(1)})${bonusMsg}`
            : `💳 Acción financiera: ${damage} de daño${bonusMsg}`,
        })
        s.turnsPlayerNotUsedCards = 0
        break
      }

      case 'FUSION': {
        const fusion = s.availableFusions.find(f => f.id === action.fusionId)
        if (!fusion) { s.log.push({ turn: s.turn, actor: 'player', action: 'FUSION_FAIL', message: '❌ Fusión no disponible.' }); break }

        s.activeFusionEffect = {
          fusion,
          turnsLeft: fusion.duration,
          statBoost: fusion.statBoost ?? 1.0,
          autoBlock: fusion.specialEffect === 'auto_block',
          freeSkill: fusion.specialEffect === 'no_mana_cost',
        }
        s.activeFusion    = fusion
        s.availableFusions = s.availableFusions.filter(f => f.id !== fusion.id)

        // Aplicar estado positivo si la fusión lo da
        if (fusion.statBoost && fusion.statBoost > 1.0) {
          const boostEff: StatusEffectRich = { type: 'strengthened', duration: fusion.duration, multiplier: fusion.statBoost }
          const { effects } = StatusEngine.applyStatus(s.player.statusEffects, boostEff)
          s.player = { ...s.player, statusEffects: effects }
        }

        s.log.push({
          turn: s.turn, actor: 'player', action: 'FUSION',
          message: `✨ ¡Fusión activada: ${fusion.name}! — ${fusion.description}`,
        })
        s.turnsPlayerNotUsedCards = 0
        break
      }

      case 'ATTACK_MINION': {
        const { damage } = this.calculateDamage(s.player.attack, 0, 1.0, fusionBoost, damageStatMult, false)
        const { minions, killed, minionKilled } = BossPhaseEngine.attackMinion(s.minions, action.minionId, damage)
        s.minions = minions
        s.log.push({
          turn: s.turn, actor: 'player', action: 'ATTACK_MINION', damage,
          message: killed
            ? `👻 ¡El Cobrador fue eliminado! (${damage} DMG)`
            : `🗡️ Golpeas al Cobrador — ${damage} DMG`,
        })
        break
      }

      case 'USE_ITEM': {
        if (action.hpHeal) {
          const heal = Math.min(action.hpHeal, s.player.maxHp - s.player.hp);
          s.player   = { ...s.player, hp: s.player.hp + heal };
          s.log.push({ turn: s.turn, actor: 'player', action: 'USE_ITEM', heal, message: `🧪 ${s.player.name} usa un objeto y recupera ${heal} HP.` });
        }
        if (action.manaHeal) {
          const mana = Math.min(action.manaHeal, (s.player.maxMana ?? 100) - s.player.mana);
          s.player   = { ...s.player, mana: s.player.mana + mana };
          s.log.push({ turn: s.turn, actor: 'player', action: 'USE_ITEM', message: `🧪 ${s.player.name} recupera ${mana} Mana.` });
        }
        break;
      }

      default: break;
    }

    s.lastPlayerAction = action.type

    // ── Verificar victoria ────────────────────────────────────────────────────
    if (s.boss.hp <= 0) {
      s.phase = 'victory'
      s.log.push({ turn: s.turn, actor: 'system', action: 'VICTORY', message: `🏆 ¡${s.boss.name} ha sido derrotado! Tu crédito mejora.` })
      return s
    }

    // ── Verificar transición de fase del jefe ─────────────────────────────────
    const hpPct = (s.boss.hp / s.boss.maxHp) * 100
    const { newPhase, didTransition } = BossPhaseEngine.checkPhaseTransition(hpPct, s.boss.phase, s.boss.debtType)
    if (didTransition && newPhase) {
      s.boss = { ...s.boss, phase: newPhase.phaseNumber as 1|2|3|4 }
      s.bossPhaseJustChanged = true
      s.bossPhaseData = newPhase
      s.weekpointsActive = newPhase.weakpoints
      s.log.push({
        turn: s.turn, actor: 'boss', action: 'PHASE_CHANGE',
        message: `💀 ¡${s.boss.name} entra en "${newPhase.name}"! ${newPhase.description}`,
      })

      // Mecánica de "Oferta irresistible" en fase 1 → recuperar HP si no usó cartas
      if (s.boss.phase === 1 && s.turnsPlayerNotUsedCards >= 2) {
        const healAmt = 50
        s.boss = { ...s.boss, hp: Math.min(s.boss.maxHp, s.boss.hp + healAmt) }
        s.log.push({ turn: s.turn, actor: 'boss', action: 'TEMPTATION_HEAL', heal: healAmt, message: `💛 ¡Oferta Irresistible! El jefe recupera ${healAmt} HP` })
      }
    }

    // ── Turno se pasa al jefe ─────────────────────────────────────────────────
    s.phase = 'boss_turn'
    // Predecir el movimiento que hará el jefe en su turno inmediato para que la UI lo muestre
    const nextMove = this.predictNextBossMove(s)
    s.telegraphMsg = nextMove.telegraphMsg || nextMove.name
    
    return s
  }

  /**
   * Predice el siguiente movimiento del jefe basándose en la fase actual.
   * Útil para la telegrafía en la UI.
   */
  private static predictNextBossMove(state: CombatState): BossSkill {
    let availableSkills = state.boss.skills.filter(sk => sk.usableAtPhase.includes(state.boss.phase))
    if (availableSkills.length === 0) availableSkills = state.boss.skills

    // Lógica determinista simulada para la predicción (en un motor real esto guardaría el move elegido)
    // Para simplificar, usaremos un índice basado en el turno actual
    const idx = (state.turn + state.boss.hp) % availableSkills.length
    return availableSkills[idx]
  }

  // ─── TURNO DEL JEFE (automático) ─────────────────────────────────────────
  static executeBossTurn(state: CombatState): CombatState {
    let s = { ...state, log: [...state.log], bossPhaseJustChanged: false, telegraphMsg: undefined as string | undefined, bankruptcyWarning: false }

    // 1. Procesar estados del jugador (veneno, quemadura, regeneración, etc.)
    const result = StatusEngine.processTurnEffects(
      s.player.hp, s.player.mana, s.player.maxHp, s.player.maxMana, s.player.defense, s.player.statusEffects,
    )
    s.player            = { ...s.player, hp: result.hp, mana: result.mana, defense: result.defense, statusEffects: result.effects }
    s.divineState       = result.divineState
    for (const logMsg of result.log) {
      s.log.push({ turn: s.turn, actor: 'system', action: 'STATUS_TICK', message: logMsg })
    }

    // 2. Actualizar minions si los hay
    if (s.minions.length > 0) {
      const { minions, reached } = BossPhaseEngine.updateMinions(s.minions, 1000)
      s.minions = minions
      for (const m of reached) {
        const mDmg = m.damage
        s.player  = { ...s.player, hp: Math.max(0, s.player.hp - mDmg) }
        s.log.push({ turn: s.turn, actor: 'boss', action: 'MINION_HIT', damage: mDmg, message: `👻 ¡El Cobrador te alcanza! -${mDmg} HP` })
      }
    }

    // 3. Spawn de minions si aplica (cada 3 turnos en fase 3+)
    const phaseData = s.bossPhaseData
    if (phaseData?.spawnsMinions && s.turn % 3 === 0) {
      const newMinion = BossPhaseEngine.spawnMinion()
      s.minions = [...s.minions, newMinion]
      s.log.push({ turn: s.turn, actor: 'boss', action: 'MINION_SPAWN', message: `👻 ¡${phaseData.uniqueMechanic.warningMessage}` })
    }

    // 4. ¿El jefe está stun? Pierde turno
    const isStunned = s.boss.statusEffects?.some(e => e.type === 'stunned') ?? false
    if (isStunned) {
      s.log.push({ turn: s.turn, actor: 'boss', action: 'STUN', message: `😵 ${s.boss.name} está aturdido — pierde este turno.` })
    } else {
      // 5. Seleccionar skill del jefe según fase actual
      let availableSkills = s.boss.skills.filter(sk => sk.usableAtPhase.includes(s.boss.phase))
      
      // Fallback si no hay skills para esta fase (sucede en mobs simples)
      if (availableSkills.length === 0) availableSkills = s.boss.skills;

      // Mecánica "Cargo por mora" fase 2+: si el jefe recibió 3 ataques consecutivos → daño x2
      const consecutiveDmgBonus = (s.boss.phase >= 2 && s.consecutiveBossHits >= 3) ? 2.0 : 1.0
      if (consecutiveDmgBonus > 1.0) {
        s.log.push({ turn: s.turn, actor: 'boss', action: 'COMPOUND_INTEREST', message: '📈 ¡Cargo por Mora! El siguiente ataque del jefe hace x2 daño' })
        s.consecutiveBossHits = 0
      }

      // Priorizar Bancarrota si está disponible y no se ha usado
      let chosen = availableSkills[Math.floor(Math.random() * availableSkills.length)]
      if (s.boss.phase === 4 && !s.boss.bankruptcyUsed && availableSkills.find(sk => sk.id === 'bankruptcy')) {
        chosen = availableSkills.find(sk => sk.id === 'bankruptcy')!
      }

      // 6. Telegrafiar ataque si tiene mensaje
      if (chosen.telegraphMsg) s.telegraphMsg = chosen.telegraphMsg

      // 7. Calcular daño con bonus de fase y estado
      const phaseBonus = phaseData ? BossPhaseEngine.getPhaseAttackBonus(phaseData) : 1.0

      let dmg = Math.floor(chosen.damage * phaseBonus * consecutiveDmgBonus * StatusEngine.getBossEnrageMultiplier(s.boss.statusEffects))

      // Mecánica Bancarrota: daño fijo del 40% HP máximo del jugador
      let isBankruptcy = false
      if (chosen.id === 'bankruptcy' && !s.boss.bankruptcyUsed) {
        dmg          = BossPhaseEngine.calculateBankruptcyDamage(s.player.maxHp)
        isBankruptcy = true
        s.boss       = { ...s.boss, bankruptcyUsed: true }
        s.bankruptcyWarning = true
      }

      // 8. Verificar si el escudo del jugador absorbe el golpe
      const { absorbed, newEffects: afterShield } = StatusEngine.consumeShield(s.player.statusEffects)
      if (absorbed || (isBankruptcy && s.activeFusionEffect?.autoBlock)) {
        s.player           = { ...s.player, statusEffects: afterShield }
        s.log.push({
          turn: s.turn, actor: 'boss', action: chosen.id,
          message: `🛡️ ¡${isBankruptcy ? 'Escudo Familiar absorbe BANCARROTA' : 'El Escudo absorbe'}! ${chosen.name} bloqueado completamente`,
        })
      } else {
        // 9. Aplicar daño al jugador
        s.player           = { ...s.player, hp: Math.max(0, s.player.hp - dmg), statusEffects: afterShield }
        s.consecutiveBossHits += 1

        s.log.push({
          turn: s.turn, actor: 'boss', action: chosen.id, damage: dmg,
          effect: chosen.effect,
          message: isBankruptcy
            ? `💀 ¡¡BANCARROTA!! ${chosen.name}: ${dmg} DMG (40% de tu HP máximo)`
            : `💢 ${s.boss.name} usa ${chosen.name}: ${dmg} DMG`,
        })

        // 10. Aplicar efecto del skill del jefe al jugador
        if (chosen.effect) {
          const { effects, interactionLog } = StatusEngine.applyStatus(s.player.statusEffects, chosen.effect)
          s.player = { ...s.player, statusEffects: effects }
          if (interactionLog) s.log.push({ turn: s.turn, actor: 'system', action: 'INTERACTION', message: interactionLog })
        }
      }

      // Incrementar contador "sin cartas" para mecánica Oferta Irresistible
      if (s.lastPlayerAction === 'ATTACK' || s.lastPlayerAction === 'DEFEND') {
        s.turnsPlayerNotUsedCards += 1
      } else {
        s.turnsPlayerNotUsedCards = 0
      }
    }

    // 11. Tick de estados del jefe (decrementa duración)
    const updatedBossEffects = (s.boss.statusEffects ?? [])
      .map(e => ({ ...e, duration: e.duration - 1 }))
      .filter(e => e.duration > 0) as StatusEffectRich[]
    s.boss = { ...s.boss, statusEffects: updatedBossEffects }

    // 12. Tick de efecto de fusión activa
    if (s.activeFusionEffect) {
      const turnsLeft = s.activeFusionEffect.turnsLeft - 1
      if (turnsLeft <= 0) {
        s.activeFusionEffect = undefined
        s.log.push({ turn: s.turn, actor: 'system', action: 'FUSION_EXPIRED', message: '🌟 La fusión ha expirado.' })
      } else {
        s.activeFusionEffect = { ...s.activeFusionEffect, turnsLeft }
      }
    }

    // 13. Verificar derrota
    if (s.player.hp <= 0) {
      s.phase = 'defeat'
      s.log.push({ turn: s.turn, actor: 'boss', action: 'DEFEAT', message: `💀 ${s.player.name} ha caído. La deuda prevalece...` })
      return s
    }

    s.turn  = s.turn + 1
    s.phase = 'player_turn'
    return s
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  private static calculateDamage(
    attack:      number,
    defense:     number,
    elemMult:    number   = 1.0,
    fusionMult:  number   = 1.0,
    statusMult:  number   = 1.0,
    isFocused:   boolean  = false,
  ): { damage: number; isCritical: boolean } {
    const safeAtk  = isNaN(attack)  ? 10 : attack
    const safeDef  = isNaN(defense) ? 0  : defense
    const isCrit   = isFocused || Math.random() < 0.15
    const base     = Math.max(1, Math.floor(safeAtk) - Math.floor(safeDef))
    const variance = Math.floor(base * 0.2)
    const raw      = base
      + Math.floor(Math.random() * (variance + 1))
      + (isCrit && !isFocused ? Math.floor(base * 0.5) : 0)
      + (isFocused ? Math.floor(base * 0.8) : 0)  // Enfocado = 80% extra

    const final = Math.floor(raw * elemMult * fusionMult * statusMult)
    return { damage: isNaN(final) ? base : Math.max(1, final), isCritical: isCrit }
  }

  private static applySkill(
    state:       CombatState,
    skill:       Skill,
    elemMult:    number,
    fusionMult:  number,
    statusMult:  number,
  ): CombatState {
    let s    = { ...state, log: [...state.log] }
    const isFocused = s.player.statusEffects.some(e => e.type === 'focused')

    if (skill.damage) {
      const { damage, isCritical } = this.calculateDamage(skill.damage, s.boss.defense, elemMult, fusionMult, statusMult, isFocused)
      s.boss = { ...s.boss, hp: Math.max(0, s.boss.hp - damage) }
      const elemLabel = ElementEngine.getEffectivenessLabel(elemMult)
      s.log.push({
        turn: s.turn, actor: 'player', action: skill.id, damage, isCritical,
        elementMult: elemMult, effectLabel: elemLabel,
        message: isCritical
          ? `⚡ ¡CRÍTICO! ${s.player.name} usa ${skill.name}: ${damage} DMG${elemLabel ? ' · ' + elemLabel : ''}`
          : `✨ ${s.player.name} usa ${skill.name}: ${damage} DMG${elemLabel ? ' · ' + elemLabel : ''}`,
      })
    }

    if (skill.heal) {
      const healed = Math.min(skill.heal, s.player.maxHp - s.player.hp)
      s.player     = { ...s.player, hp: s.player.hp + healed }
      s.log.push({ turn: s.turn, actor: 'player', action: skill.id, heal: healed, message: `💚 ${s.player.name} se cura ${healed} HP con ${skill.name}` })
    }

    if (skill.effect) {
      if (skill.targetType === 'enemy' || skill.targetType === 'all_enemies') {
        const { effects, interactionLog } = StatusEngine.applyStatus(s.boss.statusEffects, skill.effect)
        s.boss = { ...s.boss, statusEffects: effects }
        s.log.push({ turn: s.turn, actor: 'player', action: skill.id, effect: skill.effect, message: `✨ ${skill.name} aplica ${skill.effect.type} al jefe (${skill.effect.duration} turnos)` })
        if (interactionLog) s.log.push({ turn: s.turn, actor: 'system', action: 'INTERACTION', message: interactionLog })
      } else {
        const { effects, interactionLog } = StatusEngine.applyStatus(s.player.statusEffects, skill.effect)
        s.player = { ...s.player, statusEffects: effects }
        s.log.push({ turn: s.turn, actor: 'player', action: skill.id, effect: skill.effect, message: `✨ ${skill.name}: ${skill.effect.type} activo (${skill.effect.duration} turnos)` })
        if (interactionLog) s.log.push({ turn: s.turn, actor: 'system', action: 'INTERACTION', message: interactionLog })
      }
    }

    return s
  }
}
