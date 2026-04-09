// engine/BossEngine.ts
// Generador de jefes desde datos de deuda — con 4 fases y elementos

import { Boss, BossSkill, DebtWeakness, DebtData } from '../types/combat'
import { BOSS_SPRITES } from '../data/classSkills'
import { BOSS_ELEMENTS } from '../types/elements'
import type { StatusEffectRich } from './StatusEngine'

export class BossEngine {

  static generateFromDebt(debt: DebtData): Boss {
    const scaledHp    = this.calculateHp(debt)
    const scaledAtk   = this.calculateAttack(debt)
    const weaknesses  = this.assignWeaknesses(debt.type)
    const elements    = BOSS_ELEMENTS[debt.type] ?? { primary: 'dark' as const }

    return {
      id:               `boss_${debt.id}`,
      name:             this.getBossName(debt.type, debt.daysOverdue),
      debtType:         debt.type,
      hp:               scaledHp,
      maxHp:            scaledHp,
      attack:           scaledAtk,
      defense:          Math.max(0, Math.floor(debt.daysOverdue / 5)),
      phase:            1,
      phaseThresholds:  [75, 50, 25, 10],
      skills:           this.getBossSkills(debt.type),
      weaknesses,
      sprite:           this.getBossSprite(debt.type),
      debtAmount:       debt.amount,
      statusEffects:    [],
      element:          elements.primary,
      secondaryElement: elements.secondary,
      bankruptcyUsed:   false,
      consecutiveHits:  0,
      turnsWithoutCards: 0,
    }
  }

  /** HP escala con el monto de la deuda: $1,000 MXN = 100 HP, +5 HP por día de atraso */
  private static calculateHp(debt: DebtData): number {
    const base         = Math.floor(debt.amount / 10)
    const overdueBonus = debt.daysOverdue * 5
    return Math.min(Math.max(base + overdueBonus, 80), 9999)
  }

  /** ATK escala con la tasa de interés */
  private static calculateAttack(debt: DebtData): number {
    const base          = 15
    const interestBonus = debt.interestRate ? Math.floor(debt.interestRate * 2) : 0
    return base + interestBonus
  }

  private static getBossName(type: DebtData['type'], daysOverdue: number): string {
    const names: Record<DebtData['type'], string> = {
      credit_card:   daysOverdue > 30 ? '🃏 La Tarjeta Maldita'      : '🃏 La Tarjeta Oscura',
      service:       daysOverdue > 15 ? '⚡ El Servicio Corrupto'     : '⚡ La Factura Pendiente',
      loan:          daysOverdue > 60 ? '💀 El Préstamo Devorador'    : '💀 La Deuda Creciente',
      overdraft:     daysOverdue > 7  ? '🌀 El Sobregiro Eterno'      : '🌀 El Saldo Negativo',
      toka_despensa: '🛒 El Carrito Vacío',
      toka_fuel:     '⛽ El Tanque Vacío',
      toka_connect:  '📑 El Gasto Sin Comprobar',
      abyss:         '🌌 El Abismo de Deuda',
      golem:         '🗿 El Golem de Facturas',
      tickets:       '🌧️ La Lluvia de Tickets',
      cash:          '💰 El Monstruo de Efectivo',
    }
    return names[type]
  }

  private static assignWeaknesses(type: DebtData['type']): DebtWeakness[] {
    const map: Record<DebtData['type'], DebtWeakness[]> = {
      credit_card: [
        { action: 'payment_made',     multiplier: 2.0 },
        { action: 'early_payment',    multiplier: 3.0 },
      ],
      service: [
        { action: 'payment_made',     multiplier: 2.5 },
        { action: 'budget_respected', multiplier: 1.8 },
      ],
      loan: [
        { action: 'savings_deposit',  multiplier: 2.0 },
        { action: 'goal_completed',   multiplier: 3.5 },
      ],
      overdraft: [
        { action: 'savings_deposit',  multiplier: 2.5 },
        { action: 'payment_made',     multiplier: 1.5 },
      ],
      toka_despensa: [
        { action: 'payment_made',     multiplier: 2.5 },
        { action: 'budget_respected', multiplier: 2.0 },
      ],
      toka_fuel: [
        { action: 'payment_made',     multiplier: 2.0 },
        { action: 'early_payment',    multiplier: 2.5 },
      ],
      toka_connect: [
        { action: 'payment_made',     multiplier: 1.8 },
        { action: 'early_payment',    multiplier: 3.0 },
      ],
      abyss: [
        { action: 'savings_deposit',  multiplier: 2.8 },
        { action: 'goal_completed',   multiplier: 2.2 },
      ],
      golem: [
        { action: 'payment_made',     multiplier: 2.0 },
        { action: 'budget_respected', multiplier: 2.5 },
      ],
      tickets: [
        { action: 'early_payment',    multiplier: 2.8 },
        { action: 'payment_made',     multiplier: 1.5 },
      ],
      cash: [
        { action: 'savings_deposit',  multiplier: 2.5 },
        { action: 'budget_respected', multiplier: 2.0 },
      ],
    }
    return map[type]
  }

  private static getBossSkills(type: DebtData['type']): BossSkill[] {
    const poisonEffect: StatusEffectRich   = { type: 'poison',  duration: 3, value: 10 }
    const burnEffect: StatusEffectRich     = { type: 'burning', duration: 2, value: 15 }
    const stunEffect: StatusEffectRich     = { type: 'stunned', duration: 1 }
    const bleedEffect: StatusEffectRich    = { type: 'bleeding', duration: 3 }
    const cursedEffect: StatusEffectRich   = { type: 'cursed',   duration: 2 }

    const skills: Record<DebtData['type'], BossSkill[]> = {
      credit_card: [
        {
          id: 'interest_bite', name: '🦷 Mordida de Interés', damage: 25,
          usableAtPhase: [1,2,3,4], element: 'dark',
          telegraphMsg: '⚠️ La Tarjeta abre sus colmillos...',
        },
        {
          id: 'credit_drain', name: '🌑 Drenaje de Crédito', damage: 40,
          effect: poisonEffect, usableAtPhase: [2,3,4], element: 'dark',
          telegraphMsg: '⚠️ La Tarjeta absorbe tu crédito...',
        },
        {
          id: 'debt_spiral', name: '🌀 Espiral de Deuda', damage: 70,
          effect: burnEffect, usableAtPhase: [3,4], element: 'fire',
          telegraphMsg: '🔥 ¡La deuda se espiraliza!',
        },
        {
          id: 'bankruptcy', name: '💀 BANCARROTA', damage: 0,   // daño calculado por BossPhaseEngine
          effect: cursedEffect, usableAtPhase: [4], element: 'dark',
          telegraphMsg: '🌋 ¡¡LA TARJETA DESATA BANCARROTA!!',
        },
      ],
      service: [
        { id: 'late_fee',    name: '📄 Cargo por Mora',    damage: 20, usableAtPhase: [1,2,3,4], element: 'thunder' },
        { id: 'service_cut', name: '✂️ Corte de Servicio', damage: 35, effect: stunEffect, usableAtPhase: [2,3,4], element: 'thunder', telegraphMsg: '⚡ El servicio se interrumpe...' },
        { id: 'blackout',    name: '⚡ Apagón Total',      damage: 60, effect: bleedEffect, usableAtPhase: [3,4], element: 'thunder' },
        { id: 'total_cut',   name: '🚫 Corte Total',       damage: 80, effect: stunEffect, usableAtPhase: [4], element: 'thunder', telegraphMsg: '⚠️ Todo se apaga...' },
      ],
      loan: [
        { id: 'compound_hit', name: '📊 Golpe Compuesto',      damage: 30, usableAtPhase: [1,2,3,4], element: 'dark' },
        { id: 'rate_hike',    name: '📈 Alza de Tasa',          damage: 50, effect: bleedEffect, usableAtPhase: [2,3,4], element: 'dark' },
        { id: 'foreclosure',  name: '🏚️ Ejecución Hipotecaria', damage: 90, usableAtPhase: [3,4], element: 'dark', telegraphMsg: '⚠️ ¡El Préstamo exige su deuda!' },
        { id: 'total_loss',   name: '💸 Pérdida Total',         damage: 120, effect: cursedEffect, usableAtPhase: [4], element: 'dark' },
      ],
      overdraft: [
        { id: 'fee_slash', name: '💰 Comisión Cortante', damage: 20, usableAtPhase: [1,2,3,4], element: 'ice' },
        { id: 'freeze',    name: '🧊 Cuenta Congelada',  damage: 30, effect: { type: 'frozen', duration: 1 }, usableAtPhase: [2,3,4], element: 'ice' },
        { id: 'void_drain',name: '🌑 Vacío Financiero',  damage: 80, usableAtPhase: [3,4], element: 'dark' },
        { id: 'abyss',     name: '🌀 Abismo Eterno',     damage: 100, effect: cursedEffect, usableAtPhase: [4], element: 'dark' },
      ],
      toka_despensa: [
        { id: 'empty_shelf',  name: '📦 Estantería Vacía',    damage: 22, usableAtPhase: [1,2,3,4], element: 'fire' },
        { id: 'price_hike',   name: '📈 Inflación Galopante', damage: 38, effect: bleedEffect, usableAtPhase: [2,3,4], element: 'fire' },
        { id: 'hunger_pangs', name: '🍽️ Hambruna de Vales',   damage: 65, effect: stunEffect, usableAtPhase: [3,4], element: 'fire' },
        { id: 'famine',       name: '💀 Hambruna Total',       damage: 90, usableAtPhase: [4], element: 'fire' },
      ],
      toka_fuel: [
        { id: 'low_fuel',    name: '⛽ Reserva Crítica',  damage: 25, usableAtPhase: [1,2,3,4], element: 'fire' },
        { id: 'engine_stall',name: '🔧 Motor Detenido',   damage: 45, effect: stunEffect, usableAtPhase: [2,3,4], element: 'fire' },
        { id: 'gas_leak',    name: '💨 Fuga de Recursos', damage: 75, effect: poisonEffect, usableAtPhase: [3,4], element: 'fire' },
        { id: 'explode',     name: '💥 Explosión Final',  damage: 100, usableAtPhase: [4], element: 'fire', telegraphMsg: '🔥 ¡El tanque está al límite!' },
      ],
      toka_connect: [
        { id: 'non_deductible', name: '📋 Gasto No Deducible',  damage: 28, usableAtPhase: [1,2,3,4], element: 'thunder' },
        { id: 'audit_panic',    name: '🚨 Pánico de Auditoría', damage: 50, effect: stunEffect, usableAtPhase: [2,3,4], element: 'thunder' },
        { id: 'budget_freeze',  name: '❄️ Presupuesto Congelado', damage: 85, effect: { type: 'frozen', duration: 2 }, usableAtPhase: [3,4], element: 'ice' },
        { id: 'total_audit',    name: '🏛️ Auditoría Total',      damage: 110, effect: cursedEffect, usableAtPhase: [4], element: 'thunder' },
      ],
      abyss: [
        { id: 'shadow_claws', name: '🌑 Garras del Vacío', damage: 35, usableAtPhase: [1,2,3,4], element: 'dark' },
        { id: 'mana_leech',   name: '🌀 Succión de Maná', damage: 50, usableAtPhase: [2,3,4], element: 'dark', telegraphMsg: '⚠️ El abismo drena tu energía...' },
        { id: 'void_storm',   name: '🌪️ Tormenta Niveles', damage: 95, effect: cursedEffect, usableAtPhase: [3,4], element: 'dark' },
        { id: 'eternal_dark', name: '💀 Oscuridad Eterna', damage: 130, usableAtPhase: [4], element: 'dark', telegraphMsg: '🌌 ¡EL ABISMO SE CIERRA!' },
      ],
      golem: [
        { id: 'rock_throw',   name: '🪨 Lanzamiento Pétreo', damage: 30, usableAtPhase: [1,2,3,4], element: 'earth' },
        { id: 'iron_wall',    name: '🧱 Muro del Deudor', damage: 0, usableAtPhase: [2,3,4], element: 'earth', telegraphMsg: '⚠️ El Golem endurece su piel...' },
        { id: 'earthquake',   name: '🌋 Terremoto Factura', damage: 85, effect: stunEffect, usableAtPhase: [3,4], element: 'earth' },
        { id: 'unmovable',    name: '🗿 Deuda Inamovible', damage: 110, effect: cursedEffect, usableAtPhase: [4], element: 'earth' },
      ],
      tickets: [
        { id: 'paper_slash',  name: '📄 Corte de Papel', damage: 25, usableAtPhase: [1,2,3,4], element: 'ice' },
        { id: 'bureaucracy',  name: '🏛️ Burocracia Ninja', damage: 45, effect: bleedEffect, usableAtPhase: [2,3,4], element: 'ice' },
        { id: 'slip_storm',   name: '🌪️ Tormenta de Tickets', damage: 75, effect: poisonEffect, usableAtPhase: [3,4], element: 'ice' },
        { id: 'final_penalty',name: '🚨 Sanción Final',  damage: 105, effect: cursedEffect, usableAtPhase: [4], element: 'ice' },
      ],
      cash: [
        { id: 'greedy_hand',  name: '🖐️ Garra Codiciosa', damage: 30, usableAtPhase: [1,2,3,4], element: 'fire' },
        { id: 'inflation',    name: '📈 Inflación Local',   damage: 55, effect: burnEffect, usableAtPhase: [2,3,4], element: 'fire', telegraphMsg: '🔥 ¡El dinero pierde valor!' },
        { id: 'money_burn',   name: '🔥 Dinero Quemado',    damage: 90, usableAtPhase: [3,4], element: 'fire' },
        { id: 'total_crash',  name: '💀 Colapso del Mercado', damage: 140, effect: cursedEffect, usableAtPhase: [4], element: 'fire', telegraphMsg: '🌋 ¡TODO CAE!' },
      ],
    }
    return skills[type]
  }

  private static getBossSprite(type: DebtData['type']): string | number {
    return BOSS_SPRITES[type]
  }

  /** Genera un jefe de prueba sin deuda real conectada */
  static generateDemo(): Boss {
    return this.generateFromDebt({
      id:           'demo_01',
      type:         'credit_card',
      amount:       5000,
      daysOverdue:  45,
      interestRate: 36,
    })
  }
}
