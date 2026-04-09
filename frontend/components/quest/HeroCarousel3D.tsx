// components/quest/HeroCarousel3D.tsx
// Carrusel one-at-a-time: solo héroes desbloqueados
// Deslizar izquierda/derecha para navegar carta por carta

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { CHAR_SPRITES } from '../../data/classSkills';
import { Colors } from '../../constants/Colors';

const { width: SCREEN_W } = Dimensions.get('window');

const HERO_COLORS: Record<string, string> = {
  warrior: '252, 142, 142', archer: '142, 252, 157', knight: '142, 202, 252',
  mage: '204, 142, 252',  kitsune: '252, 142, 239', thief: '252, 252, 142',
  hacker: '142, 249, 252', banker: '215, 252, 142', magedark: '157, 142, 252',
  dog: '252, 208, 142', cat: '142, 252, 204', fox: '252, 157, 142',
  elf: '142, 252, 180', mermaid: '142, 240, 252', witch: '220, 142, 252',
  knigh_girl: '252, 240, 142', knigh_red: '252, 100, 100', leona: '252, 180, 100',
  maid: '252, 252, 252', santa: '100, 252, 100',
};

export const HeroCarousel3D = ({
  heroes,
  unlockedClasses,
  onSelect,
  activeHeroId,
}: {
  heroes: any[];
  unlockedClasses: string[];
  onSelect: (h: any) => void;
  activeHeroId?: string;
}) => {
  // Filtrar solo héroes desbloqueados
  const unlocked = heroes.filter(h => unlockedClasses.includes(h.id));
  const total = unlocked.length;

  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = unlocked.findIndex(h => h.id === activeHeroId);
    return idx >= 0 ? idx : 0;
  });

  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(total - 1, index));
    setCurrentIndex(clamped);
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
    })
    .onEnd((e) => {
      const threshold = SCREEN_W * 0.25;
      if (e.translationX < -threshold) {
        runOnJS(goTo)(currentIndex + 1);
      } else if (e.translationX > threshold) {
        runOnJS(goTo)(currentIndex - 1);
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
        <Text style={styles.emptyTxt}>Ningún héroe desbloqueado.</Text>
        <Text style={styles.emptySubTxt}>Visita el Códice para desbloquear clases.</Text>
      </View>
    );
  }

  const hero = unlocked[currentIndex];
  const color = HERO_COLORS[hero.id] || '200, 200, 200';
  const isActive = hero.id === activeHeroId;

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.container}>

          {/* Glow base */}
          <View style={[styles.stageGlow, { backgroundColor: `rgba(${color}, 0.07)` }]} />

          {/* Card */}
          <Animated.View
            style={[styles.card, {
              borderColor: isActive ? '#fbbf24' : `rgba(${color}, 0.4)`,
              shadowColor: `rgb(${color})`,
            }]}
          >
            {/* Holographic layer */}
            <View style={[styles.hologram, { backgroundColor: `rgba(${color}, 0.04)` }]} />

            {/* Sprite */}
            <View style={[styles.imgBg, { backgroundColor: `rgba(${color}, 0.06)` }]}>
              <Image
                source={(CHAR_SPRITES as any)[hero.id]}
                style={[
                  styles.sprite,
                  Platform.OS === 'web' && { imageRendering: 'pixelated' } as any,
                ]}
                contentFit="contain"
              />
              {isActive && (
                <View style={styles.activePulse}>
                  <Text style={styles.activePulseTxt}>ACTIVO</Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View style={[styles.infoBar, { borderTopColor: `rgba(${color}, 0.2)` }]}>
              <Text style={styles.heroName}>{hero.name.toUpperCase()}</Text>
              <Text style={styles.heroSub}>{hero.subtitle?.toUpperCase() || 'HÉROE'}</Text>
              {hero.bonus && (
                <Text style={styles.heroBonus} numberOfLines={2}>{hero.bonus}</Text>
              )}
            </View>
          </Animated.View>

          {/* Select button */}
          <TouchableOpacity
            style={[
              styles.selectBtn,
              isActive && { backgroundColor: `rgba(${color}, 0.15)`, borderColor: `rgba(${color}, 0.5)` }
            ]}
            onPress={() => onSelect(hero)}
            activeOpacity={0.8}
          >
            <Text style={[styles.selectBtnTxt, isActive && { color: '#fbbf24' }]}>
              {isActive ? '✓ Seleccionado' : 'Usar este héroe'}
            </Text>
          </TouchableOpacity>

        </View>
      </GestureDetector>

      {/* Navigation indicators */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => goTo(currentIndex - 1)} disabled={currentIndex === 0} style={styles.navArrow}>
          <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? 'rgba(255,255,255,0.2)' : '#fff'} />
        </TouchableOpacity>

        {/* Dots */}
        <View style={styles.dots}>
          {unlocked.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[
                styles.dot,
                i === currentIndex && { backgroundColor: `rgb(${HERO_COLORS[unlocked[i].id] || '200,200,200'})`, width: 20 }
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => goTo(currentIndex + 1)} disabled={currentIndex === total - 1} style={styles.navArrow}>
          <Ionicons name="chevron-forward" size={20} color={currentIndex === total - 1 ? 'rgba(255,255,255,0.2)' : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Index label */}
      <Text style={styles.indexLabel}>{currentIndex + 1} / {total}</Text>
    </GestureHandlerRootView>
  );
};

const CARD_W = SCREEN_W * 0.62;
const CARD_H = CARD_W * 1.45;

const styles = StyleSheet.create({
  root: { width: '100%', alignItems: 'center', paddingVertical: 12 },
  container: { width: '100%', alignItems: 'center', position: 'relative', height: CARD_H + 60 },

  emptyContainer: { alignItems: 'center', padding: 32 },
  emptyTxt: { color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 4 },
  emptySubTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' },

  stageGlow: {
    position: 'absolute',
    bottom: 40, width: CARD_W + 40, height: 50,
    borderRadius: 100, opacity: 0.4,
    transform: [{ scaleY: 0.5 }],
  },

  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: '#0d1224',
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  hologram: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  imgBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  sprite: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  activePulse: {
    position: 'absolute',
    top: 10, right: 10,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, zIndex: 10,
  },
  activePulseTxt: { color: '#000', fontSize: 8, fontWeight: '900' },

  infoBar: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    gap: 3,
  },
  heroName: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  heroBonus: {
    color: '#f97316',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },

  selectBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 32,
  },
  selectBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 13 },

  navRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginTop: 8,
  },
  navArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    transition: 'all 0.3s',
  } as any,

  indexLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11, fontWeight: '700',
    marginTop: 6,
  },
});
