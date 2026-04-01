// engine/BossEngine.ts

import { Boss, BossSkill, DebtWeakness, DebtData } from '../types/combat'
import { BOSS_SPRITES } from '../data/classSkills'

export class BossEngine {

  static generateFromDebt(debt: DebtData): Boss {
    const scaledHp   = this.calculateHp(debt)
    const scaledAtk  = this.calculateAttack(debt)
    const weaknesses = this.assignWeaknesses(debt.type)

    return {
      id:              `boss_${debt.id}`,
      name:            this.getBossName(debt.type, debt.daysOverdue),
      debtType:        debt.type,
      hp:              scaledHp,
      maxHp:           scaledHp,
      attack:          scaledAtk,
      defense:         Math.floor(debt.daysOverdue / 5),
      phase:           1,
      phaseThresholds: [75, 50, 25],
      skills:          this.getBossSkills(debt.type),
      weaknesses,
      sprite:          this.getBossSprite(debt.type),
      debtAmount:      debt.amount,
      statusEffects:   [],
    }
  }

  /** HP escala con el monto de la deuda: $1,000 MXN = 100 HP, +5 HP por día de atraso */
  private static calculateHp(debt: DebtData): number {
    const base         = Math.floor(debt.amount / 10)
    const overdueBonus = debt.daysOverdue * 5
    return Math.min(Math.max(base + overdueBonus, 50), 9999)
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
      loan:          daysOverdue > 60 ? '💀 El Préstamo Devorador'   : '💀 La Deuda Creciente',
      overdraft:     daysOverdue > 7  ? '🌀 El Sobregiro Eterno'     : '🌀 El Saldo Negativo',
      toka_despensa: '🛒 El Carrito Vacío',
      toka_fuel:     '⛽ El Tanque Vacío',
      toka_connect:  '📑 El Gasto Sin Comprobar',
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
        { action: 'payment_made',     multiplier: 2.5 }, // Compra realizada
        { action: 'budget_respected', multiplier: 2.0 },
      ],
      toka_fuel: [
        { action: 'payment_made',     multiplier: 2.0 }, // Carga realizada
        { action: 'early_payment',    multiplier: 2.5 }, // Registro temprano
      ],
      toka_connect: [
        { action: 'payment_made',     multiplier: 1.8 }, // Comprobación hecha
        { action: 'early_payment',    multiplier: 3.0 }, // Comprobación < 48h
      ],
    }
    return map[type]
  }

  private static getBossSkills(type: DebtData['type']): BossSkill[] {
    const skills: Record<DebtData['type'], BossSkill[]> = {
      credit_card: [
        { id: 'interest_bite', name: 'Mordida de Interés',    damage: 25, usableAtPhase: [1,2,3] },
        { id: 'credit_drain',  name: 'Drenaje de Crédito',    damage: 40,
          effect: { type: 'poison', duration: 3, damagePerTurn: 10 }, usableAtPhase: [2,3] },
        { id: 'debt_spiral',   name: 'Espiral de Deuda',      damage: 70,
          effect: { type: 'burn',   duration: 2, damagePerTurn: 15 }, usableAtPhase: [3] },
      ],
      service: [
        { id: 'late_fee',      name: 'Cargo por Mora',        damage: 20, usableAtPhase: [1,2,3] },
        { id: 'service_cut',   name: 'Corte de Servicio',     damage: 35,
          effect: { type: 'stun', duration: 1 },                       usableAtPhase: [2,3] },
        { id: 'blackout',      name: '⚡ Apagón Total',       damage: 60, usableAtPhase: [3] },
      ],
      loan: [
        { id: 'compound_hit',  name: 'Golpe Compuesto',       damage: 30, usableAtPhase: [1,2,3] },
        { id: 'rate_hike',     name: 'Alza de Tasa',          damage: 50, usableAtPhase: [2,3] },
        { id: 'foreclosure',   name: '🏚️ Ejecución Hipotecaria', damage: 90, usableAtPhase: [3] },
      ],
      overdraft: [
        { id: 'fee_slash',     name: 'Comisión Cortante',     damage: 20, usableAtPhase: [1,2,3] },
        { id: 'freeze',        name: '🧊 Cuenta Congelada',   damage: 30,
          effect: { type: 'stun', duration: 2 },                       usableAtPhase: [2,3] },
        { id: 'void_drain',    name: '🌑 Vacío Financiero',   damage: 80, usableAtPhase: [3] },
      ],
      toka_despensa: [
        { id: 'empty_shelf',   name: 'Estantería Vacía',      damage: 22, usableAtPhase: [1,2,3] },
        { id: 'price_hike',    name: 'Inflación Galopante',   damage: 38, usableAtPhase: [2,3] },
        { id: 'hunger_pangs',  name: 'Hambruna de Vales',     damage: 65, usableAtPhase: [3] },
      ],
      toka_fuel: [
        { id: 'low_fuel',      name: 'Reserva Crítica',       damage: 25, usableAtPhase: [1,2,3] },
        { id: 'engine_stall',  name: 'Motor Detenido',        damage: 45, effect: { type: 'stun', duration: 1 }, usableAtPhase: [2,3] },
        { id: 'gas_leak',      name: 'Fuga de Recursos',      damage: 75, usableAtPhase: [3] },
      ],
      toka_connect: [
        { id: 'non_deductible', name: 'Gasto No Deducible',   damage: 28, usableAtPhase: [1,2,3] },
        { id: 'audit_panic',    name: 'Pánico de Auditoría',  damage: 50, usableAtPhase: [2,3] },
        { id: 'budget_freeze',  name: 'Presupuesto Congelado', damage: 85, effect: { type: 'stun', duration: 2 }, usableAtPhase: [3] },
      ],
    }
    return skills[type]
  }

  private static getBossSprite(type: DebtData['type']): string | number {
    // Assets locales generados con IA — sin dependencia de red
    return BOSS_SPRITES[type]
  }

  /** Genera un jefe de prueba sin deuda real conectada */
  static generateDemo(): Boss {
    return this.generateFromDebt({
      id:          'demo_01',
      type:        'credit_card',
      amount:      5000,
      daysOverdue: 45,
      interestRate: 36,
    })
  }
}
