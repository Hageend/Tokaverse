// hooks/useCombatWallet.ts
// Integración websocket: eventos reales de Toka Wallet → acciones de combate

import { useEffect } from 'react'
import { CombatAction } from '../engine/TurnManager'

// Mapeo: evento webhook de Toka → CombatAction correspondiente
const WALLET_TO_COMBAT: Record<string, CombatAction> = {
  'transaction.completed': { type: 'FINANCIAL_ACTION', action: 'payment_made',     multiplier: 2.0 },
  'savings.deposit':       { type: 'FINANCIAL_ACTION', action: 'savings_deposit',  multiplier: 2.5 },
  'payment.early':         { type: 'FINANCIAL_ACTION', action: 'early_payment',    multiplier: 3.0 },
  'goal.completed':        { type: 'FINANCIAL_ACTION', action: 'goal_completed',   multiplier: 3.5 },
  'budget.respected':      { type: 'FINANCIAL_ACTION', action: 'budget_respected', multiplier: 1.8 },
}

/**
 * useCombatWallet
 * Escucha eventos del WebSocket de TokaVerse y los convierte en acciones de combate.
 * Un "pago real" en la wallet se transforma en un ataque especial en el juego.
 *
 * @param onAction - callback al recibir un evento financiero válido
 * @param wsUrl - URL del WebSocket (por defecto el backend de TokaVerse)
 */
export const useCombatWallet = (
  onAction: (action: CombatAction) => void,
  wsUrl = 'ws://localhost:3000/combat-events',
) => {
  useEffect(() => {
    let ws: WebSocket | null = null

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[CombatWallet] WebSocket conectado')
      }

      ws.onmessage = (event) => {
        try {
          const { type } = JSON.parse(event.data)
          const combatAction   = WALLET_TO_COMBAT[type]
          if (combatAction) {
            console.log(`[CombatWallet] Evento financiero "${type}" → Ataque especial x${(combatAction as any).multiplier}`)
            onAction(combatAction)
          }
        } catch (e) {
          console.warn('[CombatWallet] Mensaje inválido:', event.data)
        }
      }

      ws.onerror = (error) => {
        // En desarrollo sin backend real este error es esperado
        console.info('[CombatWallet] WS no disponible (modo offline)')
      }
    } catch (e) {
      console.info('[CombatWallet] No se pudo conectar al WebSocket')
    }

    return () => {
      ws?.close()
    }
  }, [onAction, wsUrl])
}
