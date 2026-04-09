// components/quest/PurchaseSuccessAnimation.tsx
// Animación orbital atómica premium — Estilo "Atomic Nucleus" inspirado en CSS

import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withRepeat, withTiming, withSequence, withDelay, withSpring,
    Easing, FadeIn, FadeOut, SlideInUp,
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

const C = {
    pink: '#fe53bb',
    purple: '#8f51ea',
    blue: '#0044ff',
    bg: 'rgba(2, 4, 15, 0.98)',
};

// ─── Un anillo orbital 3D ───────────────────────────────────────────────────
const Ring = ({
    size, color, duration, rotX = 0, rotY = 0, startDeg = 0, borderWidth = 8, isInverse = false
}: {
    size: number; color: string; duration: number;
    rotX?: number; rotY?: number; startDeg?: number; borderWidth?: number;
    isInverse?: boolean;
}) => {
    const deg = useSharedValue(startDeg);

    useEffect(() => {
        deg.value = withRepeat(
            withTiming(isInverse ? startDeg - 360 : startDeg + 360, { 
                duration, 
                easing: Easing.bezier(0.42, 0, 0.58, 1) // ease-in-out
            }),
            -1, false
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { perspective: 800 },
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
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10,
        }, style]} />
    );
};

const ringBase = StyleSheet.create({
    r: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'transparent',
    },
}).r;

// ─── Partículas de Luz ───────────────────────────────────────────────────────
const LightParticle = ({ color, delay, x, y }: { color: string; delay: number; x: number; y: number }) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        opacity.value = withDelay(delay, withRepeat(withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(0, { duration: 1000 }),
        ), -1, false));
        scale.value = withDelay(delay, withRepeat(withSequence(
            withTiming(1.2, { duration: 1000 }),
            withTiming(0.8, { duration: 1000 }),
        ), -1, true));
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: x }, { translateY: y }, { scale: scale.value }],
    }));

    return <Animated.View style={[S.particle, { backgroundColor: color, shadowColor: color }, style]} />;
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export const PurchaseSuccessAnimation = ({ item, onClose }: PurchaseSuccessProps) => {
    const nucleusScale = useSharedValue(0);
    const nucleusPulse = useSharedValue(1);

    useEffect(() => {
        nucleusScale.value = withSpring(1, { damping: 12, stiffness: 90 });
        nucleusPulse.value = withDelay(500, withRepeat(
            withSequence(
                withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            ), -1, true
        ));

        // Auto-close opcional tras 8s si el usuario no interactúa
        const timer = setTimeout(onClose, 8000);
        return () => clearTimeout(timer);
    }, []);

    const nucleusStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: nucleusScale.value * nucleusPulse.value }
        ],
    }));

    // ── Resolver imagen ──────────────────────────────────────────────────────
    const renderContent = () => {
        // 1. Si es un héroe (clase)
        if (item.type === 'hero') {
            const src = (CHAR_SPRITES as any)[item.id] || CHAR_SPRITES.hero_base;
            return <Image source={src} style={S.nucleusImg} contentFit="contain" />;
        }
        
        // 2. Si se pasó el sprite directamente (desde SHOP_ITEMS)
        if (item.sprite) {
            return <Image source={item.sprite} style={S.nucleusImg} contentFit="contain" />;
        }
        
        // 3. Intento por ID (pixelArt) con y sin prefijo 'item_'
        if (item.pixelArt) {
            const cleanId = item.pixelArt.replace('item_', '');
            const src = (ITEM_SPRITES as any)[item.pixelArt] || (ITEM_SPRITES as any)[cleanId];
            if (src) return <Image source={src} style={S.nucleusImg} contentFit="contain" />;
        }
        
        return <Text style={S.nucleusEmoji}>{item.icon ?? '⭐'}</Text>;
    };

    const typeLabel = item.type === 'hero' ? 'NUEVO AVENTURERO' :
                      item.type === 'card' ? 'CARTA LEGENDARIA' : 'OBJETO ADQUIRIDO';

    return (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={S.overlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

            {/* Partículas */}
            <LightParticle color={C.pink} delay={0} x={-120} y={-100} />
            <LightParticle color={C.purple} delay={400} x={130} y={-80} />
            <LightParticle color={C.blue} delay={800} x={-100} y={150} />
            <LightParticle color={C.pink} delay={1200} x={110} y={120} />

            {/* ── ESCENA ORBITAL ── */}
            <View style={S.orbScene}>
                {/* Anillos Pequeños (190px en CSS) */}
                <Ring size={190} color={C.pink}   duration={1000} rotX={50} rotY={0}   startDeg={110} />
                <Ring size={190} color={C.purple} duration={1400} rotX={20} rotY={50}  startDeg={20} />
                <Ring size={190} color={C.blue}   duration={1800} rotX={40} rotY={130} startDeg={450} isInverse />

                {/* Anillos Grandes (380px en CSS) */}
                <Ring size={340} color={C.pink}   duration={2500} rotX={50} rotY={0}   startDeg={470} isInverse borderWidth={12} />
                <Ring size={340} color={C.purple} duration={3000} rotX={20} rotY={50}  startDeg={380} isInverse borderWidth={12} />
                <Ring size={340} color={C.blue}   duration={3500} rotX={40} rotY={130} startDeg={90}  borderWidth={12} />

                {/* ── NÚCLEO (Imagen) ── */}
                <Animated.View style={[S.nucleusContainer, nucleusStyle]}>
                    {/* Resplandores de fondo */}
                    <View style={[S.nucleusGlow, { backgroundColor: C.pink, shadowColor: C.pink }]} />
                    <View style={[S.nucleusGlow, { backgroundColor: C.purple, shadowColor: C.purple, transform: [{ scale: 1.2 }] }]} />
                    
                    <View style={S.nucleusBg}>
                        {renderContent()}
                    </View>
                </Animated.View>
            </View>

            {/* ── INFO CARD ── */}
            <Animated.View entering={SlideInUp.delay(800).springify()} style={S.infoCard}>
                <Text style={S.typeText}>{typeLabel}</Text>
                <Text style={S.itemName}>{item.name.toUpperCase()}</Text>
                
                <View style={S.dividerRow}>
                    <View style={S.line} />
                    <Text style={S.star}>✦</Text>
                    <View style={S.line} />
                </View>

                <TouchableOpacity style={S.btn} onPress={onClose} activeOpacity={0.7}>
                    <Text style={S.btnTxt}>SAGA CONTINÚA</Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: C.bg,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
    },
    orbScene: {
        width: 380,
        height: 380,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    nucleusContainer: {
        width: 130,
        height: 130,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    nucleusGlow: {
        position: 'absolute',
        width: 100, height: 100,
        borderRadius: 50,
        opacity: 0.4,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 20,
    },
    nucleusBg: {
        width: 120, height: 120,
        borderRadius: 60,
        backgroundColor: '#050510',
        borderWidth: 3,
        borderColor: C.pink,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: C.pink,
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    nucleusImg: {
        width: 90, height: 90,
    },
    nucleusEmoji: {
        fontSize: 50,
    },
    particle: {
        position: 'absolute',
        width: 6, height: 6,
        borderRadius: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 5,
    },
    infoCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(10, 10, 25, 0.9)',
        padding: 24,
        borderRadius: 24,
        width: SW * 0.85,
        borderWidth: 1,
        borderColor: 'rgba(254, 83, 187, 0.3)',
        gap: 8,
        ...Platform.select({
            ios: { shadowColor: C.pink, shadowOpacity: 0.3, shadowRadius: 20 },
            android: { elevation: 15 }
        }),
    },
    typeText: {
        color: C.purple,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    itemName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        textShadowColor: C.pink,
        textShadowRadius: 8,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        marginVertical: 4,
    },
    line: {
        flex: 1, height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    star: { color: C.purple, fontSize: 16 },
    btn: {
        marginTop: 10,
        paddingVertical: 12,
        paddingHorizontal: 40,
        backgroundColor: 'rgba(143, 81, 234, 0.15)',
        borderRadius: 30,
        borderWidth: 2,
        borderColor: C.purple,
    },
    btnTxt: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 2,
    },
});
