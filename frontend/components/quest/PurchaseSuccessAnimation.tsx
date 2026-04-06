// components/quest/PurchaseSuccessAnimation.tsx
// Animación orbital atómica premium — la imagen del ítem ES el núcleo

import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withRepeat, withTiming, withSequence, withDelay, withSpring,
    Easing, FadeIn, FadeOut, ZoomIn, SlideInUp,
} from 'react-native-reanimated';
import { CHAR_SPRITES, ITEM_SPRITES } from '../../data/classSkills';

const { width: SW } = Dimensions.get('window');

interface PurchaseSuccessProps {
    item: {
        id: string;
        name: string;
        icon?: string;
        pixelArt?: string;
        type: 'hero' | 'item' | 'card';
        sprite?: any;
    };
    onClose: () => void;
}

// ─── Un anillo orbitando — cada uno con eje 3D diferente ─────────────────────
const Ring = ({
    size, color, duration, rotX = 50, rotY = 0, startDeg = 0, borderWidth = 10,
}: {
    size: number; color: string; duration: number;
    rotX?: number; rotY?: number; startDeg?: number; borderWidth?: number;
}) => {
    const deg = useSharedValue(startDeg);
    useEffect(() => {
        deg.value = withRepeat(
            withTiming(startDeg + 360, { duration, easing: Easing.linear }),
            -1, false,
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { perspective: 600 },
            { rotateX: `${rotX}deg` },
            { rotateY: `${rotY}deg` },
            { rotateZ: `${deg.value}deg` },
        ],
    }));

    return (
        <Animated.View style={[ringBase, {
            width: size, height: size,
            borderBottomColor: color,
            borderBottomWidth: borderWidth,
            shadowColor: color,
            shadowOpacity: 0.9,
            shadowRadius: 12,
            elevation: 8,
        }, style]} />
    );
};

const ringBase = StyleSheet.create({
    r: {
        position: 'absolute',
        borderRadius: 999,
        borderColor: 'transparent',
        borderStyle: 'solid',
    },
}).r;

// ─── Partícula flotante ───────────────────────────────────────────────────────
const Particle = ({ color, delay, x, y }: { color: string; delay: number; x: number; y: number }) => {
    const opacity = useSharedValue(0);
    const ty = useSharedValue(0);
    useEffect(() => {
        opacity.value = withDelay(delay, withRepeat(withSequence(
            withTiming(1, { duration: 600 }),
            withTiming(0, { duration: 800 }),
            withTiming(0, { duration: 600 }),
        ), -1, false));
        ty.value = withDelay(delay, withRepeat(
            withTiming(-30, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1, true,
        ));
    }, []);
    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: x }, { translateY: y + ty.value }],
    }));
    return (
        <Animated.View style={[S.particle, { backgroundColor: color, shadowColor: color }, style]} />
    );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export const PurchaseSuccessAnimation = ({ item, onClose }: PurchaseSuccessProps) => {
    const orbScale   = useSharedValue(0);
    const ringOpacity = useSharedValue(0);
    const nucleusPulse = useSharedValue(1);

    useEffect(() => {
        // Entrada orbital
        orbScale.value = withSpring(1, { damping: 12, stiffness: 80 });
        ringOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
        // Pulso del núcleo
        nucleusPulse.value = withDelay(400, withRepeat(
            withSequence(
                withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
                withTiming(1,    { duration: 900, easing: Easing.inOut(Easing.ease) }),
            ), -1, true,
        ));
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, []);

    const orbStyle = useAnimatedStyle(() => ({
        transform: [{ scale: orbScale.value }],
        opacity: orbScale.value,
    }));
    const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value }));
    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: nucleusPulse.value }],
    }));

    // ── Resolver imagen ──────────────────────────────────────────────────────
    const renderItemVisual = () => {
        if (item.type === 'hero') {
            const src = (CHAR_SPRITES as any)[item.id];
            if (src) return <Image source={src} style={S.nucleusImg} contentFit="contain" />;
        }
        if (item.sprite) {
            return <Image source={item.sprite} style={S.nucleusImg} contentFit="contain" />;
        }
        if (item.pixelArt) {
            const src = (ITEM_SPRITES as any)[item.pixelArt];
            if (src) return <Image source={src} style={S.nucleusImg} contentFit="contain" />;
        }
        return <Text style={S.nucleusEmoji}>{item.icon ?? '✨'}</Text>;
    };

    // Label según tipo
    const typeLabel = item.type === 'hero' ? '⚔️ CLASE DESBLOQUEADA' :
                      item.type === 'card' ? '🎴 CARTA ADQUIRIDA' : '🧪 OBJETO ADQUIRIDO';

    return (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={S.overlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

            {/* ── Partículas de fondo ── */}
            {[
                { color: '#fe53bb', delay: 0,    x: -90,  y: -60  },
                { color: '#8f51ea', delay: 300,  x: 80,   y: -80  },
                { color: '#0055ff', delay: 600,  x: -70,  y: 70   },
                { color: '#fe53bb', delay: 900,  x: 100,  y: 50   },
                { color: '#8f51ea', delay: 200,  x: -110, y: 20   },
                { color: '#0055ff', delay: 700,  x: 60,   y: 100  },
            ].map((p, i) => <Particle key={i} {...p} />)}

            {/* ── Órbita atómica ── */}
            <Animated.View style={[S.orbScene, orbStyle]}>
                <Animated.View style={ringStyle}>
                    {/* Anillos internos pequeños */}
                    <Ring size={180} color="#fe53bb" duration={1200} rotX={50} rotY={0}   startDeg={0}   borderWidth={8} />
                    <Ring size={180} color="#8f51ea" duration={1600} rotX={20} rotY={50}  startDeg={120} borderWidth={8} />
                    <Ring size={180} color="#0055ff" duration={2000} rotX={40} rotY={130} startDeg={240} borderWidth={8} />

                    {/* Anillos externos grandes */}
                    <Ring size={320} color="#fe53bb" duration={3200} rotX={50} rotY={0}   startDeg={180} borderWidth={14} />
                    <Ring size={320} color="#8f51ea" duration={4000} rotX={20} rotY={50}  startDeg={300} borderWidth={14} />
                    <Ring size={320} color="#0055ff" duration={3600} rotX={40} rotY={130} startDeg={60}  borderWidth={14} />
                </Animated.View>

                {/* ── NÚCLEO = IMAGEN DEL ITEM ── */}
                <Animated.View style={[S.nucleusShell, pulseStyle]}>
                    {/* Glow orbs detrás del núcleo */}
                    <View style={[S.glowOrb, { backgroundColor: '#fe53bb', shadowColor: '#fe53bb' }]} />
                    <View style={[S.glowOrb, { backgroundColor: '#8f51ea', shadowColor: '#8f51ea', opacity: 0.6 }]} />
                    {/* Imagen */}
                    <View style={S.nucleusBg}>
                        {renderItemVisual()}
                    </View>
                </Animated.View>
            </Animated.View>

            {/* ── Tarjeta flotante debajo ── */}
            <Animated.View entering={SlideInUp.delay(600).springify().damping(16)} style={S.infoCard}>
                {/* Tipo */}
                <Text style={S.typeLabel}>{typeLabel}</Text>
                {/* Nombre */}
                <Text style={S.itemName} numberOfLines={2}>{item.name.toUpperCase()}</Text>
                {/* Destellos en divisor */}
                <View style={S.dividerRow}>
                    <View style={S.divLine} />
                    <Text style={S.divStar}>✦</Text>
                    <View style={S.divLine} />
                </View>
                {/* Botón */}
                <TouchableOpacity style={S.continueBtn} onPress={onClose} activeOpacity={0.8}>
                    <Text style={S.continueBtnTxt}>✓ CONTINUAR</Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const NUCLEUS_SIZE = 120;

const S = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(2, 4, 20, 0.97)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        gap: 32,
    },
    orbScene: {
        width: 340,
        height: 340,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Núcleo ────────────────────────────────────────────────────────
    nucleusShell: {
        position: 'absolute',
        width: NUCLEUS_SIZE,
        height: NUCLEUS_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    glowOrb: {
        position: 'absolute',
        width: NUCLEUS_SIZE + 20,
        height: NUCLEUS_SIZE + 20,
        borderRadius: (NUCLEUS_SIZE + 20) / 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 40,
        elevation: 15,
        opacity: 0.35,
    },
    nucleusBg: {
        width: NUCLEUS_SIZE,
        height: NUCLEUS_SIZE,
        borderRadius: NUCLEUS_SIZE / 2,
        backgroundColor: 'rgba(10, 5, 25, 0.9)',
        borderWidth: 3,
        borderColor: 'rgba(254, 83, 187, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fe53bb',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 20,
        overflow: 'hidden',
    },
    nucleusImg: {
        width: NUCLEUS_SIZE - 16,
        height: NUCLEUS_SIZE - 16,
    },
    nucleusEmoji: {
        fontSize: 60,
    },

    // ── Partículas ────────────────────────────────────────────────────
    particle: {
        position: 'absolute',
        width: 8, height: 8,
        borderRadius: 4,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    },

    // ── Info card ─────────────────────────────────────────────────────
    infoCard: {
        width: Math.min(SW * 0.80, 320),
        backgroundColor: 'rgba(15, 10, 35, 0.95)',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(143, 81, 234, 0.5)',
        padding: 20,
        alignItems: 'center',
        shadowColor: '#8f51ea',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 12,
        gap: 8,
    },
    typeLabel: {
        color: '#8f51ea',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
    },
    itemName: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 2,
        textShadowColor: '#fe53bb',
        textShadowRadius: 10,
        lineHeight: 28,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        width: '100%',
    },
    divLine: {
        flex: 1, height: 1,
        backgroundColor: 'rgba(143, 81, 234, 0.35)',
    },
    divStar: {
        color: '#8f51ea',
        fontSize: 14,
    },
    continueBtn: {
        marginTop: 4,
        backgroundColor: 'rgba(143, 81, 234, 0.2)',
        borderWidth: 1.5,
        borderColor: 'rgba(143, 81, 234, 0.7)',
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 36,
    },
    continueBtnTxt: {
        color: '#c084fc',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 2,
    },
});
