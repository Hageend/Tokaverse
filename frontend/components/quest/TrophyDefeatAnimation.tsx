import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const TrophyDefeatAnimation = ({ onFinish }: { onFinish: () => void }) => {
  const rotation = useSharedValue(0);
  const trophyRotation = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Escala inicial
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });

    // Rotación de la estrella (0 a 340 a 0)
    rotation.value = withRepeat(
      withSequence(
        withTiming(340, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Animación "grow" del trofeo (pequeña oscilación)
    trophyRotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 250 }),
        withTiming(5, { duration: 500 }),
        withTiming(0, { duration: 250 })
      ),
      -1,
      true
    );

    // Auto-finalizar después de 3.5 segundos
    const timer = setTimeout(() => {
      onFinish();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${trophyRotation.value}deg` },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View 
      entering={FadeIn.duration(500)} 
      exiting={FadeOut.duration(500)}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Estrella de 8 puntas (efecto CSS ::before + base) */}
        <Animated.View style={[styles.starContainer, starStyle]}>
          <View style={styles.starBase} />
          <View style={[styles.starBase, { transform: [{ rotate: '135deg' }] }]} />
        </Animated.View>

        {/* Trofeo SVG */}
        <Animated.View style={[styles.trophyContainer, trophyStyle]}>
          <Svg
            height={100}
            width={100}
            viewBox="0 0 100 100"
          >
            <Path
              fill="#e94822"
              d="M62.11,53.93c22.582-3.125,22.304-23.471,18.152-29.929-4.166-6.444-10.36-2.153-10.36-2.153v-4.166H30.099v4.166s-6.194-4.291-10.36,2.153c-4.152,6.458-4.43,26.804,18.152,29.929l5.236,7.777v8.249s-.944,4.597-4.833,4.986c-3.903,.389-7.791,4.028-7.791,7.374h38.997c0-3.347-3.889-6.986-7.791-7.374-3.889-.389-4.833-4.986-4.833-4.986v-8.249l5.236-7.777Zm7.388-24.818s2.833-3.097,5.111-1.347c2.292,1.75,2.292,15.86-8.999,18.138l3.889-16.791Zm-44.108-1.347c2.278-1.75,5.111,1.347,5.111,1.347l3.889,16.791c-11.291-2.278-11.291-16.388-8.999-18.138Z"
            />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  starContainer: {
    position: 'absolute',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starBase: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: '#efd510',
    borderRadius: 4,
  },
  trophyContainer: {
    position: 'absolute',
    zIndex: 10,
  },
});

export default TrophyDefeatAnimation;
