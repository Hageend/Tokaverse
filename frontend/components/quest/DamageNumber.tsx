// components/quest/DamageNumber.tsx
// TokaVerse — Floating Combat Text (FCT)
// Número de daño animado con Reanimated 3: Gravedad, Salpicadura (Spread) y Estilo Retro 8-bit

import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSequence, withSpring, Easing,
} from 'react-native-reanimated';

export type DamageKind = 'normal' | 'critical' | 'heal' | 'weakness';

interface DamageNumberProps {
  id:       string;
  amount:   number;
  kind:     DamageKind;
  x:        number;
  y:        number;
  onFinish: (id: string) => void;
}

const COLOR: Record<DamageKind, string> = {
  normal:   '#fbbf24', // Amarillo clásico
  critical: '#ef4444', // Rojo fuerte
  heal:     '#22c55e', // Verde brillante
  weakness: '#a855f7', // Morado para debilidad
};

// Retro fonts fallback
const RETRO_FONT = Platform.select({ ios: 'Courier-Bold', android: 'monospace', default: 'monospace' });

export function DamageNumber({ id, amount, kind, x, y, onFinish }: DamageNumberProps) {
  // Salpicadura aleatoria (Spread)
  const [offsetX] = useState(() => (Math.random() * 40) - 20); // Entre -20 y +20

  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity    = useSharedValue(1);
  const scale      = useSharedValue(kind === 'critical' ? 0.5 : 0.8);

  useEffect(() => {
    // 1. Squash & Stretch Popup (Aparición de impacto)
    scale.value = withSequence(
      withTiming(kind === 'critical' ? 1.6 : 1.2, { duration: 150, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(kind === 'critical' ? 1.2 : 1.0, { duration: 100 })
    );

    // 2. Gravedad: Salto hacia arriba
    translateY.value = withSequence(
      withTiming(-50, { duration: 300, easing: Easing.out(Easing.cubic) }), // Sube rápido
      withTiming(20,  { duration: 400, easing: Easing.bounce }) // Cae y rebota
    );

    // 3. Salpicadura lateral (Spread)
    translateX.value = withTiming(offsetX * 1.5, { duration: 600, easing: Easing.out(Easing.quad) });

    // 4. Desvanecimiento (Fade Out al caer)
    opacity.value = withSequence(
      withTiming(1, { duration: 400 }), // Mantiene
      withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }) // Desaparece rápido al final
    );

    const t = setTimeout(() => onFinish(id), 850);
    return () => clearTimeout(t);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const prefix = kind === 'heal' ? '+' : '';
  const label  = kind === 'critical' ? `💥 ${amount}` : `${prefix}${amount}`;

  return (
    <Animated.Text
      style={[
        styles.number,
        { color: COLOR[kind], left: x - 30, top: y - 20 },
        animStyle,
      ]}
    >
      {label}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  number: {
    position:   'absolute',
    fontFamily: RETRO_FONT,
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1,
    // Simular contorno (stroke) pixelado de 8-bits usando dropshadow superpuesto
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    zIndex: 999,
  },
});

export default DamageNumber;
