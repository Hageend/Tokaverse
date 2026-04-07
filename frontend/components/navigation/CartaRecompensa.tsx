import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
    BounceIn,
    FadeIn,
    withRepeat,
    withTiming,
    useSharedValue,
    useAnimatedStyle,
    Easing
} from "react-native-reanimated";

interface SpinRewardResult {
    id: number;
    name: string;
    rewardType: string;
    amount: number;
    itemId: number | null;
    color: string | null;
}

interface Props {
    reward: SpinRewardResult;
    onClaim: () => void;
}

const REWARD_ICONS: Record<string, { icon: string; label: string; emoji: string }> = {
    COINS: { icon: 'cash-outline', label: 'Toka Coins', emoji: '🪙' },
    XP: { icon: 'flash-outline', label: 'Puntos XP', emoji: '⚡' },
    ITEM: { icon: 'cube-outline', label: 'Ítem Especial', emoji: '🗡️' },
    CASHBACK: { icon: 'card-outline', label: 'Cashback', emoji: '💸' },
};

export default function CartaRecompensa({ reward, onClaim }: Props) {
    const rewardMeta = REWARD_ICONS[reward.rewardType] || REWARD_ICONS.COINS;
    const shinePos = useSharedValue(-200);
    const btnScale = useSharedValue(1);

    useEffect(() => {
        shinePos.value = withRepeat(
            withTiming(500, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
            -1,
            false
        );
    }, [shinePos]);

    // Pulse the claim button
    useEffect(() => {
        btnScale.value = withRepeat(
            withTiming(1.04, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, [btnScale]);

    const shineStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shinePos.value }, { skewX: '-20deg' }],
    }));

    const btnAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: btnScale.value }],
    }));

    return (
        <Animated.View entering={BounceIn.duration(800)} style={styles.wrapper}>
            <View style={styles.card}>
                {/* Shine */}
                <View style={styles.shineContainer}>
                    <Animated.View style={[styles.shine, shineStyle]} />
                </View>

                {/* Icon */}
                <Animated.View entering={FadeIn.delay(300)}>
                    <View style={[styles.iconContainer, reward.color ? { borderColor: reward.color + '66' } : undefined]}>
                        <Ionicons name={rewardMeta.icon as any} size={36} color={reward.color || '#FEF08A'} />
                    </View>
                </Animated.View>

                <Text style={styles.title}>¡HAS GANADO!</Text>

                <View style={styles.premioBox}>
                    <Text style={styles.premioLabel}>{rewardMeta.label}</Text>
                    <Text style={[styles.highlight, reward.color ? { color: reward.color } : undefined]}>
                        {reward.rewardType === 'ITEM' ? reward.name : `${reward.amount} ${rewardMeta.label}`}
                    </Text>
                </View>

                {/* Reclamar button */}
                <Animated.View style={[{ width: '100%' }, btnAnimStyle]}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                        ]}
                        onPress={onClaim}
                    >
                        <Text style={styles.buttonEmoji}>✨</Text>
                        <Text style={styles.buttonText}>RECLAMAR</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        maxWidth: 360,
        alignItems: "center",
        zIndex: 100,
    },
    card: {
        width: "100%",
        padding: 28,
        borderRadius: 24,
        backgroundColor: "rgba(30, 41, 59, 0.92)",
        borderWidth: 1,
        borderColor: "rgba(234, 179, 8, 0.35)",
        alignItems: "center",
        overflow: "hidden",
        shadowColor: "#EAB308",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    shineContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
        borderRadius: 24,
    },
    shine: {
        width: 100,
        height: "200%",
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        position: 'absolute',
        top: -50,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "rgba(234, 179, 8, 0.12)",
        borderWidth: 2,
        borderColor: "rgba(234, 179, 8, 0.4)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        color: "#F8FAFC",
        marginBottom: 18,
        letterSpacing: 0.5,
    },
    premioBox: {
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: "center",
        width: "100%",
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
    },
    premioLabel: {
        fontSize: 11,
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    highlight: {
        fontSize: 30,
        color: "#FDE047",
        fontWeight: "bold",
    },
    button: {
        flexDirection: "row",
        width: "100%",
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: "#FEF08A",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    buttonEmoji: {
        fontSize: 18,
    },
    buttonText: {
        color: "#0F172A",
        fontWeight: "900",
        letterSpacing: 1,
        fontSize: 16,
    },
});