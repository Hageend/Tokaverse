import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const EYE_COLORS = ['rgb(46, 0, 129)', 'rgb(83, 152, 255)'];

const EyeLayer = ({ depth }: { depth: number }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Replicamos el pseudo-elemento ":before" con un overlay absoluto
  // y anidamos el siguiente EyeLayer
  return (
    <Animated.View style={[styles.eyeBase, animatedStyle]}>
      {/* Equivalente a .eye:before */}
      <View style={styles.eyeBefore} />
      
      <View style={styles.eyeContent}>
        {depth > 0 && <EyeLayer depth={depth - 1} />}
      </View>
    </Animated.View>
  );
};

export const PurchaseEye = () => {
  return (
    <View style={styles.container}>
      <View style={styles.wrap}>
        {/* En el CSS original había 8 div anidados. Aquí pasamos depth=7. */}
        <EyeLayer depth={7} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  wrap: {
    transform: [{ rotate: '45deg' }],
  },
  eyeBase: {
    width: '100%',
    height: '100%',
    // margin: 4em auto en web era sobre el outmost, pero aquí width/height relativo.
    // El outermost tiene 260px. Si es depth 7, el outermost lo forzamos.
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: EYE_COLORS[0],
    borderTopLeftRadius: 300,
    borderBottomRightRadius: 300,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 15,
  },
  eyeBefore: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: EYE_COLORS[1],
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopRightRadius: 300,
    borderBottomLeftRadius: 300,
  },
  eyeContent: {
    width: '100%',
    height: '100%',
    margin: 0,
    // Para que los hijos se adapten al padding resuelto del padre
  },
});

// El primer EyeLayer (outmost) necesita tener tamaño fijo como el original
export const AnimatedPurchaseEye = () => {
    return (
        <View style={styles.container}>
            <View style={styles.wrap}>
                <View style={{ width: 260, height: 260 }}>
                    <EyeLayer depth={7} />
                </View>
            </View>
        </View>
    );
};
