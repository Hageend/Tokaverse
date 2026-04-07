import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Svg, { G, Path, Text as SvgText, Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing,
    useAnimatedReaction,
    runOnJS,
    withSequence,
    withRepeat,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const SIZE = 340;
const RADIUS = SIZE / 2;

const DEFAULT_GRADIENT_PAIRS = [
    ["#3B82F6", "#1D4ED8"],
    ["#8B5CF6", "#6D28D9"],
    ["#EC4899", "#BE185D"],
    ["#F59E0B", "#B45309"],
    ["#10B981", "#047857"],
    ["#6366F1", "#4338CA"],
    ["#14B8A6", "#0D9488"],
    ["#F43F5E", "#BE123C"],
];

const REWARD_EMOJIS: Record<string, string> = {
    COINS: '🪙',
    XP: '⚡',
    ITEM: '🗡️',
    CASHBACK: '💸',
};

export interface SpinReward {
    id: number;
    name: string;
    rewardType: string;
    amount: number;
    itemId: number | null;
    probabilityWeight: string;
    color: string | null;
    isActive: boolean;
}

interface Props {
    rewards: SpinReward[];
    disabled?: boolean;
    onSpin: () => Promise<{ reward: SpinReward; remainingSpins: number } | null>;
}

export default function Ruleta({ rewards, disabled, onSpin }: Props) {
    const rotation = useSharedValue(0);
    const scaleBtn = useSharedValue(1);
    const glowOpacity = useSharedValue(0.5);
    const pointerBounce = useSharedValue(0);
    const [isSpinning, setIsSpinning] = useState(false);

    // Pulsing glow behind wheel
    useEffect(() => {
        glowOpacity.value = withRepeat(
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, [glowOpacity]);

    // Pointer bounce animation
    useEffect(() => {
        pointerBounce.value = withRepeat(
            withSequence(
                withTiming(8, { duration: 600, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            false
        );
    }, [pointerBounce]);

    // Haptic tick on each slice boundary
    useAnimatedReaction(
        () => Math.floor(rotation.value / (360 / (rewards.length || 1))),
        (current, previous) => {
            if (current !== previous && previous !== null) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            }
        }
    );

    // ─── Spin logic ─────────────────────────────────────────────────
    const executeSpin = useCallback(async (initialVelocity?: number) => {
        if (isSpinning || disabled) return;
        setIsSpinning(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        const result = await onSpin();
        if (!result) {
            setIsSpinning(false);
            return;
        }

        const winnerIndex = rewards.findIndex(r => r.id === result.reward.id);
        const index = winnerIndex >= 0 ? winnerIndex : 0;

        const numSectors = rewards.length;
        const sliceAngle = 360 / numSectors;

        const sectorCenter = index * sliceAngle + sliceAngle / 2;
        const targetAngle = 270 - sectorCenter;

        const currentNormalized = ((rotation.value % 360) + 360) % 360;
        let delta = ((targetAngle - currentNormalized) % 360 + 360) % 360;

        const speed = initialVelocity ? Math.min(Math.abs(initialVelocity), 3000) : 1500;
        const extraRotations = Math.floor(6 + (speed / 3000) * 8);
        const totalDelta = delta + 360 * extraRotations;
        const duration = 4000 + extraRotations * 200;

        rotation.value = withTiming(rotation.value + totalDelta, {
            duration,
            easing: Easing.bezier(0.1, 0.85, 0.15, 1.02),
        }, (finished) => {
            if (finished) {
                runOnJS(finishSpin)();
            }
        });
    }, [isSpinning, disabled, onSpin, rewards, rotation]);

    const finishSpin = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsSpinning(false);
    };

    // ─── Pan Gesture (drag to spin) ─────────────────────────────────
    const lastAngle = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .enabled(!disabled && !isSpinning)
        .onBegin((e) => {
            const dx = e.x - RADIUS;
            const dy = e.y - RADIUS;
            lastAngle.value = Math.atan2(dy, dx) * (180 / Math.PI);
        })
        .onUpdate((e) => {
            const dx = e.x - RADIUS;
            const dy = e.y - RADIUS;
            const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            let delta = currentAngle - lastAngle.value;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            rotation.value += delta;
            lastAngle.value = currentAngle;
        })
        .onEnd((e) => {
            const velocity = Math.sqrt(e.velocityX ** 2 + e.velocityY ** 2);
            if (velocity > 300) {
                runOnJS(executeSpin)(velocity);
            }
        });

    // ─── Button spin ────────────────────────────────────────────────
    const handleButtonSpin = () => {
        scaleBtn.value = withSequence(withSpring(0.85), withSpring(1));
        executeSpin(2000);
    };

    // ─── Animated styles ────────────────────────────────────────────
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const animatedBtnStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleBtn.value }],
    }));

    const animatedGlowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: 1 + glowOpacity.value * 0.12 }],
    }));

    const animatedPointerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: pointerBounce.value }],
    }));

    // ─── Slice geometry ─────────────────────────────────────────────
    const sliceCount = rewards.length || 1;
    const sliceAngle = (2 * Math.PI) / sliceCount;

    const createSlice = (i: number) => {
        const start = i * sliceAngle;
        const end = start + sliceAngle;
        const x1 = RADIUS + RADIUS * Math.cos(start);
        const y1 = RADIUS + RADIUS * Math.sin(start);
        const x2 = RADIUS + RADIUS * Math.cos(end);
        const y2 = RADIUS + RADIUS * Math.sin(end);
        return `M ${RADIUS} ${RADIUS} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2} Z`;
    };

    const getSliceSubLabel = (r: SpinReward) => {
        return REWARD_EMOJIS[r.rewardType] || '🎁';
    };

    return (
        <View style={styles.container}>
            {/* Outer glow ring */}
            <Animated.View style={[styles.glowRingBox, styles.shadowExtreme, animatedGlowStyle]} />

            {/* Animated bouncing pointer */}
            <Animated.View style={[styles.pointerContainer, animatedPointerStyle]}>
                <Svg width={44} height={56} viewBox="0 0 44 56">
                    <Defs>
                        <LinearGradient id="pointerGrad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor="#FDE047" />
                            <Stop offset="0.5" stopColor="#FACC15" />
                            <Stop offset="1" stopColor="#EAB308" />
                        </LinearGradient>
                    </Defs>
                    {/* Shadow */}
                    <Path d="M22 56 L5 12 A17 17 0 0 1 39 12 Z" fill="rgba(0,0,0,0.4)" transform="translate(0, 3)" />
                    {/* Body */}
                    <Path d="M22 56 L5 12 A17 17 0 0 1 39 12 Z" fill="url(#pointerGrad)" />
                    {/* Gem */}
                    <Circle cx="22" cy="17" r="5" fill="#FEF9C3" />
                    <Circle cx="22" cy="17" r="3" fill="#FFFFFF" opacity={0.6} />
                </Svg>
            </Animated.View>

            {/* Wheel */}
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.wheelBoard, animatedStyle]}>
                    <Svg width={SIZE} height={SIZE}>
                        <Defs>
                            {rewards.map((r, i) => {
                                const colors = r.color
                                    ? [r.color, adjustColor(r.color, -40)]
                                    : DEFAULT_GRADIENT_PAIRS[i % DEFAULT_GRADIENT_PAIRS.length];
                                return (
                                    <LinearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <Stop offset="0%" stopColor={colors[0]} />
                                        <Stop offset="100%" stopColor={colors[1]} />
                                    </LinearGradient>
                                );
                            })}
                        </Defs>
                        <G>
                            {rewards.map((_, i) => (
                                <Path
                                    key={`slice-${i}`}
                                    d={createSlice(i)}
                                    fill={`url(#grad-${i})`}
                                    stroke="rgba(255, 255, 255, 0.15)"
                                    strokeWidth="2.5"
                                />
                            ))}

                            {rewards.map((r, i) => {
                                const a = i * sliceAngle + sliceAngle / 2;
                                // Rotate text to be radial (pointing outward from center)
                                const degAngle = (a * 180) / Math.PI;

                                // Emoji near the outer rim
                                const emojiR = RADIUS * 0.82;
                                const ex = RADIUS + emojiR * Math.cos(a);
                                const ey = RADIUS + emojiR * Math.sin(a);

                                // Split label into words for multi-line
                                const labelWords = r.rewardType === 'ITEM'
                                    ? r.name.split(' ').slice(0, 3).reverse()
                                    : [`${r.amount}`];

                                const fontSize = rewards.length > 6 ? 11 : 13;

                                return (
                                    <G key={`text-g-${i}`}>
                                        {/* Emoji near edge */}
                                        <G transform={`rotate(${degAngle + 90}, ${ex}, ${ey})`}>
                                            <SvgText
                                                x={ex}
                                                y={ey}
                                                fontSize="15"
                                                textAnchor="middle"
                                                alignmentBaseline="middle"
                                            >
                                                {getSliceSubLabel(r)}
                                            </SvgText>
                                        </G>

                                        {/* Multi-line label, each word stacked radially */}
                                        {labelWords.map((word, wi) => {
                                            const spacing = 0.12;
                                            const totalHeight = (labelWords.length - 1) * spacing;
                                            const wordR = RADIUS * (0.55 - totalHeight / 2 + wi * spacing);
                                            const wx = RADIUS + wordR * Math.cos(a);
                                            const wy = RADIUS + wordR * Math.sin(a);
                                            return (
                                                <G key={`w-${i}-${wi}`} transform={`rotate(${degAngle + 90}, ${wx}, ${wy})`}>
                                                    {/* Dark stroke outline for contrast */}
                                                    <SvgText
                                                        x={wx}
                                                        y={wy}
                                                        fill="none"
                                                        stroke="rgba(0,0,0,0.3)"
                                                        strokeWidth="2"
                                                        fontSize={`${fontSize}`}
                                                        fontWeight="800"
                                                        textAnchor="middle"
                                                        alignmentBaseline="middle"
                                                    >
                                                        {word}
                                                    </SvgText>
                                                    {/* White text on top */}
                                                    <SvgText
                                                        x={wx}
                                                        y={wy}
                                                        fill="#FFFFFF"
                                                        fontSize={`${fontSize}`}
                                                        fontWeight="800"
                                                        textAnchor="middle"
                                                        alignmentBaseline="middle"
                                                    >
                                                        {word}
                                                    </SvgText>
                                                </G>
                                            );
                                        })}
                                    </G>
                                );
                            })}
                        </G>
                    </Svg>
                </Animated.View>
            </GestureDetector>

            {/* Center button (compact, icon only) */}
            <View style={styles.centerButtonWrapper} pointerEvents="box-none">
                <Animated.View style={[styles.centerGlow, animatedGlowStyle]} />
                <Animated.View style={[animatedBtnStyle]}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.boton,
                            pressed && { opacity: 0.8 },
                            (disabled || isSpinning) && { opacity: 0.4 },
                        ]}
                        onPress={handleButtonSpin}
                        disabled={disabled || isSpinning}
                    >
                        <Ionicons name={isSpinning ? "sync" : "flash"} size={26} color="#FEF08A" />
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}

function adjustColor(hex: string, amount: number): string {
    let color = hex.replace('#', '');
    if (color.length === 3) color = color.split('').map(c => c + c).join('');
    const num = parseInt(color, 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 24,
        position: 'relative',
    },
    glowRingBox: {
        position: 'absolute',
        width: SIZE - 10,
        height: SIZE - 10,
        borderRadius: SIZE,
        backgroundColor: '#8B5CF6',
        opacity: 0.1,
    },
    shadowExtreme: {
        shadowColor: "#A78BFA",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
        elevation: 15,
    },
    wheelBoard: {
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        overflow: 'hidden',
        borderWidth: 5,
        borderColor: 'rgba(139, 92, 246, 0.5)',
        backgroundColor: '#0F172A',
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 15,
    },
    pointerContainer: {
        position: "absolute",
        top: -24,
        zIndex: 50,
        alignItems: "center",
        justifyContent: "center",
    },
    centerButtonWrapper: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
    },
    centerGlow: {
        position: "absolute",
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(253, 224, 71, 0.3)",
    },
    boton: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#0F172A",
        borderWidth: 3,
        borderColor: "#EAB308",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#EAB308",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
        elevation: 8,
    },
});