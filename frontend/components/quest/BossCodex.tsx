// components/quest/BossCodex.tsx
// TokaVerse — Códice de Jefes: Registro de Amenazas Financieras
// Portal Alquímico Híbrido · Lore de Jefes y Enemigos · Optimización PC

import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, 
    Dimensions, Platform, Alert, useWindowDimensions 
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Polygon, Rect, G, Circle } from 'react-native-svg';
import { usePlayerStore } from '../../store/usePlayerStore';
import { ITEM_SPRITES, COIN_SPRITES } from '../../data/classSkills';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
    useSharedValue, useAnimatedStyle, withTiming, withRepeat, 
    Easing, withSequence, withDelay, FadeIn, FadeOut, ZoomIn, FadeInDown,
    withSpring
} from 'react-native-reanimated';

// ─── Diseño de Colores (Obsidian & Ruby) ───────────────────────────────────
const C = {
    obsidian:      '#0a0a12',
    obsidianMid:   '#12121e',
    obsidianLight: '#1e1e2d',
    ruby:          '#ef4444',
    rubyDim:       '#7f1d1d',
    rubyBright:    '#f87171',
    ink:            '#f1f5f9',
    inkDim:         '#94a3b8',
    inkBright:      '#ffffff',
    borderPixel:    '#1e1e24',
    borderBright:   '#ef4444',
    portalColors:   ['#ef4444', '#b91c1c', '#7f1d1d', '#450a0a', '#000000'],
};

// ─── Helpers Responsivos ─────────────────────────────────────────────────────
const fs = (mobile: number, desktop: number, isDesktop: boolean) => isDesktop ? desktop : mobile;

// ─── Datos de Jefes (Lore) ──────────────────────────────────────────────────
const BOSS_LORE = [
    { 
        id: 'toka_despensa', 
        name: 'EL CARRITO VACÍO', 
        sub: 'Entidad de la Carencia', 
        lore: 'Nace de las almas que olvidan su lista de compras. Su hambre es insaciable y solo puede ser aplacada con una gestión de despensa impecable.',
        weakness: 'Planificación Semanal',
        icon: '🛒',
        color: '#22C55E'
    },
    { 
        id: 'toka_fuel', 
        name: 'EL TANQUE VACÍO', 
        sub: 'Espectro de la Inmovilidad', 
        lore: 'Un antiguo motor que se alimenta de la desesperación de los varados. Representa la falta de previsión en los gastos de transporte.',
        weakness: 'Carga de Gasolina Eficiente',
        icon: '⛽',
        color: '#F59E0B'
    },
    { 
        id: 'toka_connect', 
        name: 'EL GASTO SIN COMPROBAR', 
        sub: 'Leviatán de Papel', 
        lore: 'Compuesto por miles de tickets perdidos en el tiempo. Ignorarlo solo lo hace crecer, alimentándose de la desorganización fiscal.',
        weakness: 'Validación Connect',
        icon: '📑',
        color: '#EF4444'
    },
    { 
        id: 'abyss', 
        name: 'EL ABISMO DE DEUDA', 
        sub: 'Singularidad Financiera', 
        lore: 'El punto de no retorno donde los intereses se vuelven infinitos. Solo los guerreros más disciplinados pueden escapar de su gravedad.',
        weakness: 'Ahorro Constante',
        icon: '🕳️',
        color: '#9333ea'
    },
];

// ─── Componentes ─────────────────────────────────────────────────────────────

/** Portal Místico de Bosses (Fuego y Sombras) */
const BossPortal = () => {
    const rotOuter = useSharedValue(0);
    const rotInner = useSharedValue(0);
    
    useEffect(() => {
        rotOuter.value = withRepeat(withTiming(-360, { duration: 5000, easing: Easing.linear }), -1, false);
        rotInner.value = withRepeat(withTiming(360, { duration: 3000, easing: Easing.linear }), -1, false);
    }, []);

    const outerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotOuter.value}deg` }] }));
    const innerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotInner.value}deg` }] }));

    return (
        <View style={S.pWrap}>
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

            <View style={S.ringLoader}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <KineticRing key={i} index={i} total={8} />
                ))}
            </View>

            <Text style={S.pTxt}>INVOCANDO REGISTROS OSCUROS...</Text>
        </View>
    );
};

const KineticRing = ({ index, total }: any) => {
    const rot = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacityVal = useSharedValue(0.4);
    const color = C.portalColors[index % C.portalColors.length];

    useEffect(() => {
        rot.value = withDelay(index * -500, withRepeat(withTiming(360, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1) }), -1, false));
        scale.value = withRepeat(withTiming(1.4, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
        opacityVal.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rot.value}deg` }, { scale: scale.value }],
        borderColor: color,
        opacity: opacityVal.value,
        borderWidth: 2,
    }));

    return <Animated.View style={[S.pRing, style]} />;
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export const BossCodex = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const [phase, setPhase] = useState<'cover' | 'portal' | 'open'>('cover');
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const portalTimer = useRef<any>(null);

    useEffect(() => { if (visible) setPhase('cover'); }, [visible]);

    const handleCoverPress = () => {
        setPhase('portal');
        portalTimer.current = setTimeout(() => { setPhase('open'); }, 2000);
    };
    
    useEffect(() => () => { if (portalTimer.current) clearTimeout(portalTimer.current); }, []);

    // Dimensiones Responsivas
    const GR_W = isDesktop ? Math.min(width * 0.85, 1200) : width * 0.94;
    const GR_H = isDesktop ? 750 : 660;
    const spineW = isDesktop ? 64 : 44;
    const paddingX = 16;
    const pageWidth = GR_W - spineW - paddingX * 2;
    const cardWidth = isDesktop ? (pageWidth - 16 * 2) / 3 : pageWidth;

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={S.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                
                <Animated.View entering={ZoomIn} style={[S.grimoireShell, { width: GR_W, height: GR_H }]}>
                    
                    {phase === 'cover' && (
                        <TouchableOpacity style={S.coverFull} onPress={handleCoverPress}>
                            <View style={[S.coverBg, { backgroundColor: '#1a0a0a', borderColor: '#450a0a', borderWidth: 8 }]} />
                            <View style={S.coverOverlay}>
                                <MaterialCommunityIcons name="skull-outline" size={fs(60, 100, isDesktop)} color={C.rubyBright} />
                                <Text style={[S.coverTitle, { fontSize: fs(24, 42, isDesktop) }]}>CÓDICE DE AMENAZAS</Text>
                                <Text style={[S.coverSub, { fontSize: fs(10, 16, isDesktop) }]}>REGISTROS DE LAS DEUDAS LEGENDARIAS</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {phase === 'portal' && <BossPortal />}

                    {phase === 'open' && (
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <View style={S.scanlines} pointerEvents="none" />
                            
                            {/* SPINE (Sidebar) */}
                            <View style={[S.spine, { width: spineW }]}>
                                <TouchableOpacity style={S.tabBtnActive}>
                                    <Text style={[S.tabIcon, { fontSize: fs(18, 24, isDesktop), color: C.rubyBright }]}>👹</Text>
                                </TouchableOpacity>
                            </View>

                            {/* MAIN PAGE */}
                            <View style={S.page}>
                                <View style={[S.header, { paddingBottom: fs(10, 18, isDesktop), marginBottom: fs(15, 22, isDesktop) }]}>
                                    <View>
                                        <Text style={[S.headerTitle, { fontSize: fs(14, 24, isDesktop) }]}>ANALES DEL CAOS FINANCIERO</Text>
                                        <Text style={[S.headerSub, { fontSize: fs(7, 11, isDesktop) }]}>CLASIFICACIÓN SIGMA • ACCESO RESTRINGIDO</Text>
                                    </View>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
                                    <View style={[S.grid, { gap: isDesktop ? 16 : 10 }]}>
                                        {BOSS_LORE.map((b, i) => (
                                            <BossLoreCard key={b.id} item={b} index={i} isDesktop={isDesktop} cardWidth={cardWidth} />
                                        ))}
                                    </View>
                                </ScrollView>

                                <TouchableOpacity style={[S.closeBar, { height: fs(50, 64, isDesktop) }]} onPress={onClose}>
                                    <Text style={[S.closeBarTxt, { fontSize: fs(8, 11, isDesktop) }]}>▼ SELLAR CÓDICE ▼</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const BossLoreCard = ({ item, index, isDesktop, cardWidth }: any) => (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={[S.card, { width: cardWidth }]}>
        <View style={S.cardHead}>
            <Text style={S.cardIcon}>{item.icon}</Text>
            <View>
                <Text style={[S.cardName, { color: item.color }]}>{item.name}</Text>
                <Text style={S.cardSub}>{item.sub}</Text>
            </View>
        </View>
        <View style={S.divider} />
        <Text style={S.loreTxt}>{item.lore}</Text>
        <View style={S.weakBox}>
            <Text style={S.weakTitle}>DEBILIDAD DETECTADA:</Text>
            <Text style={S.weakVal}>{item.weakness}</Text>
        </View>
    </Animated.View>
);

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 20000 },
    grimoireShell: { backgroundColor: C.obsidianMid, borderRadius: 12, overflow: 'hidden', borderWidth: 6, borderColor: C.borderPixel, elevation: 20, position: 'relative' },
    scanlines: { ...StyleSheet.absoluteFillObject, opacity: 0.1, zIndex: 10 },
    coverFull: { flex: 1, backgroundColor: '#1a0a0a' },
    coverBg: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
    coverOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    coverTitle: { color: C.rubyBright, fontWeight: '900', letterSpacing: 4, textAlign: 'center', marginTop: 24 },
    coverSub: { color: C.rubyDim, fontWeight: '700', letterSpacing: 1, marginTop: 12 },

    spine: { height: '100%', backgroundColor: C.obsidianLight, borderRightWidth: 3, borderColor: C.borderPixel, paddingTop: 40, alignItems: 'center' },
    tabBtnActive: { width: '80%', height: 64, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2a0a0a', borderWidth: 2, borderColor: C.rubyBright },
    tabIcon: { textAlign: 'center' },

    page: { flex: 1, padding: 16, backgroundColor: C.obsidianMid },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderColor: C.borderPixel },
    headerTitle: { color: C.rubyBright, fontWeight: '900', letterSpacing: 1 },
    headerSub: { color: C.inkDim, marginTop: 4 },

    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    card: { backgroundColor: '#0a0a0a', padding: 20, borderWidth: 1.5, borderColor: C.borderPixel, borderRadius: 4, marginBottom: 16 },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 15 },
    cardIcon: { fontSize: 32 },
    cardName: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    cardSub: { fontSize: 10, color: C.rubyDim, fontWeight: '800', textTransform: 'uppercase' },
    divider: { height: 1, backgroundColor: C.borderPixel, marginBottom: 15 },
    loreTxt: { color: C.inkDim, fontSize: 12, lineHeight: 18, marginBottom: 15 },
    weakBox: { backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
    weakTitle: { color: C.rubyBright, fontSize: 9, fontWeight: '900', marginBottom: 4 },
    weakVal: { color: '#FFF', fontSize: 11, fontWeight: '700' },

    closeBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.obsidianMid, borderTopWidth: 2, borderColor: C.borderPixel, justifyContent: 'center', alignItems: 'center' },
    closeBarTxt: { color: C.rubyDim, fontWeight: '900', letterSpacing: 2 },

    pWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pc1: { borderRadius: 1000, height: 260, width: 260, borderWidth: 2, borderColor: C.rubyDim, justifyContent: 'center', alignItems: 'center' },
    pc2: { borderRadius: 1000, height: 240, width: 240, borderWidth: 1.5, borderColor: C.ruby, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    pc3: { borderRadius: 1000, height: 220, width: 220, borderWidth: 1, borderColor: C.rubyBright, justifyContent: 'center', alignItems: 'center' },
    pr1: { height: 140, width: 140, borderWidth: 1, borderColor: C.ruby, borderStyle: 'dotted', justifyContent: 'center', alignItems: 'center' },
    pc4: { borderRadius: 1000, height: 140, width: 140, borderWidth: 1, borderColor: C.ruby, borderStyle: 'dotted', justifyContent: 'center', alignItems: 'center' },
    pr2: { height: 90, width: 90, borderWidth: 1, borderColor: C.ruby, justifyContent: 'center', alignItems: 'center' },
    pr3: { height: 90, width: 90, borderWidth: 1, borderColor: C.ruby, transform: [{ rotate: '45deg' }] },
    pc5: { position: 'absolute', borderRadius: 1000, height: 80, width: 80, borderWidth: 1, borderColor: C.ruby },
    pc6: { position: 'absolute', borderRadius: 1000, height: 60, width: 60, borderWidth: 3, borderColor: C.rubyBright },
    pTxt: { color: C.rubyBright, fontSize: 11, fontWeight: '900', marginTop: 50, letterSpacing: 3 },
    ringLoader: { position: 'absolute', width: 340, height: 340, justifyContent: 'center', alignItems: 'center' },
    pRing: { position: 'absolute', width: 130, height: 130, borderRadius: 1000, borderWidth: 2, borderBottomWidth: 0, borderRightWidth: 0 },
});
