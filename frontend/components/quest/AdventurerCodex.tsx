import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, 
    Dimensions, useWindowDimensions, Platform
} from 'react-native';
import { Image } from 'expo-image';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { ITEM_SPRITES, CHAR_SPRITES } from '../../data/classSkills';
import { RPG_PETS } from '../../data/pets';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
    ZoomIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring
} from 'react-native-reanimated';
import { PurchaseSuccessAnimation } from './PurchaseSuccessAnimation';
import { StarCoinShop } from '../ui/StarCoinShop';
import { CircuitLoader } from '../animations/CircuitLoader';

// ─── Variables de Diseño Códice (HTML port) ─────────────────────────────────
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
    glow:           '#d4a017',
    bgCard:         '#1a0e04',
    bgFrame:        '#0d0704',
};

const fontFam = Platform.OS === 'ios' ? 'Courier' : 'monospace';

// ─── Helpers Responsivos ─────────────────────────────────────────────────────
const fs = (mobile: number, desktop: number, isDesktop: boolean) => isDesktop ? desktop : mobile;

// ─── Datos ──────────────────────────────────────────────────────────────────
const HEROES = [
    { id: 'warrior',  name: 'SAMURAI',   sub: 'Guerrero', price: 0,    elem: '⚔', elemColor: '#8b1a1a' },
    { id: 'archer',   name: 'YUSHU',     sub: 'Arquero',  price: 0,    elem: '🏹', elemColor: '#1a5c2a' },
    { id: 'mage',     name: 'MAHŌTSUKAI', sub: 'Maga',    price: 0,    elem: '❄', elemColor: '#1a3a6b' },
    { id: 'thief',    name: 'GŌTŌ',      sub: 'Ladrona',  price: 0,    elem: '💨', elemColor: '#3a3a1a' },
    { id: 'hacker',   name: 'HACKER',    sub: 'Ciber-Mago', price: 500, elem: '⚡', elemColor: '#6b1a6b' },
    { id: 'banker',   name: 'SHŌNIN',    sub: 'Mercader', price: 750,  elem: '💰', elemColor: '#6b4a1a' },
    { id: 'magedark', name: 'ANKOKU',    sub: 'Maga Oscura', price: 1000, elem: '☽', elemColor: '#2a1a4a' },
    { id: 'dog',      name: 'INU',       sub: 'Can Guard.', price: 300, elem: '🐾', elemColor: '#3a2a1a' },
];

const ITEMS = [
    { name: 'POCIÓN HP',    price: 25,  icon: '🧪', color: '#8b1a1a', sprite: ITEM_SPRITES.potion },
    { name: 'POCIÓN MANÁ',  price: 30,  icon: '💧', color: '#1a3a6b', sprite: ITEM_SPRITES.potion_mana },
    { name: 'MEGA POCIÓN',  price: 60,  icon: '⚗', color: '#6b1a6b', sprite: ITEM_SPRITES.potion_strong },
    { name: 'ANILLO PODER', price: 250, icon: '💍', color: '#6b4a1a', sprite: ITEM_SPRITES.ring_strong },
    { name: 'ESPADA DIAMANTE',price: 800, icon: '⚔', color: '#1a5c6b', sprite: ITEM_SPRITES.sword_diamond },
    { name: 'ESCUDO ELEM.', price: 500, icon: '🛡', color: '#3a5c1a', sprite: ITEM_SPRITES.shield_elemental },
];

const CARDS = [
    { name: 'CARTA XP',    price: 150, icon: '✦', color: '#6b4a1a', sprite: ITEM_SPRITES.card_xp },
    { name: 'CARTA VIDA',  price: 200, icon: '♥', color: '#8b1a1a', sprite: ITEM_SPRITES.card_hp },
    { name: 'CARTA MANÁ',  price: 200, icon: '◆', color: '#1a3a6b', sprite: ITEM_SPRITES.card_mana },
    { name: 'CARTA MAESTRA',price: 500,icon: '★', color: '#6b1a6b', sprite: ITEM_SPRITES.card_strong },
];


export const AdventurerCodex = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const [tab, setTab] = useState<'heroes' | 'pets' | 'items' | 'cards' | 'shop'>('heroes');
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const { 
        starCoins, unlockedClasses, unlockClass, addStarCoins,
        ownedPets, unlockPet, equippedPet, setEquippedPet,
        petMetadata, registerPetTap, hatchPet, evolvePet
    } = usePlayerStore();
    const { addItem } = useInventoryStore();

    const [showConfetti, setShowConfetti] = useState(false);
    const [successItem, setSuccessItem] = useState<any>(null);
    const [evolvingPet, setEvolvingPet] = useState<string | null>(null);

    const handleAction = (item: any, type: 'hero' | 'item' | 'card' | 'pet') => {
        if (type === 'hero') {
            if (unlockedClasses.includes(item.id)) return alert(`${item.name} ya está en tus filas.`);
            if (starCoins < item.price) return alert('No tienes suficientes Star Coins.');

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
        } else if (type === 'pet') {
            const meta = petMetadata[item.id];
            
            if (ownedPets.includes(item.id)) {
                if (!meta?.hatched) {
                    registerPetTap(item.id);
                    if (meta?.taps >= 9) {
                        setEvolvingPet(item.id);
                        setTimeout(() => {
                            hatchPet(item.id);
                            setEvolvingPet(null);
                        }, 3000);
                    }
                    return;
                }
                
                const currentLevel = usePlayerStore.getState().level;
                if (!meta.evolved && currentLevel >= item.stage2_evolved.levelRequired) {
                    setEvolvingPet(item.id);
                    setTimeout(() => {
                        evolvePet(item.id);
                        setEvolvingPet(null);
                    }, 3000);
                    return;
                }

                setEquippedPet(item.id);
                return;
            }

            if (starCoins < item.cost) return alert('No tienes suficientes Star Coins.');
            unlockPet(item.id);
            addStarCoins(-item.cost);
            setSuccessItem({ id: item.id, name: item.name, icon: '🐾', type: 'pet', sprite: item.stage1.sprite });
            setShowConfetti(true);
        } else {
            if (starCoins < item.price) return alert('No tienes suficientes Star Coins.');
            const ok = addItem({
                name: item.name, icon: item.icon, rarity: 'uncommon',
                type: type === 'item' ? 'consumable' : 'card',
            } as any, 'Códice');

            if (ok) {
                addStarCoins(-item.price);
                setSuccessItem({ ...item, type });
                setShowConfetti(true);
            }
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={S.overlay}>
                {/* Fondo translúcido tap to close */}
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                
                <Animated.View entering={ZoomIn} style={[{
                    backgroundColor: '#000', // Outline simulation
                    padding: 1, 
                    shadowColor: '#000',
                    shadowOffset: { width: 6, height: 6 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    elevation: 10,
                }, isDesktop ? { width: 800, height: 600 } : { width: '94%', height: '85%' }]}>
                  <View style={[S.grimoireShell, { flex: 1 }]}>
                    <View style={S.scanlines} pointerEvents="none" />
                    
                    {/* Corner runes */}
                    <Text style={[S.corner, S.cornerTL]}>◆</Text>
                    <Text style={[S.corner, S.cornerTR]}>◆</Text>
                    <Text style={[S.corner, S.cornerBL]}>◆</Text>
                    <Text style={[S.corner, S.cornerBR]}>◆</Text>

                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        {/* SPINE / TABS */}
                        <View style={S.spine}>
                            <TabBtn icon="⚔" label="HÉROES" active={tab === 'heroes'} onPress={() => setTab('heroes')} />
                            <TabBtn icon="🐲" label="DRAGONES" active={tab === 'pets'} onPress={() => setTab('pets')} />
                            <TabBtn icon="⚗" label="OBJETOS" active={tab === 'items'} onPress={() => setTab('items')} />
                            <TabBtn icon="♦" label="CARTAS" active={tab === 'cards'} onPress={() => setTab('cards')} />
                            <View style={{ flex: 1 }} />
                            <TabBtn icon="💎" label="TIENDA" active={tab === 'shop'} onPress={() => setTab('shop')} isGold />
                        </View>

                        {/* PAGE */}
                        <View style={S.page}>
                            <View style={S.pageHeader}>
                                <View style={S.titleRow}>
                                    <View>
                                        <Text style={S.grimoireTitle}>CÓDICE{'\n'}MERCADER</Text>
                                        <Text style={S.grimoireSub}>ORDEN DE AVENTUREROS</Text>
                                    </View>
                                    <View style={S.goldCounter}>
                                        <Image source={require('../../assets/images/coin_estrella.png')} style={S.starCoinIcon} contentFit="contain" />
                                        <Text style={S.goldCounterTxt}>{starCoins.toLocaleString()}</Text>
                                    </View>
                                </View>
                                <Text style={S.headerDivider}>✦ ─────────── ✦</Text>
                            </View>

                            {/* TABS CONTENT */}
                            <Text style={S.sectionLabel}>
                                {tab === 'heroes' ? 'REGISTRO DE HÉROES' :
                                 tab === 'pets' ? 'INCUBADORA DE DRAGONES' :
                                 tab === 'items' ? 'TIENDA DE OBJETOS' :
                                 tab === 'cards' ? 'COLECCIÓN DE CARTAS' :
                                 'TESORO IAP'}
                            </Text>

                            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                                {tab === 'shop' ? (
                                    <StarCoinShop />
                                ) : (
                                    <View style={S.heroGrid}>
                                        {tab === 'heroes' && HEROES.map((h) => 
                                            <HeroCard key={h.id} item={h} owned={unlockedClasses.includes(h.id)} onPress={() => handleAction(h, 'hero')} isDesktop={isDesktop} />
                                        )}
                                        {tab === 'pets' && RPG_PETS.map((pet) => 
                                            <PetCard 
                                                key={pet.id} 
                                                pet={pet} 
                                                owned={ownedPets.includes(pet.id)} 
                                                equipped={equippedPet === pet.id} 
                                                meta={petMetadata[pet.id]}
                                                onPress={() => handleAction(pet, 'pet')} 
                                                isDesktop={isDesktop}
                                            />
                                        )}
                                        {tab === 'items' && ITEMS.map((item) => 
                                            <ShopCard key={item.name} item={item} onPress={() => handleAction(item, 'item')} isDesktop={isDesktop} />
                                        )}
                                        {tab === 'cards' && CARDS.map((item) => 
                                            <ShopCard key={item.name} item={item} onPress={() => handleAction(item, 'card')} isDesktop={isDesktop} />
                                        )}
                                    </View>
                                )}
                            </ScrollView>

                            {/* CLOSE BAR */}
                            <TouchableOpacity style={S.closeBar} onPress={onClose}>
                                <Text style={S.closeBarSign}>▼</Text>
                                <Text style={S.closeBarText}>CERRAR CÓDICE</Text>
                                <Text style={S.closeBarSign}>▼</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                  </View>
                </Animated.View>

                {showConfetti && successItem && (
                    <PurchaseSuccessAnimation 
                        item={{
                            id: successItem.id || successItem.name, name: successItem.name,
                            type: successItem.type === 'hero' ? 'hero' : (successItem.type === 'pet' ? 'card' : 'item'),
                            icon: successItem.icon || '🌟', sprite: successItem.sprite
                        }} 
                        onClose={() => { setShowConfetti(false); setSuccessItem(null); }} 
                    />
                )}

                {evolvingPet && (
                    <View style={S.evolvingOverlay}>
                        <CircuitLoader 
                            spriteUrl={RPG_PETS.find(p => p.id === evolvingPet)?.stage2_evolved.sprite}
                            evolutionText={petMetadata[evolvingPet]?.hatched ? "EVOLUCIONANDO..." : "ECLOSIONANDO..."}
                        />
                    </View>
                )}
            </View>
        </Modal>
    );
};

const TabBtn = ({ icon, label, active, onPress, isGold = false }: any) => (
    <TouchableOpacity style={[S.tabBtn, active && S.tabBtnActive]} onPress={onPress}>
        <Text style={[S.tabIcon, isGold && { color: C.inkBright }, active && { color: C.borderBright }]}>{icon}</Text>
        <Text style={[S.tabLabel, isGold && { color: '#FFF' }, active && { color: C.borderBright }]}>{label}</Text>
        {active && <View style={S.tabBtnActiveLine} />}
    </TouchableOpacity>
);

const HeroCard = ({ item, owned, onPress }: any) => {
    const sprite = (CHAR_SPRITES as any)[item.id] || CHAR_SPRITES.hero_base;
    return (
        <View style={[S.heroCard, owned && S.heroCardOwned]}>
            {owned && <Text style={S.ownedStar}>★</Text>}
            <View style={S.spriteFrame}>
                <Image source={sprite} style={S.pixelSprite} contentFit="contain" />
                {!owned && <View style={S.lockedOverlay}><View style={S.pxLock}><View style={S.pxLockShackle}/><View style={S.pxLockBody}/></View></View>}
            </View>
            <Text style={S.heroName} numberOfLines={1}>{item.name}</Text>
            <Text style={S.heroClass}>{item.sub}</Text>
            <View style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: `${item.elemColor}44`, paddingHorizontal: 4, paddingVertical: 2, marginBottom: 8 }}>
                <Text style={{ color: item.elemColor, fontSize: 8, fontFamily: fontFam, fontWeight: '800' }}>{item.elem} {item.sub.split(' ')[0].toUpperCase()}</Text>
            </View>
            {owned ? (
                <View style={S.ownedBanner}><Text style={S.ownedBannerTxt}>✔ REGISTRADO</Text></View>
            ) : (
                <TouchableOpacity style={S.buyBtn} onPress={onPress}>
                    <Text style={S.buyBtnStar}>★</Text>
                    <Text style={S.buyBtnTxt}>{item.price}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const PetCard = ({ pet, owned, equipped, meta, onPress, isDesktop }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handleTap = () => {
        if (owned && !meta?.hatched) {
            scale.value = withSequence(withTiming(1.2, { duration: 100 }), withTiming(1, { duration: 100 }));
        }
        onPress();
    };

    let sprite = pet.stage1.sprite;
    let label = pet.name;
    let subLabel = pet.lore;
    let btnText = equipped ? 'EQUIPADO' : 'EQUIPAR';

    if (owned && meta) {
        if (!meta.hatched) {
            sprite = require('../../assets/images/items/item_chest.png'); // Placeholder Egg
            label = "HUEVO DESCONOCIDO";
            subLabel = `Toca para incubar (${meta.taps}/10)`;
            btnText = "INCUBAR";
        } else if (meta.evolved) {
            sprite = pet.stage2_evolved.sprite;
        }
    }

    return (
        <Animated.View style={[S.heroCard, isDesktop && { width: '31%' }, equipped && { borderColor: C.accentGreen }, animatedStyle]}>
            {equipped && <Text style={S.ownedStar}>★</Text>}
            <TouchableOpacity activeOpacity={0.9} onPress={handleTap} style={{ flex: 1 }}>
                <View style={S.spriteFrame}>
                    <Image source={sprite} style={S.pixelSprite} contentFit="contain" />
                </View>
                <Text style={S.heroName} numberOfLines={1}>{label}</Text>
                <Text style={S.heroClass} numberOfLines={2}>{subLabel}</Text>
                
                {owned ? (
                    <View style={[S.buyBtn, equipped && { backgroundColor: '#2a4a2a' }]}>
                        <Text style={[S.buyBtnTxt, equipped && { color: C.inkBright }]}>{btnText}</Text>
                    </View>
                ) : (
                    <View style={S.buyBtn}>
                        <Text style={S.buyBtnStar}>★</Text>
                        <Text style={S.buyBtnTxt}>{pet.cost}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {owned && meta?.hatched && !meta.evolved && usePlayerStore.getState().level >= pet.stage2_evolved.levelRequired && (
                <TouchableOpacity style={S.evolveBadge} onPress={onPress}>
                  <Text style={S.evolveBadgeTxt}>EVOLUCIONAR</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const ShopCard = ({ item, onPress, isDesktop }: any) => (
    <View style={[S.heroCard, isDesktop && { width: '31%' }]}>
        <View style={[S.spriteFrame, { borderColor: `${item.color}66` }]}>
            {item.sprite ? (
                <Image source={item.sprite} style={S.pixelSprite} contentFit="contain" />
            ) : (
                <Text style={{ fontSize: 32, fontFamily: fontFam }}>{item.icon}</Text>
            )}
        </View>
        <Text style={S.heroName} numberOfLines={1}>{item.name}</Text>
        <TouchableOpacity style={[S.buyBtn, { borderColor: item.color }]} onPress={onPress}>
            <Text style={[S.buyBtnStar, { color: item.color }]}>★</Text>
            <Text style={S.buyBtnTxt}>{item.price}</Text>
        </TouchableOpacity>
    </View>
);

const S = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    grimoireShell: {
        backgroundColor: C.parchmentMid,
        borderWidth: 4,
        borderColor: C.borderPixel,
        overflow: 'hidden',
    },
    scanlines: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    corner: { position: 'absolute', fontSize: 10, color: C.borderBright, zIndex: 2, fontFamily: fontFam },
    cornerTL: { top: 6, left: 6 },
    cornerTR: { top: 6, right: 6 },
    cornerBL: { bottom: 6, left: 6 },
    cornerBR: { bottom: 6, right: 6 },

    spine: {
        width: 60,
        borderRightWidth: 3,
        borderColor: C.borderPixel,
        backgroundColor: C.parchmentLight,
        alignItems: 'center',
        paddingVertical: 20,
        paddingLeft: 4,
        zIndex: 3,
    },
    tabBtn: {
        width: 50,
        height: 60,
        backgroundColor: C.parchmentMid,
        borderWidth: 2,
        borderColor: C.borderPixel,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    tabBtnActive: {
        backgroundColor: '#4a2c14',
        borderLeftWidth: 0,
        borderColor: C.borderBright,
        width: 54,
        marginLeft: 4,
    },
    tabBtnActiveLine: {
        position: 'absolute',
        right: -3,
        top: '15%',
        width: 3,
        height: '70%',
        backgroundColor: C.borderBright,
    },
    tabIcon: {
        fontSize: 18,
        color: C.inkDim,
        fontFamily: fontFam,
    },
    tabLabel: {
        fontSize: 6,
        color: C.inkDim,
        marginTop: 4,
        fontWeight: '900',
        fontFamily: fontFam,
    },

    page: {
        flex: 1,
        paddingLeft: 12,
        paddingTop: 12,
        paddingRight: 12,
        position: 'relative',
        zIndex: 1,
    },
    pageHeader: {
        borderBottomWidth: 2,
        borderBottomColor: C.borderPixel,
        paddingBottom: 10,
        marginBottom: 12,
    },
    headerDivider: {
        textAlign: 'center',
        fontSize: 8,
        color: C.borderBright,
        marginTop: 6,
        letterSpacing: 1,
        fontFamily: fontFam,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    grimoireTitle: {
        fontSize: 14,
        color: C.inkBright,
        fontWeight: '900',
        letterSpacing: 0.5,
        fontFamily: fontFam,
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
    },
    grimoireSub: {
        fontSize: 8,
        color: C.inkDim,
        marginTop: 3,
        fontWeight: '900',
        fontFamily: fontFam,
    },
    goldCounter: {
        backgroundColor: '#1a0e04',
        borderWidth: 2,
        borderColor: C.borderBright,
        paddingVertical: 4,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    starCoinIcon: {
        width: 12,
        height: 12,
    },
    goldCounterTxt: {
        fontSize: 10,
        color: C.inkBright,
        fontWeight: '900',
        fontFamily: fontFam,
    },
    sectionLabel: {
        fontSize: 10,
        color: C.borderBright,
        letterSpacing: 2,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.borderPixel,
        paddingBottom: 4,
        fontWeight: '900',
        fontFamily: fontFam,
    },

    heroGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    heroCard: {
        width: '48%', // Approx 2 columns
        backgroundColor: C.bgCard,
        borderWidth: 2,
        borderColor: C.borderPixel,
        padding: 8,
        marginBottom: 8,
    },
    heroCardOwned: {
        borderColor: C.accentGreen,
    },
    ownedStar: {
        position: 'absolute',
        top: 3,
        right: 3,
        fontSize: 10,
        color: '#2ecc71',
        fontFamily: fontFam,
    },
    spriteFrame: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: C.bgFrame,
        borderWidth: 2,
        borderColor: C.borderPixel,
        marginBottom: 6,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    pixelSprite: {
        width: 48,
        height: 48,
    },
    lockedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pxLock: { width: 14, height: 18, alignItems: 'center' },
    pxLockShackle: { width: 8, height: 8, borderWidth: 3, borderColor: C.inkDim, borderBottomWidth: 0, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    pxLockBody: { width: 14, height: 10, backgroundColor: C.inkDim, borderWidth: 1 },

    heroName: {
        fontSize: 11,
        color: C.ink,
        fontWeight: '900',
        marginBottom: 2,
        fontFamily: fontFam,
    },
    heroClass: {
        fontSize: 9,
        color: C.inkDim,
        marginBottom: 6,
        fontWeight: '800',
        fontFamily: fontFam,
    },
    buyBtn: {
        width: '100%',
        backgroundColor: '#3d1a0a',
        borderWidth: 2,
        borderColor: C.borderBright,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    buyBtnStar: {
        color: C.inkBright,
        fontSize: 10,
        fontFamily: fontFam,
    },
    buyBtnTxt: {
        color: C.inkBright,
        fontSize: 10,
        fontWeight: '900',
        fontFamily: fontFam,
    },
    ownedBanner: {
        borderTopWidth: 1,
        borderTopColor: C.accentGreen,
        paddingTop: 4,
        alignItems: 'center',
    },
    ownedBannerTxt: {
        fontSize: 9,
        color: '#2ecc71',
        fontWeight: '900',
        letterSpacing: 1,
        fontFamily: fontFam,
    },

    closeBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: C.parchmentMid,
        borderTopWidth: 2,
        borderColor: C.borderPixel,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    closeBarText: {
        fontSize: 10,
        color: C.inkDim,
        fontWeight: '900',
        letterSpacing: 2,
        fontFamily: fontFam,
    },
    closeBarSign: {
        fontSize: 12,
        color: C.borderBright,
        fontFamily: fontFam,
    },
    evolvingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
        zIndex: 10000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    evolveBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: C.accentRed,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: C.inkBright,
        zIndex: 10,
    },
    evolveBadgeTxt: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '900',
        fontFamily: fontFam,
    }
});
