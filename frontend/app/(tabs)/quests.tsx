// app/(tabs)/quests.tsx
// TokaVerse RPG — Quests + Combat JRPG Screen
// Diseño: JRPG Japonés Dark Mode · Habitica-style Habits · Turn-based Combat

import React, { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
// Música de ambientación
const AMBIENT_MUSIC = [
  require('../../assets/music/ambient/Beneath_the_Velvet_Canopy.mp3'),
  require('../../assets/music/ambient/Where_the_Maps_End.mp3'),
];
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Platform,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import CombatScreen from '../../components/CombatScreen';
import { BossEngine } from '../../engine/BossEngine';
import { CLASS_FIGHTERS, CHAR_SPRITES } from '../../data/classSkills';
import type { ClassKey } from '../../data/classSkills';
import { Boss, Fighter } from '../../types/combat';

// ─── Clases JRPG ─────────────────────────────────────────────────────────
const JRPG_CLASSES = [
  { id: 'mage', name: 'Mahōtsukai', subtitle: '(Mago)', stat: 'Sabiduría', bonus: '+15% XP en ahorro', sprite: CHAR_SPRITES.mage },
  { id: 'warrior', name: 'Samurai', subtitle: '(Guerrero)', stat: 'Fuerza', bonus: '+25% Resistencia a daño', sprite: CHAR_SPRITES.warrior },
  { id: 'rogue', name: 'Shinobi', subtitle: '(Ninja)', stat: 'Agilidad', bonus: '+20% Recompensas Cashback', sprite: CHAR_SPRITES.rogue },
  { id: 'archer', name: 'Yushu', subtitle: '(Arquero)', stat: 'Destreza', bonus: 'x2 recompensa metas largas', sprite: CHAR_SPRITES.archer },
  { id: 'banker', name: 'Shōnin', subtitle: '(商人/Mercader)', stat: 'Riqueza', bonus: '+30% XP en inversiones', sprite: CHAR_SPRITES.banker },
  { id: 'kitsune', name: 'Kitsune', subtitle: '(狐/Espiritual)', stat: 'Misticismo', bonus: 'Veneno + curación automática', sprite: CHAR_SPRITES.kitsune },
] as const;

type ClassId = typeof JRPG_CLASSES[number]['id'];  // 'mage' | 'warrior' | 'rogue' | 'archer' | 'banker' | 'kitsune'


// ─── Datos de Hábitos / Dailies (Toka Integrated) ────────────────────────────
const HABITS = [
  { id: 'h1', title: '🛒 Compra Despensa Toka', type: 'positive' as const, xp: 20 },
  { id: 'h2', title: '⛽ Carga Eficiente Gasolina', type: 'positive' as const, xp: 25 },
  { id: 'h3', title: '📋 Comprobación a Tiempo', type: 'positive' as const, xp: 30 },
  { id: 'h4', title: '🎰 Gasto impulsivo extra', type: 'negative' as const, hpPenalty: 25 },
];

const DAILIES = [
  { id: 'd1', title: '📸 Subir comprobante Connect', completed: false, xp: 60, hpPenalty: 20 },
  { id: 'd2', title: '📊 Registrar odómetro diario', completed: false, xp: 70, hpPenalty: 25 },
  { id: 'd3', title: '🛒 Completar "Quest Mercadito"', completed: false, xp: 100, hpPenalty: 40 },
];

// ─── Jefes disponibles (Toka Products) ──────────────────────────────
const DEMO_BOSSES = [
  { label: '🛒 El Carrito Vacío', type: 'toka_despensa' as const, amount: 2500, daysOverdue: 0 },
  { label: '⛽ El Tanque Vacío', type: 'toka_fuel' as const, amount: 1500, daysOverdue: 5 },
  { label: '📑 El Gasto Sin Comprobar', type: 'toka_connect' as const, amount: 8000, daysOverdue: 15, interestRate: 10 },
  { label: '🃏 Tarjeta Maldita', type: 'credit_card' as const, amount: 5000, daysOverdue: 45, interestRate: 36 },
];

const USER_ID = 'user_123';
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  let host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
    return 'http://localhost:3000';
  }
  return `http://${host}:3000`;
};
const API_URL = getApiUrl();
const XP_THRESHOLDS = [0, 2500, 10000, 35000, 100000];

// ─────────────────────────────────────────────────────────────────────────────
export default function QuestsScreen() {
  // Estado de música y volumen global
  const [ambientSound, setAmbientSound] = useState<Audio.Sound | null>(null);
  const [volume, setVolume] = useState(0.7);
  const isCombatRef = useRef(false);

  // Reproducir música de ambientación al iniciar la app
  useEffect(() => {
    let isMounted = true;
    async function playAmbient() {
      if (ambientSound) {
        await ambientSound.stopAsync();
        await ambientSound.unloadAsync();
      }
      const track = AMBIENT_MUSIC[Math.floor(Math.random() * AMBIENT_MUSIC.length)];
      const { sound } = await Audio.Sound.createAsync(track, { volume, isLooping: true });
      if (isMounted) {
        setAmbientSound(sound);
        await sound.playAsync();
      }
    }
    playAmbient();
    return () => {
      isMounted = false;
      if (ambientSound) {
        ambientSound.stopAsync();
        ambientSound.unloadAsync();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambiar volumen global
  useEffect(() => {
    if (ambientSound) ambientSound.setVolumeAsync(volume);
  }, [volume, ambientSound]);
  // Sincronización con Backend
  const [userProfile, setUserProfile] = useState<{ id: string, xp: number, level: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
       try {
         const res = await fetch(`${API_URL}/users/${USER_ID}/profile`);
         if (res.ok) {
           const data = await res.json();
           if (isMounted) setUserProfile(data);
         }
       } catch (e) { console.error("Profile Fetch Error:", e); }
    };
    fetchProfile();

    const socket = io(API_URL);
    socketRef.current = socket;
    socket.on('userUpdated', (updated: any) => {
       if (updated.id === USER_ID && isMounted) setUserProfile(updated);
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  const [classIndex, setClassIndex] = useState(0);
  const level = userProfile?.level || 1;
  const xp = userProfile?.xp || 0;
  
  // Umbrales dinámicos
  const xpMax = XP_THRESHOLDS[level] || 100000;
  const prevThreshold = XP_THRESHOLDS[level - 1] || 0;

  const [hp, setHp] = useState(100);
  const [hpMax] = useState(100);
  const [mana] = useState(50);
  const [manaMax] = useState(50);
  const [multiplier] = useState(1.5);
  const [defenseStreak] = useState(4);

  const [activeTab, setActiveTab] = useState<'HABITS' | 'DAILIES' | 'PARTY'>('HABITS');
  const [showStatusModal, setShowStatus] = useState(false);
  const [showBossSelect, setShowBossSelect] = useState(false);
  const [inCombat, setInCombat] = useState(false);
  const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
  const [activeFighter, setActiveFighter] = useState<Fighter | null>(null);

  const [habits, setHabits] = useState(HABITS);
  const [dailies, setDailies] = useState(DAILIES);
  const [isTakingDamage, setDamage] = useState(false);
  const [isAttacking, setAttacking] = useState(false);

  const currentClass = JRPG_CLASSES[classIndex];

  // ── RPG helpers ──────────────────────────────────────────────────────────
  const gainXp = async (amount: number, source: string = 'Quest Action') => {
    setAttacking(true);
    const totalXp = Math.floor(amount * multiplier);
    try {
      await fetch(`${API_URL}/users/${USER_ID}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountXp: totalXp, source })
      });
    } catch (e) {
      console.warn("XP Gain API Error:", e);
    }
    setTimeout(() => setAttacking(false), 500);
  };

  const takeDamage = async (amount: number) => {
    setDamage(true);
    const newHp = hp - amount;
    if (newHp <= 0) {
      Alert.alert('ゲームオーバー (¡Caíste!)', 'Has perdido vitalidad y algo de experiencia por descuido financiero.');
      setHp(hpMax);
      // Penalización fuerte de XP si HP llega a 0
      try {
        await fetch(`${API_URL}/users/${USER_ID}/transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountXp: -500, source: 'Derrota / Descuido' })
        });
      } catch (e) { console.warn("XP Damage Error:", e); }
    } else {
      setHp(newHp);
    }
    setTimeout(() => setDamage(false), 500);
  };

  // ── Iniciar combate ──────────────────────────────────────────────────────
  const startCombat = (bossConfig: typeof DEMO_BOSSES[number]) => {
    const boss = BossEngine.generateFromDebt({ id: `boss_${bossConfig.type}`, ...bossConfig });
    const fighter = CLASS_FIGHTERS[currentClass.id as ClassKey];
    setActiveBoss(boss);
    setActiveFighter({ ...fighter, name: currentClass.name });
    setShowBossSelect(false);
    setInCombat(true);
  };

  const handleVictory = (boss: Boss) => {
    gainXp(500);
    Alert.alert('🏆 ¡Victoria!', `Derrotaste a ${boss.name}\n+500 XP · Loot Box desbloqueada`);
  };

  const handleDefeat = () => {
    takeDamage(30);
  };

  // ─── Gestión de Audio (Pausa/Resumen) ─────────────────────────────────────
  useEffect(() => {
    async function syncAudio() {
      try {
        if (inCombat) {
          if (ambientSound) await ambientSound.pauseAsync();
        } else {
          if (ambientSound) await ambientSound.playAsync();
        }
      } catch (e) {
        console.warn("[Quests] Audio Sync Error:", e);
      }
    }
    syncAudio();
  }, [inCombat, ambientSound]);

  // ─── COMBAT MODE — cubre toda la pantalla ──────────────────────────────
  if (inCombat && activeBoss && activeFighter) {
    return (
      <CombatScreen
        key={`combat_${activeBoss.id}_${Date.now()}`}
        player={activeFighter}
        boss={activeBoss}
        onVictory={handleVictory}
        onDefeat={handleDefeat}
        onExit={() => setInCombat(false)}
        globalVolume={volume}
      />
    );
  }

  // ─── MAIN QUESTS UI ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Control de música y volumen global ─────────────── */}
      <View style={styles.audioHeader}>
        <View style={styles.audioInfo}>
          <Text style={styles.audioGenre}>🌅 Ambient</Text>
          <Text style={styles.audioStatus}>Playing</Text>
        </View>
        <View style={styles.volumeControl}>
          <TouchableOpacity onPress={() => setVolume(Math.max(0, volume - 0.1))} style={styles.volBtn}>
            <Ionicons name="volume-low" size={16} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.volBarBg}>
            <View style={[styles.volBarFill, { width: `${volume * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => setVolume(Math.min(1, volume + 0.1))} style={styles.volBtn}>
            <Ionicons name="volume-high" size={16} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.volText}>{Math.round(volume * 100)}%</Text>
        </View>
      </View>

      {/* ━━ MODAL BOSS SELECT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Modal visible={showBossSelect} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHdr}>
              <Text style={styles.modalTitle}>⚔️ 挑戦 — Seleccionar Jefe</Text>
              <TouchableOpacity onPress={() => setShowBossSelect(false)}>
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Elige la deuda enemiga que quieres confrontar hoy:</Text>
            <View style={{ gap: 10 }}>
              {DEMO_BOSSES.map((b, i) => (
                <TouchableOpacity key={i} style={styles.bossPickCard} onPress={() => startCombat(b)}>
                  <Text style={styles.bossPickName}>{b.label}</Text>
                  <Text style={styles.bossPickSub}>
                    ${b.amount.toLocaleString('es-MX')} MXN · {b.daysOverdue} días de atraso
                  </Text>
                  <Text style={styles.bossPickHp}>HP del jefe: {Math.min(Math.floor(b.amount / 10) + b.daysOverdue * 5, 9999)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ━━ MODAL STATUS / PERSONAJE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Modal visible={showStatusModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHdr}>
              <Text style={styles.modalTitle}>ステータス (STATUS)</Text>
              <TouchableOpacity onPress={() => setShowStatus(false)}>
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Selecciona tu Camino Financiero:</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
              {JRPG_CLASSES.map((cls, i) => {
                const selected = classIndex === i;
                return (
                  <TouchableOpacity
                    key={cls.id}
                    style={[styles.classCard, selected && styles.classCardActive]}
                    onPress={() => setClassIndex(i)}
                  >
                    {selected && (
                      <View style={styles.activeTag}>
                        <Text style={styles.activeTagTxt}>ACTIVO</Text>
                      </View>
                    )}
                    <Image
                      source={typeof cls.sprite === 'number' ? cls.sprite : { uri: cls.sprite }}
                      style={[styles.classImg, Platform.OS === 'web' && { imageRendering: 'pixelated' } as any]}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                    />
                    <Text style={styles.className}>{cls.name}</Text>
                    <Text style={styles.classSubtitle}>{cls.subtitle}</Text>
                    <Text style={styles.classStat}>Stat: {cls.stat}</Text>
                    <View style={styles.bonusBadge}>
                      <Text style={styles.bonusText}>{cls.bonus}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.divider} />

            <View style={styles.statsGrid}>
              {[
                { lbl: 'HP', val: `${hp}/${hpMax}` },
                { lbl: 'MP', val: `${mana}/${manaMax}` },
                { lbl: 'NIV', val: `${level}` },
                { lbl: 'XP', val: `${xp}` },
              ].map(s => (
                <View key={s.lbl} style={styles.statBox}>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                  <Text style={styles.statVal}>{s.val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ━━ CONTENIDO PRINCIPAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* — HUD RPG ——————————————————————————————————————————————— */}
        <View style={styles.hud}>
          <View style={styles.hudHdr}>
            <View>
              <Text style={styles.hudName}>Lv.{level} {currentClass.name}</Text>
              <Text style={styles.hudMul}>🔥 Renkei: x{multiplier}</Text>
            </View>
            <View style={{ gap: 6 }}>
              <TouchableOpacity style={styles.statusBtn} onPress={() => setShowStatus(true)}>
                <Ionicons name="person-circle" size={14} color="#FFF" />
                <Text style={styles.statusBtnTxt}> Estado</Text>
              </TouchableOpacity>
              <View style={styles.defenseBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.tertiary} />
                <Text style={styles.defenseTxt}> {defenseStreak}d</Text>
              </View>
            </View>
          </View>

          <View style={styles.avatarRow}>
            <CharacterAvatar
              spriteUrl={currentClass.sprite}
              isTakingDamage={isTakingDamage}
              isAttacking={isAttacking}
            />

            <View style={styles.barsCol}>
              {[
                { label: 'HP', cur: hp, max: hpMax, color: '#EF4444' },
                { label: 'MP', cur: mana, max: manaMax, color: '#3B82F6' },
                { label: 'XP', cur: xp, max: xpMax, color: '#F59E0B' },
              ].map(b => (
                <View key={b.label} style={styles.barWrap}>
                  <View style={styles.barHdr}>
                    <Text style={[styles.barLbl, { color: b.color }]}>{b.label}</Text>
                    <Text style={styles.barVal}>{b.cur}/{b.max}</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${Math.min(100, ((b.label === 'XP' ? (xp - prevThreshold) : b.cur) / (b.label === 'XP' ? (xpMax - prevThreshold) : b.max)) * 100)}%` as any, backgroundColor: b.color }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* — BOTÓN COMBATE ─────────────────────────────────────────── */}
        <TouchableOpacity style={styles.combatButton} onPress={() => setShowBossSelect(true)}>
          <Text style={styles.combatButtonIcon}>⚔️</Text>
          <View>
            <Text style={styles.combatButtonTxt}>¡A combatir!</Text>
            <Text style={styles.combatButtonSub}>Enfrenta tus deudas · Combate por turnos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* — TABS JRPG ─────────────────────────────────────────────── */}
        <View style={styles.tabs}>
          {[
            { key: 'HABITS', label: '習慣 (Hábitos)' },
            { key: 'DAILIES', label: '日課 (Dailies)' },
            { key: 'PARTY', label: '仲間 (Party)' },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key as any)}
            >
              <Text style={[styles.tabTxt, activeTab === t.key && styles.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* — LISTA ─────────────────────────────────────────────────── */}
        <View style={styles.list}>

          {activeTab === 'HABITS' && habits.map((h, i) => (
            <Animated.View entering={FadeInUp.delay(i * 80)} key={h.id} style={styles.card}>
              <View style={[styles.cardAccent, { backgroundColor: h.type === 'positive' ? '#10B981' : '#EF4444' }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{h.title}</Text>
                <Text style={styles.cardSub}>
                  {h.type === 'positive' ? `EXP: +${h.xp}` : `DMG: -${h.hpPenalty} HP`}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.cardBtn, { backgroundColor: h.type === 'positive' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}
                onPress={() => h.type === 'positive' ? gainXp(h.xp) : takeDamage(h.hpPenalty!)}
              >
                <Ionicons name={h.type === 'positive' ? 'add' : 'remove'} size={22} color={h.type === 'positive' ? '#10B981' : '#EF4444'} />
                <Text style={styles.cardBtnTxt}>{h.type === 'positive' ? '¡Hecho!' : 'Castigar'}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}

          {activeTab === 'DAILIES' && dailies.map((d, i) => (
            <Animated.View entering={FadeInUp.delay(i * 80)} key={d.id} style={[styles.card, d.completed && styles.cardDone]}>
              <View style={[styles.cardAccent, { backgroundColor: '#F59E0B' }]} />
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, d.completed && { textDecorationLine: 'line-through', opacity: 0.6 }]}>{d.title}</Text>
                <Text style={styles.cardSub}>+{d.xp} XP</Text>
              </View>
              {!d.completed
                ? (
                  <TouchableOpacity style={styles.checkBtnYellow} onPress={() => {
                    setDailies(ds => ds.map(x => x.id === d.id ? { ...x, completed: true } : x));
                    gainXp(d.xp);
                  }}>
                    <Ionicons name="checkmark" size={18} color="#000" />
                    <Text style={styles.cardBtnTxt}>¡Listo!</Text>
                  </TouchableOpacity>
                )
                : <Ionicons name="checkmark-circle" size={26} color="#10B981" style={{ marginRight: 14 }} />
              }
            </Animated.View>
          ))}

          {activeTab === 'PARTY' && (
            <Animated.View entering={FadeInUp}>
              <View style={styles.partyHeader}>
                <Text style={styles.partyTitle}>Guild: 赤い竜 (Dragón Rojo)</Text>
                <Text style={styles.partySub}>Si alguien falla, todos pierden HP. ¡Cooperen!</Text>
              </View>

              {[
                { name: 'Yamato', cls: 'Samurai', hp: 180, hpMax: 200 },
                { name: 'Sakura', cls: 'Mahōtsukai', hp: 18, hpMax: 80 },
                { name: 'Riku', cls: 'Shinobi', hp: 130, hpMax: 140 },
              ].map((m, i) => {
                const isLow = m.hp < m.hpMax * 0.3;
                return (
                  <View key={i} style={styles.partyCard}>
                    <Ionicons name="person" size={18} color={isLow ? '#EF4444' : Colors.tertiary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.partyMemberName}>{m.name} <Text style={{ color: Colors.textMuted, fontSize: 11 }}>({m.cls})</Text></Text>
                        <Text style={[styles.partyHp, isLow && { color: '#EF4444' }]}>{m.hp}/{m.hpMax}</Text>
                      </View>
                      <View style={styles.partyBarBg}>
                        <View style={[styles.partyBarFill, { width: `${(m.hp / m.hpMax) * 100}%` as any, backgroundColor: isLow ? '#EF4444' : '#10B981' }]} />
                      </View>
                    </View>
                    {isLow && (
                      <TouchableOpacity style={styles.healBtn}>
                        <Text style={styles.healBtnTxt}>CURAR</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F13' },
  scrollContent: { paddingTop: 40, paddingBottom: 50 },

  // HUD
  hud: { marginHorizontal: 14, backgroundColor: '#1E1E24', borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.07)', borderLeftWidth: 4, borderLeftColor: Colors.primary, padding: 14, marginBottom: 14 },
  hudHdr: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  hudName: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  hudMul: { color: '#F59E0B', fontSize: 12, fontWeight: '800', marginTop: 2 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  statusBtnTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  defenseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,212,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)' },
  defenseTxt: { color: Colors.tertiary, fontSize: 11, fontWeight: '800' },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  barsCol: { flex: 1, marginLeft: 14, gap: 8 },
  barWrap: {},
  barHdr: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  barLbl: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  barVal: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  barBg: { height: 7, backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  barFill: { height: '100%' },

  // Combat Button
  combatButton: { marginHorizontal: 14, marginBottom: 16, backgroundColor: '#7F1D1D', borderWidth: 1, borderColor: '#EF4444', borderRadius: 10, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  combatButtonIcon: { fontSize: 28 },
  combatButtonTxt: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  combatButtonSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  // Tabs
  tabs: { flexDirection: 'row', marginHorizontal: 14, marginBottom: 14, gap: 6 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { backgroundColor: 'rgba(77,97,252,0.1)', borderBottomColor: Colors.primary },
  tabTxt: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  tabTxtActive: { color: '#FFF', fontWeight: '900' },

  // Cards
  list: { marginHorizontal: 14, gap: 10 },
  card: { backgroundColor: '#1E1E24', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' },
  cardDone: { opacity: 0.5 },
  cardAccent: { width: 5, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 14 },
  cardTitle: { color: '#FFF', fontWeight: '700', fontSize: 14, marginBottom: 3 },
  cardSub: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  cardBtn: { width: 42, height: 42, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardBtnTxt: { color: '#FFF', fontSize: 10, fontWeight: '700', marginTop: 2 },
  checkBtnYellow: { width: 30, height: 30, backgroundColor: '#F59E0B', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 14 },

  // Party
  partyHeader: { backgroundColor: '#1E1E24', padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', marginBottom: 10 },
  partyTitle: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  partySub: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  partyCard: { backgroundColor: '#1E1E24', flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', marginBottom: 8 },
  partyMemberName: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  partyHp: { color: Colors.textMuted, fontWeight: '700', fontSize: 12 },
  partyBarBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  partyBarFill: { height: '100%', borderRadius: 3 },
  healBtn: { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginLeft: 10 },
  healBtnTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', paddingHorizontal: 14 },
  modalBox: { backgroundColor: '#1E1E24', borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, padding: 20, maxHeight: '85%' },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  modalSub: { color: Colors.textMuted, fontSize: 13, marginBottom: 16 },

  classCard: { width: 140, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, alignItems: 'center', position: 'relative' },
  classCardActive: { borderColor: Colors.tertiary, backgroundColor: 'rgba(0,212,255,0.08)' },
  classImg: { width: 80, height: 80, marginBottom: 8 },
  className: { color: '#FFF', fontWeight: '900', fontSize: 14, textAlign: 'center' },
  classSubtitle: { color: Colors.textMuted, fontSize: 11, marginBottom: 4 },
  classStat: { color: Colors.textMuted, fontSize: 11 },
  bonusBadge: { marginTop: 8, backgroundColor: 'rgba(249,115,22,0.1)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, width: '100%', alignItems: 'center' },
  bonusText: { color: '#F97316', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  activeTag: { position: 'absolute', top: -8, backgroundColor: Colors.tertiary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, zIndex: 1 },
  activeTagTxt: { color: '#000', fontSize: 9, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: { width: '47%', backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statLbl: { color: Colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  statVal: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 4 },

  // Boss select
  bossPickCard: { backgroundColor: 'rgba(127,29,29,0.2)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 8, padding: 14 },
  bossPickName: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  bossPickSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  bossPickHp: { color: '#EF4444', fontSize: 11, fontWeight: '700', marginTop: 6 },

  // Audio Styles
  audioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 14, marginBottom: 12, backgroundColor: '#1E1E24', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  audioInfo: { flex: 1 },
  audioGenre: { color: Colors.tertiary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  audioStatus: { color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 1 },
  volumeControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  volBtn: { padding: 4 },
  volBarBg: { width: 60, height: 4, backgroundColor: '#000', borderRadius: 2, overflow: 'hidden' },
  volBarFill: { height: '100%', backgroundColor: Colors.tertiary },
  volText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', minWidth: 28, textAlign: 'right' },
});
