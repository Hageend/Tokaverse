// components/CombatScreen.tsx
// TokaVerse RPG — Pantalla de Combate JRPG Financiero
// Sistema Híbrido: Elementos · Fusiones · Estados Alterados · Fases de Jefe

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert,
} from 'react-native'
import { Audio } from 'expo-av'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring, withRepeat,
  FadeIn, FadeInUp, FadeOut, SlideInDown, SlideOutDown,
} from 'react-native-reanimated'

import { TurnManager, CombatState, CombatAction } from '../engine/TurnManager'
import { Fighter, Boss } from '../types/combat'
import { ELEMENT_INFO } from '../types/elements'
import { STATUS_INFO, AnyStatus } from '../engine/StatusEngine'
import { Colors } from '../constants/Colors'
import type { PlayerCard, FusionResult } from '../types/fusion'

const COMBAT_TRACKS = [
  require('../../assets/music/combat/Ascent_to_Victory.mp3'),
  require('../../assets/music/combat/Beyond_The_Threshold.mp3'),
  require('../../assets/music/combat/Kurenai_no_Kessen.mp3'),
  require('../../assets/music/combat/Last_Hand_at_the_Gate.mp3'),
  require('../../assets/music/combat/One_Last_Tile.mp3'),
  require('../../assets/music/combat/The_Final_Tile.mp3'),
]

const PHASE_THEME_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#8B5CF6',
  3: '#EF4444',
  4: '#FF6B35',
}

interface CombatScreenProps {
  player: Fighter
  boss: Boss
  equippedCards?: PlayerCard[]
  onVictory?: (boss: Boss) => void
  onDefeat?: () => void
  onExit: () => void
  globalVolume?: number
}

// ─── BARRA DE STAT ────────────────────────────────────────────────────────────
const StatBar = ({ current, max, color, label, showText = true }: {
  current: number; max: number; color: string; label: string; showText?: boolean
}) => {
  const safeCur = isNaN(current) ? 0 : current
  const safeMax = isNaN(max) || max <= 0 ? 100 : max
  const pct = Math.max(0, Math.min(1, safeCur / safeMax))

  // Parpadeo cuando < 20%
  const opacity = useSharedValue(1)
  useEffect(() => {
    if (pct < 0.2) {
      opacity.value = withRepeat(withTiming(0.3, { duration: 500 }), -1, true)
    } else {
      opacity.value = 1
    }
  }, [pct])

  const barStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <View style={barStyles.wrapper}>
      {showText && (
        <View style={barStyles.labelRow}>
          <Text style={[barStyles.label, { color }]}>{label}</Text>
          <Text style={barStyles.value}>{safeCur}/{safeMax}</Text>
        </View>
      )}
      <View style={barStyles.bg}>
        <Animated.View style={[barStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: color }, barStyle]} />
      </View>
    </View>
  )
}
const barStyles = StyleSheet.create({
  wrapper: { marginBottom: 5 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  value: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  bg: { height: 7, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  fill: { height: '100%', borderRadius: 4 },
})

// ─── SPRITE ANIMADO ───────────────────────────────────────────────────────────
const AnimatedSprite = ({ spriteUrl, onHit, size = 100 }: { spriteUrl: any; onHit: boolean; size?: number }) => {
  const tx = useSharedValue(0)
  const sc = useSharedValue(1)
  useEffect(() => {
    if (onHit) {
      tx.value = withSequence(withTiming(-8, { duration: 40 }), withTiming(8, { duration: 40 }), withTiming(-4, { duration: 30 }), withTiming(0, { duration: 30 }))
      sc.value = withSequence(withTiming(0.92, { duration: 60 }), withSpring(1))
    }
  }, [onHit])
  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { scale: sc.value }] }))
  return (
    <Animated.View style={animated}>
      <Image
        source={typeof spriteUrl === 'number' ? spriteUrl : { uri: spriteUrl }}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  )
}

// ─── CHIPS DE ESTADOS ALTERADOS ───────────────────────────────────────────────
const StatusChips = ({ effects }: { effects: { type: AnyStatus; duration: number }[] }) => {
  if (effects.length === 0) return null
  return (
    <View style={chipStyles.row}>
      {effects.map((e, i) => {
        const info = STATUS_INFO[e.type as AnyStatus]
        if (!info) return null
        return (
          <Animated.View key={`${e.type}_${i}`} entering={FadeIn} exiting={FadeOut} style={[chipStyles.chip, { borderColor: info.color + '66', backgroundColor: info.color + '18' }]}>
            <Text style={chipStyles.emoji}>{info.emoji}</Text>
            <Text style={[chipStyles.label, { color: info.color }]}>{e.duration}t</Text>
          </Animated.View>
        )
      })}
    </View>
  )
}
const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, gap: 2 },
  emoji: { fontSize: 10 },
  label: { fontSize: 9, fontWeight: '800' },
})

// ─── BANNER DE FASE DEL JEFE ──────────────────────────────────────────────────
const PhaseBanner = ({ phaseName, themeColor, visible }: { phaseName: string; themeColor: string; visible: boolean }) => {
  if (!visible) return null
  return (
    <Animated.View entering={SlideInDown.springify()} exiting={SlideOutDown} style={[bannerStyles.banner, { borderColor: themeColor, shadowColor: themeColor }]}>
      <Text style={bannerStyles.emoji}>⚠️</Text>
      <Text style={[bannerStyles.txt, { color: themeColor }]}>{phaseName}</Text>
    </Animated.View>
  )
}
const bannerStyles = StyleSheet.create({
  banner: { position: 'absolute', top: 0, left: 16, right: 16, zIndex: 100, backgroundColor: '#0A0F1E', borderWidth: 1.5, borderRadius: 10, padding: 12, alignItems: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 12 },
  emoji: { fontSize: 20, marginBottom: 2 },
  txt: { fontWeight: '900', fontSize: 15, letterSpacing: 0.5, textAlign: 'center' },
})

// ─── POPUP DE EFECTIVIDAD ELEMENTAL ──────────────────────────────────────────
const EffectPopup = ({ label, color, visible }: { label: string; color: string; visible: boolean }) => {
  if (!visible || !label) return null
  return (
    <Animated.View entering={FadeInUp.springify()} exiting={FadeOut} style={[popupStyles.popup, { borderColor: color }]}>
      <Text style={[popupStyles.txt, { color }]}>{label}</Text>
    </Animated.View>
  )
}
const popupStyles = StyleSheet.create({
  popup: { position: 'absolute', top: 60, alignSelf: 'center', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 'rgba(10,15,30,0.9)', zIndex: 90 },
  txt: { fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
})

// ─── BOTÓN DE ACCIÓN ──────────────────────────────────────────────────────────
const ActionBtn = ({ label, sub, color, icon, onPress, disabled }: {
  label: string; sub?: string; color: string; icon?: string; onPress: () => void; disabled?: boolean
}) => {
  const sc = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }))
  return (
    <Animated.View style={[animated, { flex: 1 }]}>
      <TouchableOpacity
        style={[actionBtnStyles.btn, { backgroundColor: color + '22', borderColor: color + '66' }, disabled && actionBtnStyles.disabled]}
        onPress={() => { sc.value = withSequence(withTiming(0.94, { duration: 80 }), withSpring(1)); onPress() }}
        disabled={disabled}
        activeOpacity={0.75}
      >
        {icon && <Text style={{ fontSize: 20, marginBottom: 2 }}>{icon}</Text>}
        <Text style={[actionBtnStyles.label, { color }]} numberOfLines={1}>{label}</Text>
        {sub && <Text style={actionBtnStyles.sub}>{sub}</Text>}
      </TouchableOpacity>
    </Animated.View>
  )
}
const actionBtnStyles = StyleSheet.create({
  btn: { borderWidth: 1.5, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', minHeight: 66 },
  disabled: { opacity: 0.35 },
  label: { fontWeight: '900', fontSize: 12, textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 2, textAlign: 'center' },
})

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function CombatScreen({
  player, boss, equippedCards, onVictory, onDefeat, onExit, globalVolume = 0.7,
}: CombatScreenProps) {

  const [state, setState] = useState<CombatState>(() =>
    TurnManager.initCombat(player, boss, equippedCards)
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [bossHit, setBossHit] = useState(false)
  const [playerHit, setPlayerHit] = useState(false)
  const [volume, setVolume] = useState(globalVolume)
  const [showLog, setShowLog] = useState(false)
  const [showFusions, setShowFusions] = useState(false)
  const [phaseVisible, setPhaseVisible] = useState(false)
  const [effectPopup, setEffectPopup] = useState<{ label: string; color: string } | null>(null)
  const [telegraphMsg, setTelegraphMsg] = useState<string | undefined>()

  const processingRef = useRef(false)

  const soundRef = useRef<Audio.Sound | null>(null)

  // Audio — expo-av
  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const track = COMBAT_TRACKS[Math.floor(Math.random() * COMBAT_TRACKS.length)]
        const { sound } = await Audio.Sound.createAsync(track, { volume, isLooping: true, shouldPlay: true })
        if (mounted) soundRef.current = sound
        else await sound.unloadAsync()
      } catch (e) { console.warn('[CombatScreen] Audio error:', e) }
    }
    init()
    return () => {
      mounted = false
      soundRef.current?.stopAsync().catch(() => { }).then(() => soundRef.current?.unloadAsync().catch(() => { }))
    }
  }, [])

  useEffect(() => {
    soundRef.current?.setVolumeAsync(volume).catch(() => { })
  }, [volume])

  // Mostrar banner de fase cuando cambia
  useEffect(() => {
    if (state.bossPhaseJustChanged && state.bossPhaseData) {
      setPhaseVisible(true)
      setTimeout(() => setPhaseVisible(false), 2500)
    }
  }, [state.bossPhaseJustChanged])

  // Mostrar popup de efectividad elemental
  useEffect(() => {
    const last = state.log[state.log.length - 1]
    if (last?.effectLabel && last.effectLabel.length > 0) {
      setEffectPopup({ label: last.effectLabel, color: last.effectColor ?? '#FFFFFF' })
      setTimeout(() => setEffectPopup(null), 1600)
    }
  }, [state.log.length])

  // Telegrafía del jefe
  useEffect(() => {
    if (state.telegraphMsg) {
      setTelegraphMsg(state.telegraphMsg)
      setTimeout(() => setTelegraphMsg(undefined), 2000)
    }
  }, [state.telegraphMsg])

  // ── Game loop: turno del jefe ─────────────────────────────────────────────
  // IMPORTANTE: deps = [state.turn, state.phase]
  //  - Nunca includyas `isProcessing` — causa doble-disparo en React Strict Mode
  //    que bloquea processingRef para siempre.
  //  - state.turn cambia solo cuando el jefe actúa  
  //    (TurnManager.executeBossTurn incrementa turn), así el effect no se
  //    dispara infinitamente.
  useEffect(() => {
    if (state.phase !== 'boss_turn') return

    setIsProcessing(true)
    const t = setTimeout(() => {
      try {
        const next = TurnManager.executeBossTurn(state)
        const lastLog = next.log[next.log.length - 1]
        if (lastLog?.damage) {
          setPlayerHit(true)
          setTimeout(() => setPlayerHit(false), 300)
        }
        setState(next)
        if (next.phase === 'defeat') {
          setTimeout(() => onDefeat?.(), 1200)
        }
      } catch (e) {
        console.error('[CombatScreen] Boss turn error:', e)
        setState(s => ({ ...s, phase: 'player_turn' }))
      } finally {
        setIsProcessing(false)
      }
    }, 800)

    // Cleanup: cancela el timer si el componente se desmonta o las deps cambian.
    // También resetea isProcessing en caso de limpieza (Strict Mode doble disparo).
    return () => {
      clearTimeout(t)
      setIsProcessing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.turn, state.phase])

  // ── Acción del jugador ──────────────────────────────────────────────────────
  // processingRef: guard SÍNCRONO para evitar doble acción en el mismo render.
  // isProcessing: estado UI — deshabilita botones durante el turno del jefe.
  const handleAction = useCallback((action: CombatAction) => {
    if (state.phase !== 'player_turn' || processingRef.current || isProcessing) return
    processingRef.current = true
    setIsProcessing(true)
    try {
      const next = TurnManager.executePlayerAction(state, action)
      const lastLog = next.log[next.log.length - 1]
      if (lastLog?.damage) {
        setBossHit(true)
        setTimeout(() => setBossHit(false), 300)
      }
      setState(next)
      if (next.phase === 'victory') {
        setTimeout(() => onVictory?.(next.boss), 1200)
      }
      // No gestionamos 'defeat' aquí — el effect del jefe lo detecta.
    } catch (e) {
      console.error('[CombatScreen] Player action error:', e)
    } finally {
      // Liberamos el lock INMEDIATAMENTE para que el effect del jefe
      // pueda arrancar en el próximo render sin esperar ningún timer.
      processingRef.current = false
      setIsProcessing(false)
    }
  }, [state, isProcessing, onVictory])

  // ── PANTALLAS FINALES ──────────────────────────────────────────────────────
  if (state.phase === 'victory') {
    return (
      <View style={[endStyles.screen, { backgroundColor: '#001810' }]}>
        <Animated.Text entering={FadeInUp.springify()} style={endStyles.kanji}>勝利</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(200)} style={endStyles.title}>¡Victoria!</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(350)} style={endStyles.sub}>La deuda ha sido derrotada</Animated.Text>
        <Animated.View entering={FadeInUp.delay(500)} style={endStyles.rewardBox}>
          <Text style={endStyles.rewardTxt}>🏆 +500 XP · 🃏 Loot Box Desbloqueada</Text>
        </Animated.View>
        <TouchableOpacity style={[endStyles.btn, { backgroundColor: '#065F46' }]} onPress={onExit}>
          <Text style={endStyles.btnTxt}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (state.phase === 'defeat') {
    return (
      <View style={[endStyles.screen, { backgroundColor: '#1a0000' }]}>
        <Animated.Text entering={FadeInUp.springify()} style={[endStyles.kanji, { color: '#EF4444' }]}>敗北</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(200)} style={[endStyles.title, { color: '#EF4444' }]}>Derrota...</Animated.Text>
        <Animated.Text entering={FadeInUp.delay(350)} style={endStyles.sub}>La deuda prevalece... por ahora</Animated.Text>
        <TouchableOpacity style={[endStyles.btn, { backgroundColor: '#7F1D1D', borderColor: '#EF4444', borderWidth: 1 }]} onPress={onExit}>
          <Text style={endStyles.btnTxt}>Regresar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── DATOS DERIVADOS ────────────────────────────────────────────────────────
  const bossPhaseColor = PHASE_THEME_COLORS[state.boss.phase] ?? '#FFD700'
  const bossHpPct = state.boss.hp / state.boss.maxHp
  const playerElem = state.player.element
  const bossElem = state.boss.element
  const playerElemInfo = playerElem ? ELEMENT_INFO[playerElem] : null
  const bossElemInfo = bossElem ? ELEMENT_INFO[bossElem] : null
  const lastLog = state.log[state.log.length - 1]
  const isFrozen = state.player.statusEffects.some(e => e.type === 'frozen')
  const isChained = state.player.statusEffects.some(e => e.type === 'chained')
  const isPlayerBlocking = state.player.statusEffects.some(e => e.type === 'shielded')
  const hasActiveFusion = !!state.activeFusionEffect
  const fusionTurns = state.activeFusionEffect?.turnsLeft ?? 0
  const bossIsStunned = state.boss.statusEffects.some(e => e.type === 'stunned')
  const bossPhaseData = state.bossPhaseData

  return (
    <View style={styles.root}>

      {/* ── BANNER DE FASE ─────────────────────────────────────────────────── */}
      <PhaseBanner
        phaseName={bossPhaseData ? `💀 ¡${bossPhaseData.name}!\n${bossPhaseData.description}` : ''}
        themeColor={bossPhaseColor}
        visible={phaseVisible}
      />

      {/* ── POPUP DE EFECTIVIDAD ELEMENTAL ─────────────────────────────────── */}
      {effectPopup && (
        <EffectPopup label={effectPopup.label} color={effectPopup.color} visible />
      )}

      {/* ── TELEGRAFÍA DEL JEFE ────────────────────────────────────────────── */}
      {telegraphMsg && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.telegraphBar, { borderColor: bossPhaseColor + '88' }]}>
          <Text style={[styles.telegraphTxt, { color: bossPhaseColor }]}>{telegraphMsg}</Text>
        </Animated.View>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.volRow}>
          <TouchableOpacity onPress={() => setVolume(v => Math.max(0, v - 0.1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="volume-low" size={14} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <Text style={styles.volTxt}>{Math.round(volume * 100)}%</Text>
          <TouchableOpacity onPress={() => setVolume(v => Math.min(1, v + 0.1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="volume-high" size={14} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
        <View style={styles.turnBadge}>
          <Text style={styles.turnTxt}>TURNO {state.turn}</Text>
        </View>
        <TouchableOpacity onPress={onExit} style={styles.exitBtn}>
          <Text style={styles.exitTxt}>Huir</Text>
        </TouchableOpacity>
      </View>

      {/* ── ZONA DEL JEFE ──────────────────────────────────────────────────── */}
      <View style={[styles.bossZone, { borderColor: bossPhaseColor + '44' }]}>
        {/* Nombre + fase + elemento */}
        <View style={styles.bossTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bossName, { color: bossPhaseColor }]} numberOfLines={1}>{state.boss.name}</Text>
            <View style={styles.bossMetaRow}>
              <View style={[styles.phasePill, { backgroundColor: bossPhaseColor + '22', borderColor: bossPhaseColor + '55' }]}>
                <Text style={[styles.phasePillTxt, { color: bossPhaseColor }]}>FASE {state.boss.phase}/4</Text>
              </View>
              {bossElemInfo && (
                <View style={[styles.elemPill, { backgroundColor: bossElemInfo.color + '18', borderColor: bossElemInfo.color + '44' }]}>
                  <Text style={[styles.elemPillTxt, { color: bossElemInfo.color }]}>{bossElemInfo.emoji} {bossElemInfo.label}</Text>
                </View>
              )}
              {bossIsStunned && (
                <View style={styles.stunnedPill}>
                  <Text style={styles.stunnedPillTxt}>😵 STUN</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={[styles.bossHpNum, { color: bossHpPct < 0.25 ? '#EF4444' : bossPhaseColor }]}>
            {state.boss.hp}/{state.boss.maxHp}
          </Text>
        </View>

        {/* Barra HP jefe con glow */}
        <View style={[styles.bossHpBg, { shadowColor: bossPhaseColor }]}>
          <Animated.View
            style={[styles.bossHpFill, {
              width: `${(state.boss.hp / state.boss.maxHp) * 100}%`,
              backgroundColor: bossPhaseColor,
              shadowColor: bossPhaseColor,
            }]}
          />
        </View>

        {/* Estados del jefe */}
        <StatusChips effects={state.boss.statusEffects as any} />

        {/* Sprite del jefe */}
        <View style={styles.bossSprite}>
          <AnimatedSprite spriteUrl={state.boss.sprite} onHit={bossHit} size={130} />
          {/* Minions */}
          {state.minions.length > 0 && (
            <View style={styles.minionsRow}>
              {state.minions.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.minionBtn}
                  onPress={() => handleAction({ type: 'ATTACK_MINION', minionId: m.id })}
                  disabled={state.phase !== 'player_turn' || isProcessing}
                >
                  <Text style={styles.minionEmoji}>{m.emoji}</Text>
                  <Text style={styles.minionHp}>{m.hp}HP</Text>
                  <View style={styles.minionBarBg}>
                    <View style={[styles.minionBarFill, { width: `${(m.hp / m.maxHp) * 100}%` as any }]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* ── ZONA DEL JUGADOR ───────────────────────────────────────────────── */}
      <View style={styles.playerZone}>
        <View style={styles.playerRow}>
          <AnimatedSprite spriteUrl={state.player.sprite} onHit={playerHit} size={65} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={styles.playerNameRow}>
              <Text style={styles.playerName}>{state.player.name}</Text>
              {playerElemInfo && (
                <View style={[styles.elemPill, { backgroundColor: playerElemInfo.color + '18', borderColor: playerElemInfo.color + '44' }]}>
                  <Text style={[styles.elemPillTxt, { color: playerElemInfo.color }]}>{playerElemInfo.emoji} {playerElemInfo.label}</Text>
                </View>
              )}
              {isPlayerBlocking && (
                <View style={styles.shieldBadge}>
                  <Text style={styles.shieldTxt}>🛡️</Text>
                </View>
              )}
            </View>
            <StatBar current={state.player.hp} max={state.player.maxHp} color="#10B981" label="HP" />
            <StatBar current={state.player.mana} max={state.player.maxMana} color="#3B82F6" label="MP" />
            {state.player.maxStamina && (
              <StatBar current={state.player.stamina ?? 100} max={state.player.maxStamina ?? 100} color="#F59E0B" label="ST" />
            )}
          </View>
        </View>

        {/* Estados del jugador */}
        <StatusChips effects={state.player.statusEffects as any} />

        {/* Fusión activa */}
        {hasActiveFusion && state.activeFusionEffect && (
          <Animated.View entering={FadeIn} style={styles.fusionActiveBar}>
            <Text style={styles.fusionActiveIcon}>✨</Text>
            <Text style={styles.fusionActiveName}>{state.activeFusionEffect.fusion.name}</Text>
            <View style={styles.fusionTurnsBadge}>
              <Text style={styles.fusionTurnsTxt}>{fusionTurns}t</Text>
            </View>
            {state.divineState && (
              <View style={styles.divineBadge}>
                <Text style={styles.divineTxt}>🌟 ESTADO DIVINO x4</Text>
              </View>
            )}
          </Animated.View>
        )}
      </View>

      {/* ── LOG DE COMBATE ─────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logBox} onPress={() => setShowLog(!showLog)} activeOpacity={0.7}>
        <Text style={[styles.logMain, lastLog?.actor === 'boss' ? styles.logBoss : lastLog?.actor === 'system' ? styles.logSystem : styles.logPlayer]} numberOfLines={showLog ? 4 : 2}>
          {lastLog?.message ?? '...'}
        </Text>
        {!showLog && <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.3)" style={{ marginLeft: 4 }} />}
      </TouchableOpacity>

      {/* ── ACCIONES ───────────────────────────────────────────────────────── */}
      <View style={styles.actionsArea}>
        {state.phase === 'player_turn' && !isProcessing ? (
          <>
            {/* Fila 1: Atacar + Defender */}
            <View style={styles.actionRow}>
              <ActionBtn
                label="⚔️ ATACAR"
                sub={playerElemInfo ? playerElemInfo.emoji + ' ' + playerElemInfo.label : undefined}
                color="#EF4444"
                onPress={() => handleAction({ type: 'ATTACK' })}
                disabled={isFrozen}
              />
              <ActionBtn
                label="🛡️ DEFENDER"
                sub="Absorbe próximo golpe"
                color="#3B82F6"
                onPress={() => handleAction({ type: 'DEFEND' })}
                disabled={isFrozen}
              />
            </View>

            {/* Fila 2: Skills */}
            <View style={styles.actionRow}>
              {state.player.skills.slice(0, 2).map(skill => (
                <ActionBtn
                  key={skill.id}
                  label={skill.name.length > 16 ? skill.name.slice(0, 15) + '…' : skill.name}
                  sub={`${skill.manaCost} MP`}
                  color="#8B5CF6"
                  onPress={() => handleAction({ type: 'SKILL', skillId: skill.id })}
                  disabled={isFrozen || isChained || state.player.mana < skill.manaCost}
                />
              ))}
            </View>

            {/* Fila 3: Skill extra + Fusión / Acción financiera */}
            <View style={styles.actionRow}>
              {state.player.skills[2] && (
                <ActionBtn
                  key={state.player.skills[2].id}
                  label={state.player.skills[2].name.length > 14 ? state.player.skills[2].name.slice(0, 13) + '…' : state.player.skills[2].name}
                  sub={`${state.player.skills[2].manaCost} MP`}
                  color="#7C3AED"
                  onPress={() => handleAction({ type: 'SKILL', skillId: state.player.skills[2].id })}
                  disabled={isFrozen || isChained || state.player.mana < state.player.skills[2].manaCost}
                />
              )}

              {/* Botón de fusión — aparece si hay fusiones disponibles */}
              {state.availableFusions.length > 0 && (
                <ActionBtn
                  label={`✨ FUSIÓN`}
                  sub={`${state.availableFusions.length} disponible${state.availableFusions.length > 1 ? 's' : ''}`}
                  color="#F59E0B"
                  onPress={() => setShowFusions(!showFusions)}
                />
              )}

              {/* Acción financiera */}
              <ActionBtn
                label="💳 PAGO"
                sub="Debilidad financiera"
                color="#22C55E"
                onPress={() => handleAction({ type: 'FINANCIAL_ACTION', action: 'payment_made', multiplier: 1.5 })}
              />
            </View>

            {/* Panel de fusiones expandido */}
            {showFusions && state.availableFusions.length > 0 && (
              <Animated.View entering={FadeInUp.springify()} style={styles.fusionPanel}>
                <Text style={styles.fusionPanelTitle}>✨ Activar Fusión</Text>
                {state.availableFusions.map(fusion => {
                  const info = require('../engine/FusionEngine').FusionEngine.getFusionDisplayInfo(fusion)
                  return (
                    <TouchableOpacity
                      key={fusion.id}
                      style={[styles.fusionOption, { borderColor: info.color + '66' }]}
                      onPress={() => { handleAction({ type: 'FUSION', fusionId: fusion.id }); setShowFusions(false) }}
                    >
                      <Text style={{ fontSize: 18 }}>{info.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.fusionOptName, { color: info.color }]}>{fusion.name}</Text>
                        <Text style={styles.fusionOptDesc} numberOfLines={1}>{fusion.description}</Text>
                      </View>
                      <Text style={[styles.fusionOptDuration, { color: info.color }]}>{info.badgeText}</Text>
                    </TouchableOpacity>
                  )
                })}
              </Animated.View>
            )}
          </>
        ) : (
          <View style={styles.waitBox}>
            <Animated.Text
              style={styles.waitTxt}
              entering={FadeIn}
            >
              {state.phase === 'boss_turn' ? `💢 ${state.boss.name} está actuando...` : '⏳ Procesando...'}
            </Animated.Text>
          </View>
        )}
      </View>

    </View>
  )
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0F1E', paddingTop: Platform.OS === 'ios' ? 48 : 28 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, marginBottom: 10 },
  volRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  volTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600', minWidth: 26, textAlign: 'center' },
  turnBadge: { backgroundColor: 'rgba(77,97,252,0.15)', borderWidth: 1, borderColor: Colors.primary + '55', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  turnTxt: { color: Colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  exitBtn: { backgroundColor: 'rgba(127,29,29,0.5)', borderWidth: 1, borderColor: '#EF444455', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  exitTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  bossZone: { marginHorizontal: 12, backgroundColor: '#111827', borderRadius: 14, borderWidth: 1.5, padding: 12, marginBottom: 8 },
  bossTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bossName: { fontSize: 15, fontWeight: '900', marginBottom: 4 },
  bossMetaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  bossHpNum: { fontSize: 12, fontWeight: '900', marginLeft: 8, marginTop: 2 },

  phasePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  phasePillTxt: { fontSize: 9, fontWeight: '900' },
  elemPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  elemPillTxt: { fontSize: 9, fontWeight: '700' },
  stunnedPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: '#F59E0B55' },
  stunnedPillTxt: { color: '#F59E0B', fontSize: 9, fontWeight: '800' },

  bossHpBg: { height: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden', marginBottom: 6, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6 },
  bossHpFill: { height: '100%', borderRadius: 4, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },

  bossSprite: { alignItems: 'center', marginTop: 4, position: 'relative' },
  minionsRow: { position: 'absolute', bottom: 0, right: 0, flexDirection: 'row', gap: 6 },
  minionBtn: { backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: '#8B5CF677', borderRadius: 8, padding: 6, alignItems: 'center', minWidth: 48 },
  minionEmoji: { fontSize: 18 },
  minionHp: { color: '#FFF', fontSize: 8, fontWeight: '700', marginTop: 1 },
  minionBarBg: { width: 36, height: 3, backgroundColor: '#000', borderRadius: 2, marginTop: 2, overflow: 'hidden' },
  minionBarFill: { height: '100%', backgroundColor: '#EF4444', borderRadius: 2 },

  playerZone: { marginHorizontal: 12, backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 12, marginBottom: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  playerName: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  shieldBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(59,130,246,0.2)', borderWidth: 1, borderColor: '#3B82F666' },
  shieldTxt: { fontSize: 12 },

  fusionActiveBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: '#F59E0B44', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  fusionActiveIcon: { fontSize: 14 },
  fusionActiveName: { color: '#F59E0B', fontWeight: '800', fontSize: 12, flex: 1 },
  fusionTurnsBadge: { backgroundColor: '#F59E0B', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  fusionTurnsTxt: { color: '#000', fontSize: 9, fontWeight: '900' },
  divineBadge: { backgroundColor: 'rgba(255,215,0,0.15)', borderWidth: 1, borderColor: '#FFD70055', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  divineTxt: { color: '#FFD700', fontSize: 9, fontWeight: '900' },

  logBox: { marginHorizontal: 12, backgroundColor: '#000', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  logMain: { flex: 1, fontSize: 11, lineHeight: 17 },
  logPlayer: { color: '#D1FAE5' },
  logBoss: { color: '#FEE2E2' },
  logSystem: { color: 'rgba(255,255,255,0.5)' },

  actionsArea: { flex: 1, paddingHorizontal: 12, paddingBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },

  fusionPanel: { backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B44', padding: 12, marginBottom: 8 },
  fusionPanelTitle: { color: '#F59E0B', fontWeight: '900', fontSize: 13, marginBottom: 10 },
  fusionOption: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 8 },
  fusionOptName: { fontWeight: '800', fontSize: 13 },
  fusionOptDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 1 },
  fusionOptDuration: { fontSize: 10, fontWeight: '700' },

  waitBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitTxt: { color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 13, letterSpacing: 1 },

  telegraphBar: { marginHorizontal: 12, marginBottom: 8, backgroundColor: 'rgba(10,15,30,0.95)', borderWidth: 1.5, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  telegraphTxt: { fontWeight: '900', fontSize: 12, textAlign: 'center', letterSpacing: 0.3 },
})

const endStyles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  kanji: { fontSize: 88, fontWeight: '900', color: '#FFD700', marginBottom: 8 },
  title: { fontSize: 32, color: '#FFF', fontWeight: '900', marginBottom: 8 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 24 },
  rewardBox: { backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1, borderColor: '#FFD70044', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 32 },
  rewardTxt: { color: '#FFD700', fontWeight: '800', fontSize: 14, textAlign: 'center' },
  btn: { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 14 },
  btnTxt: { color: '#FFF', fontWeight: '900', fontSize: 16 },
})
