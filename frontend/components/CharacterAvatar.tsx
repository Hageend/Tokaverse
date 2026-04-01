import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  withSequence,
  withSpring
} from 'react-native-reanimated';
import { Image } from 'expo-image';

interface CharacterAvatarProps {
  spriteUrl: string | number;   // string = URL, number = require('../assets/...')
  isTakingDamage?: boolean;
  isAttacking?: boolean;
}

export function CharacterAvatar({ spriteUrl, isTakingDamage, isAttacking }: CharacterAvatarProps) {
  const floatAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(1);
  const scaleAnim = useSharedValue(1);
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Animación Idle Continua
    floatAnim.value = withRepeat(
      withTiming(6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1, 
      true
    );
  }, []);

  useEffect(() => {
    // Reacciona a Daño: Parpadeo Rojo y vibración
    if (isTakingDamage) {
      opacityAnim.value = withSequence(
        withTiming(0.3, { duration: 80 }),
        withTiming(1, { duration: 80 }),
        withTiming(0.3, { duration: 80 }),
        withTiming(1, { duration: 80 }),
      );
      translateX.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [isTakingDamage]);

  useEffect(() => {
    // Reacciona a Ataque: Avance rápido frontal y regreso
    if (isAttacking) {
      scaleAnim.value = withSequence(
        withSpring(1.2, { damping: 12 }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [isAttacking]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: floatAnim.value },
        { scale: scaleAnim.value },
        { translateX: translateX.value }
      ],
      opacity: opacityAnim.value,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.shadow} />
      <Animated.View style={[styles.spriteWrapper, animatedStyles]}>
        <Image
          source={typeof spriteUrl === 'number' ? spriteUrl : { uri: spriteUrl }}
          style={[styles.sprite, Platform.OS === 'web' && { imageRendering: 'pixelated' } as any]}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  spriteWrapper: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: '100%',
    height: '100%',
  },
  shadow: {
    width: 60,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 30,
    position: 'absolute',
    bottom: -2,
    transform: [{ scaleY: 0.5 }]
  }
});

export default CharacterAvatar;
