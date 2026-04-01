// app/(tabs)/quests.tsx
// TokaVerse RPG — Pantalla de Misiones + Combate JRPG
// Sistema Híbrido: Elementos · Fusiones · Fases · Estados Alterados

import React, { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';


const AMBIENT_MUSIC = [
  require('../../assets/music/ambient/Beneath_the_Velvet_Canopy.mp3'),
  require('../../assets/music/ambient/Clock_With_A_Human_Face.mp3'),
  require('../../assets/music/ambient/Innocence_Is_The_Sharpest_Blade.mp3'),
  require('../../assets/music/ambient/The_Stranger_Inside.mp3'),
  require('../../assets/music/ambient/Toka_Skies.mp3'),
  require('../../assets/music/ambient/Where_the_Maps_End.mp3'),
];

const COMBAT_MUSIC = [
  require('../../assets/music/combat/Ascent_to_Victory.mp3'),
  require('../../assets/music/combat/Beyond_The_Threshold.mp3'),
  require('../../assets/music/combat/Kurenai_no_Kessen.mp3'),
  require('../../assets/music/combat/Last_Hand_at_the_Gate.mp3'),
  require('../../assets/music/combat/One_Last_Tile.mp3'),
  require('../../assets/music/combat/The_Final_Tile.mp3'),
];

import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Platform,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import CombatScreen from '../../components/CombatScreen';
import FusionPreCombat from '../../components/FusionPreCombat';
import { BossEngine } from '../../engine/BossEngine';
import { CLASS_FIGHTERS, CHAR_SPRITES } from '../../data/classSkills';
import type { ClassKey } from '../../data/classSkills';
import { Boss, Fighter } from '../../types/combat';
import { ELEMENT_INFO, BOSS_ELEMENTS, CLASS_ELEMENTS } from '../../types/elements';
import type { PlayerCard } from '../../types/fusion';

// ─── Clases JRPG ─────────────────────────────────────────────────────────
const JRPG_CLASSES = [
  { id: 'mage',    name: 'Mahōtsukai', subtitle: '(Mago)',      stat: 'Sabiduría',   bonus: '+15% XP en ahorro',           sprite: CHAR_SPRITES.mage    },
  { id: 'warrior', name: 'Samurai',    subtitle: '(Guerrero)',   stat: 'Fuerza',      bonus: '+25% Resistencia a daño',      sprite: CHAR_SPRITES.warrior },
  { id: 'rogue',   name: 'Shinobi',    subtitle: '(Ninja)',      stat: 'Agilidad',    bonus: '+20% Recompensas Cashback',    sprite: CHAR_SPRITES.rogue   },
  { id: 'archer',  name: 'Yushu',      subtitle: '(Arquero)',    stat: 'Destreza',    bonus: 'x2 recompensa metas largas',   sprite: CHAR_SPRITES.archer  },
  { id: 'banker',  name: 'Shōnin',     subtitle: '(Mercader)',   stat: 'Riqueza',     bonus: '+30% XP en inversiones',       sprite: CHAR_SPRITES.banker  },
  { id: 'kitsune', name: 'Kitsune',    subtitle: '(Espiritual)', stat: 'Misticismo',  bonus: 'Veneno + curación automática', sprite: CHAR_SPRITES.kitsune },
] as const;

type ClassId = typeof JRPG_CLASSES[number]['id'];

// ─── Hábitos y Dailies ────────────────────────────────────────────────────
const HABITS = [
  { id: 'h1', title: 'Compra de Despensa Toka',     icon: '🛒', type: 'positive' as const, xp: 20  },
  { id: 'h2', title: 'Carga Eficiente de Gasolina', icon: '⛽', type: 'positive' as const, xp: 25  },
  { id: 'h3', title: 'Comprobación a Tiempo',        icon: '📋', type: 'positive' as const, xp: 30  },
  { id: 'h4', title: 'Gasto Impulsivo Extra',        icon: '🎰', type: 'negative' as const, hpPenalty: 25 },
];

const DAILIES = [
  { id: 'd1', title: 'Subir comprobante Connect',  icon: '📸', completed: false, xp: 60,  hpPenalty: 20 },
  { id: 'd2', title: 'Registrar odómetro diario',  icon: '📊', completed: false, xp: 70,  hpPenalty: 25 },
  { id: 'd3', title: 'Completar "Quest Mercadito"', icon: '🛒', completed: false, xp: 100, hpPenalty: 40 },
];

// ─── Jefes disponibles ───────────────────────────────────────────────────
const DEMO_BOSSES = [
  { label: 'El Carrito Vacío',        icon: '🛒', type: 'toka_despensa' as const, amount: 2500,  daysOverdue: 0,  difficulty: 'Fácil',    diffColor: '#22C55E' },
  { label: 'El Tanque Vacío',         icon: '⛽', type: 'toka_fuel'     as const, amount: 1500,  daysOverdue: 5,  difficulty: 'Normal',   diffColor: '#F59E0B' },
  { label: 'El Gasto Sin Comprobar',  icon: '📑', type: 'toka_connect'  as const, amount: 8000,  daysOverdue: 15, difficulty: 'Difícil',  diffColor: '#EF4444', interestRate: 10 },
  { label: 'Tarjeta Maldita',         icon: '🃏', type: 'credit_card'   as const, amount: 5000,  daysOverdue: 45, difficulty: '🌋 Épico', diffColor: '#FF6B35', interestRate: 36 },
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
  const insets = useSafeAreaInsets();

  // ── Audio ──────────────────────────────────────────────────────────────
  const [ambientSound, setAmbientSound] = useState<Audio.Sound | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [showVolumePanel, setShowVolumePanel] = useState(false);
  const [trackName, setTrackName] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function playAmbient() {
      try {
        const idx = Math.floor(Math.random() * AMBIENT_MUSIC.length);
        const names = ['Beneath the Velvet Canopy', 'Where the Maps End'];
        const track = AMBIENT_MUSIC[idx];
        setTrackName(names[idx] ?? 'Música Ambiente');
        const { sound } = await Audio.Sound.createAsync(track, { volume, isLooping: true });
        if (isMounted) {
          setAmbientSound(sound);
          await sound.playAsync();
        } else {
          await sound.unloadAsync();
        }
      } catch (e) {
        console.warn('[Quests] Audio init error:', e);
      }
    }
    playAmbient();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar volumen
  useEffect(() => {
    ambientSound?.setVolumeAsync(volume).catch(() => {});
  }, [volume, ambientSound]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      ambientSound?.stopAsync().catch(() => {}).then(() => ambientSound?.unloadAsync().catch(() => {}));
    };
  }, [ambientSound]);

  // ── Backend / Socket ───────────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState<{ id: string; xp: number; level: number } | null>(null);
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
      } catch (e) { console.error('Profile Fetch Error:', e); }
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

  // ── Estado del personaje ───────────────────────────────────────────────
  const [classIndex, setClassIndex] = useState(0);
  const level       = userProfile?.level ?? 1;
  const xp          = userProfile?.xp    ?? 0;
  const xpMax       = XP_THRESHOLDS[level]     ?? 100000;
  const prevThresh  = XP_THRESHOLDS[level - 1] ?? 0;

  const [hp,       setHp]     = useState(100);
  const [hpMax]               = useState(100);
  const [mana]                = useState(50);
  const [manaMax]             = useState(50);
  const [multiplier]          = useState(1.5);
  const [defenseStreak]       = useState(4);

  const [activeTab, setActiveTab]       = useState<'HABITOS' | 'DAILIES' | 'GRUPO'>('HABITOS');
  const [showStatusModal, setShowStatus] = useState(false);
  const [showBossSelect, setShowBossSelect] = useState(false);
  const [inCombat, setInCombat]          = useState(false);
  const [inPreCombat, setInPreCombat]    = useState(false);
  const [activeBoss, setActiveBoss]      = useState<Boss | null>(null);
  const [activeFighter, setActiveFighter] = useState<Fighter | null>(null);
  const [selectedCards, setSelectedCards] = useState<PlayerCard[]>([]);

  const [habits,  setHabits]  = useState(HABITS);
  const [dailies, setDailies] = useState(DAILIES);
  const [isTakingDamage, setDamage]    = useState(false);
  const [isAttacking,    setAttacking] = useState(false);

  const currentClass = JRPG_CLASSES[classIndex];

  // ── Helpers RPG ────────────────────────────────────────────────────────
  const gainXp = async (amount: number, source = 'Acción de Misión') => {
    setAttacking(true);
    const totalXp = Math.floor(amount * multiplier);
    try {
      await fetch(`${API_URL}/users/${USER_ID}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountXp: totalXp, source }),
      });
    } catch (e) { console.warn('XP Gain API Error:', e); }
    setTimeout(() => setAttacking(false), 500);
  };

  const takeDamage = async (amount: number) => {
    setDamage(true);
    const newHp = hp - amount;
    if (newHp <= 0) {
      Alert.alert('ゲームオーバー (¡Caíste!)', 'Has perdido vitalidad y algo de experiencia por descuido financiero.');
      setHp(hpMax);
      try {
        await fetch(`${API_URL}/users/${USER_ID}/transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountXp: -500, source: 'Derrota / Descuido' }),
        });
      } catch (e) { console.warn('XP Damage Error:', e); }
    } else {
      setHp(newHp);
    }
    setTimeout(() => setDamage(false), 500);
  };

  const selectBoss = (bossConfig: typeof DEMO_BOSSES[number]) => {
    const boss    = BossEngine.generateFromDebt({ id: `boss_${bossConfig.type}`, ...bossConfig });
    const fighter = CLASS_FIGHTERS[currentClass.id as ClassKey];
    setActiveBoss(boss);
    setActiveFighter({ ...fighter, name: currentClass.name });
    setShowBossSelect(false);
    setInPreCombat(true);
  };

  const startCombat = (cards: PlayerCard[]) => {
    setSelectedCards(cards);
    setInPreCombat(false);
    setInCombat(true);
  };

  const handleVictory = (boss: Boss) => {
    gainXp(500);
    Alert.alert('🏆 ¡Victoria!', `Derrotaste a ${boss.name}\n+500 XP · Loot Box desbloqueada`);
  };

  const handleDefeat = () => { takeDamage(30); };

  // ── Sincronizar audio con combate ───────────────────────────────────────
  useEffect(() => {
    if (inCombat) {
      ambientSound?.pauseAsync().catch(() => {});
    } else {
      ambientSound?.playAsync().catch(() => {});
    }
  }, [inCombat, ambientSound]);

  // ─── PRE-COMBAT ────────────────────────────────────────────────────────
  if (inPreCombat && activeBoss) {
    return (
      <FusionPreCombat
        boss={activeBoss}
        onStart={startCombat}
        onCancel={() => setInPreCombat(false)}
      />
    );
  }

  // ─── COMBAT ────────────────────────────────────────────────────────────
  if (inCombat && activeBoss && activeFighter) {
    return (
      <CombatScreen
        key={`combat_${activeBoss.id}_${Date.now()}`}
        player={activeFighter}
        boss={activeBoss}
        equippedCards={selectedCards}
        onVictory={handleVictory}
        onDefeat={handleDefeat}
        onExit={() => setInCombat(false)}
        globalVolume={volume}
      />
    );
  }

  // ─── Cálculos del elemento del personaje ──────────────────────────────
  const classElem     = (CLASS_ELEMENTS as any)[currentClass.id];
  const classElemInfo = classElem ? (ELEMENT_INFO as any)[classElem.primary] : null;

  // ─── UI PRINCIPAL ──────────────────────────────────────────────────────
  return (
    <View style={[S.container, { paddingTop: Math.max(insets.top, 8) }]}>

      {/* ── Barra de música y volumen ─────────────────────────────────── */}
      <View style={S.musicBar}>
        <View style={S.musicLeft}>
          <Ionicons name="musical-notes" size={14} color={Colors.tertiary} />
          <View style={S.musicText}>
            <Text style={S.musicTrack} numberOfLines={1}>{trackName || 'Música Ambiente'}</Text>
            <Text style={S.musicStatus}>🌅 Ambient · Reproduciendo</Text>
          </View>
        </View>

        {/* Botón de volumen mejorado */}
        <TouchableOpacity
          style={S.volBtn}
          onPress={() => setShowVolumePanel(v => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Menú de volumen"
          accessibilityRole="button"
        >
          <Ionicons
            name={volume === 0 ? 'volume-mute' : volume < 0.5 ? 'volume-low' : 'volume-high'}
            size={16}
            color={Colors.tertiary}
          />
          <Text style={S.volBtnTxt}>{Math.round(volume * 100)}%</Text>
          <Ionicons
            name={showVolumePanel ? 'chevron-up' : 'chevron-down'}
            size={11}
            color="rgba(255,255,255,0.4)"
          />
        </TouchableOpacity>
      </View>

      {/* Panel de volumen expandible */}
      {showVolumePanel && (
        <Animated.View entering={FadeIn.duration(180)} style={S.volPanel}>
          <Text style={S.volPanelLabel}>Volumen de Música</Text>
          <View style={S.volRow}>
            <TouchableOpacity
              onPress={() => setVolume(v => Math.max(0, parseFloat((v - 0.1).toFixed(1))))}
              style={S.volArrow}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="volume-low" size={18} color="#FFF" />
            </TouchableOpacity>
            <View style={S.volTrack}>
              <View style={[S.volFill, { width: `${volume * 100}%` as any }]} />
              {[0, 0.25, 0.5, 0.75, 1].map(mark => (
                <View
                  key={mark}
                  style={[S.volMark, { left: `${mark * 100}%` as any, backgroundColor: volume >= mark ? Colors.tertiary : 'rgba(255,255,255,0.15)' }]}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setVolume(v => Math.min(1, parseFloat((v + 0.1).toFixed(1))))}
              style={S.volArrow}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="volume-high" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={S.volPresets}>
            {[0, 0.3, 0.5, 0.7, 1].map(p => (
              <TouchableOpacity
                key={p}
                style={[S.volPreset, Math.abs(volume - p) < 0.05 && S.volPresetActive]}
                onPress={() => setVolume(p)}
              >
                <Text style={[S.volPresetTxt, Math.abs(volume - p) < 0.05 && { color: Colors.tertiary }]}>
                  {p === 0 ? 'Mute' : `${Math.round(p * 100)}%`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* ━━ MODAL: Selección de Jefe ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Modal visible={showBossSelect} animationType="slide" transparent>
        <View style={S.overlay}>
          <View style={S.modalBox}>
            <View style={S.modalHdr}>
              <Text style={S.modalTitle}>⚔️ 挑戦 — Seleccionar Jefe</Text>
              <TouchableOpacity
                onPress={() => setShowBossSelect(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            <Text style={S.modalSub}>Elige la deuda enemiga que quieres confrontar hoy:</Text>
            <View style={{ gap: 10 }}>
              {DEMO_BOSSES.map((b, i) => {
                const bossElemData = BOSS_ELEMENTS[b.type];
                const elemInfo     = bossElemData ? (ELEMENT_INFO as any)[bossElemData.primary] : null;
                const bossHp       = Math.min(Math.floor(b.amount / 10) + b.daysOverdue * 5, 9999);
                const isEpic       = b.type === 'credit_card';
                return (
                  <Animated.View key={i} entering={FadeInUp.delay(i * 70)}>
                    <TouchableOpacity
                      style={[S.bossCard, isEpic && { borderColor: 'rgba(255,107,53,0.5)', backgroundColor: 'rgba(255,107,53,0.08)' }]}
                      onPress={() => selectBoss(b)}
                      activeOpacity={0.75}
                    >
                      <View style={S.bossCardTop}>
                        <Text style={S.bossCardIcon}>{b.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={S.bossCardName}>{b.label}</Text>
                          <Text style={S.bossCardSub}>
                            ${b.amount.toLocaleString('es-MX')} MXN · {b.daysOverdue} días de atraso
                          </Text>
                        </View>
                        <View style={[S.diffBadge, { backgroundColor: b.diffColor + '22', borderColor: b.diffColor + '55' }]}>
                          <Text style={[S.diffTxt, { color: b.diffColor }]}>{b.difficulty}</Text>
                        </View>
                      </View>
                      <View style={S.bossCardBot}>
                        <Text style={S.bossHpTxt}>❤️ {bossHp} HP · 4 fases</Text>
                        {elemInfo && (
                          <View style={[S.elemPill, { backgroundColor: elemInfo.color + '18', borderColor: elemInfo.color + '44' }]}>
                            <Text style={[S.elemPillTxt, { color: elemInfo.color }]}>{elemInfo.emoji} {elemInfo.label}</Text>
                          </View>
                        )}
                      </View>
                      {isEpic && (
                        <View style={S.epicWarn}>
                          <Ionicons name="warning" size={11} color="#FF6B35" />
                          <Text style={S.epicWarnTxt}>Jefe Legendario — 4 fases épicas · Mecánica Bancarrota</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ━━ MODAL: Estado del Personaje ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Modal visible={showStatusModal} animationType="fade" transparent>
        <View style={S.overlay}>
          <View style={S.modalBox}>
            <View style={S.modalHdr}>
              <Text style={S.modalTitle}>ステータス · Estado</Text>
              <TouchableOpacity
                onPress={() => setShowStatus(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            <Text style={S.modalSub}>Selecciona tu Camino Financiero:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
              {JRPG_CLASSES.map((cls, i) => {
                const selected = classIndex === i;
                return (
                  <TouchableOpacity
                    key={cls.id}
                    style={[S.classCard, selected && S.classCardActive]}
                    onPress={() => setClassIndex(i)}
                    activeOpacity={0.8}
                  >
                    {selected && (
                      <View style={S.activeTag}>
                        <Text style={S.activeTagTxt}>ACTIVO</Text>
                      </View>
                    )}
                    <Image
                      source={typeof cls.sprite === 'number' ? cls.sprite : { uri: cls.sprite }}
                      style={[S.classImg, Platform.OS === 'web' && { imageRendering: 'pixelated' } as any]}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                    />
                    <Text style={S.className}>{cls.name}</Text>
                    <Text style={S.classSubtitle}>{cls.subtitle}</Text>
                    <Text style={S.classStat}>Stat: {cls.stat}</Text>
                    <View style={S.bonusBadge}>
                      <Text style={S.bonusTxt}>{cls.bonus}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={S.divider} />
            <View style={S.statsGrid}>
              {[
                { lbl: 'HP',  val: `${hp}/${hpMax}`,   color: '#EF4444' },
                { lbl: 'MP',  val: `${mana}/${manaMax}`, color: '#3B82F6' },
                { lbl: 'NIV', val: `${level}`,           color: Colors.primary },
                { lbl: 'XP',  val: `${xp}`,              color: '#F59E0B' },
              ].map(s => (
                <View key={s.lbl} style={S.statBox}>
                  <Text style={[S.statLbl, { color: s.color }]}>{s.lbl}</Text>
                  <Text style={S.statVal}>{s.val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ━━ CONTENIDO PRINCIPAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>

        {/* ── HUD del personaje ──────────────────────────────────────── */}
        <View style={S.hud}>
          <View style={S.hudAccent} />
          <View style={S.hudHdr}>
            <View>
              <Text style={S.hudName}>Lv.{level} {currentClass.name}</Text>
              <Text style={S.hudSub}>{currentClass.subtitle}</Text>
            </View>
            <View style={{ gap: 6, alignItems: 'flex-end' }}>
              <TouchableOpacity
                style={S.statusBtn}
                onPress={() => setShowStatus(true)}
                accessibilityLabel="Ver estado del personaje"
              >
                <Ionicons name="person-circle" size={14} color={Colors.primary} />
                <Text style={S.statusBtnTxt}>Estado</Text>
              </TouchableOpacity>
              <View style={S.streakBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.tertiary} />
                <Text style={S.streakTxt}>{defenseStreak}d racha</Text>
              </View>
            </View>
          </View>

          {/* Multiplicador */}
          <View style={S.mulRow}>
            <Ionicons name="flame" size={12} color="#F59E0B" />
            <Text style={S.mulTxt}>Renkei x{multiplier}</Text>
            {classElemInfo && (
              <View style={[S.elemTag, { backgroundColor: classElemInfo.color + '1A', borderColor: classElemInfo.color + '44' }]}>
                <Text style={[S.elemTagTxt, { color: classElemInfo.color }]}>{classElemInfo.emoji} {classElemInfo.label}</Text>
              </View>
            )}
          </View>

          {/* Avatar + Barras */}
          <View style={S.avatarRow}>
            <CharacterAvatar
              spriteUrl={currentClass.sprite}
              isTakingDamage={isTakingDamage}
              isAttacking={isAttacking}
            />
            <View style={S.barsCol}>
              {[
                { label: 'HP', cur: hp,   max: hpMax,   color: '#EF4444', cur2: hp },
                { label: 'MP', cur: mana, max: manaMax, color: '#3B82F6', cur2: mana },
                { label: 'XP', cur: xp - prevThresh, max: xpMax - prevThresh, color: '#F59E0B', cur2: xp },
              ].map(b => (
                <View key={b.label} style={S.barWrap}>
                  <View style={S.barHdr}>
                    <Text style={[S.barLbl, { color: b.color }]}>{b.label}</Text>
                    <Text style={S.barVal}>
                      {b.label === 'XP' ? `${b.cur2}/${xpMax}` : `${b.cur}/${b.max}`}
                    </Text>
                  </View>
                  <View style={S.barBg}>
                    <View
                      style={[S.barFill, {
                        width: `${Math.max(0, Math.min(100, (b.cur / (b.max || 1)) * 100))}%` as any,
                        backgroundColor: b.color,
                        shadowColor: b.color,
                      }]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Botón de Combate ───────────────────────────────────────── */}
        <TouchableOpacity
          style={S.combatBtn}
          onPress={() => setShowBossSelect(true)}
          activeOpacity={0.8}
          accessibilityLabel="Iniciar combate"
          accessibilityRole="button"
        >
          <View style={S.combatBtnGlow} />
          <Text style={S.combatBtnIcon}>⚔️</Text>
          <View style={{ flex: 1 }}>
            <Text style={S.combatBtnTitle}>¡A Combatir!</Text>
            <Text style={S.combatBtnSub}>Enfrenta tus deudas · Elige cartas · 4 fases</Text>
          </View>
          <View style={S.combatBtnRight}>
            {classElemInfo && (
              <View style={[S.elemBadge, { backgroundColor: classElemInfo.color + '25' }]}>
                <Text style={{ fontSize: 16 }}>{classElemInfo.emoji}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <View style={S.tabs}>
          {[
            { key: 'HABITOS', label: '習慣 Hábitos' },
            { key: 'DAILIES', label: '日課 Dailies'  },
            { key: 'GRUPO',   label: '仲間 Grupo'    },
          ].map(t => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[S.tab, active && S.tabActive]}
                onPress={() => setActiveTab(t.key as any)}
                activeOpacity={0.7}
              >
                <Text style={[S.tabTxt, active && S.tabTxtActive]}>{t.label}</Text>
                {active && <View style={S.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Lista ─────────────────────────────────────────────────── */}
        <View style={S.list}>

          {/* Hábitos */}
          {activeTab === 'HABITOS' && habits.map((h, i) => (
            <Animated.View entering={FadeInUp.delay(i * 70)} key={h.id}>
              <View style={S.card}>
                <View style={[S.cardAccent, { backgroundColor: h.type === 'positive' ? '#10B981' : '#EF4444' }]} />
                <View style={S.cardBody}>
                  <Text style={S.cardIcon}>{h.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.cardTitle}>{h.title}</Text>
                    <Text style={[S.cardSub, { color: h.type === 'positive' ? '#10B981' : '#EF4444' }]}>
                      {h.type === 'positive' ? `+${h.xp} EXP` : `-${h.hpPenalty} HP`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[S.cardActionBtn, { borderColor: h.type === 'positive' ? '#10B98155' : '#EF444455' }]}
                  onPress={() => h.type === 'positive' ? gainXp(h.xp) : takeDamage(h.hpPenalty!)}
                  activeOpacity={0.75}
                  accessibilityLabel={h.type === 'positive' ? 'Marcar hábito como hecho' : 'Aplicar penalización'}
                >
                  <Ionicons
                    name={h.type === 'positive' ? 'checkmark' : 'remove'}
                    size={18}
                    color={h.type === 'positive' ? '#10B981' : '#EF4444'}
                  />
                  <Text style={[S.cardActionTxt, { color: h.type === 'positive' ? '#10B981' : '#EF4444' }]}>
                    {h.type === 'positive' ? '¡Hecho!' : 'Castigar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}

          {/* Dailies */}
          {activeTab === 'DAILIES' && dailies.map((d, i) => (
            <Animated.View entering={FadeInUp.delay(i * 70)} key={d.id}>
              <View style={[S.card, d.completed && S.cardDone]}>
                <View style={[S.cardAccent, { backgroundColor: d.completed ? '#10B981' : '#F59E0B' }]} />
                <View style={S.cardBody}>
                  <Text style={S.cardIcon}>{d.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.cardTitle, d.completed && S.cardTitleDone]}>{d.title}</Text>
                    <Text style={[S.cardSub, { color: '#F59E0B' }]}>+{d.xp} XP · -{d.hpPenalty} HP si fallas</Text>
                  </View>
                </View>
                {!d.completed ? (
                  <TouchableOpacity
                    style={S.checkBtn}
                    onPress={() => {
                      setDailies(ds => ds.map(x => x.id === d.id ? { ...x, completed: true } : x));
                      gainXp(d.xp);
                    }}
                    activeOpacity={0.8}
                    accessibilityLabel="Marcar daily como completado"
                  >
                    <Ionicons name="checkmark" size={16} color="#000" />
                  </TouchableOpacity>
                ) : (
                  <View style={S.doneIcon}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                )}
              </View>
            </Animated.View>
          ))}

          {/* Grupo */}
          {activeTab === 'GRUPO' && (
            <Animated.View entering={FadeInUp}>
              <View style={S.partyHeader}>
                <Ionicons name="people" size={16} color={Colors.tertiary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={S.partyTitle}>Guild: 赤い竜 — Dragón Rojo</Text>
                  <Text style={S.partySub}>Si alguien falla, todos pierden HP. ¡Cooperen!</Text>
                </View>
              </View>

              {[
                { name: 'Yamato', cls: 'Samurai',    hp: 180, hpMax: 200 },
                { name: 'Sakura', cls: 'Mahōtsukai', hp: 18,  hpMax: 80  },
                { name: 'Riku',   cls: 'Shinobi',    hp: 130, hpMax: 140 },
              ].map((m, i) => {
                const isLow = m.hp < m.hpMax * 0.3;
                const pct   = (m.hp / m.hpMax) * 100;
                return (
                  <View key={i} style={S.partyCard}>
                    <View style={[S.partyAvatar, { backgroundColor: isLow ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)' }]}>
                      <Ionicons name="person" size={18} color={isLow ? '#EF4444' : '#10B981'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={S.partyNameRow}>
                        <Text style={S.partyName}>{m.name}</Text>
                        <Text style={S.partyCls}>{m.cls}</Text>
                        <Text style={[S.partyHpTxt, isLow && { color: '#EF4444' }]}>{m.hp}/{m.hpMax}</Text>
                      </View>
                      <View style={S.partyBarBg}>
                        <View style={[S.partyBarFill, {
                          width: `${pct}%` as any,
                          backgroundColor: isLow ? '#EF4444' : '#10B981',
                        }]} />
                      </View>
                      {isLow && <Text style={S.partyLowWarn}>⚠️ HP crítico — necesita curación</Text>}
                    </View>
                    {isLow && (
                      <TouchableOpacity style={S.healBtn} accessibilityLabel={`Curar a ${m.name}`}>
                        <Text style={S.healBtnTxt}>CURAR</Text>
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

// ─── ESTILOS ─────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  scroll:     { paddingHorizontal: 14, paddingBottom: 60 },

  // ── Barra de música ──────────────────────────────────────────────────
  musicBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 14, marginTop: 6, marginBottom: 4,
    backgroundColor: 'rgba(0,212,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.12)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  musicLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  musicText:   { flex: 1 },
  musicTrack:  { color: '#FFF', fontSize: 12, fontWeight: '700' },
  musicStatus: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 },

  // ── Botón de volumen ─────────────────────────────────────────────────
  volBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  volBtnTxt: { color: Colors.tertiary, fontSize: 11, fontWeight: '800', minWidth: 28 },

  // ── Panel de volumen ─────────────────────────────────────────────────
  volPanel: {
    marginHorizontal: 14, marginBottom: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
    borderRadius: 12, padding: 14,
  },
  volPanelLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10, textAlign: 'center' },
  volRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  volArrow: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  volTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'visible', position: 'relative' },
  volFill:  { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: Colors.tertiary, borderRadius: 3 },
  volMark:  { position: 'absolute', width: 2, height: 10, top: -2, borderRadius: 1, marginLeft: -1 },
  volPresets: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  volPreset:  { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  volPresetActive: { borderColor: Colors.tertiary, backgroundColor: 'rgba(0,212,255,0.12)' },
  volPresetTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },

  // ── Modales ──────────────────────────────────────────────────────────
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', paddingHorizontal: 14 },
  modalBox:  { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary + '88', borderRadius: 14, padding: 20, maxHeight: '90%' },
  modalHdr:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle:{ color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.4 },
  modalSub:  { color: Colors.textMuted, fontSize: 12, marginBottom: 14 },

  // ── Selección de Jefe ─────────────────────────────────────────────────
  bossCard:    { backgroundColor: 'rgba(127,29,29,0.14)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: 12, padding: 14 },
  bossCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  bossCardIcon:{ fontSize: 22 },
  bossCardName:{ color: '#FFF', fontWeight: '900', fontSize: 14 },
  bossCardSub: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  bossCardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  bossHpTxt:   { color: '#EF4444', fontSize: 11, fontWeight: '700' },
  diffBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  diffTxt:     { fontSize: 10, fontWeight: '900' },
  elemPill:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  elemPillTxt: { fontSize: 9, fontWeight: '700' },
  epicWarn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: 'rgba(255,107,53,0.08)', borderRadius: 6, padding: 7, borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)' },
  epicWarnTxt: { color: '#FF6B35', fontSize: 10, fontWeight: '700', flex: 1 },

  // ── Modal Status ──────────────────────────────────────────────────────
  classCard:      { width: 140, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, alignItems: 'center', position: 'relative' },
  classCardActive:{ borderColor: Colors.tertiary, backgroundColor: 'rgba(0,212,255,0.08)' },
  classImg:       { width: 80, height: 80, marginBottom: 8 },
  className:      { color: '#FFF', fontWeight: '900', fontSize: 14, textAlign: 'center' },
  classSubtitle:  { color: Colors.textMuted, fontSize: 11, marginBottom: 4 },
  classStat:      { color: Colors.textMuted, fontSize: 11 },
  bonusBadge:     { marginTop: 8, backgroundColor: 'rgba(249,115,22,0.1)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, width: '100%', alignItems: 'center' },
  bonusTxt:       { color: '#F97316', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  activeTag:      { position: 'absolute', top: -10, backgroundColor: Colors.tertiary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, zIndex: 1 },
  activeTagTxt:   { color: '#000', fontSize: 9, fontWeight: '900' },
  divider:        { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 14 },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox:        { width: '47%', backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statLbl:        { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statVal:        { color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 4 },

  // ── HUD ───────────────────────────────────────────────────────────────
  hud: {
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
    padding: 14, marginTop: 10, marginBottom: 12,
    overflow: 'hidden',
  },
  hudAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.primary + '44' },
  hudHdr:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  hudName:   { color: '#FFF', fontSize: 18, fontWeight: '900' },
  hudSub:    { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  statusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(77,97,252,0.12)',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(77,97,252,0.3)',
  },
  statusBtnTxt: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  streakBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,212,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)' },
  streakTxt:    { color: Colors.tertiary, fontSize: 10, fontWeight: '800' },
  mulRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  mulTxt:       { color: '#F59E0B', fontSize: 12, fontWeight: '800' },
  elemTag:      { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  elemTagTxt:   { fontSize: 10, fontWeight: '700' },
  avatarRow:    { flexDirection: 'row', alignItems: 'center' },
  barsCol:      { flex: 1, marginLeft: 14, gap: 8 },
  barWrap:      {},
  barHdr:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  barLbl:       { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  barVal:       { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  barBg:        { height: 7, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  barFill:      { height: '100%', borderRadius: 4, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4 },

  // ── Botón de combate ──────────────────────────────────────────────────
  combatBtn: {
    marginBottom: 14,
    backgroundColor: '#7F1D1D',
    borderWidth: 1.5, borderColor: '#EF4444',
    borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    overflow: 'hidden', position: 'relative',
  },
  combatBtnGlow:  { position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(239,68,68,0.12)' },
  combatBtnIcon:  { fontSize: 30 },
  combatBtnTitle: { color: '#FFF', fontWeight: '900', fontSize: 17 },
  combatBtnSub:   { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 },
  combatBtnRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  elemBadge:      { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  // ── Tabs ──────────────────────────────────────────────────────────────
  tabs: { flexDirection: 'row', marginBottom: 12, gap: 4 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8, overflow: 'hidden', position: 'relative',
  },
  tabActive:     { backgroundColor: 'rgba(77,97,252,0.1)' },
  tabTxt:        { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  tabTxtActive:  { color: '#FFF', fontWeight: '900' },
  tabIndicator:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.primary, borderRadius: 2 },

  // ── Cards ─────────────────────────────────────────────────────────────
  list:   { gap: 8 },
  card:   {
    backgroundColor: Colors.surface,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden', flexDirection: 'column',
  },
  cardDone:  { opacity: 0.5 },
  cardAccent:{ height: 3 },
  cardBody:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardIcon:  { fontSize: 22 },
  cardTitle: { color: '#FFF', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  cardTitleDone: { textDecorationLine: 'line-through', opacity: 0.6 },
  cardSub:   { fontSize: 11, fontWeight: '700' },
  cardActionBtn: {
    position: 'absolute', right: 12, top: '50%',
    marginTop: -22,
    width: 44, height: 44, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  cardActionTxt: { fontSize: 9, fontWeight: '700', marginTop: 2 },
  checkBtn: {
    position: 'absolute', right: 14, top: '50%',
    marginTop: -18,
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center', alignItems: 'center',
  },
  doneIcon: { position: 'absolute', right: 14, top: '50%', marginTop: -14 },

  // ── Party / Grupo ─────────────────────────────────────────────────────
  partyHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, padding: 14,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  partyTitle: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  partySub:   { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  partyCard:  {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, padding: 12,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  partyAvatar:  { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  partyNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  partyName:    { color: '#FFF', fontWeight: '900', fontSize: 14 },
  partyCls:     { color: Colors.textMuted, fontSize: 11 },
  partyHpTxt:   { color: Colors.textMuted, fontWeight: '700', fontSize: 12, marginLeft: 'auto' },
  partyBarBg:   { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  partyBarFill: { height: '100%', borderRadius: 3 },
  partyLowWarn: { color: '#EF4444', fontSize: 10, fontWeight: '700', marginTop: 4 },
  healBtn:      { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  healBtnTxt:   { color: '#FFF', fontWeight: '900', fontSize: 11 },
});
