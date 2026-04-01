// app/components/CombatScreen.tsx
// Pantalla de combate por turnos JRPG financiero
// Integra TurnManager + BossEngine + animaciones Reanimated 3

import React, { useState, useCallback, useEffect } from 'react'
import { Audio } from 'expo-av'
// Música de combate
const COMBAT_MUSIC = [
  require('../../assets/music/combat/One_Last_Tile.mp3'),
  require('../../assets/music/combat/The_Final_Tile.mp3'),
]
const AMBIENT_MUSIC = [
  require('../../assets/music/ambient/Beneath_the_Velvet_Canopy.mp3'),
  require('../../assets/music/ambient/Where_the_Maps_End.mp3'),
]
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform
} from 'react-native'
import { Image } from 'expo-image'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring,
  globalVolume?: number
  FadeIn,
} from 'react-native-reanimated'
const CombatScreen = ({
import { Fighter, Boss, StatusEffect } from '../../types/combat'
  globalVolume = 0.7,
// ────────────────────────────────────────────────────────────────────────────

/** Barra de vida/mana estilo JRPG */
const StatBar = ({
  current, max, color, label,
}: { current: number; max: number; color: string; label: string }) => {
  const pct = Math.max(0, Math.min(1, current / max))
  const isLow = pct < 0.25

  return (
    <View style={barStyles.wrapper}>
      <View style={barStyles.labelRow}>
        <Text style={[barStyles.label, { color }]}>{label}</Text>
        <Text style={[barStyles.value, isLow && { color: '#EF4444' }]}>
          {current} / {max}
        </Text>
      </View>
      <View style={barStyles.bg}>
        <Animated.View
          style={[
            barStyles.fill,
            { width: `${pct * 100}%` as any, backgroundColor: isLow ? '#EF4444' : color },
          ]}
        />
      </View>
    </View>
  )
}

const barStyles = StyleSheet.create({
  wrapper:  { marginBottom: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  label:    { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  value:    { fontSize: 10, fontWeight: '700', color: '#FFF' },
  bg:       { height: 8, backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  fill:     { height: '100%' },
})

// ─────────────────────────────────────────────────────────────────
/** Sprite animado — se sacude al recibir daño */
const AnimatedSprite = ({
  spriteUrl, onHit, size = 100,
}: { spriteUrl: string | number; onHit: boolean; size?: number }) => {
  const tx = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    if (onHit) {
      tx.value = withSequence(
        withTiming(-10, { duration: 55 }),
        withTiming( 10, { duration: 55 }),
        withTiming( -6, { duration: 45 }),
        withTiming(  6, { duration: 45 }),
        withTiming(  0, { duration: 45 }),
      )
      scale.value = withSequence(
        withTiming(0.9, { duration: 80 }),
        withSpring(1, { damping: 12 }),
      )
    }
  }, [onHit])

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { scale: scale.value }],
  }))

  // expo-image source: number (require) || { uri: string }
  const source = typeof spriteUrl === 'number'
    ? spriteUrl
    : { uri: spriteUrl }

  return (
    <Animated.View style={animated}>
      <Image
        source={source}
        style={[
          { width: size, height: size },
          // @ts-ignore — imageRendering only valid on web
          Platform.OS === 'web' && { imageRendering: 'pixelated' },
        ]}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </Animated.View>
  )
}

// ─────────────────────────────────────────────────────────────────
/** Número de daño flotante */
const FloatingNumber = ({
  value, isWeakness, isHeal,
}: { value: number; isWeakness?: boolean; isHeal?: boolean }) => {
  const ty      = useSharedValue(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    ty.value      = withTiming(-70, { duration: 1000 })
    opacity.value = withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 600 }),
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.Text
      style={[
        floatStyles.number,
        style,
        isWeakness && floatStyles.weakness,
        isHeal     && floatStyles.heal,
      ]}
    >
      {isHeal ? '+' : isWeakness ? '💥 ' : ''}{value}
    </Animated.Text>
  )
}

const floatStyles = StyleSheet.create({
  number:   { position: 'absolute', top: 10, color: '#FFD700', fontSize: 26, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 1, height: 1 } },
  weakness: { color: '#FF4500', fontSize: 34 },
  heal:     { color: '#10B981', fontSize: 26 },
})

// ─────────────────────────────────────────────────────────────────
/** Badge de efecto de estado (veneno, escudo, etc.) */
const StatusBadge = ({ effect }: { effect: StatusEffect }) => {
  const colors: Record<string, string> = {
    poison: '#A855F7', burn: '#EF4444', stun: '#F59E0B',
    shield: '#3B82F6', boost: '#10B981',
  }
  const icons: Record<string, string> = {
    poison: '🤢', burn: '🔥', stun: '💫', shield: '🛡️', boost: '⬆️',
  }
  return (
    <View style={[badgeStyles.badge, { backgroundColor: colors[effect.type] + '33', borderColor: colors[effect.type] + '66' }]}>
      <Text style={badgeStyles.icon}>{icons[effect.type]}</Text>
      <Text style={badgeStyles.dur}>{effect.duration}</Text>
    </View>
  )
}

const badgeStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, marginRight: 4 },
  icon:  { fontSize: 10 },
  dur:   { fontSize: 9, color: '#FFF', fontWeight: 'bold', marginLeft: 2 },
})

// ────────────────────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL DE COMBATE
// ────────────────────────────────────────────────────────────────────────────

interface CombatScreenProps {
  player: Fighter
  boss: Boss
  onVictory?: (boss: Boss) => void
  onDefeat?:  () => void
  onExit:     () => void
}

export const CombatScreen = ({
  player, boss, onVictory, onDefeat, onExit,
}: CombatScreenProps) => {
  // Estado de música y volumen
  const [musicType, setMusicType] = useState<'combat' | 'ambient'>('combat')
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [volume, setVolume] = useState(0.7)

  // Reproducir música según tipo
  useEffect(() => {
    let isMounted = true
    async function playMusic() {
      if (sound) {
        await sound.stopAsync()
        await sound.unloadAsync()
      }
      const tracks = musicType === 'combat' ? COMBAT_MUSIC : AMBIENT_MUSIC
      const track = tracks[Math.floor(Math.random() * tracks.length)]
      const { sound: newSound } = await Audio.Sound.createAsync(track, { volume, isLooping: true })
      if (isMounted) {
        setSound(newSound)
        await newSound.playAsync()
      }
    }
    playMusic()
    return () => {
      isMounted = false
      if (sound) {
        sound.stopAsync()
        sound.unloadAsync()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicType])

  // Cambiar volumen
  useEffect(() => {
    if (sound) sound.setVolumeAsync(volume)
  }, [volume, sound])
  const [state, setState]           = useState<CombatState>(() => TurnManager.initCombat(player, boss))
  const [bossHit, setBossHit]       = useState(false)
  const [playerHit, setPlayerHit]   = useState(false)
  const [floatDmg, setFloatDmg]     = useState<{ value: number; isWeakness?: boolean; isHeal?: boolean } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab]   = useState<'SKILLS' | 'LOG'>('SKILLS')

  const showDamageFloat = (value: number, isWeakness?: boolean, isHeal?: boolean) => {
    setFloatDmg(null)
    setTimeout(() => setFloatDmg({ value, isWeakness, isHeal }), 50)
    setTimeout(() => setFloatDmg(null), 1100)
  }

  const handleAction = useCallback((action: CombatAction) => {
    if (state.phase !== 'player_turn' || isProcessing) return
    setIsProcessing(true)

    // 1. Turno del jugador
    const afterPlayer = TurnManager.executePlayerAction(state, action)
    const lastPlayerLog = afterPlayer.log[afterPlayer.log.length - 1]

    if (lastPlayerLog?.damage && lastPlayerLog.actor === 'player') {
      setBossHit(true)
      showDamageFloat(lastPlayerLog.damage, lastPlayerLog.isWeakness)
      setTimeout(() => setBossHit(false), 350)
    }

    if (afterPlayer.phase === 'victory') {
      setState(afterPlayer)
      onVictory?.(afterPlayer.boss)
      setIsProcessing(false)
      return
    }

    setState(afterPlayer)

    // 2. Turno del jefe con delay visual
    setTimeout(() => {
      const afterBoss     = TurnManager.executeBossTurn(afterPlayer)
      const lastBossLog   = afterBoss.log[afterBoss.log.length - 1]

      if (lastBossLog?.damage && lastBossLog.actor === 'boss') {
        setPlayerHit(true)
        showDamageFloat(lastBossLog.damage)
        setTimeout(() => setPlayerHit(false), 350)
      }

      setState(afterBoss)

      if (afterBoss.phase === 'defeat') {
        onDefeat?.()
      }
      setIsProcessing(false)
    }, 900)

  }, [state, isProcessing])

  const hpPercent    = state.boss.hp / state.boss.maxHp
  const bossBarColor = hpPercent > 0.5 ? '#10B981' : hpPercent > 0.25 ? '#F59E0B' : '#EF4444'

  // Pantalla de victoria o derrota
  if (state.phase === 'victory') {
    return (
      <Animated.View entering={FadeIn} style={[styles.endScreen, { backgroundColor: '#001a0d' }]}>
        <Text style={styles.endKanji}>勝利</Text>
        <Text style={styles.endTitle}>¡Victoria!</Text>
        <Text style={styles.endSub}>La deuda ha sido derrotada 💪</Text>
        <Text style={styles.endReward}>+500 XP  |  +Loot Box</Text>
        <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
          <Text style={styles.exitBtnText}>Continuar</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  if (state.phase === 'defeat') {
    return (
      <Animated.View entering={FadeIn} style={[styles.endScreen, { backgroundColor: '#1a0000' }]}>
        <Text style={[styles.endKanji, { color: '#EF4444' }]}>敗北</Text>
        <Text style={[styles.endTitle, { color: '#EF4444' }]}>Derrota...</Text>
        <Text style={styles.endSub}>La deuda prevalece por ahora</Text>
        <Text style={styles.endSub}>Perdiste 1 nivel</Text>
        <TouchableOpacity style={[styles.exitBtn, { backgroundColor: '#7F1D1D' }]} onPress={onExit}>
          <Text style={styles.exitBtnText}>Regresar</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <View style={styles.container}>
      {/* ── Control de música y volumen ─────────────── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 }}>
        <TouchableOpacity
          style={{ backgroundColor: musicType === 'combat' ? Colors.primary : '#222', borderRadius: 8, padding: 8 }}
          onPress={() => setMusicType('combat')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>🎵 Combate</Text>
        </TouchableOpacity>
        <TouchableOpacity
            <TouchableOpacity
              style={{ backgroundColor: '#222', borderRadius: 8, padding: 8 }}
              onPress={onExit}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salir</Text>
            </TouchableOpacity>
      {/* ── ZONA DEL JEFE ─────────────────────────────── */}
      <View style={styles.bossZone}>
        <View style={styles.bossHeader}>
          <Text style={styles.bossName}>{state.boss.name}</Text>
          <View style={[styles.phaseBadge, { backgroundColor: state.boss.phase === 3 ? '#7F1D1D' : state.boss.phase === 2 ? '#78350F' : '#1E3A5F' }]}>
            <Text style={styles.phaseText}>FASE {state.boss.phase}</Text>
          </View>
        </View>

        <StatBar current={state.boss.hp} max={state.boss.maxHp} color={bossBarColor} label="HP" />

        <View style={styles.bossDebtBadge}>
          <Text style={styles.bossDebtText}>
            Deuda: ${state.boss.debtAmount.toLocaleString('es-MX')} MXN
          </Text>
        </View>

        <View style={styles.bossSprite}>
          <AnimatedSprite spriteUrl={state.boss.sprite} onHit={bossHit} size={120} />
          {floatDmg && <FloatingNumber value={floatDmg.value} isWeakness={floatDmg.isWeakness} />}
        </View>
      </View>

      {/* ── ZONA DEL JUGADOR ──────────────────────────── */}
      <View style={styles.playerZone}>
        <View style={styles.playerSpriteWrapper}>
          <AnimatedSprite spriteUrl={state.player.sprite ?? ''} onHit={playerHit} size={80} />
        </View>

        <View style={styles.playerStats}>
          <Text style={styles.playerName}>{state.player.name}</Text>

          <StatBar current={state.player.hp}   max={state.player.maxHp}   color="#10B981" label="HP" />
          <StatBar current={state.player.mana} max={state.player.maxMana} color="#3B82F6" label="MP" />

          {/* Efectos de estado activos */}
          {state.player.statusEffects.length > 0 && (
            <View style={{ flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' }}>
              {state.player.statusEffects.map((eff, i) => (
                <StatusBadge key={i} effect={eff} />
              ))}
            </View>
          )}
        </View>
      </View>

      {/* ── LOG / BOX DE COMBATE ──────────────────────── */}
      <View style={styles.logBox}>
        <Text style={styles.logText} numberOfLines={2}>
          {state.log[state.log.length - 1]?.message ?? '...'}
        </Text>
        {state.phase === 'boss_turn' && (
          <View style={styles.turnIndicator}>
            <Text style={styles.turnText}>Turno del Jefe...</Text>
          </View>
        )}
      </View>

      {/* ── MENÚ DE ACCIONES ──────────────────────────── */}
      {state.phase === 'player_turn' && !isProcessing && (
        <View style={styles.actionArea}>
          {/* Sub-tabs: Skills vs Log */}
          <View style={styles.subTabs}>
            <TouchableOpacity
              style={[styles.subTab, activeTab === 'SKILLS' && styles.subTabActive]}
              onPress={() => setActiveTab('SKILLS')}
            >
              <Text style={styles.subTabText}>スキル (Skills)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subTab, activeTab === 'LOG' && styles.subTabActive]}
              onPress={() => setActiveTab('LOG')}
            >
              <Text style={styles.subTabText}>ログ (Log)</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'SKILLS' && (
            <>
              {/* Fila 1: Atacar / Defender */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction({ type: 'ATTACK' })}>
                  <Text style={styles.actionIcon}>⚔️</Text>
                  <Text style={styles.actionLabel}>Atacar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(59,130,246,0.15)' }]} onPress={() => handleAction({ type: 'DEFEND' })}>
                  <Text style={styles.actionIcon}>🛡️</Text>
                  <Text style={styles.actionLabel}>Defender</Text>
                </TouchableOpacity>
              </View>

              {/* Fila 2: Skills de clase */}
              <View style={styles.actionRow}>
                {state.player.skills.slice(0, 2).map(skill => {
                  const canUse = state.player.mana >= skill.manaCost
                  return (
                    <TouchableOpacity
                      key={skill.id}
                      style={[styles.actionBtn, styles.skillBtn, !canUse && styles.actionBtnDisabled]}
                      onPress={() => handleAction({ type: 'SKILL', skillId: skill.id })}
                      disabled={!canUse}
                    >
                      <Text style={styles.actionIcon}>✨</Text>
                      <Text style={styles.actionLabel}>{skill.name}</Text>
                      <Text style={styles.actionCost}>{skill.manaCost} MP</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {/* Botón de Acción Financiera Real */}
              <TouchableOpacity
                style={styles.financialBtn}
                onPress={() => handleAction({ type: 'FINANCIAL_ACTION', action: 'payment_made', multiplier: 2.0 })}
              >
                <Text style={styles.financialIcon}>💳</Text>
                <View>
                  <Text style={styles.financialBtnText}>Pago Real → Ataque Especial</Text>
                  <Text style={styles.financialBtnSub}>
                    Toca las debilidades del jefe · x{state.boss.weaknesses[0]?.multiplier ?? 2} DMG
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'LOG' && (
            <ScrollView style={styles.logScroll} contentContainerStyle={{ gap: 4 }}>
              {[...state.log].reverse().slice(0, 12).map((entry, i) => (
                <View key={i} style={[styles.logEntry, entry.actor === 'player' ? styles.logPlayer : styles.logBoss]}>
                  <Text style={styles.logEntryText}>{entry.message}</Text>
                  <Text style={styles.logTurn}>T{entry.turn}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {isProcessing && state.phase === 'boss_turn' && (
        <View style={styles.waitZone}>
          <Text style={styles.waitText}>⚔️ El jefe está actuando...</Text>
        </View>
      )}
    </View>
  )
}

// ────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0d0d1a', padding: 12 },

  topExitBtn:   { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginBottom: 4, opacity: 0.6 },
  topExitText:  { color: '#FFF', fontSize: 12, marginLeft: 4 },

      export default CombatScreen
  bossZone:     { backgroundColor: '#12121f', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 8, padding: 12, marginBottom: 10 },
  bossHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  bossName:     { color: '#FFF', fontSize: 16, fontWeight: '900', flex: 1 },
  phaseBadge:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  phaseText:    { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  bossDebtBadge: { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  bossDebtText: { color: '#FCA5A5', fontSize: 11, fontWeight: '700' },
  bossSprite:   { alignItems: 'center', position: 'relative', paddingTop: 4 },

  // Player zone
  playerZone:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12121f', borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)', borderRadius: 8, padding: 12, marginBottom: 10 },
  playerSpriteWrapper: { marginRight: 12, position: 'relative' },
  playerStats:  { flex: 1 },
  playerName:   { color: '#FFF', fontWeight: '900', fontSize: 14, marginBottom: 6 },

  // Log
  logBox:       { backgroundColor: '#12121f', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 10, minHeight: 44, marginBottom: 10 },
  logText:      { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 18 },
  turnIndicator: { marginTop: 4 },
  turnText:     { color: Colors.accent, fontSize: 11, fontStyle: 'italic' },

  // Action area
  actionArea:   { flex: 1 },
  subTabs:      { flexDirection: 'row', gap: 6, marginBottom: 8 },
  subTab:       { flex: 1, paddingVertical: 6, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4 },
  subTabActive: { backgroundColor: Colors.primary },
  subTabText:   { color: '#FFF', fontSize: 12, fontWeight: '700' },

  actionRow:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  actionBtn:    { flex: 1, backgroundColor: 'rgba(30, 58, 95, 0.6)', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  skillBtn:     { backgroundColor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.2)' },
  actionBtnDisabled: { opacity: 0.35 },
  actionIcon:   { fontSize: 20, marginBottom: 4 },
  actionLabel:  { color: '#FFF', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  actionCost:   { color: '#7EB8F7', fontSize: 10, marginTop: 2 },

  financialBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  financialIcon: { fontSize: 24 },
  financialBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  financialBtnSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },

  // Log scroll
  logScroll:    { maxHeight: 180 },
  logEntry:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4 },
  logPlayer:    { backgroundColor: 'rgba(77,97,252,0.12)' },
  logBoss:      { backgroundColor: 'rgba(239,68,68,0.08)' },
  logEntryText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, flex: 1 },
  logTurn:      { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginLeft: 6 },

  waitZone:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  waitText:     { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

  // End screens
  endScreen:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  endKanji:     { color: '#FFD700', fontSize: 56, fontWeight: '900', marginBottom: 4 },
  endTitle:     { color: '#FFD700', fontSize: 32, fontWeight: '900' },
  endSub:       { color: '#AAA', fontSize: 16, marginTop: 8, textAlign: 'center' },
  endReward:    { color: '#10B981', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  exitBtn:      { marginTop: 28, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  exitBtnText:  { color: '#FFF', fontWeight: '900', fontSize: 16 },
})
