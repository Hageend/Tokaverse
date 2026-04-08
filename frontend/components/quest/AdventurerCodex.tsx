// components/quest/AdventurerCodex.tsx
// TokaVerse — Códice 2.0: Evolución Mística-Cyberpunk
// Portal Alquímico Híbrido · Botones Glitch Sutil · Optimización PC de Alta Fidelidad

import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, 
    Dimensions, Platform, Alert, useWindowDimensions 
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Polygon, Rect, G, Circle } from 'react-native-svg';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { ITEM_SPRITES, COIN_SPRITES, CHAR_SPRITES } from '../../data/classSkills';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
    useSharedValue, useAnimatedStyle, withTiming, withRepeat, 
    Easing, withSequence, withDelay, FadeIn, FadeOut, ZoomIn, FadeInDown,
    withSpring
} from 'react-native-reanimated';
import { PurchaseSuccessAnimation } from './PurchaseSuccessAnimation';

// ─── Diseño de Colores (Parchment & Magic) ───────────────────────────────────
const C = {
    parchment:      '#2a1a0e',
    parchmentMid:   '#1e110a',
    parchmentLight: '#3d2512',
    ink:            '#f0d9a0',
    inkDim:         '#a08050',
    inkBright:      '#ffd700',
    accentRed:      '#8b1a1a',
    accentGreen:    '#1a5c2a',
    borderPixel:    '#6b4420',
    borderBright:   '#c8860a',
    glitch:         '#ff004d',
    glitchGlow:     '#ff0066',
    portalColors:   ['#ffb61e', '#fa9542', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'],
};

// ─── Helpers Responsivos ─────────────────────────────────────────────────────
const fs = (mobile: number, desktop: number, isDesktop: boolean) => isDesktop ? desktop : mobile;

// ─── Datos ──────────────────────────────────────────────────────────────────
const MAGE_ITEMS = [
    { id: 'warrior',  name: 'SAMURAI',   sub: 'Guerrero', price: 0,    elem: '⚔', elemColor: '#8b1a1a' },
    { id: 'archer',   name: 'YUSHU',     sub: 'Arquero',  price: 0,    elem: '🏹', elemColor: '#1a5c2a' },
    { id: 'mage',     name: 'MAHŌTSUKAI', sub: 'Maga',    price: 0,    elem: '❄', elemColor: '#1a3a6b' },
    { id: 'thief',    name: 'GŌTŌ',      sub: 'Ladrona',  price: 0,    elem: '💨', elemColor: '#3a3a1a' },
    { id: 'hacker',   name: 'HACKER',    sub: 'Ciber-Mago', price: 500, elem: '⚡', elemColor: '#6b1a6b' },
    { id: 'banker',   name: 'SHŌNIN',    sub: 'Mercader', price: 750,  elem: '💰', elemColor: '#6b4a1a' },
    { id: 'magedark', name: 'ANKOKU',    sub: 'Maga Oscura', price: 1000, elem: '☽', elemColor: '#2a1a4a' },
    { id: 'dog',      name: 'INU',       sub: 'Can Guardián', price: 300, elem: '🐾', elemColor: '#3a2a1a' },
    { id: 'cat',      name: 'NEKO',      sub: 'Gato Suerte', price: 250, elem: '🐱', elemColor: '#ffaa00' },
    { id: 'fox',      name: 'KITSUNE',   sub: 'Espíritu', price: 400, elem: '🦊', elemColor: '#ff4400' },
];

const SHOP_ITEMS = [
    { name: 'POCIÓN HP', price: 25, icon: '🧪', color: '#8b1a1a', sprite: ITEM_SPRITES.potion },
    { name: 'POCIÓN MANÁ', price: 30, icon: '💧', color: '#1a3a6b', sprite: ITEM_SPRITES.potion_mana },
    { name: 'ANILLO PODER', price: 250, icon: '💍', color: '#6b4a1a', sprite: ITEM_SPRITES.ring_strong },
    { name: 'ESPADA DIAMANTE', price: 800, icon: '⚔', color: '#1a5c6b', sprite: ITEM_SPRITES.sword_diamond },
];

const CARD_ITEMS = [
    { name: 'CARTA XP',    price: 150, icon: '✦', color: '#6b4a1a', sprite: ITEM_SPRITES.card_xp },
    { name: 'CARTA VIDA',  price: 200, icon: '♥', color: '#8b1a1a', sprite: ITEM_SPRITES.card_hp },
    { name: 'CARTA MANÁ',  price: 200, icon: '◆', color: '#1a3a6b', sprite: ITEM_SPRITES.card_mana },
    { name: 'CARTA MAESTRA', price: 500, icon: '★', color: '#6b1a6b', sprite: ITEM_SPRITES.card_strong },
];

// ─── Componentes ─────────────────────────────────────────────────────────────

/** Botón Octogonal estilo Cyberpunk/Glitch */
const GlitchButton = ({ children, onPress, color = C.borderBright, isDesktop, style: extraStyle }: any) => {
    const scale = useSharedValue(1);
    const glitchX = useSharedValue(0);
    const glitchY = useSharedValue(0);
    const opacity = useSharedValue(1);

    const runGlitch = () => {
        glitchX.value = withRepeat(withSequence(withTiming(2, { duration: 50 }), withTiming(-2, { duration: 50 }), withTiming(0, { duration: 50 })), 3, false);
        glitchY.value = withRepeat(withSequence(withTiming(-1, { duration: 50 }), withTiming(1, { duration: 50 }), withTiming(0, { duration: 50 })), 3, false);
        opacity.value = withSequence(withTiming(0.8, { duration: 50 }), withTiming(1, { duration: 100 }));
    };

    useEffect(() => {
        const interval = setInterval(() => { if (Math.random() > 0.8) runGlitch(); }, 3000);
        return () => clearInterval(interval);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { translateX: glitchX.value }, { translateY: glitchY.value }],
        opacity: opacity.value
    }));

    return (
        <TouchableOpacity 
            onPress={onPress} 
            activeOpacity={1} 
            onPressIn={() => scale.value = withSpring(0.95)} 
            onPressOut={() => scale.value = withSpring(1)}
            style={[S.glitchContainer, extraStyle]}
        >
            <Animated.View style={[S.glitchShell, animatedStyle]}>
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                    {/* Forma de Clip-Path Octogonal */}
                    <Polygon 
                        points="15,0 85,0 100,30 100,70 85,100 15,100 0,70 0,30" 
                        fill="transparent" 
                        stroke={color} 
                        strokeWidth="3" 
                        scale="0.95"
                    />
                </Svg>
                {/* Esquinas (Pips) */}
                <View style={[S.gCorner, S.gTL, { backgroundColor: color }]} />
                <View style={[S.gCorner, S.gTR, { backgroundColor: color }]} />
                <View style={[S.gCorner, S.gBL, { backgroundColor: color }]} />
                <View style={[S.gCorner, S.gBR, { backgroundColor: color }]} />
                
                <Text style={[S.glitchTxt, { color, fontSize: fs(7, 11, isDesktop) }]}>{children}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

/** Portal Místico Híbrido (Alquimia + Anillos Cinéticos) */
const MagicPortal = () => {
    const rotOuter = useSharedValue(0);
    const rotInner = useSharedValue(0);
    
    useEffect(() => {
        // Velocidades duplicadas para un efecto de poder cinético
        rotOuter.value = withRepeat(withTiming(-360, { duration: 6000, easing: Easing.linear }), -1, false);
        rotInner.value = withRepeat(withTiming(360, { duration: 3500, easing: Easing.linear }), -1, false);
    }, []);

    const outerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotOuter.value}deg` }] }));
    const innerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotInner.value}deg` }] }));

    return (
        <View style={S.pWrap}>
            {/* Capas Alquímicas Sincronizadas */}
            <Animated.View style={[S.pc1, outerStyle]}>
                <View style={S.pc2}>
                    <Animated.View style={[S.pc3, innerStyle]}>
                        <View style={S.pr1}>
                            <View style={S.pc4}>
                                <View style={S.pr2}><View style={S.pr3} /></View>
                            </View>
                            <View style={S.pc5} />
                            <View style={S.pc6} />
                        </View>
                    </Animated.View>
                </View>
            </Animated.View>

            {/* Vórtice de 12 Anillos de Alta Energía (Mejor Rendimiento + Impacto) */}
            <View style={S.ringLoader}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <KineticRing key={i} index={i} total={12} />
                ))}
            </View>

            <Text style={S.pTxt}>CANALIZANDO DESTINO...</Text>
        </View>
    );
};

const KineticRing = ({ index, total }: any) => {
    const rot = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacityVal = useSharedValue(0.4);
    const color = C.portalColors[index % C.portalColors.length];

    useEffect(() => {
        // Rotación ultra-rápida y escalonada
        rot.value = withDelay(
            index * -400,
            withRepeat(withTiming(360, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1) }), -1, false)
        );
        // Oscilación de energía (escala y brillo)
        scale.value = withRepeat(withTiming(1.3, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1, true);
        opacityVal.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rot.value}deg` }, { scale: scale.value }],
        borderColor: color,
        opacity: opacityVal.value,
        borderWidth: index % 2 === 0 ? 3 : 1.5, // Variación de grosor para profundidad
    }));

    return <Animated.View style={[S.pRing, style]} />;
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export const AdventurerCodex = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const [phase, setPhase] = useState<'cover' | 'portal' | 'open'>('cover');
    const [tab, setTab] = useState<'heroes' | 'items' | 'cards'>('heroes');
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const portalTimer = useRef<any>(null);

    const { starCoins, unlockedClasses, unlockClass, addStarCoins } = usePlayerStore();
    const { addItem } = useInventoryStore();

    const [showConfetti, setShowConfetti] = useState(false);
    const [successItem, setSuccessItem] = useState<any>(null);

    useEffect(() => { if (visible) setPhase('cover'); }, [visible]);

    const handleCoverPress = () => {
        setPhase('portal');
        portalTimer.current = setTimeout(() => { setPhase('open'); }, 2200); // Portal más rápido y agresivo
    };
    
    useEffect(() => () => { if (portalTimer.current) clearTimeout(portalTimer.current); }, []);

    const handleAction = (item: any, type: 'hero' | 'item' | 'card') => {
        if (type === 'hero') {
            if (unlockedClasses.includes(item.id)) return Alert.alert('📖 Registro', `${item.name} ya está en tus filas.`);
            if (starCoins < item.price) return Alert.alert('⚠ Monedas!', 'No tienes suficientes Star Coins.');

            const ok = addItem({
                name: item.name, icon: '✨', rarity: 'rare', type: 'card', 
                id: item.id, obtainedFrom: 'Códice', obtainedAt: new Date()
            } as any, 'Códice');

            if (ok) {
                unlockClass(item.id);
                addStarCoins(-item.price);
                setSuccessItem({ ...item, type: 'hero' });
                setShowConfetti(true);
            }
        } else {
            if (starCoins < item.price) return Alert.alert('⚠ Monedas!', 'No tienes suficientes Star Coins.');
            const ok = addItem({
                name: item.name, icon: item.icon, rarity: 'uncommon',
                type: type === 'item' ? 'consumable' : 'card',
                pixelArt: item.name.toLowerCase().includes('poción') ? 'potion' : 'item_card',
            } as any, 'Códice');

            if (ok) {
                addStarCoins(-item.price);
                setSuccessItem({ ...item, type });
                setShowConfetti(true);
            }
        }
    };

    // Dimensiones Responsivas
    const GR_W = isDesktop ? Math.min(width * 0.85, 1200) : width * 0.94;
    const GR_H = isDesktop ? 750 : 660;
    const spineW = isDesktop ? 64 : 44;
    const paddingX = 16;
    const pageWidth = GR_W - spineW - paddingX * 2;
    const cardWidth = isDesktop ? (pageWidth - 16 * 3) / 4 : (pageWidth - 10) / 2;

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={S.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                
                <Animated.View entering={ZoomIn.springify().damping(15)} style={[S.grimoireShell, { width: GR_W, height: GR_H }]}>
                    
                    {phase === 'cover' && (
                        <TouchableOpacity style={S.coverFull} onPress={handleCoverPress}>
                            <View style={[S.coverBg, { backgroundColor: '#3E2723', borderColor: '#5D4037', borderWidth: 8 }]} />
                            <View style={S.coverOverlay}>
                                <MaterialCommunityIcons name="book-open-variant" size={fs(60, 100, isDesktop)} color={C.ink} />
                                <Text style={[S.coverTitle, { fontSize: fs(24, 42, isDesktop) }]}>CÓDICE DE MERCADER</Text>
                                <Text style={[S.coverSub, { fontSize: fs(10, 16, isDesktop) }]}>TOCA PARA ACTIVAR EL CÍRCULO ALQUÍMICO</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {phase === 'portal' && <MagicPortal />}

                    {phase === 'open' && (
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <View style={S.scanlines} pointerEvents="none" />
                            
                            {/* SPINE (Sidebar) */}
                            <View style={[S.spine, { width: spineW }]}>
                                <TabBtn icon="⚔" label="Héroes" active={tab === 'heroes'} onPress={() => setTab('heroes')} isDesktop={isDesktop} />
                                <TabBtn icon="⚗" label="Objetos" active={tab === 'items'} onPress={() => setTab('items')} isDesktop={isDesktop} />
                                <TabBtn icon="♦" label="Cartas" active={tab === 'cards'} onPress={() => setTab('cards')} isDesktop={isDesktop} />
                            </View>

                            {/* MAIN PAGE */}
                            <View style={S.page}>
                                <View style={[S.header, { paddingBottom: fs(10, 18, isDesktop), marginBottom: fs(15, 22, isDesktop) }]}>
                                    <View>
                                        <Text style={[S.headerTitle, { fontSize: fs(14, 24, isDesktop) }]}>REGISTRO DE AVENTUREROS</Text>
                                        <Text style={[S.headerSub, { fontSize: fs(7, 11, isDesktop) }]}>ORDEN DEL DESTINO • EDICIÓN PC</Text>
                                    </View>
                                    <View style={S.coinsRow}>
                                        <Image source={COIN_SPRITES.star} style={{ width: fs(14, 22, isDesktop), height: fs(14, 22, isDesktop) }} />
                                        <Text style={[S.coinsTxt, { fontSize: fs(10, 16, isDesktop) }]}>{starCoins}</Text>
                                    </View>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={Platform.OS === 'web'} contentContainerStyle={{ paddingBottom: 80 }}>
                                    <View style={S.sectionLblRow}>
                                        <Text style={[S.sectionLbl, { fontSize: fs(8, 12, isDesktop) }]}>{tab.toUpperCase()}</Text>
                                        <View style={S.sectionLine} />
                                    </View>

                                    <View style={[S.grid, { gap: isDesktop ? 16 : 10 }]}>
                                        {tab === 'heroes' && MAGE_ITEMS.map((h, i) => (
                                            <HeroCard key={h.id} item={h} index={i} isDesktop={isDesktop} cardWidth={cardWidth} owned={unlockedClasses.includes(h.id)} onPress={() => handleAction(h, 'hero')} />
                                        ))}
                                        {tab === 'items' && SHOP_ITEMS.map((item, i) => (
                                            <ShopCard key={item.name} item={item} index={i} type="item" isDesktop={isDesktop} cardWidth={cardWidth} onPress={() => handleAction(item, 'item')} />
                                        ))}
                                        {tab === 'cards' && CARD_ITEMS.map((item, i) => (
                                            <ShopCard key={item.name} item={item} index={i} type="card" isDesktop={isDesktop} cardWidth={cardWidth} onPress={() => handleAction(item, 'card')} />
                                        ))}
                                    </View>
                                </ScrollView>

                                <TouchableOpacity style={[S.closeBar, { height: fs(50, 64, isDesktop) }]} onPress={onClose}>
                                    <Text style={[S.closeBarTxt, { fontSize: fs(8, 11, isDesktop) }]}>▼ CERRAR CÓDICE ▼</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </Animated.View>

                {showConfetti && successItem && (
                    <PurchaseSuccessAnimation 
                        item={{
                            id: successItem.id || successItem.name, name: successItem.name,
                            type: successItem.type === 'hero' ? 'hero' : 'item',
                            icon: successItem.icon || '🌟', sprite: successItem.sprite
                        }} 
                        onClose={() => { setShowConfetti(false); setSuccessItem(null); }} 
                    />
                )}
            </View>
        </Modal>
    );
};

// ─── Sub-Componentes Internos ────────────────────────────────────────────────

const TabBtn = ({ icon, label, active, onPress, isDesktop }: any) => (
    <TouchableOpacity style={[S.tabBtn, active && S.tabBtnActive, isDesktop && { height: 64 }]} onPress={onPress}>
        <Text style={[S.tabIcon, { fontSize: fs(18, 24, isDesktop), color: active ? C.borderBright : C.inkDim }]}>{icon}</Text>
        {isDesktop && <Text style={{ color: active ? C.borderBright : C.inkDim, fontSize: 8, marginTop: 4, fontWeight: '900' }}>{label}</Text>}
        {active && <View style={S.tabIndicator} />}
    </TouchableOpacity>
);

const HeroCard = ({ item, owned, onPress, index, isDesktop, cardWidth }: any) => {
    const sprite = (CHAR_SPRITES as any)[item.id] || CHAR_SPRITES.hero_base;
    return (
        <Animated.View entering={FadeInDown.delay(index * 40)} style={[S.card, { width: cardWidth }, owned && S.cardOwned]}>
            <View style={[S.spriteFrame, isDesktop && { maxWidth: 160, maxHeight: 160, alignSelf: 'center' }]}>
                <Image source={sprite} style={S.pixelSprite} contentFit="contain" />
                {!owned && <View style={S.lockOverlay}><Ionicons name="lock-closed" size={fs(16, 24, isDesktop)} color={C.inkDim} /></View>}
            </View>
            <Text style={[S.heroName, { fontSize: fs(8, 13, isDesktop) }]}>{item.name}</Text>
            <Text style={[S.heroClass, { fontSize: fs(6, 10, isDesktop) }]}>{item.sub}</Text>
            
            {owned ? (
                <View style={S.ownedBanner}><Text style={[S.ownedTxt, { fontSize: fs(6, 9, isDesktop) }]}>✔ REGISTRADO</Text></View>
            ) : (
                <GlitchButton onPress={onPress} color={C.borderBright} isDesktop={isDesktop} style={{ marginTop: 8 }}>
                    {item.price}
                </GlitchButton>
            )}
        </Animated.View>
    );
};

const ShopCard = ({ item, onPress, index, isDesktop, cardWidth }: any) => (
    <Animated.View entering={FadeInDown.delay(index * 40)} style={[S.card, { width: cardWidth }]}>
        <View style={[S.spriteFrame, isDesktop && { maxWidth: 160, maxHeight: 160, alignSelf: 'center' }]}>
            {item.sprite ? <Image source={item.sprite} style={S.pixelSprite} contentFit="contain" /> : <Text style={{ fontSize: fs(24, 40, isDesktop) }}>{item.icon}</Text>}
        </View>
        <Text style={[S.heroName, { fontSize: fs(8, 13, isDesktop) }]}>{item.name}</Text>
        <GlitchButton onPress={onPress} color={item.color} isDesktop={isDesktop} style={{ marginTop: 8 }}>
            {item.price}
        </GlitchButton>
    </Animated.View>
);

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 4, 15, 0.98)', justifyContent: 'center', alignItems: 'center', zIndex: 20000 },
    grimoireShell: { backgroundColor: C.parchmentMid, borderRadius: 12, overflow: 'hidden', borderWidth: 6, borderColor: C.borderPixel, elevation: 20, position: 'relative' },
    scanlines: { ...StyleSheet.absoluteFillObject, opacity: 0.05, zIndex: 10 },
    coverFull: { flex: 1, backgroundColor: '#3E2723' },
    coverBg: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
    coverOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    coverTitle: { color: C.ink, fontWeight: '900', letterSpacing: 4, textAlign: 'center', marginTop: 24 },
    coverSub: { color: C.inkDim, fontWeight: '700', letterSpacing: 1, marginTop: 12 },

    spine: { height: '100%', backgroundColor: C.parchmentLight, borderRightWidth: 3, borderColor: C.borderPixel, paddingTop: 40, gap: 20, alignItems: 'center' },
    tabBtn: { width: '80%', height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: C.parchmentMid, borderWidth: 2, borderColor: C.borderPixel },
    tabBtnActive: { backgroundColor: '#4a2c14', borderColor: C.borderBright, width: '90%', marginLeft: 10 },
    tabIcon: { textAlign: 'center' },
    tabIndicator: { position: 'absolute', right: -2, width: 3, height: '70%', backgroundColor: C.borderBright },

    page: { flex: 1, padding: 16, backgroundColor: C.parchmentMid },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderColor: C.borderPixel },
    headerTitle: { color: C.inkBright, fontWeight: '900', letterSpacing: 1 },
    headerSub: { color: C.inkDim, marginTop: 4 },
    coinsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a0e04', padding: 6, borderRadius: 4, borderWidth: 1.5, borderColor: C.borderBright },
    coinsTxt: { color: C.inkBright, fontWeight: '900' },

    sectionLblRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    sectionLbl: { color: C.borderBright, fontWeight: '900', letterSpacing: 2 },
    sectionLine: { flex: 1, height: 1, backgroundColor: C.borderPixel },

    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    card: { backgroundColor: '#1a0e04', padding: 8, borderWidth: 1.5, borderColor: C.borderPixel, borderRadius: 4, marginBottom: 16 },
    cardOwned: { borderColor: C.accentGreen },
    spriteFrame: { width: '100%', aspectRatio: 1, backgroundColor: '#0d0704', borderWidth: 1.5, borderColor: C.borderPixel, marginBottom: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    pixelSprite: { width: '80%', height: '80%' },
    lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    heroName: { color: C.ink, fontWeight: '900', marginBottom: 2 },
    heroClass: { color: C.inkDim, marginBottom: 6 },
    ownedBanner: { borderTopWidth: 1, borderColor: C.accentGreen, paddingTop: 6, alignItems: 'center' },
    ownedTxt: { color: '#4ADE80', fontWeight: '900' },

    closeBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.parchmentMid, borderTopWidth: 2, borderColor: C.borderPixel, justifyContent: 'center', alignItems: 'center' },
    closeBarTxt: { color: C.inkDim, fontWeight: '900', letterSpacing: 2 },

    // Estilos Portal Avanzado
    pWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pc1: { borderRadius: 1000, height: 260, width: 260, borderWidth: 2, borderColor: '#e7b439', justifyContent: 'center', alignItems: 'center' },
    pc2: { borderRadius: 1000, height: 240, width: 240, borderWidth: 1.5, borderColor: '#ffb61e', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    pc3: { borderRadius: 1000, height: 220, width: 220, borderWidth: 1, borderColor: '#ffb61e', justifyContent: 'center', alignItems: 'center' },
    pr1: { height: 140, width: 140, borderWidth: 1, borderColor: '#ffb61e', borderStyle: 'dotted', justifyContent: 'center', alignItems: 'center' },
    pc4: { borderRadius: 1000, height: 140, width: 140, borderWidth: 1, borderColor: '#ffb61e', borderStyle: 'dotted', justifyContent: 'center', alignItems: 'center' },
    pr2: { height: 90, width: 90, borderWidth: 1, borderColor: '#ffb61e', justifyContent: 'center', alignItems: 'center' },
    pr3: { height: 90, width: 90, borderWidth: 1, borderColor: '#ffb61e', transform: [{ rotate: '45deg' }] },
    pc5: { position: 'absolute', borderRadius: 1000, height: 80, width: 80, borderWidth: 1, borderColor: '#ffb61e' },
    pc6: { position: 'absolute', borderRadius: 1000, height: 60, width: 60, borderWidth: 3, borderColor: '#ffb61e' },
    pTxt: { color: C.inkBright, fontSize: 11, fontWeight: '900', marginTop: 50, letterSpacing: 3 },
    
    // Anillos Cinéticos
    ringLoader: { position: 'absolute', width: 340, height: 340, justifyContent: 'center', alignItems: 'center' },
    pRing: { position: 'absolute', width: 120, height: 120, borderRadius: 1000, borderWidth: 2, borderBottomWidth: 0, borderRightWidth: 0 },

    // Botón Glitch
    glitchContainer: { height: 44, justifyContent: 'center' },
    glitchShell: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
    glitchTxt: { fontWeight: '900', letterSpacing: 1, zIndex: 5 },
    gCorner: { position: 'absolute', width: 14, height: 14, transform: [{ rotate: '45deg' }], zIndex: 10 },
    gTL: { top: -7, left: -7 }, gTR: { top: -7, right: -7 },
    gBL: { bottom: -7, left: -7 }, gBR: { bottom: -7, right: -7 },
});
