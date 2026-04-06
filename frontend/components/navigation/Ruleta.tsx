import { Easing } from 'react-native-reanimated';
import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";

const SIZE = 260;
const RADIUS = SIZE / 2;

const premios = [
    "15%",
    "10%",
    "50",
    "100",
    "200",
    "300",
];

interface Props {
    onResult: (premio: string) => void;
}

export default function Ruleta({ onResult }: Props) {
    const rotation = useSharedValue(0);
    const [premioSeleccionado, setPremioSeleccionado] = useState("");

    const girar = () => {
        const index = Math.floor(Math.random() * premios.length);
        const premio = premios[index];
        setPremioSeleccionado(premio); // Guardar el premio seleccionado

        const gradosPorSeccion = 360 / premios.length;
        const anguloCentro = index * gradosPorSeccion + gradosPorSeccion / 2;
        const vueltas = 360 * 8;
        const destino = vueltas + (270 - anguloCentro);

        rotation.value = withTiming(rotation.value + destino, {
            duration: 4000,
            easing: Easing.out(Easing.cubic),
        });

        // Llama onResult después de un timeout para esperar a que termine la animación
        setTimeout(() => {
            onResult(premio);
        }, 4000); // Asegúrate de que coincida con la duración de la animación
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const angle = (2 * Math.PI) / premios.length;

    const createSlice = (i: number) => {
        const start = i * angle;
        const end = start + angle;

        const x1 = RADIUS + RADIUS * Math.cos(start);
        const y1 = RADIUS + RADIUS * Math.sin(start);
        const x2 = RADIUS + RADIUS * Math.cos(end);
        const y2 = RADIUS + RADIUS * Math.sin(end);

        return `
      M ${RADIUS} ${RADIUS}
      L ${x1} ${y1}
      A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}
      Z
    `;
    };

    return (
        <View style={styles.container}>
            <View style={styles.pointer} />

            <Animated.View style={animatedStyle}>
                <Svg width={SIZE} height={SIZE}>
                    <G>
                        {premios.map((_, i) => (
                            <Path
                                key={i}
                                d={createSlice(i)}
                                fill={i % 2 === 0 ? "#4D61FC" : "#6C63FF"}
                            />
                        ))}

                        {premios.map((p, i) => {
                            const a = i * angle + angle / 2;
                            const x = RADIUS + (RADIUS / 1.6) * Math.cos(a);
                            const y = RADIUS + (RADIUS / 1.6) * Math.sin(a);
                            return (
                                <SvgText
                                    key={i}
                                    x={x}
                                    y={y}
                                    fill="white"
                                    fontSize="12"
                                    textAnchor="middle"
                                >
                                    {p}
                                </SvgText>
                            );
                        })}
                    </G>
                </Svg>
            </Animated.View>

            <Pressable style={styles.boton} onPress={girar} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    pointer: {
        width: 0,
        height: 0,
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderBottomWidth: 20,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "white",
        marginBottom: -10,
        zIndex: 10,
    },
    boton: {
        position: "absolute",
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#1E2A5A",
    },
});