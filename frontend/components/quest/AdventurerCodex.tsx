// components/quest/AdventurerCodex.tsx
// TokaVerse — Códice Mercader Pixel-Art Premium
// Fix: el libro solo se abre al tocar · ArcanePortal al abrir · layout mejorado

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Modal, Dimensions, Alert, Platform,
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring, withTiming,
    withRepeat, withSequence, withDelay,
    Easing, runOnJS, cancelAnimation,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { usePlayerStore } from '../../store/usePlayerStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { CHAR_SPRITES, ITEM_SPRITES, COIN_SPRITES } from '../../data/classSkills';
import { ELEMENT_INFO, CLASS_ELEMENTS } from '../../types/elements';
import { PurchaseSuccessAnimation } from './PurchaseSuccessAnimation';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Paleta de Colores Pixel-Art (Parchment & Ink) ────────────────────────────
const C = {
    parchment:      '#2a1a0e',
    parchmentMid:   '#1e110a',
    parchmentLight: '#3d2512',
    ink:            '#f0d9a0',
    inkDim:         '#a08050',
    inkBright:      '#ffd700',
    accentRed:      '#8b1a1a',
    accentGreen:    '#1a5c2a',
    accentBlue:     '#1a3a6b',
    borderPixel:    '#6b4420',
    borderBright:   '#c8860a',
    runeGlow:       '#d4a017',
    gold:           '#ffd700',
    goldDim:        '#c8860a',
};

// ─── Datos de héroes (inmutables) ─────────────────────────────────────────────
interface CodexHero {
    id: string; name: string; subtitle: string;
    price: number; gender: 'M' | 'F' | 'N'; description: string;
}

const ALL_HEROES: CodexHero[] = [
    { id: 'warrior',    name: 'SAMURAI',    subtitle: 'Guerrero',    price: 0,    gender: 'M', description: 'Maestro de la espada y la disciplina financiera.' },
    { id: 'archer',     name: 'YUSHU',      subtitle: 'Arquero',     price: 0,    gender: 'M', description: 'Ataques precisos desde la distancia del ahorro.' },
    { id: 'knight',     name: 'CABALLERO',  subtitle: 'Tanque',      price: 0,    gender: 'M', description: 'Un muro inamovible frente a las deudas.' },
    { id: 'mage',       name: 'MAHŌTSUKAI', subtitle: 'Maga',        price: 0,    gender: 'F', description: 'Controla el hielo del ahorro acumulado.' },
    { id: 'kitsune',    name: 'KITSUNE',    subtitle: 'Espíritu',    price: 0,    gender: 'F', description: 'Misticismo y sanación de flujo de caja.' },
    { id: 'thief',      name: 'GŌTŌ',       subtitle: 'Ladrona',     price: 0,    gender: 'F', description: 'Experta en obtener botines y cashback.' },
    { id: 'hacker',     name: 'HACKER',     subtitle: 'Ciber-Mago',  price: 500,  gender: 'M', description: 'Manipula el sistema para golpes críticos.' },
    { id: 'banker',     name: 'SHŌNIN',     subtitle: 'Mercader',    price: 750,  gender: 'M', description: 'Maximiza los intereses y las inversiones.' },
    { id: 'magedark',   name: 'ANKOKU',     subtitle: 'Maga Oscura', price: 1000, gender: 'F', description: 'Poder prohibido que consume deuda.' },
    { id: 'dog',        name: 'INU',        subtitle: 'Can Guardián',price: 300,  gender: 'N', description: 'Lealtad inquebrantable y defensa extra.' },
    { id: 'cat',        name: 'NEKO',       subtitle: 'Felino Veloz',price: 300,  gender: 'N', description: 'Suerte y evasión en cada transacción.' },
    { id: 'fox',        name: 'KITSUNE-BI', subtitle: 'Zorro Ígneo', price: 400,  gender: 'N', description: 'Regeneración mágica y fuego fatuo.' },
    { id: 'elf',        name: 'ERUFU',      subtitle: 'Elfo Silvano',price: 650,  gender: 'N', description: 'Espíritu del bosque con agilidad extrema.' },
    { id: 'mermaid',    name: 'NINGYO',     subtitle: 'Sirena',      price: 800,  gender: 'F', description: 'Canto místico que restaura flujo de caja.' },
    { id: 'witch',      name: 'MAJO',       subtitle: 'Bruja',       price: 900,  gender: 'F', description: 'Hechizos oscuros de alta rentabilidad.' },
    { id: 'knigh_girl', name: 'PALADÍN',    subtitle: 'Guardiana',   price: 700,  gender: 'F', description: 'Armadura sagrada contra el fraude.' },
    { id: 'knigh_red',  name: 'BERSERKER',  subtitle: 'Cab. Rojo',   price: 850,  gender: 'M', description: 'Ataque feroz alimentado por la pasión.' },
    { id: 'leona',      name: 'LEONA',      subtitle: 'Guerrera',    price: 750,  gender: 'F', description: 'Fuerza bruta y nobleza de espíritu.' },
    { id: 'maid',       name: 'MEIDO',      subtitle: 'Sirvienta',   price: 550,  gender: 'F', description: 'Eficiencia y orden en cada gasto.' },
    { id: 'santa',      name: 'KLAUS',      subtitle: 'San Nicolás', price: 1200, gender: 'M', description: 'Repartidor de bendiciones y bonos.' },
];

const SHOP_ITEMS = [
    { id: 'item_potion_hp',      name: 'POCIÓN HP',       price: 25,   icon: '🧪', sprite: ITEM_SPRITES.potion, color: C.accentRed },
    { id: 'item_potion_mana',    name: 'POCIÓN MANÁ',     price: 30,   icon: '💧', sprite: ITEM_SPRITES.potion_mana, color: C.accentBlue },
    { id: 'item_potion_strong',  name: 'MEGA POCIÓN',     price: 60,   icon: '🧪', sprite: ITEM_SPRITES.potion_strong, color: '#6b1a6b' },
    { id: 'item_ring_strong',    name: 'ANILLO PODER',    price: 250,  icon: '💍', sprite: ITEM_SPRITES.ring_strong, color: C.borderBright },
    { id: 'item_sword_diamond',  name: 'ESPADA DIAMANTE', price: 800,  icon: '⚔️', sprite: ITEM_SPRITES.sword_diamond, color: '#1a5c6b' },
    { id: 'item_shield_element', name: 'ESCUDO ELEM.',    price: 500,  icon: '🛡️', sprite: ITEM_SPRITES.shield_elemental, color: '#3a5c1a' },
    { id: 'item_ritual_incense', name: 'INCIENSO RITUAL', price: 300,  icon: '🕯️', sprite: ITEM_SPRITES.ritual_incense, color: '#4a2c14' },
];

const SHOP_CARDS = [
    { id: 'item_card_xp',    name: 'CARTA XP',      price: 150, icon: '🎴', sprite: ITEM_SPRITES.card_xp, color: C.borderBright },
    { id: 'item_card_hp',    name: 'CARTA VIDA',    price: 200, icon: '🎴', sprite: ITEM_SPRITES.card_hp, color: C.accentRed },
    { id: 'item_card_mana',  name: 'CARTA MANÁ',    price: 200, icon: '🎴', sprite: ITEM_SPRITES.card_mana, color: C.accentBlue },
    { id: 'item_card_energy',name: 'CARTA ENERGÍA', price: 250, icon: '⚡', sprite: ITEM_SPRITES.card_energy, color: '#c084fc' },
];

const TABS = {
    heroes: { label: 'HEROES', icon: '⚔' },
    items:  { label: 'ITEMS',  icon: '⚗' },
    cards:  { label: 'CARDS',  icon: '♦' },
} as const;

// ─── Sub-componentes Visuales ──────────────────────────────────────────────────
const Scanlines = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" >
        {[0, 40, 80, 120, 160, 200, 240, 300, 360, 420, 480, 540].map(top => (
            <View key={top} style={[v.scanlineLine, { top }]} />
        ))}
    </View>
);

const CornerOrnaments = () => (
    <>
        <Text style={[v.corner, { top: 8, left: 8 }]}>◆</Text>
        <Text style={[v.corner, { top: 8, right: 8 }]}>◆</Text>
        <Text style={[v.corner, { bottom: 8, left: 8 }]}>◆</Text>
        <Text style={[v.corner, { bottom: 8, right: 8 }]}>◆</Text>
    </>
);

const PixelLock = () => (
    <View style={v.lockContainer}>
        <View style={v.lockShackle} />
        <View style={v.lockBody} />
    </View>
);

// ─── ArcanePortal — Animación de apertura del grimorio ───────────────────────
// Traducida de CSS (styled-components) a React Native Reanimated
const ArcanePortal = ({ onDone }: { onDone: () => void }) => {
    // 4 anillos: rotaciones lentas invertidas
    const rot1 = useSharedValue(0);
    const rot2 = useSharedValue(0);
    const rot3 = useSharedValue(0);
    const rot4 = useSharedValue(0);
    const fade = useSharedValue(0);
    const scale = useSharedValue(0.4);

    useEffect(() => {
        // Fade in
        fade.value  = withTiming(1, { duration: 400 });
        scale.value = withSpring(1, { damping: 14, stiffness: 90 });
        // Rotaciones continuas a distintas velocidades
        rot1.value = withRepeat(withTiming(360,  { duration: 3200, easing: Easing.linear }), -1, false);
        rot2.value = withRepeat(withTiming(-360, { duration: 2400, easing: Easing.linear }), -1, false);
        rot3.value = withRepeat(withTiming(360,  { duration: 1800, easing: Easing.linear }), -1, false);
        rot4.value = withRepeat(withTiming(-360, { duration: 1200, easing: Easing.linear }), -1, false);
        // Terminar la animación luego de 1.4s
        const timer = setTimeout(() => {
            fade.value = withTiming(0, { duration: 300 }, () => runOnJS(onDone)());
        }, 1400);
        return () => clearTimeout(timer);
    }, []);

    const wrapStyle  = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: scale.value }] }));
    const r1Style    = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot1.value}deg` }] }));
    const r2Style    = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot2.value}deg` }] }));
    const r3Style    = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot3.value}deg` }] }));
    const r4Style    = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot4.value}deg` }] }));

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={portal.center}>
                <Animated.View style={[wrapStyle]}>
                    {/* Ring 1 — outer solid */}
                    <Animated.View style={[portal.ring, portal.r1, r1Style]}>
                        {/* Ring 2 — dashed */}
                        <Animated.View style={[portal.ring, portal.r2, r2Style]}>
                            {/* Ring 3 — solid */}
                            <Animated.View style={[portal.ring, portal.r3, r3Style]}>
                                {/* Ring 4 — inner thick */}
                                <Animated.View style={[portal.ring, portal.r4, r4Style]} />
                            </Animated.View>
                        </Animated.View>
                    </Animated.View>
                    {/* Corner satellites */}
                    {[{ top: -16, left: '37%' }, { top: '37%', left: -16 }, { top: '37%', right: -16 }, { bottom: -16, left: '37%' }].map((pos: any, i) => (
                        <View key={i} style={[portal.satellite, pos]} />
                    ))}
                </Animated.View>
            </View>
        </View>
    );
};

// ─── HeroCard ───────────────────────────────────────────────────────────────────
const HeroCard = ({ hero, onBuy, isUnlocked }: { hero: CodexHero; onBuy: () => void; isUnlocked: boolean }) => {
    const elements = CLASS_ELEMENTS[hero.id] || { primary: 'light' };
    const elemInfo = (ELEMENT_INFO as any)[elements.primary] || { color: C.inkDim, emoji: '✨' };
    
    return (
        <TouchableOpacity activeOpacity={0.8} style={[card.shell, isUnlocked && card.shellOwned]} onPress={onBuy}>
            <View style={card.spriteFrame}>
                <Image 
                    source={(CHAR_SPRITES as any)[hero.id]} 
                    style={[card.sprite, !isUnlocked && { opacity: 0.15 }]} 
                    contentFit="contain" 
                />
                {!isUnlocked && <PixelLock />}
                <Text style={[v.pxCorner, { top: 2, left: 2 }]}>■</Text>
                <Text style={[v.pxCorner, { bottom: 2, right: 2 }]}>■</Text>
            </View>
            <Text style={card.name} numberOfLines={1}>{hero.name}</Text>
            <Text style={card.sub}>{hero.subtitle}</Text>
            <View style={[card.elemTag, { borderColor: elemInfo.color + '44' }]}>
                <Text style={[card.elemTagTxt, { color: elemInfo.color }]}>{elemInfo.emoji} {hero.subtitle.split(' ')[0].toUpperCase()}</Text>
            </View>
            
            {isUnlocked ? (
                <View style={card.ownedBanner}>
                    <Text style={card.ownedTxt}>✔ REGISTRADO</Text>
                </View>
            ) : (
                <View style={card.buyBtn}>
                    <Image source={COIN_SPRITES.star} style={card.starIconCoin} contentFit="contain" />
                    <Text style={card.priceTxt}>{hero.price || 'LIBRE'}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// ─── ShopCard ───────────────────────────────────────────────────────────────────
const ShopCard = ({ item, onBuy, accent = C.inkBright }: { item: any; onBuy: () => void; accent?: string }) => (
    <TouchableOpacity activeOpacity={0.8} style={[card.shell, { borderColor: accent + '66' }]} onPress={onBuy}>
        <View style={[card.spriteFrame, { borderColor: accent + '44' }]}>
            <Image source={item.sprite} style={card.sprite} contentFit="contain" />
            <Text style={[v.pxCorner, { top: 2, left: 2, color: accent }]}>■</Text>
            <Text style={[v.pxCorner, { bottom: 2, right: 2, color: accent }]}>■</Text>
        </View>
        <Text style={card.name} numberOfLines={1}>{item.name}</Text>
        <View style={[card.buyBtn, { borderColor: accent, backgroundColor: accent + '1a' }]}>
            <Image source={COIN_SPRITES.star} style={card.starIconCoin} contentFit="contain" />
            <Text style={[card.priceTxt, { color: accent }]}>{item.price}</Text>
        </View>
    </TouchableOpacity>
);

// ─── Typewriter Title ────────────────────────────────────────────────────────────
const TypewriterTitle = ({ text }: { text: string }) => {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) clearInterval(interval);
        }, 55);
        return () => clearInterval(interval);
    }, [text]);
    return (
        <View>
            <Text style={s.grimoireTitle}>{displayed}<Text style={{color:C.inkDim}}>_</Text></Text>
            <Text style={s.grimoireSub}>ORDEN DE AVENTUREROS</Text>
        </View>
    );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export function AdventurerCodex({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const [tab, setTab] = useState<'heroes' | 'items' | 'cards'>('heroes');
    // 'cover' = portada cerrada, 'portal' = animación ArcanePortal, 'open' = grimorio abierto
    const [phase, setPhase] = useState<'cover' | 'portal' | 'open'>('cover');
    const { starCoins, unlockedClasses, unlockClass, addStarCoins } = usePlayerStore();
    const { addItem } = useInventoryStore();

    const [showSuccess, setShowSuccess] = useState(false);
    const [successItem, setSuccessItem] = useState<any>(null);

    // ── Animaciones ──────────────────────────────────────────────────────────
    const modalY    = useSharedValue(SCREEN_H);
    const coverOp   = useSharedValue(1);
    const bookOp    = useSharedValue(0);
    const flashOp   = useSharedValue(0);

    // Reset al abrir/cerrar el modal — NO auto-abre el libro
    useEffect(() => {
        if (visible) {
            setPhase('cover');
            coverOp.value = 1;
            bookOp.value  = 0;
            modalY.value  = withSpring(0, { damping: 20, stiffness: 90 });
        } else {
            modalY.value = withTiming(SCREEN_H, { duration: 250 });
            setPhase('cover');
        }
    }, [visible]);

    // El usuario toca la portada → fase portal → fase open
    const handleCoverPress = () => {
        if (phase !== 'cover') return;
        // Fade out cover
        coverOp.value = withTiming(0, { duration: 250 });
        setPhase('portal'); // muestra ArcanePortal
    };

    // ArcanePortal termina → mostrar libro
    const handlePortalDone = () => {
        bookOp.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });
        flashOp.value = withSequence(
            withTiming(0.7, { duration: 80 }),
            withTiming(0,   { duration: 450 }),
        );
        setPhase('open');
    };

    const coverStyle = useAnimatedStyle(() => ({
        opacity: coverOp.value,
    }));
    const bookStyle  = useAnimatedStyle(() => ({
        opacity: bookOp.value,
    }));
    const flashStyle = useAnimatedStyle(() => ({ opacity: flashOp.value }));
    const modalStyle = useAnimatedStyle(() => ({ transform: [{ translateY: modalY.value }] }));

    // logic
    const triggerSuccess = useCallback((item: any) => { setSuccessItem(item); setShowSuccess(true); }, []);

    const handleBuyHero = (hero: CodexHero) => {
        if (unlockedClasses.includes(hero.id)) return;
        if (hero.price > starCoins) {
            Alert.alert('🌟 Monedas Insuficientes', `Necesitas ${hero.price} Estrellas. Tienes ${starCoins}.`); return;
        }
        addStarCoins(-hero.price);
        unlockClass(hero.id);
        triggerSuccess({ id: hero.id, name: hero.name, type: 'hero' });
    };

    const handleBuyItem = (item: any) => {
        if (item.price > starCoins) {
            Alert.alert('🌟 Monedas Insuficientes', `Necesitas ${item.price} Estrellas.`); return;
        }
        const invItem = {
            id: `INV_${Date.now()}`,
            name: item.name, rarity: item.price > 500 ? 'legendary' : item.price > 200 ? 'rare' : 'uncommon',
            type: item.id.includes('potion') ? 'consumable' : item.id.includes('sword') ? 'weapon' : 'protection',
            pixelArt: item.id, icon: item.icon,
            stats: item.id.includes('hp') ? { hp: 50 } : item.id.includes('mana') ? { mana: 40 } : item.id.includes('sword') ? { atk: 25 } : { def: 15 },
            durability: 20, maxDurability: 20, description: 'Objeto adquirido en el Códice.',
        };
        const ok = useInventoryStore.getState().addItem(invItem as any, 'Códice');
        if (ok) { addStarCoins(-item.price); triggerSuccess({ id: item.id, name: item.name, type: 'item', pixelArt: item.id }); }
        else Alert.alert('⚠️ Inventario Lleno', 'No tienes espacio.');
    };

    const handleBuyCard = (c: any) => {
        if (c.price > starCoins) {
            Alert.alert('🌟 Monedas Insuficientes', `Necesitas ${c.price} Estrellas.`); return;
        }
        const invCard = {
            id: `CARD_${Date.now()}`,
            name: c.name, rarity: c.price > 400 ? 'legendary' : 'rare',
            type: 'card', pixelArt: c.id, icon: c.icon, description: 'Carta del Códice.',
        };
        const ok = useInventoryStore.getState().addItem(invCard as any, 'Códice');
        if (ok) { addStarCoins(-c.price); triggerSuccess({ id: c.id, name: c.name, type: 'card', pixelArt: c.id }); }
        else Alert.alert('⚠️ Sin Espacio', 'Libera espacio en tu inventario.');
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
            <View style={s.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
                
                <Animated.View style={[s.grimoireShell, modalStyle]}>
                    <Scanlines />
                    <CornerOrnaments />
                    
                    {/* ── PORTADA CERRADA — solo se abre al tap ──── */}
                    {phase === 'cover' && (
                        <Animated.View style={[StyleSheet.absoluteFill, s.coverContainer, coverStyle]}>
                            <TouchableOpacity
                                style={[StyleSheet.absoluteFill, s.coverContent]}
                                onPress={handleCoverPress}
                                activeOpacity={0.9}
                            >
                                <View style={s.coverLogoBox}>
                                    <View style={[s.coverRing, { position: 'absolute', width: 90, height: 90, borderRadius: 45, opacity: 0.25 }]} />
                                    <View style={[s.coverRing, { position: 'absolute', width: 66, height: 66, borderRadius: 33, opacity: 0.45 }]} />
                                    <MaterialCommunityIcons name="book-open-variant" size={44} color={C.inkDim} />
                                </View>
                                <Text style={s.coverTitle}>CÓDICE</Text>
                                <Text style={s.coverSub}>MERCADER</Text>
                                <View style={s.coverHint}>
                                    <Text style={s.coverHintTxt}>[ TOCA PARA ABRIR ]</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* ── ARCANE PORTAL — animación de apertura ───── */}
                    {phase === 'portal' && (
                        <View style={[StyleSheet.absoluteFill, s.portalBg]}>
                            <ArcanePortal onDone={handlePortalDone} />
                        </View>
                    )}

                    {/* ── GRIMORIO ABIERTO ────────────────────────── */}
                    {phase === 'open' && (
                        <Animated.View style={[StyleSheet.absoluteFill, bookStyle]}>
                            {/* Spine */}
                            <View style={s.spine}>
                                {(Object.keys(TABS) as (keyof typeof TABS)[]).map(t => (
                                    <TouchableOpacity 
                                        key={t}
                                        style={[s.tabBtn, tab === t && s.tabBtnActive]}
                                        onPress={() => setTab(t)}
                                    >
                                        <Text style={[s.tabIcon, tab === t && { color: C.inkBright }]}>{TABS[t].icon}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={s.page}>
                                {/* Header */}
                                <View style={s.header}>
                                    <View style={{ flex: 1 }}>
                                        <TypewriterTitle text={`CÓDICE\nMERCADER`} />
                                    </View>
                                    <View style={s.goldCounter}>
                                        <Image source={COIN_SPRITES.star} style={s.starIconCoin} contentFit="contain" />
                                        <Text style={s.coinsTxt}>{starCoins}</Text>
                                    </View>
                                </View>
                                <View style={s.headerSeparator}>
                                    <Text style={s.sepTxt}>✦ ─────────── ✦</Text>
                                </View>

                                {/* Content */}
                                <View style={s.sectionLabel}>
                                    <Text style={s.sectionLabelTxt}>{tab.toUpperCase()} DISPONIBLES</Text>
                                    <View style={s.sectionLabelLine} />
                                </View>

                                <ScrollView 
                                    style={s.scroll} 
                                    contentContainerStyle={s.scrollContent}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <View style={s.grid}>
                                        {tab === 'heroes' && ALL_HEROES.map(h => (
                                            <HeroCard key={h.id} hero={h} isUnlocked={unlockedClasses.includes(h.id)} onBuy={() => handleBuyHero(h)} />
                                        ))}
                                        {tab === 'items' && SHOP_ITEMS.map(i => (
                                            <ShopCard key={i.id} item={i} onBuy={() => handleBuyItem(i)} accent={i.color} />
                                        ))}
                                        {tab === 'cards' && SHOP_CARDS.map(c => (
                                            <ShopCard key={c.id} item={c} onBuy={() => handleBuyCard(c)} accent={c.color} />
                                        ))}
                                    </View>
                                </ScrollView>

                                {/* Close bar */}
                                <TouchableOpacity style={s.closeBar} onPress={onClose}>
                                    <Text style={s.closeBarChevron}>▼</Text>
                                    <Text style={s.closeBarTxt}>CERRAR CÓDICE</Text>
                                    <Text style={s.closeBarChevron}>▼</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Flash FX */}
                            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.flash, flashStyle]} />
                        </Animated.View>
                    )}
                    
                </Animated.View>

                {showSuccess && successItem && (
                    <PurchaseSuccessAnimation item={successItem} onClose={() => setShowSuccess(false)} />
                )}
            </View>
        </Modal>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const GRIMOIRE_W = Math.min(SCREEN_W * 0.96, 440);
const GRIMOIRE_H = Math.min(SCREEN_H * 0.88, 700);
const CARD_W     = (GRIMOIRE_W - 36 - 60) / 2; // Reduced width slightly to allow space-between gap

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center', alignItems: 'center' },
    grimoireShell: {
        width: GRIMOIRE_W, height: GRIMOIRE_H,
        backgroundColor: C.parchmentMid,
        borderWidth: 4, borderColor: C.borderPixel,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        ...Platform.select({ 
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 }, 
            android: { elevation: 20 } 
        }),
    },

    // ── Portada ───────────────────────────────────────────────────────
    coverContainer: { backgroundColor: C.parchment, justifyContent: 'center', alignItems: 'center', zIndex: 20, backfaceVisibility: 'hidden' },
    coverContent: { alignItems: 'center', gap: 12 },
    coverLogoBox: {
        width: 100, height: 100,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    coverLogoRings: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    coverRing: { position: 'absolute', borderRadius: 100, borderStyle: 'dotted', borderWidth: 2, borderColor: C.borderPixel },
    coverTitle: { color: C.inkBright, fontSize: 26, fontWeight: '800', letterSpacing: 6, textShadowColor: '#000', textShadowRadius: 10 },
    coverSub: { color: C.inkDim, fontSize: 14, fontWeight: '700', letterSpacing: 4, marginTop: -4 },
    coverHint: { marginTop: 45, paddingVertical: 10, paddingHorizontal: 22, borderWidth: 1, borderColor: C.borderBright + '33', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.2)' },
    coverHintTxt: { color: C.inkDim, fontSize: 10, fontWeight: '700', letterSpacing: 3 },

    // ── Layout ────────────────────────────────────────────────────────
    spine: {
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 36, backgroundColor: C.parchmentLight,
        borderRightWidth: 3, borderRightColor: C.borderPixel,
        alignItems: 'center', justifyContent: 'center', gap: 24, zIndex: 10,
    },
    tabBtn: {
        width: 28, height: 48, backgroundColor: C.parchmentMid,
        borderWidth: 2, borderColor: C.borderPixel,
        alignItems: 'center', justifyContent: 'center',
    },
    tabBtnActive: {
        backgroundColor: '#4a2c14', borderColor: C.borderBright,
        borderLeftWidth: 0, marginLeft: 6, width: 32,
    },
    tabIcon: { color: C.inkDim, fontSize: 18 },
    
    page: { flex: 1, marginLeft: 36, padding: 18, paddingTop: 24 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    grimoireTitle: { color: C.inkBright, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, lineHeight: 18 },
    grimoireSub: { color: C.inkDim, fontSize: 7, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
    
    goldCounter: {
        backgroundColor: '#160a03', borderWidth: 2, borderColor: C.borderBright,
        paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row',
        alignItems: 'center', gap: 8, borderRadius: 4,
    },
    starIconCoin: { width: 14, height: 14 },
    coinsTxt: { color: C.inkBright, fontSize: 11, fontWeight: '900' },
    headerSeparator: { alignItems: 'center', marginVertical: 10, opacity: 0.6 },
    sepTxt: { color: C.borderBright, fontSize: 8, letterSpacing: 1.5 },

    sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    sectionLabelTxt: { color: C.borderBright, fontSize: 8, fontWeight: '800', letterSpacing: 2 },
    sectionLabelLine: { flex: 1, height: 1.5, backgroundColor: C.borderPixel, opacity: 0.5 },

    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 64 },
    grid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        gap: 16,
        paddingTop: 8,
    },

    // Portal background
    portalBg: { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },

    closeBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: C.parchmentMid, borderTopWidth: 2, borderTopColor: C.borderPixel,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: 14, gap: 12,
    },
    closeBarTxt: { color: C.inkDim, fontSize: 8, fontWeight: '800', letterSpacing: 3 },
    closeBarChevron: { color: C.borderBright, fontSize: 11 },

    flash: { backgroundColor: C.inkBright, zIndex: 100 },
});

// ─── Estilos de Card Pixel ────────────────────────────────────────────────────
const card = StyleSheet.create({
    shell: {
        width: CARD_W,
        backgroundColor: '#120803', borderWidth: 2, borderColor: C.borderPixel,
        padding: 10, borderRadius: 2,
        marginBottom: 8,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
            android: { elevation: 4 }
        }),
    },
    shellOwned: { borderColor: C.accentGreen + 'aa' },
    spriteFrame: {
        width: '100%', aspectRatio: 1, backgroundColor: '#090503',
        borderWidth: 2, borderColor: C.borderPixel, marginBottom: 8,
        justifyContent: 'center', alignItems: 'center', position: 'relative',
    },
    sprite: { width: '85%', height: '85%' },
    name: { color: C.ink, fontSize: 8, fontWeight: '900', lineHeight: 14, marginBottom: 2 },
    sub: { color: C.inkDim, fontSize: 6, fontWeight: '700', marginBottom: 8 },
    elemTag: { alignSelf: 'flex-start', paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, marginBottom: 10, borderRadius: 2 },
    elemTagTxt: { fontSize: 6, fontWeight: '800' },
    ownedBanner: { borderTopWidth: 1, borderTopColor: C.accentGreen + '66', paddingTop: 6, alignItems: 'center' },
    ownedTxt: { color: '#2ecc71', fontSize: 7, fontWeight: '900' },
    buyBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#351808', borderWidth: 2, borderColor: C.borderBright,
        paddingVertical: 5, gap: 6, borderRadius: 2,
    },
    starIconCoin: { width: 12, height: 12 },
    priceTxt: { color: C.inkBright, fontSize: 8, fontWeight: '900' },
});

// ─── Estilos Visuales Compartidos ──────────────────────────────────────────────
const v = StyleSheet.create({
    scanlineLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#000', opacity: 0.08 },
    corner: { position: 'absolute', fontSize: 14, color: C.borderBright, zIndex: 10, opacity: 0.55 },
    pxCorner: { position: 'absolute', fontSize: 6, color: C.borderBright, opacity: 0.45 },
    lockContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
    lockShackle: { width: 10, height: 10, borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 3, borderColor: C.inkDim, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
    lockBody: { width: 16, height: 12, backgroundColor: C.inkDim, borderWidth: 1, borderColor: '#000', borderRadius: 1 },
});

// ─── Estilos ArcanePortal ─────────────────────────────────────────────────────
const PORTAL_SIZE = Math.min(GRIMOIRE_W, GRIMOIRE_H) * 0.65;
const portal = StyleSheet.create({
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
    },
    ring: {
        justifyContent: 'center', alignItems: 'center',
        borderRadius: 1000,
        borderWidth: 1.5, borderColor: C.borderBright,
        shadowColor: '#fa9542', shadowOpacity: 0.7, shadowRadius: 8, elevation: 6,
    },
    r1: { width: PORTAL_SIZE,       height: PORTAL_SIZE,       borderWidth: 1.5 },
    r2: { width: PORTAL_SIZE * 0.85, height: PORTAL_SIZE * 0.85, borderStyle: 'dashed', borderWidth: 1 },
    r3: { width: PORTAL_SIZE * 0.70, height: PORTAL_SIZE * 0.70, borderWidth: 1 },
    r4: { width: PORTAL_SIZE * 0.50, height: PORTAL_SIZE * 0.50, borderWidth: 3, borderColor: C.inkBright },
    satellite: {
        position: 'absolute',
        width: 18, height: 18, borderRadius: 9,
        borderWidth: 3, borderColor: C.borderBright,
        backgroundColor: '#1a0e04',
        shadowColor: '#fa9542', shadowOpacity: 0.9, shadowRadius: 6, elevation: 5,
    },
});
