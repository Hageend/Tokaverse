import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Un componente para cada trazo de energía para manejar sus props animadas
const TracePath = ({ d, stroke, color }: { d: string; stroke: string; color: string }) => {
  const dashOffset = useSharedValue(438);

  useEffect(() => {
    dashOffset.value = withRepeat(
      withTiming(0, { duration: 3000, easing: Easing.bezier(0.5, 0, 0.9, 1) }),
      -1,
      false
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  return (
    <>
      {/* Background del trazo */}
      <Path d={d} stroke="#333" strokeWidth={1.8} fill="none" />
      {/* Flujo de energía animado */}
      <AnimatedPath
        d={d}
        stroke={stroke}
        strokeWidth={1.8}
        fill="none"
        strokeDasharray="40 400"
        animatedProps={animatedProps}
      />
    </>
  );
};

interface CircuitLoaderProps {
  spriteUrl?: any;
  evolutionText?: string;
}

export const CircuitLoader = ({ spriteUrl, evolutionText = "Evolucionando" }: CircuitLoaderProps) => {
  const traces = [
    { d: "M100 100 H200 V210 H326", type: "purple", color: "#9900ff" },
    { d: "M80 180 H180 V230 H326", type: "blue", color: "#00ccff" },
    { d: "M60 260 H150 V250 H326", type: "yellow", color: "#ffea00" },
    { d: "M100 350 H200 V270 H326", type: "green", color: "#00ff15" },
    { d: "M700 90 H560 V210 H474", type: "blue", color: "#00ccff" },
    { d: "M740 160 H580 V230 H474", type: "green", color: "#00ff15" },
    { d: "M720 250 H590 V250 H474", type: "red", color: "#ff3300" },
    { d: "M680 340 H570 V270 H474", type: "yellow", color: "#ffea00" },
  ];

  return (
    <View style={styles.container}>
      <Svg viewBox="0 0 800 500" width="100%" height="100%" style={styles.svg}>
        <Defs>
          <LinearGradient id="chipGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#2d2d2d" />
            <Stop offset="100%" stopColor="#0f0f0f" />
          </LinearGradient>
          <LinearGradient id="textGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#eeeeee" />
            <Stop offset="100%" stopColor="#888888" />
          </LinearGradient>
          <LinearGradient id="pinGradient" x1="1" y1="0" x2="0" y2="0">
            <Stop offset="0%" stopColor="#bbbbbb" />
            <Stop offset="50%" stopColor="#888888" />
            <Stop offset="100%" stopColor="#555555" />
          </LinearGradient>
        </Defs>

        <G id="traces">
          {traces.map((trace, index) => (
            <TracePath key={index} d={trace.d} stroke={trace.color} color={trace.color} />
          ))}
        </G>

        {/* Chip central */}
        <Rect
          x={330} y={190}
          width={140} height={100}
          rx={20} ry={20}
          fill="url(#chipGradient)"
          stroke="#222" strokeWidth={3}
        />

        {/* Pines izquierdos */}
        <G>
          <Rect x={322} y={205} width={8} height={10} fill="url(#pinGradient)" rx={2} />
          <Rect x={322} y={225} width={8} height={10} fill="url(#pinGradient)" rx={2} />
          <Rect x={322} y={245} width={8} height={10} fill="url(#pinGradient)" rx={2} />
          <Rect x={322} y={265} width={8} height={10} fill="url(#pinGradient)" rx={2} />
        </G>
        {/* Pines derechos */}
        <G>
          <Rect x={470} y={205} width={8} height={10} fill="url(#pinGradient)" rx={2} />
          <Rect x={470} y={225} width={8} height={10} fill="url(#pinGradient)" rx={2} />
          <Rect x={470} y={245} width={8} height={10} fill="url(#pinGradient)" rx={2} />
          <Rect x={470} y={265} width={8} height={10} fill="url(#pinGradient)" rx={2} />
        </G>

        {/* Nodos de los bordes */}
        <Circle cx={100} cy={100} r={5} fill="black" />
        <Circle cx={80}  cy={180} r={5} fill="black" />
        <Circle cx={60}  cy={260} r={5} fill="black" />
        <Circle cx={100} cy={350} r={5} fill="black" />
        <Circle cx={700} cy={90} r={5} fill="black" />
        <Circle cx={740} cy={160} r={5} fill="black" />
        <Circle cx={720} cy={250} r={5} fill="black" />
        <Circle cx={680} cy={340} r={5} fill="black" />
      </Svg>

      <View style={styles.centerContainer} pointerEvents="none">
        {spriteUrl && (
          <Image 
            source={spriteUrl} 
            contentFit="contain" 
            style={{ width: 80, height: 80, zIndex: 10, marginTop: -30 }} 
          />
        )}
        <Text style={styles.loaderText}>{evolutionText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 800 / 500, // Misma proporción que el viewBox del SVG original
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#eeeeee',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 2,
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  }
});
