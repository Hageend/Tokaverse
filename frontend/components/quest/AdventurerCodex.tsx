// components/quest/AdventurerCodex.tsx
// TokaVerse — Códice de Aventureros: Bazar central con estética de libro antiguo

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Modal, Dimensions, Alert, ImageBackground, Image, Platform
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerStore } from '../../store/usePlayerStore';
import { useInventoryStore, RARITY_COLORS } from '../../store/useInventoryStore';
import { Colors } from '../../constants/Colors';
import { CHAR_SPRITES, CLASS_SKILLS, ITEM_SPRITES, COIN_SPRITES } from '../../data/classSkills';
import { ELEMENT_INFO, CLASS_ELEMENTS } from '../../types/elements';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── CONFIGURACIÓN DEL GRIMORIO ─────────────────────────────────────────────
const COLORS = {
    parchment: '#2a1a0e',      // Fondo base Madera
    parchmentMid: '#1e110a',   // Fondo oscuro
    parchmentLight: '#3d2512', // Madera clara
    ink: '#f0d9a0',           // Oro viejo (Texto)
    inkDim: '#a08050',        // Oro apagado
    inkBright: '#ffd700',     // Oro brillante
    accentRed: '#8b1a1a',     // Rojo ritual
    borderPixel: '#6b4420',   // Borde pixelado
    borderBright: '#c8860a',  // Borde brillante
    runeGlow: '#d4a017',      // Brillo rúnico
};

interface CodexHero {
    id: string;
    name: string;
    subtitle: string;
    price: number;
    gender: 'M' | 'F' | 'N';
    description: string;
}

const ALL_HEROES: CodexHero[] = [
    { id: 'warrior',  name: 'Samurai',    subtitle: 'Guerrero',   price: 0,    gender: 'M', description: 'Maestro de la espada y la disciplina financiera.' },
    { id: 'archer',   name: 'Yushu',      subtitle: 'Arquero',    price: 0,    gender: 'M', description: 'Ataques precisos desde la distancia del ahorro.' },
    { id: 'knight',   name: 'Caballero',  subtitle: 'Tanque',     price: 0,    gender: 'M', description: 'Un muro inamovible frente a las deudas.' },
    { id: 'mage',     name: 'Mahōtsukai', subtitle: 'Maga',       price: 0,    gender: 'F', description: 'Controla el hielo del ahorro acumulado.' },
    { id: 'kitsune',  name: 'Kitsune',    subtitle: 'Espíritu',   price: 0,    gender: 'F', description: 'Misticismo y sanación de flujo de caja.' },
    { id: 'thief',    name: 'Gōtō',       subtitle: 'Ladrona',    price: 0,    gender: 'F', description: 'Experta en obtener botines y cashback.' },
    { id: 'hacker',   name: 'Hacker',     subtitle: 'Ciber-Mago', price: 500,  gender: 'M', description: 'Manipula el sistema para golpes críticos.' },
    { id: 'banker',   name: 'Shōnin',     subtitle: 'Mercader',   price: 750,  gender: 'M', description: 'Maximiza los intereses y las inversiones.' },
    { id: 'magedark', name: 'Ankoku',     subtitle: 'Maga Oscura',price: 1000, gender: 'F', description: 'Poder prohibido que consume deuda.' },
    { id: 'dog',      name: 'Inu',        subtitle: 'Can Guardián',price: 300,  gender: 'N', description: 'Lealtad inquebrantable y defensa extra.' },
    { id: 'cat',      name: 'Neko',       subtitle: 'Felino Veloz',price: 300,  gender: 'N', description: 'Suerte y evasión en cada transacción.' },
    { id: 'fox',      name: 'Kitsune-bi', subtitle: 'Zorro Ígneo', price: 400,  gender: 'N', description: 'Regeneración mágica y fuego fatuo.' },
    { id: 'elf',      name: 'Erufu',      subtitle: 'Elfo Silvano',price: 650,  gender: 'N', description: 'Espíritu del bosque con agilidad extrema.' },
    { id: 'mermaid',  name: 'Ningyo',     subtitle: 'Sirena',     price: 800,  gender: 'F', description: 'Canto místico que restaura flujo de caja.' },
    { id: 'witch',    name: 'Majo',       subtitle: 'Bruja',      price: 900,  gender: 'F', description: 'Hechizos oscuros de alta rentabilidad.' },
    { id: 'knigh_girl', name: 'Paladín',   subtitle: 'Guardiana',  price: 700,  gender: 'F', description: 'Armadura sagrada contra el fraude.' },
    { id: 'knigh_red',  name: 'Berserker', subtitle: 'Cab. Rojo',  price: 850,  gender: 'M', description: 'Ataque feroz alimentado por la pasión.' },
    { id: 'leona',    name: 'Leona',      subtitle: 'Guerrera',   price: 750,  gender: 'F', description: 'Fuerza bruta y nobleza de espíritu.' },
    { id: 'maid',     name: 'Meido',      subtitle: 'Sirvienta',  price: 550,  gender: 'F', description: 'Eficiencia y orden en cada gasto.' },
    { id: 'santa',    name: 'Klaus',      subtitle: 'San Nicolás',price: 1200, gender: 'M', description: 'Repartidor de bendiciones y bonos.' },
];

const SHOP_ITEMS = [
    { id: 'item_potion_hp',     name: 'Poción HP',      price: 25,  icon: '🧪', sprite: ITEM_SPRITES.potion },
    { id: 'item_potion_mana',   name: 'Poción Maná',    price: 30,  icon: '💧', sprite: ITEM_SPRITES.potion_mana },
    { id: 'item_potion_strong', name: 'Mega Poción',    price: 60,  icon: '🧪', sprite: ITEM_SPRITES.potion_strong },
    { id: 'item_ring_strong',   name: 'Anillo Poder',   price: 250, icon: '💍', sprite: ITEM_SPRITES.ring_strong },
    { id: 'item_ring_mana',     name: 'Anillo Maná',    price: 250, icon: '💍', sprite: ITEM_SPRITES.ring_mana },
    { id: 'item_sword_diamond', name: 'Espada Diamante',price: 800, icon: '⚔️', sprite: ITEM_SPRITES.sword_diamond },
    { id: 'item_sword_infernal',name: 'Espada Infernal',price: 1200,icon: '🔥', sprite: ITEM_SPRITES.sword_infernal },
    { id: 'item_shield_element',name: 'Escudo Elem.',   price: 500, icon: '🛡️', sprite: ITEM_SPRITES.shield_elemental },
    { id: 'item_ritual_incense',name: 'Incienso Ritual',price: 300, icon: '🕯️', sprite: ITEM_SPRITES.ritual_incense },
];

const SHOP_CARDS = [
    { id: 'item_card_xp',   name: 'Carta de XP',     price: 150, icon: '🎴', sprite: ITEM_SPRITES.card_xp },
    { id: 'item_card_hp',   name: 'Carta de Vida',   price: 200, icon: '🎴', sprite: ITEM_SPRITES.card_hp },
    { id: 'item_card_mana', name: 'Carta de Maná',   price: 200, icon: '🎴', sprite: ITEM_SPRITES.card_mana },
    { id: 'item_card_strong',name: 'Carta Maestra',  price: 500, icon: '🎴', sprite: ITEM_SPRITES.card_strong },
];

// ─── COMPONENTES SUBORDINADOS ────────────────────────────────────────────────

const HeroCard = ({ hero, onBuy, isUnlocked }: { hero: CodexHero; onBuy: () => void; isUnlocked: boolean }) => {
    const skills = CLASS_SKILLS[hero.id] || [];
    const elements = CLASS_ELEMENTS[hero.id] || { primary: 'light' };
    const elemInfo = (ELEMENT_INFO as any)[elements.primary];

    return (
        <View style={cardStyles.container}>
            <TouchableOpacity 
                activeOpacity={0.9}
                style={[cardStyles.parchment, isUnlocked && cardStyles.unlocked]}
                onPress={onBuy}
            >
                {/* Marco de Sprite Pixelado */}
                <View style={cardStyles.illustrationBox}>
                    <Image source={(CHAR_SPRITES as any)[hero.id]} style={cardStyles.sprite} resizeMode="contain" />
                    {!isUnlocked && (
                        <View style={cardStyles.lockOverlay}>
                            <View style={cardStyles.pxLock}>
                                <View style={cardStyles.pxLockShackle} />
                                <View style={cardStyles.pxLockBody} />
                            </View>
                        </View>
                    )}
                    {/* Ornamentos de esquina en el marco */}
                    <Text style={[cardStyles.pxDot, { top: 2, left: 2 }]}>■</Text>
                    <Text style={[cardStyles.pxDot, { bottom: 2, right: 2 }]}>■</Text>
                </View>

                <View style={cardStyles.infoBox}>
                    <Text style={cardStyles.name}>{hero.name.toUpperCase()}</Text>
                    <Text style={cardStyles.subtitle}>{hero.subtitle}</Text>
                    
                    <View style={[cardStyles.elemTag, { borderColor: elemInfo?.color + '44' }]}>
                        <Text style={[cardStyles.elemText, { color: elemInfo?.color }]}>
                            {elemInfo?.emoji} {hero.subtitle.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Pie: Botón o Estado */}
                <View style={cardStyles.footer}>
                    {isUnlocked ? (
                        <View style={cardStyles.ownedBanner}>
                            <Text style={cardStyles.ownedText}>✔ REGISTRADO</Text>
                        </View>
                    ) : (
                        <View style={cardStyles.buyBtn}>
                            <Image source={COIN_SPRITES.star} style={cardStyles.buyStar} />
                            <Text style={cardStyles.buyBtnTxt}>{hero.price}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export function AdventurerCodex({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const insets = useSafeAreaInsets();
    const [tab, setTab] = useState<'heroes' | 'items' | 'cards'>('heroes');
    const { starCoins, unlockedClasses, unlockClass, addStarCoins } = usePlayerStore();
    const { addItem } = useInventoryStore();

    const translateY = useSharedValue(SCREEN_H);
    useEffect(() => {
        if (visible) translateY.value = withSpring(0, { damping: 25, stiffness: 100 });
        else translateY.value = withTiming(SCREEN_H);
    }, [visible]);

    const bookStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

    const handleBuyHero = (hero: CodexHero) => {
        if (hero.price > starCoins) {
            Alert.alert('🌟 Monedas Insuficientes', 'Debes recolectar más Estrellas en tus aventuras.');
            return;
        }
        addStarCoins(-hero.price);
        unlockClass(hero.id);
        Alert.alert('📜 Nuevo Conocimiento', `${hero.name} ha sido registrado en tu cónclave.`);
    };

    const handleBuyItem = (item: any) => {
        if (item.price > starCoins) {
            Alert.alert('🌟 Monedas Insuficientes', 'No tienes suficientes Estrellas para este objeto.');
            return;
        }
        const invItem = {
            id: `INV_${Date.now()}`,
            name: item.name,
            rarity: item.price > 500 ? 'legendary' : item.price > 200 ? 'rare' : 'uncommon',
            type: item.id.includes('potion') ? 'consumable' : item.id.includes('sword') ? 'weapon' : 'protection',
            pixelArt: item.id,
            icon: item.icon,
            stats: item.id.includes('hp') ? { hp: 50 } : item.id.includes('mana') ? { mana: 40 } : item.id.includes('sword') ? { atk: 25 } : { def: 15 },
            durability: 20,
            maxDurability: 20,
            description: `Objeto adquirido en el Códice.`
        };
        const success = useInventoryStore.getState().addItem(invItem as any, 'Códice');
        if (success) {
            addStarCoins(-item.price);
            Alert.alert('🎒 Objeto Adquirido', `Has comprado ${item.name}. Revisa tu bolsa.`);
        } else {
            Alert.alert('⚠️ Inventario Lleno', 'No tienes espacio para más objetos.');
        }
    };

    const handleBuyCard = (card: any) => {
        if (card.price > starCoins) {
            Alert.alert('🌟 Monedas Insuficientes', 'Te faltan Estrellas para adquirir esta carta.');
            return;
        }
        const invCard = {
            id: `CARD_${Date.now()}`,
            name: card.name,
            rarity: card.price > 400 ? 'legendary' : 'rare',
            type: 'card',
            pixelArt: card.id,
            icon: card.icon,
            description: `Carta de mejora del Códice.`
        };
        const success = useInventoryStore.getState().addItem(invCard as any, 'Códice');
        if (success) {
            addStarCoins(-card.price);
            Alert.alert('🎴 Carta Registrada', `La ${card.name} ha sido añadida a tu mazo.`);
        } else {
            Alert.alert('⚠️ Sin Espacio', 'Libera espacio en tu inventario primero.');
        }
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
                
                <Animated.View style={[styles.grimoireShell, bookStyle, { paddingBottom: insets.bottom + 10 }]}>
                    {/* Efecto Scanlines Retro */}
                    <View style={styles.scanlines} pointerEvents="none" />
                    
                    {/* Ornamentos en las esquinas del libro */}
                    <Text style={[styles.corner, { top: 6, left: 6 }]}>◆</Text>
                    <Text style={[styles.corner, { top: 6, right: 6 }]}>◆</Text>
                    <Text style={[styles.corner, { bottom: 6, left: 6 }]}>◆</Text>
                    <Text style={[styles.corner, { bottom: 6, right: 6 }]}>◆</Text>

                    {/* Spine / Lomo (Selector de Pestañas Vertical) */}
                    <View style={styles.spine}>
                        {(['heroes', 'items', 'cards'] as const).map((t) => (
                            <TouchableOpacity 
                                key={t} 
                                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                                onPress={() => setTab(t)}
                            >
                                <MaterialCommunityIcons 
                                    name={t === 'heroes' ? 'sword-cross' : t === 'items' ? 'bottle-tonic' : 'cards-diamond'} 
                                    size={18} 
                                    color={tab === t ? COLORS.inkBright : COLORS.inkDim} 
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Página del Grimorio (Contenido) */}
                    <View style={styles.page}>
                        <View style={styles.pageHeader}>
                            <View style={styles.titleRow}>
                                <View>
                                    <Text style={styles.grimoireTitle}>CÓDICE{"\n"}MERCADER</Text>
                                    <Text style={styles.grimoireSub}>ORDEN DE AVENTUREROS</Text>
                                </View>
                                <View style={styles.goldCounter}>
                                    <Image source={COIN_SPRITES.star} style={styles.starIcon} />
                                    <Text style={styles.coins}>{starCoins}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.sectionLabel}>
                            <Text style={styles.sectionLabelText}>
                                {tab === 'heroes' ? 'REGISTRO DE HÉROES' : tab === 'items' ? 'TIENDA DE OBJETOS' : 'COLECCIÓN DE CARTAS'}
                            </Text>
                            <View style={styles.sectionLine} />
                        </View>

                        <ScrollView 
                            style={styles.contentScroll} 
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.heroGrid}>
                                {tab === 'heroes' && ALL_HEROES.map(hero => (
                                    <HeroCard 
                                        key={hero.id} 
                                        hero={hero} 
                                        isUnlocked={unlockedClasses.includes(hero.id)} 
                                        onBuy={() => handleBuyHero(hero)}
                                    />
                                ))}

                                {tab === 'items' && SHOP_ITEMS.map(item => (
                                    <TouchableOpacity 
                                        key={item.id} 
                                        style={cardStyles.container} 
                                        onPress={() => handleBuyItem(item)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={cardStyles.parchment}>
                                           <View style={cardStyles.illustrationBox}>
                                               <Image source={(item as any).sprite} style={cardStyles.sprite} resizeMode="contain" />
                                           </View>
                                           <Text style={cardStyles.name}>{item.name.toUpperCase()}</Text>
                                           <View style={[cardStyles.buyBtn, { marginTop: 6, borderColor: COLORS.borderBright }]}>
                                              <Image source={COIN_SPRITES.star} style={cardStyles.buyStarSmall} />
                                              <Text style={cardStyles.buyBtnTxt}>{item.price}</Text>
                                           </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}

                                {tab === 'cards' && SHOP_CARDS.map(card => (
                                    <TouchableOpacity 
                                        key={card.id} 
                                        style={cardStyles.container} 
                                        onPress={() => handleBuyCard(card)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[cardStyles.parchment, { borderColor: COLORS.runeGlow + '88' }]}>
                                           <View style={[cardStyles.illustrationBox, { borderColor: COLORS.runeGlow }]}>
                                               <Image source={(card as any).sprite} style={cardStyles.sprite} resizeMode="contain" />
                                           </View>
                                           <Text style={cardStyles.name}>{card.name.toUpperCase()}</Text>
                                           <View style={[cardStyles.buyBtn, { marginTop: 6, borderColor: COLORS.runeGlow }]}>
                                              <Image source={COIN_SPRITES.star} style={[cardStyles.buyStarSmall, { tintColor: COLORS.runeGlow }]} />
                                              <Text style={cardStyles.buyBtnTxt}>{card.price}</Text>
                                           </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Barra de cierre estilo botón pixel */}
                        <TouchableOpacity style={styles.closeBar} onPress={onClose}>
                            <Text style={styles.closeBarArrow}>▼</Text>
                            <Text style={styles.closeBarText}>CERRAR CÓDICE</Text>
                            <Text style={styles.closeBarArrow}>▼</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    grimoireShell: { 
        width: Math.min(SCREEN_W * 0.95, 420), 
        height: SCREEN_H * 0.85, 
        backgroundColor: COLORS.parchmentMid, 
        borderWidth: 4, 
        borderColor: COLORS.borderPixel, 
        flexDirection: 'row',
        position: 'relative',
        overflow: 'hidden'
    },
    scanlines: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'transparent',
        zIndex: 5,
        opacity: 0.1,
        // En React Native no hay gradientes lineales nativos fuera de bibliotecas como expo-linear-gradient,
        // pero podemos omitir el efecto complejo o usar un fondo patronado si está disponible.
    },
    corner: { position: 'absolute', color: COLORS.borderBright, fontSize: 10, fontWeight: '900', zIndex: 10 },
    spine: {
        width: 40,
        backgroundColor: COLORS.parchmentLight,
        borderRightWidth: 3,
        borderColor: COLORS.borderPixel,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
        zIndex: 10
    },
    tabBtn: {
        width: 32,
        height: 48,
        backgroundColor: COLORS.parchmentMid,
        borderWidth: 2,
        borderColor: COLORS.borderPixel,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBtnActive: {
        width: 38,
        marginLeft: 4,
        backgroundColor: '#4a2c14',
        borderColor: COLORS.borderBright,
        borderRightWidth: 0,
    },
    page: { flex: 1, padding: 12, position: 'relative' },
    pageHeader: { 
        borderBottomWidth: 2, 
        borderColor: COLORS.borderPixel, 
        paddingBottom: 8, 
        marginBottom: 12 
    },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    grimoireTitle: { 
        color: COLORS.inkBright, 
        fontSize: 10, 
        fontWeight: '900', 
        letterSpacing: 1,
        textShadowColor: '#000',
        textShadowRadius: 2,
        textShadowOffset: { width: 1, height: 1 }
    },
    grimoireSub: { color: COLORS.inkDim, fontSize: 6, marginTop: 4, letterSpacing: 0.5 },
    goldCounter: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6, 
        backgroundColor: '#1a0e04', 
        borderWidth: 2, 
        borderColor: COLORS.borderBright, 
        paddingHorizontal: 8, 
        paddingVertical: 4 
    },
    starIcon: { width: 12, height: 12 },
    coins: { color: COLORS.inkBright, fontSize: 9, fontWeight: '900' },
    sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    sectionLabelText: { color: COLORS.borderBright, fontSize: 6, letterSpacing: 1.5, fontWeight: '900' },
    sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.borderPixel },
    contentScroll: { flex: 1 },
    scrollContent: { paddingBottom: 60 },
    heroGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
    closeBar: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: COLORS.parchmentMid, 
        borderTopWidth: 2, 
        borderColor: COLORS.borderPixel,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        gap: 8
    },
    closeBarText: { color: COLORS.inkDim, fontSize: 7, fontWeight: '900', letterSpacing: 1.5 },
    closeBarArrow: { color: COLORS.borderBright, fontSize: 8 },
});

const cardStyles = StyleSheet.create({
    container: { width: '48%', marginBottom: 8 },
    parchment: { 
        backgroundColor: '#1a0e04', 
        borderWidth: 2, 
        borderColor: COLORS.borderPixel, 
        padding: 8, 
        alignItems: 'center' 
    },
    unlocked: { borderColor: '#1a5c2a' },
    illustrationBox: { 
        width: '100%', 
        aspectRatio: 1, 
        backgroundColor: '#0d0704', 
        borderWidth: 2, 
        borderColor: COLORS.borderPixel, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: 6,
        position: 'relative'
    },
    sprite: { width: '85%', height: '85%' },
    pxDot: { position: 'absolute', color: COLORS.borderBright, fontSize: 5, lineHeight: 5 },
    lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' },
    pxLock: { width: 16, height: 20, alignItems: 'center' },
    pxLockShackle: { width: 10, height: 8, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: COLORS.inkDim, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
    pxLockBody: { width: 14, height: 10, backgroundColor: COLORS.inkDim, borderWidth: 1, borderColor: '#000' },
    infoBox: { alignItems: 'center', marginBottom: 6 },
    name: { color: COLORS.ink, fontSize: 7, fontWeight: '900', textAlign: 'center', lineHeight: 10 },
    subtitle: { color: COLORS.inkDim, fontSize: 5, textAlign: 'center', marginTop: 2 },
    elemTag: { borderWidth: 1, paddingVertical: 2, paddingHorizontal: 4, marginTop: 4 },
    elemText: { fontSize: 5, fontWeight: '900' },
    footer: { width: '100%' },
    ownedBanner: { borderTopWidth: 1, borderColor: '#1a5c2a', paddingTop: 4, alignItems: 'center' },
    ownedText: { color: '#2ecc71', fontSize: 5, fontWeight: '900', letterSpacing: 1 },
    buyBtn: { 
        flexDirection: 'row', 
        backgroundColor: '#3d1a0a', 
        borderWidth: 2, 
        borderColor: COLORS.borderBright, 
        paddingVertical: 4, 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 4 
    },
    buyBtnTxt: { color: COLORS.inkBright, fontSize: 7, fontWeight: '900' },
    buyStar: { width: 10, height: 10 },
    buyStarSmall: { width: 8, height: 8 },
});
