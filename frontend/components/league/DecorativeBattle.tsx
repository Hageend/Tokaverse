import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  Easing
} from 'react-native-reanimated';

const BATTLE_ASSETS: Record<string, any> = {
  red: require('../../assets/TinySwords/Tiny Swords (Free Pack)/Units/Red Units/Warrior/Warrior_Attack1.png'),
  blue: require('../../assets/TinySwords/Tiny Swords (Free Pack)/Units/Blue Units/Warrior/Warrior_Attack1.png'),
  yellow: require('../../assets/TinySwords/Tiny Swords (Free Pack)/Units/Yellow Units/Warrior/Warrior_Attack1.png'),
  purple: require('../../assets/TinySwords/Tiny Swords (Free Pack)/Units/Purple Units/Warrior/Warrior_Attack1.png'),
};

const FRAME_SIZE = 192;
const FRAME_COUNT = 6;
const SCALE = 0.35; // Tamaño para el mapa
const DISPLAY_SIZE = FRAME_SIZE * SCALE;

interface Props {
  factionA: 'red' | 'blue' | 'yellow' | 'purple';
  factionB: 'red' | 'blue' | 'yellow' | 'purple';
  x: string | number;
  y: string | number;
  getCoord: (val: string | number, max: number) => number;
  maxWidth: number;
  maxHeight: number;
}

const AnimatedWarrior = ({ faction, isFacingLeft }: { faction: string, isFacingLeft: boolean }) => {
  const frameIndex = useSharedValue(0);

  useEffect(() => {
    frameIndex.value = withRepeat(
      withTiming(FRAME_COUNT - 1, { 
        duration: 800, 
        easing: Easing.linear 
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Redondear el índice para saltos discretos entre frames
    const currentFrame = Math.floor(frameIndex.value);
    return {
      transform: [
        { translateX: -(currentFrame * DISPLAY_SIZE) },
        { scaleX: isFacingLeft ? -1 : 1 },
      ],
    };
  });

  return (
    <View style={S.warriorContainer}>
      <Animated.View style={[S.spritesheet, animatedStyle]}>
        <Image 
          source={BATTLE_ASSETS[faction]} 
          style={{ width: DISPLAY_SIZE * FRAME_COUNT, height: DISPLAY_SIZE }}
          contentFit="cover"
        />
      </Animated.View>
    </View>
  );
};

export const DecorativeBattle = ({ factionA, factionB, x, y, getCoord, maxWidth, maxHeight }: Props) => {
  const leftX = getCoord(x, maxWidth);
  const topY = getCoord(y, maxHeight);

  return (
    <View style={[S.battleWrapper, { left: leftX, top: topY }]}>
      {/* Guerrero A (Izquierda) */}
      <View style={{ marginRight: -15 }}>
        <AnimatedWarrior faction={factionA} isFacingLeft={false} />
      </View>
      
      {/* Guerrero B (Derecha) */}
      <View style={{ marginLeft: -15 }}>
        <AnimatedWarrior faction={factionB} isFacingLeft={true} />
      </View>
    </View>
  );
};

const S = StyleSheet.create({
  battleWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 60,
    marginLeft: -50,
    marginTop: -30,
    zIndex: 5, // Detrás de los nodos, sobre el terreno
    pointerEvents: 'none',
  },
  warriorContainer: {
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
    overflow: 'hidden',
  },
  spritesheet: {
    flexDirection: 'row',
    height: DISPLAY_SIZE,
  }
});
