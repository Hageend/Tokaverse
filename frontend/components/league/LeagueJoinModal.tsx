// components/league/LeagueJoinModal.tsx
// Animación de celebración al unirse a una liga

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Easing, Image, Dimensions,
} from 'react-native';
import Svg, {
  LinearGradient, Stop, Mask, Rect, G, Polygon,
  Defs,
} from 'react-native-svg';

const { width: SW } = Dimensions.get('window');

const LEAGUE_ASSETS: Record<string, any> = {
  cobre:    require('../../assets/images/coin_cobre.png'),
  plata:    require('../../assets/images/coin_plata.png'),
  oro:      require('../../assets/images/coin_oro.png'),
  estrella: require('../../assets/images/coin_estrella.png'),
};

const TIER_COLORS: Record<string, string> = {
  cobre:    '#cd7f32',
  plata:    '#c0c0c0',
  oro:      '#ffd700',
  estrella: '#818cf8',
};

interface Props {
  visible: boolean;
  leagueName: string;
  tier: 'cobre' | 'plata' | 'oro' | 'estrella';
  onClose: () => void;
}

// ── Animación de estrella ────────────────────────────────────────────────────
// Usamos 4 Animated.Value ciclando strokeDashoffset en polígonos SVG

const POINTS = [
  "64 49 66.322 58.992 71.071 56.929 69.008 61.678 79 64 69.008 66.322 71.071 71.071 66.322 69.008 64 79 61.678 69.008 56.929 71.071 58.992 66.322 49 64 58.992 61.678 56.929 56.929 61.678 58.992 64 49",
  "64 34 68.644 53.983 78.142 49.858 74.017 59.356 94 64 74.017 68.644 78.142 78.142 68.644 74.017 64 94 59.356 74.017 49.858 78.142 53.983 68.644 34 64 53.983 59.356 49.858 49.858 59.356 53.983 64 34",
  "64 19 70.966 48.975 85.213 42.787 79.025 57.034 109 64 79.025 70.966 85.213 85.213 70.966 79.025 64 109 57.034 79.025 42.787 85.213 48.975 70.966 19 64 48.975 57.034 42.787 42.787 57.034 48.975 64 19",
  "64 4 73.287 43.966 92.284 35.716 84.034 54.713 124 64 84.034 73.287 92.284 92.284 73.287 84.034 64 124 54.713 84.034 35.716 92.284 43.966 73.287 4 64 43.966 54.713 35.716 35.716 54.713 43.966 64 4",
];
const DASH_ARRAYS = ["31 93", "62 186", "93 279", "124 372"];

// Crear versión animada del Polygon de react-native-svg
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon as any);

function StarAnimation({ color }: { color: string }) {
  const DUR = 2000;

  // Los 4 offsets. stroke1/2 van 0→max, stroke3/4 van max→0 (reverse)
  const offsets = [
    useRef(new Animated.Value(0)).current,       // stroke1: 0→124
    useRef(new Animated.Value(124)).current,     // stroke2: delay=-1s → empieza a mitad
    useRef(new Animated.Value(372)).current,     // stroke3 reverse: 372→0
    useRef(new Animated.Value(248)).current,     // stroke4 reverse+delay: 248→0→248
  ];

  useEffect(() => {
    const animations = [
      Animated.loop(
        Animated.timing(offsets[0], { toValue: 124,  from: 0,   duration: DUR, easing: Easing.linear, useNativeDriver: false } as any)
      ),
      Animated.loop(
        Animated.timing(offsets[1], { toValue: 248,  duration: DUR, easing: Easing.linear, useNativeDriver: false })
      ),
      Animated.loop(
        Animated.timing(offsets[2], { toValue: 0,    duration: DUR, easing: Easing.linear, useNativeDriver: false })
      ),
      Animated.loop(
        Animated.timing(offsets[3], { toValue: 0,    duration: DUR, easing: Easing.linear, useNativeDriver: false })
      ),
    ];

    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <Svg viewBox="0 0 128 128" width={200} height={200}>
      <Defs>
        <LinearGradient id="jm-grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#000" />
          <Stop offset="100%" stopColor="#fff" />
        </LinearGradient>
        <Mask id="jm-mask">
          <Rect x={0} y={0} width={128} height={128} fill="url(#jm-grad)" />
        </Mask>
      </Defs>

      <G strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" fill="none">
        {/* Sombra fantasma (dim) */}
        <G stroke={color} opacity={0.2}>
          {POINTS.map((pts, i) => <Polygon key={`g-${i}`} points={pts} />)}
        </G>

        {/* Trazos animados azules */}
        <G stroke={color}>
          {POINTS.map((pts, i) => (
            <AnimatedPolygon
              key={`a-${i}`}
              points={pts}
              strokeDasharray={DASH_ARRAYS[i]}
              strokeDashoffset={offsets[i]}
            />
          ))}
        </G>

        {/* Trazos animados púrpura con máscara */}
        <G mask="url(#jm-mask)" stroke="hsl(283,90%,60%)">
          {POINTS.map((pts, i) => (
            <AnimatedPolygon
              key={`m-${i}`}
              points={pts}
              strokeDasharray={DASH_ARRAYS[i]}
              strokeDashoffset={offsets[i]}
            />
          ))}
        </G>
      </G>
    </Svg>
  );
}

// ── Modal Principal ───────────────────────────────────────────────────────────
export function LeagueJoinModal({ visible, leagueName, tier, onClose }: Props) {
  const scaleAnim   = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const coinScale   = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const tierColor  = TIER_COLORS[tier] ?? '#818cf8';
  const leagueImg  = LEAGUE_ASSETS[tier] ?? LEAGUE_ASSETS.cobre;

  useEffect(() => {
    if (!visible) return;

    // Reset
    scaleAnim.setValue(0.3);
    opacityAnim.setValue(0);
    coinScale.setValue(0);
    textY.setValue(20);
    textOpacity.setValue(0);

    Animated.sequence([
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(scaleAnim,  { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
        Animated.spring(coinScale,  { toValue: 1, friction: 5, tension: 80,  useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Toque fuera cierra */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* Estrella giratoria + moneda superpuesta */}
          <View style={styles.starWrap}>
            <StarAnimation color="hsl(223,90%,55%)" />
            <Animated.View style={[styles.coinOverlay, { transform: [{ scale: coinScale }] }]}>
              <View style={[styles.coinBg, { shadowColor: tierColor }]}>
                <Image source={leagueImg} style={styles.coinImg} resizeMode="contain" />
              </View>
            </Animated.View>
          </View>

          {/* Texto animado */}
          <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], alignItems: 'center' }}>
            <Text style={styles.titleSmall}>¡Te has unido a la liga!</Text>
            <Text style={[styles.leagueName, { color: tierColor }]}>
              {leagueName.toUpperCase()}
            </Text>
            <Text style={styles.subtitle}>
              Completa misiones para escalar el ranking y ganar recompensas exclusivas.
            </Text>
          </Animated.View>

          {/* Botón */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: tierColor + '22', borderColor: tierColor + '66' }]}
            onPress={onClose}
          >
            <Text style={[styles.btnText, { color: tierColor }]}>¡A jugar! →</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: SW * 0.88,
    backgroundColor: '#131625',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77,97,252,0.25)',
  },
  starWrap: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  coinOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
  coinImg: { width: 68, height: 68 },
  titleSmall: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  leagueName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 28,
  },
  btn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 44,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
