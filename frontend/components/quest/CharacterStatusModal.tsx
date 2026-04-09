// components/quest/CharacterStatusModal.tsx
// TokaVerse — Modal de Estado del Personaje — Diseño AAA (Genshin / Honkai style)

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Dimensions, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, withDelay,
  FadeIn, FadeOut, FadeInDown, runOnJS,
  SlideInDown, SlideOutDown, Easing, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CHAR_SPRITES } from '../../data/classSkills';
import { CLASS_ELEMENTS, ELEMENT_INFO } from '../../types/elements';

const { width: SW, height: SH } = Dimensions.get('window');
const SEGMENTS = 10;

// ─── Colores por héroe ────────────────────────────────────────────────────────
const HERO_ACCENT: Record<string, string> = {
  warrior:    '#ef4444',
  archer:     '#22c55e',
  knight:     '#60a5fa',
  mage:       '#c084fc',
  kitsune:    '#f472b6',
  thief:      '#fbbf24',
  hacker:     '#34d399',
  banker:     '#86efac',
  magedark:   '#a78bfa',
  dog:        '#fb923c',
  cat:        '#67e8f9',
  fox:        '#f97316',
  elf:        '#4ade80',
  mermaid:    '#38bdf8',
  witch:      '#e879f9',
  knigh_girl: '#fde68a',
  knigh_red:  '#f87171',
  leona:      '#fbbf24',
  maid:       '#f9a8d4',
  santa:      '#4ade80',
};

interface Hero {
  id: string; name: string; subtitle: string;
  stat: string; bonus: string; sprite: any;
}
interface Props {
  visible: boolean; heroes: Hero[]; unlockedClasses: string[];
  activeHeroId: string; hp: number; hpMax: number;
  mana: number; manaMax: number; level: number;
  xp: number; xpMax: number; multiplier: number; defenseStreak: number;
  onSelectHero: (hero: Hero) => void; onClose: () => void;
}

// ─── Barra segmentada (10 bloques) ───────────────────────────────────────────
const SegBar = ({ pct, color, pulse }: { pct: number; color: string; pulse?: boolean }) => {
  const pulseAnim = useSharedValue(1);
  useEffect(() => {
    if (pulse) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1,   { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ), -1, true,
      );
    } else {
      pulseAnim.value = 1;
    }
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseAnim.value }));

  const filled = Math.round(pct * SEGMENTS);
  return (
    <View style={seg.track}>
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const isOn = i < filled;
        return isOn ? (
          <Animated.View
            key={i}
            style={[seg.seg, { backgroundColor: color, shadowColor: color }, pulseStyle]}
          />
        ) : (
          <View key={i} style={[seg.seg, seg.segOff]} />
        );
      })}
    </View>
  );
};

const seg = StyleSheet.create({
  track: { flexDirection: 'row', gap: 2, height: 9 },
  seg: {
    flex: 1, borderRadius: 2,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 4, elevation: 3,
  },
  segOff: { flex: 1, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.07)' },
});

// ─── Chip animado con entrada escalonada ──────────────────────────────────────
const AnimChip = ({
  emoji, label, value, color, delay, pulse,
}: { emoji: string; label: string; value: string; color?: string; delay: number; pulse?: boolean }) => {
  const border = useSharedValue(0);
  useEffect(() => {
    if (pulse) {
      border.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0, { duration: 700 }),
        ), -1, true,
      );
    }
  }, [pulse]);
  const auraStyle = useAnimatedStyle(() => ({
    borderColor: interpolate(border.value, [0, 1], [0, 1], Extrapolation.CLAMP) > 0.5
      ? '#f59e0b88' : 'transparent',
    shadowOpacity: border.value * 0.8,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(18)}
      style={[cs.chip, pulse && cs.chipPulse, auraStyle]}
    >
      <Text style={cs.chipEmoji}>{emoji}</Text>
      <Text style={cs.chipLbl}>{label}</Text>
      <Text style={[cs.chipVal, color ? { color } : {}]}>{value}</Text>
    </Animated.View>
  );
};

// ─── Shimmer en badge ACTIVO ──────────────────────────────────────────────────
const ShimmerBadge = ({ accent }: { accent: string }) => {
  const shimX = useSharedValue(-40);
  useEffect(() => {
    const loop = () => {
      shimX.value = -40;
      shimX.value = withDelay(3000, withTiming(80, { duration: 700, easing: Easing.out(Easing.quad) }, () => {
        runOnJS(loop)();
      }));
    };
    loop();
  }, []);
  const shimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimX.value }],
  }));
  return (
    <View style={[cs.activeBadge, { backgroundColor: accent, overflow: 'hidden' }]}>
      <Text style={cs.activeBadgeTxt}>ACTIVO</Text>
      <Animated.View style={[cs.shimmer, shimStyle]} />
    </View>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export const CharacterStatusModal = ({
  visible, heroes, unlockedClasses, activeHeroId,
  hp, hpMax, mana, manaMax, level, xp, xpMax,
  multiplier, defenseStreak,
  onSelectHero, onClose,
}: Props) => {
  const unlocked = heroes.filter(h => unlockedClasses.includes(h.id));
  const initIdx  = Math.max(0, unlocked.findIndex(h => h.id === activeHeroId));
  const [idx, setIdx]           = useState(initIdx);
  const [heroName, setHeroName] = useState('');
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const swipeShownRef = useRef(false);

  useEffect(() => {
    if (visible) {
      const i = Math.max(0, unlocked.findIndex(h => h.id === activeHeroId));
      setIdx(i);
      // Swipe hint — solo una vez si hay más de 1
      if (!swipeShownRef.current && unlocked.length > 1) {
        swipeShownRef.current = true;
        setShowSwipeHint(true);
        setTimeout(() => setShowSwipeHint(false), 2500);
      }
    }
  }, [visible, activeHeroId]);

  useEffect(() => {
    if (unlocked[idx]) setHeroName(unlocked[idx].name);
  }, [idx]);

  const hero    = unlocked[idx] ?? unlocked[0];
  const accent  = hero ? (HERO_ACCENT[hero.id] ?? '#818cf8') : '#818cf8';
  const elemInfo = hero ? (ELEMENT_INFO as any)[(CLASS_ELEMENTS[hero.id]?.primary ?? 'light')] : null;

  // ── Animated values ────────────────────────────────────────────────────────
  const tx         = useSharedValue(0);
  const startX     = useSharedValue(0);
  const cardScale  = useSharedValue(1);
  const flashOp    = useSharedValue(0);
  const navDir     = useRef(0);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(unlocked.length - 1, next));
    flashOp.value = withSequence(
      withTiming(0.35, { duration: 100 }),
      withTiming(0,    { duration: 250 }),
    );
    tx.value        = withSpring(0, { damping: 20 });
    cardScale.value = withSpring(1, { damping: 14 });
    setIdx(clamped);
  };

  const navigate = (dir: number) => {
    setIdx(prev => {
      const next = Math.max(0, Math.min(unlocked.length - 1, prev + dir));
      flashOp.value = withSequence(
        withTiming(0.35, { duration: 100 }),
        withTiming(0,    { duration: 250 }),
      );
      tx.value        = withSpring(0, { damping: 20 });
      cardScale.value = withSpring(1, { damping: 14 });
      return next;
    });
  };

  const pan = Gesture.Pan()
    .minDistance(10)
    .onBegin(() => { startX.value = tx.value; })
    .onUpdate(e => { tx.value = startX.value + e.translationX * 0.35; })
    .onEnd(e => {
      if (e.translationX < -50) runOnJS(navigate)(1);
      else if (e.translationX > 50) runOnJS(navigate)(-1);
      else {
        tx.value = withSpring(0);
        cardScale.value = withSpring(1);
      }
    });

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { scale: cardScale.value }],
  }));
  const flashAnim = useAnimatedStyle(() => ({
    opacity: flashOp.value,
    backgroundColor: accent,
  }));

  if (!visible) return null;

  const hpPct  = Math.min(1, hp   / Math.max(1, hpMax));
  const mpPct  = Math.min(1, mana / Math.max(1, manaMax));
  const xpPct  = Math.min(1, xp   / Math.max(1, xpMax));
  const lowHp  = hpPct < 0.3;
  const nearLvl = xpPct > 0.9;

  return (
    <Modal visible={visible} transparent animationType="none">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={cs.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <Animated.View
          entering={SlideInDown.springify().damping(22)}
          exiting={SlideOutDown.duration(200)}
          style={cs.sheet}
        >
          {/* ── Radial glow de fondo del héroe ──────────────────────────── */}
          <View style={[cs.radialGlow, { backgroundColor: accent + '12' }]} pointerEvents="none" />

          {/* ── Handle con elemento del héroe ───────────────────────────── */}
          <View style={cs.handleRow}>
            <View style={[cs.handleLine, { backgroundColor: accent + '44' }]} />
            <View style={[cs.handlePill, { borderColor: accent + '55' }]}>
              <Text style={cs.handleEmoji}>{elemInfo?.emoji ?? '✦'}</Text>
            </View>
            <View style={[cs.handleLine, { backgroundColor: accent + '44' }]} />
          </View>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <View style={cs.header}>
            <View>
              <Text style={cs.headerTitle}>Estado del Personaje</Text>
              <Text style={cs.headerSub}>{unlocked.length} clases desbloqueadas</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close-circle" size={30} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          </View>

          {/* ── Hero Card ────────────────────────────────────────────────── */}
          <GestureDetector gesture={pan}>
            <View style={cs.cardZone}>
              {hero && (
                <Animated.View
                  style={[
                    cs.heroCard,
                    { borderColor: accent + '60', shadowColor: accent },
                    cardAnim,
                  ]}
                >
                  {/* Tinted glow bg */}
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: accent + '08' }]} />

                  {/* Flash overlay on navigate */}
                  <Animated.View style={[StyleSheet.absoluteFill, flashAnim]} pointerEvents="none" />

                  {/* Left: Sprite */}
                  <View style={[cs.spriteCol, { borderRightColor: accent + '22' }]}>
                    <Image
                      source={(CHAR_SPRITES as any)[hero.id]}
                      style={[cs.sprite, Platform.OS === 'web' && { imageRendering: 'pixelated' } as any]}
                      contentFit="contain"
                    />
                    {/* Active badge con shimmer */}
                    {hero.id === activeHeroId
                      ? <ShimmerBadge accent={accent} />
                      : null
                    }
                  </View>

                  {/* Right: Info */}
                  <View style={cs.infoCol}>
                    {elemInfo && (
                      <View style={[cs.elemTag, { backgroundColor: elemInfo.color + '1a', borderColor: elemInfo.color + '44' }]}>
                        <Text style={[cs.elemTagTxt, { color: elemInfo.color }]}>{elemInfo.emoji} {elemInfo.label}</Text>
                      </View>
                    )}
                    <Text style={[cs.heroName, { color: accent }]}>{hero.name}</Text>
                    <Text style={cs.heroSubtitle}>{hero.subtitle}</Text>

                    <View style={cs.statTypeRow}>
                      <MaterialCommunityIcons name="star-four-points" size={10} color={accent} />
                      <Text style={[cs.statType, { color: accent + 'cc' }]}>{hero.stat}</Text>
                    </View>

                    <View style={[cs.bonusBox, { borderLeftColor: accent }]}>
                      <Text style={cs.bonusTxt}>{hero.bonus}</Text>
                    </View>

                    {unlocked[idx]?.id !== activeHeroId ? (
                      <TouchableOpacity
                        style={[cs.selectBtn, { borderColor: accent + '55', backgroundColor: accent + '15' }]}
                        onPress={() => onSelectHero(unlocked[idx])}
                        activeOpacity={0.7}
                      >
                        <Text style={[cs.selectBtnTxt, { color: accent }]}>Seleccionar</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={cs.selectedLabel}>
                        <Ionicons name="checkmark-circle" size={12} color={accent} />
                        <Text style={[cs.selectedLabelTxt, { color: accent }]}>Seleccionado</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              )}

              {/* ── Swipe hint ─────────────────────────────────────────── */}
              {showSwipeHint && (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(400)}
                  style={cs.swipeHint}
                >
                  <Text style={cs.swipeHintTxt}>← Desliza para explorar →</Text>
                </Animated.View>
              )}
            </View>
          </GestureDetector>

          {/* ── Navigation bar ───────────────────────────────────────── */}
          <View style={cs.navRow}>
            <TouchableOpacity onPress={() => navigate(-1)} disabled={idx === 0} style={cs.navArrow}>
              <Ionicons name="chevron-back" size={18} color={idx === 0 ? 'rgba(255,255,255,0.2)' : '#fff'} />
            </TouchableOpacity>

            <View style={cs.dotsCol}>
              <View style={cs.dots}>
                {unlocked.map((h, i) => {
                  const a = HERO_ACCENT[h.id] ?? '#818cf8';
                  const active = i === idx;
                  return (
                    <TouchableOpacity key={h.id} onPress={() => goTo(i)}>
                      <View style={[
                        cs.dot,
                        active && {
                          backgroundColor: a,
                          width: 18,
                          borderRadius: 4,
                          shadowColor: a,
                          shadowOpacity: 0.9,
                          shadowRadius: 6,
                          elevation: 4,
                        },
                      ]} />
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* Hero name label — Wrapped in View to avoid opacity warning */}
              <Animated.View
                key={hero?.id}
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
              >
                <Animated.Text style={[cs.heroNameLabel, { color: accent }]}>
                  {hero?.name ?? ''}
                </Animated.Text>
              </Animated.View>
            </View>

            <TouchableOpacity onPress={() => navigate(1)} disabled={idx === unlocked.length - 1} style={cs.navArrow}>
              <Ionicons name="chevron-forward" size={18} color={idx === unlocked.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff'} />
            </TouchableOpacity>

            <Text style={cs.indexTxt}>{idx + 1}/{unlocked.length}</Text>
          </View>

          {/* ── Divider dorado ────────────────────────────────────────────── */}
          <View style={cs.dividerRow}>
            <View style={cs.divLine} />
            <Text style={[cs.divDot, { color: accent }]}>◆</Text>
            <View style={cs.divLine} />
          </View>

          {/* ── Stats ─────────────────────────────────────────────────────── */}
          <View style={cs.statsSection}>
            <Text style={cs.statsSectionTitle}>📊 ESTADÍSTICAS</Text>

            {/* HP — rojo, pulso si < 30% */}
            <View style={cs.barRow}>
              <View style={cs.barMeta}>
                <Text style={[cs.barLbl, { color: '#ef4444' }]}>{lowHp ? '⚠️' : '❤️'} HP</Text>
                <Text style={cs.barVal}>{hp} / {hpMax}</Text>
              </View>
              <SegBar pct={hpPct} color="#ef4444" pulse={lowHp} />
            </View>

            {/* MP — azul */}
            <View style={cs.barRow}>
              <View style={cs.barMeta}>
                <Text style={[cs.barLbl, { color: '#3b82f6' }]}>💧 MP</Text>
                <Text style={cs.barVal}>{mana} / {manaMax}</Text>
              </View>
              <SegBar pct={mpPct} color="#3b82f6" />
            </View>

            {/* XP — dorado, partículas si >90% */}
            <View style={cs.barRow}>
              <View style={cs.barMeta}>
                <Text style={[cs.barLbl, { color: '#f59e0b' }]}>{nearLvl ? '✨' : '⭐'} XP</Text>
                <Text style={cs.barVal}>{xp.toLocaleString()} / {xpMax.toLocaleString()}</Text>
              </View>
              <SegBar pct={xpPct} color="#f59e0b" />
              {nearLvl && (
                <Text style={cs.nearLvlHint}>¡Casi subes de nivel! 🎉</Text>
              )}
            </View>

            {/* Chips con entrada escalonada */}
            <View style={cs.chipRow}>
              <AnimChip emoji="🏅" label="NIVEL"    value={`${level}`}                       delay={0}   />
              <AnimChip emoji="🔥" label="RENKEI"   value={`x${multiplier}`}  color="#f59e0b" delay={80}  pulse={multiplier > 1.5} />
              <AnimChip
                emoji={defenseStreak >= 7 ? '🔥' : '🛡️'}
                label="RACHA"
                value={`${defenseStreak}d`}
                color="#22c55e"
                delay={160}
              />
              <AnimChip emoji="✨" label="BONUS XP" value={`+${Math.round(multiplier * 100 - 100)}%`} color="#a78bfa" delay={240} />
            </View>
          </View>

        </Animated.View>
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const SHEET_MAX = Math.min(SH * 0.88, 680);

const cs = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(2,6,23,0.9)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%', maxHeight: SHEET_MAX,
    backgroundColor: '#0b1120',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20, paddingBottom: 36,
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 40, elevation: 20,
    overflow: 'hidden',
  },
  radialGlow: {
    position: 'absolute', top: -60, left: SW * 0.1,
    width: SW * 0.8, height: 260, borderRadius: 130,
  },

  // ── Handle ─────────────────────────────────────────────────────────
  handleRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 12, marginBottom: 14, gap: 8,
  },
  handleLine: { flex: 1, height: 1 },
  handlePill: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  handleEmoji: { fontSize: 12 },

  // ── Header ─────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  headerSub:   { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },

  // ── Card ───────────────────────────────────────────────────────────
  cardZone: { width: '100%', alignItems: 'center' },
  heroCard: {
    width: '100%', flexDirection: 'row',
    backgroundColor: '#0d1629',
    borderRadius: 20, borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20,
    elevation: 10, minHeight: 155,
  },
  spriteCol: {
    width: 108, justifyContent: 'center', alignItems: 'center',
    padding: 10, borderRightWidth: 1,
  },
  sprite: { width: 88, height: 108 },
  activeBadge: {
    position: 'absolute', bottom: 6, alignSelf: 'center',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
  },
  activeBadgeTxt: { color: '#000', fontSize: 7, fontWeight: '900' },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: 30,
    backgroundColor: 'rgba(255,255,255,0.5)',
    transform: [{ skewX: '-20deg' }],
  },
  infoCol: { flex: 1, padding: 14, justifyContent: 'center', gap: 5 },
  elemTag: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, borderWidth: 1, marginBottom: 2,
  },
  elemTagTxt: { fontSize: 9, fontWeight: '900' },
  heroName:     { fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  heroSubtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700', marginTop: -3 },
  statTypeRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  statType:     { fontSize: 10, fontWeight: '800' },
  bonusBox: {
    borderLeftWidth: 3, paddingLeft: 8, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4,
  },
  bonusTxt: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', lineHeight: 14 },
  selectBtn: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1.5, marginTop: 4,
  },
  selectBtnTxt:  { fontSize: 11, fontWeight: '900' },
  selectedLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  selectedLabelTxt: { fontSize: 10, fontWeight: '900' },

  // ── Swipe hint ─────────────────────────────────────────────────────
  swipeHint: {
    marginTop: 6,
    paddingVertical: 4, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
  },
  swipeHintTxt: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '700' },

  // ── Nav ────────────────────────────────────────────────────────────
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginTop: 10, marginBottom: 2,
  },
  navArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  dotsCol: { flex: 1, alignItems: 'center', gap: 4 },
  dots: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', justifyContent: 'center' },
  dot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroNameLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, opacity: 0.85 },
  indexTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  // ── Divider ────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, marginBottom: 12,
  },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  divDot: { fontSize: 10 },

  // ── Stats ──────────────────────────────────────────────────────────
  statsSection: { gap: 9 },
  statsSectionTitle: {
    color: 'rgba(255,255,255,0.45)', fontSize: 10,
    fontWeight: '900', letterSpacing: 2, marginBottom: 2,
  },
  barRow:  { gap: 4 },
  barMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLbl:  { fontSize: 11, fontWeight: '900' },
  barVal:  { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  nearLvlHint: {
    color: '#f59e0b', fontSize: 9, fontWeight: '900',
    letterSpacing: 1, marginTop: 2, textAlign: 'right',
  },

  // ── Chips ──────────────────────────────────────────────────────────
  chipRow: { flexDirection: 'row', gap: 7, marginTop: 4, flexWrap: 'wrap' },
  chip: {
    flex: 1, minWidth: 68,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 10, alignItems: 'center', gap: 3,
    shadowColor: '#f59e0b',
  },
  chipPulse: {
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, elevation: 4,
  },
  chipEmoji: { fontSize: 18 },
  chipLbl:   { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  chipVal:   { color: '#fff', fontSize: 15, fontWeight: '900' },
});
