// components/CombatScreen.tsx
// Pantalla de combate por turnos JRPG financiero
// Versión Ultra-Robust con GameLoop y Manejo de Errores

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert
} from 'react-native'
import { Audio } from 'expo-av'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring,
  FadeIn,
} from 'react-native-reanimated'

import { TurnManager, CombatState, CombatAction } from '../engine/TurnManager'
import { Fighter, Boss, StatusEffect } from '../types/combat'
import { Colors } from '../constants/Colors'

const COMBAT_TRACKS = [
  require('../assets/music/combat/One_Last_Tile.mp3'),
  require('../assets/music/combat/The_Final_Tile.mp3'),
]

interface CombatScreenProps {
  player: Fighter
  boss: Boss
  onVictory?: (boss: Boss) => void
  onDefeat?:  () => void
  onExit:     () => void
  globalVolume?: number
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ────────────────────────────────────────────────────────────────────────────

const StatBar = ({ current, max, color, label }: { current: number; max: number; color: string; label: string }) => {
  const safeCur = isNaN(current) ? 0 : current;
  const safeMax = isNaN(max) ? 100 : (max > 0 ? max : 100);
  const pct = Math.max(0, Math.min(1, safeCur / safeMax));
  
  return (
    <View style={barStyles.wrapper}>
      <View style={barStyles.labelRow}>
        <Text style={[barStyles.label, { color }]}>{label}</Text>
        <Text style={barStyles.value}>{safeCur}/{safeMax}</Text>
      </View>
      <View style={barStyles.bg}>
        <View style={[barStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  )
}
const barStyles = StyleSheet.create({
  wrapper: { marginBottom: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  label: { fontSize: 10, fontWeight: '900' },
  value: { fontSize: 10, color: '#FFF' },
  bg: { height: 6, backgroundColor: '#000', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 }
})

const AnimatedSprite = ({ spriteUrl, onHit, size=100 }: { spriteUrl: any; onHit: boolean; size?: number }) => {
  const tx = useSharedValue(0)
  useEffect(() => {
    if (onHit) {
      tx.value = withSequence(withTiming(-10, { duration: 50 }), withTiming(10, { duration: 50 }), withTiming(0, { duration: 50 }))
    }
  }, [onHit])
  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }))
  return (
    <Animated.View style={animated}>
      <Image source={typeof spriteUrl === 'number' ? spriteUrl : { uri: spriteUrl }} style={{ width: size, height: size }} contentFit="contain" />
    </Animated.View>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────

export default function CombatScreen({ player, boss, onVictory, onDefeat, onExit, globalVolume = 0.7 }: CombatScreenProps) {
  
  const [state, setState] = useState<CombatState>(() => TurnManager.initCombat(player, boss))
  const [isProcessing, setIsProcessing] = useState(false)
  const [bossHit, setBossHit] = useState(false)
  const [playerHit, setPlayerHit] = useState(false)
  const [activeTab, setActiveTab] = useState<'SKILLS' | 'LOG'>('SKILLS')
  const [volume, setVolume] = useState(globalVolume)
  
  const soundRef = useRef<Audio.Sound | null>(null)
  const processingRef = useRef(false) // Ref de seguridad para evitar dobles turnos

  // Audio Logic
  useEffect(() => {
    let isMounted = true
    async function initMusic() {
      try {
        const track = COMBAT_TRACKS[Math.floor(Math.random() * COMBAT_TRACKS.length)]
        const { sound } = await Audio.Sound.createAsync(track, { volume, isLooping: true, shouldPlay: true })
        if (isMounted) {
          soundRef.current = sound
        } else {
          await sound.unloadAsync()
        }
      } catch (e) { console.warn("Music load error", e) }
    }
    initMusic()
    return () => {
      isMounted = false
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {}).then(() => soundRef.current?.unloadAsync().catch(() => {}))
      }
    }
  }, [])

  useEffect(() => {
    if (soundRef.current) soundRef.current.setVolumeAsync(volume).catch(() => {})
  }, [volume])

  // ── GAME LOOP: AUTOMATED BOSS TURN ──────────────────────────────────────────
  useEffect(() => {
    // Si es turno del jefe y no estamos ya procesando algo
    if (state.phase === 'boss_turn' && !processingRef.current) {
      console.log("[Combat] Trigerring Boss Turn Effect");
      processingRef.current = true;
      setIsProcessing(true);

      const turnTimer = setTimeout(() => {
        try {
          const nextState = TurnManager.executeBossTurn(state);
          
          if (nextState.log[nextState.log.length-1]?.damage) {
            setPlayerHit(true);
            setTimeout(() => setPlayerHit(false), 300);
          }

          setState(nextState);

          if (nextState.phase === 'defeat') {
            setTimeout(() => {
              onDefeat?.();
            }, 1000);
            return; // No liberamos el procesamiento para evitar inputs
          }

        } catch (e) {
          console.error("[Combat] Error in Boss Turn:", e);
          // Fallback: Devolver el turno al jugador para evitar freeze
          setState(s => ({ ...s, phase: 'player_turn' }));
        } finally {
          processingRef.current = false;
          setIsProcessing(false);
        }
      }, 500);

      return () => clearTimeout(turnTimer);
    }
  }, [state.phase]); // Solo dependemos de la fase para evitar loops infinitos

  // ── PLAYER ACTIONS ────────────────────────────────────────────────────────
  const handlePlayerAction = useCallback((action: CombatAction) => {
    if (state.phase !== 'player_turn' || processingRef.current || isProcessing) return;
    
    console.log("[Combat] Player Action:", action.type);
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const nextState = TurnManager.executePlayerAction(state, action);
      
      if (nextState.log[nextState.log.length-1]?.damage) {
        setBossHit(true);
        setTimeout(() => setBossHit(false), 300);
      }

      setState(nextState);

      if (nextState.phase === 'victory') {
        setTimeout(() => {
          onVictory?.(nextState.boss);
        }, 1000);
        // Dejamos processingRef en true para bloquear UI mientras se muestra la victoria
      } else {
        // Liberamos tras 200ms para permitir que el useEffect del Boss Turn se active
        setTimeout(() => {
          processingRef.current = false;
          setIsProcessing(false);
        }, 200); 
      }
    } catch (e) {
      console.error("[Combat] Error in Player Action:", e);
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [state, isProcessing, onVictory]);

  // Pantallas Finales
  if (state.phase === 'victory') {
    return (
      <View style={[styles.endScreen, { backgroundColor: '#001a0d' }]}>
        <Text style={styles.endKanji}>勝利</Text>
        <Text style={styles.endTitle}>¡Victoria!</Text>
        <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
          <Text style={styles.exitBtnText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state.phase === 'defeat') {
    return (
      <View style={[styles.endScreen, { backgroundColor: '#1a0000' }]}>
        <Text style={[styles.endKanji, { color: '#EF4444' }]}>敗北</Text>
        <Text style={[styles.endTitle, { color: '#EF4444' }]}>Derrota...</Text>
        <TouchableOpacity style={[styles.exitBtn, { backgroundColor: '#7F1D1D' }]} onPress={onExit}>
          <Text style={styles.exitBtnText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.volControl}>
          <Text style={{color:'#FFF', fontSize: 10}}>VOL {Math.round(volume*100)}%</Text>
          <TouchableOpacity onPress={() => setVolume(Math.max(0, volume-0.1))}><Text style={{color:'#FFF', padding:5}}>➖</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setVolume(Math.min(1, volume+0.1))}><Text style={{color:'#FFF', padding:5}}>➕</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onExit} style={styles.retreatBtn}>
          <Text style={{color:'#FFF', fontWeight:'bold', fontSize:12}}>Huir</Text>
        </TouchableOpacity>
      </View>

      {/* Boss Zone */}
      <View style={styles.bossBox}>
        <Text style={styles.bossName}>{state.boss.name}</Text>
        <StatBar current={state.boss.hp} max={state.boss.maxHp} color="#EF4444" label="DEBT HP" />
        <View style={styles.spriteBox}>
          <AnimatedSprite spriteUrl={state.boss.sprite} onHit={bossHit} size={140} />
        </View>
      </View>

      {/* Player Zone */}
      <View style={styles.playerBox}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          <AnimatedSprite spriteUrl={state.player.sprite} onHit={playerHit} size={70} />
          <View style={{flex:1, marginLeft:10}}>
            <Text style={styles.playerName}>{state.player.name}</Text>
            <StatBar current={state.player.hp} max={state.player.maxHp} color="#10B981" label="HP" />
            <StatBar current={state.player.mana} max={state.player.maxMana} color="#3B82F6" label="MP" />
          </View>
        </View>
      </View>

      {/* Log */}
      <View style={styles.logBox}>
        <Text style={styles.logText} numberOfLines={2}>
           {state.log[state.log.length-1]?.message}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionArea}>
        {state.phase === 'player_turn' && !isProcessing ? (
          <>
            <View style={styles.actionRow}>
               <TouchableOpacity style={styles.actionBtn} onPress={() => handlePlayerAction({type:'ATTACK'})}>
                  <Text style={styles.actionBtnTxt}>ATACAR</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.actionBtn, {backgroundColor:'#3B82F6'}]} onPress={() => handlePlayerAction({type:'DEFEND'})}>
                  <Text style={styles.actionBtnTxt}>DEFENDER</Text>
               </TouchableOpacity>
            </View>
            <View style={styles.actionRow}>
               {state.player.skills.slice(0,2).map(skill => (
                 <TouchableOpacity 
                   key={skill.id} 
                   style={[styles.actionBtn, {backgroundColor:'#7C3AED'}]} 
                   onPress={() => handlePlayerAction({type:'SKILL', skillId: skill.id})}
                 >
                   <Text style={styles.actionBtnTxt}>{skill.name.toUpperCase()}</Text>
                   <Text style={{color:'#FFF', fontSize:8}}>{skill.manaCost} MP</Text>
                 </TouchableOpacity>
               ))}
            </View>
          </>
        ) : (
          <View style={styles.waitBox}>
            <Text style={styles.waitText}>ESPERANDO...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', padding: 16, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  volControl: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#18181b', padding: 5, borderRadius: 5 },
  retreatBtn: { backgroundColor: '#450a0a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5, borderWidth: 1, borderColor: '#ef4444' },
  bossBox: { backgroundColor: '#18181b', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#27272a', marginBottom: 15 },
  bossName: { color: '#ef4444', fontWeight: '900', fontSize: 16, marginBottom: 10 },
  spriteBox: { alignItems: 'center', marginVertical: 10 },
  playerBox: { backgroundColor: '#18181b', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#27272a', marginBottom: 15 },
  playerName: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  logBox: { height: 60, backgroundColor: '#000', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#3f3f46', marginBottom: 15, justifyContent: 'center' },
  logText: { color: '#d4d4d8', fontSize: 12, lineHeight: 18 },
  actionArea: { flex: 1, justifyContent: 'flex-end' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionBtn: { flex: 1, backgroundColor: '#1e3a8a', padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnTxt: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  waitBox: { height: 100, alignItems: 'center', justifyContent: 'center' },
  waitText: { color: '#71717a', fontWeight: 'bold', letterSpacing: 2 },
  endScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  endKanji: { fontSize: 80, fontWeight: '900', color: '#FFD700' },
  endTitle: { fontSize: 30, color: '#FFF', marginTop: 20 },
  exitBtn: { marginTop: 40, backgroundColor: '#2563eb', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 10 },
  exitBtnText: { color: '#FFF', fontWeight: 'bold' }
});
