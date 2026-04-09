import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePlayerStore } from '../../store/usePlayerStore';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';

// ─── Estilos y Constantes ───────────────────────────────────────────────────
const STAR_COIN_IMG = require('../../assets/images/coin_estrella.png');

const PACKAGES = [
    { id: 'pack_1', name: 'Bolsita de Cobre',  coins: 500,   price: 5,  priceHex: '#CD7F32', bonus: null    },
    { id: 'pack_2', name: 'Bolsa de Plata',    coins: 1200,  price: 10, priceHex: '#C0C0C0', bonus: null    },
    { id: 'pack_3', name: 'Cofre de Oro',      coins: 2800,  price: 20, priceHex: '#FFD700', bonus: 'Mejor Valor'  },
    { id: 'pack_4', name: 'Baúl Legendario',   coins: 6500,  price: 40, priceHex: '#9333EA', bonus: '+15% Extra'   },
    { id: 'pack_5', name: 'Tesoro del Abismo', coins: 15000, price: 80, priceHex: '#EF4444', bonus: '+30% Extra'   },
];

export const StarCoinShop = () => {
    const { addStarCoins } = usePlayerStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

    const handlePurchase = (pack: typeof PACKAGES[0]) => {
        setIsPurchasing(pack.id);
        
        // Simulación Mock TokaPay
        setTimeout(() => {
            Alert.alert(
                'Pasarela Segura Toka',
                `Realizando cobro de $${pack.price} MXN...\n(Redireccionando...)`,
                [
                    { 
                        text: 'Simular Pago Exitoso', 
                        onPress: () => {
                            addStarCoins(pack.coins);
                            setIsPurchasing(null);
                            Alert.alert('¡Éxito!', `Has recibido +${pack.coins.toLocaleString()} StarCoins.\n¡Gracias por tu apoyo!`);
                        } 
                    },
                    {
                        text: 'Cancelar Simulación',
                        style: 'cancel',
                        onPress: () => setIsPurchasing(null)
                    }
                ]
            );
        }, 800);
    };

    return (
        <ScrollView contentContainerStyle={S.container} showsVerticalScrollIndicator={false}>
            <View style={S.header}>
                <Ionicons name="diamond" size={28} color="#FFD700" />
                <Text style={S.title}>TESORO DEL DESTINO</Text>
            </View>
            <Text style={S.subtitle}>Adquiere StarCoins para desbloquear artefactos y aliados en el Códice.</Text>

            <View style={[S.grid, isDesktop && S.gridDesktop]}>
                {PACKAGES.map((pkg, i) => (
                    <Animated.View key={pkg.id} entering={FadeInUp.delay(i * 100)} style={S.cardWrap}>
                        <TouchableOpacity 
                            style={[S.card, { borderColor: `${pkg.priceHex}55` }]} 
                            onPress={() => handlePurchase(pkg)}
                            activeOpacity={0.8}
                            disabled={isPurchasing !== null}
                        >
                            {/* Bonus Ribbon */}
                            {pkg.bonus && (
                                <View style={[S.ribbon, { backgroundColor: pkg.priceHex }]}>
                                    <Text style={S.ribbonTxt}>{pkg.bonus}</Text>
                                </View>
                            )}

                            <View style={[S.iconBox, { borderColor: pkg.priceHex + '44' }]}>
                                <Image source={STAR_COIN_IMG} style={S.starImg} contentFit="contain" />
                            </View>

                            <View style={S.infoBox}>
                                <Text style={S.coinsAmount}>{pkg.coins.toLocaleString()} SC</Text>
                                <Text style={[S.packName, { color: pkg.priceHex }]}>{pkg.name}</Text>
                            </View>

                            <View style={S.priceBox}>
                                {isPurchasing === pkg.id ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={S.priceTxt}>${pkg.price} MXN</Text>
                                )}
                            </View>
                            
                            {/* Efecto hover/brillo falso */}
                            <View style={[S.glow, { backgroundColor: `${pkg.priceHex}11` }]} />
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
            <View style={S.footer}>
                <Text style={S.footerTxt}>Los pagos reales vía TokaCard se habilitarán en la Fase 2.</Text>
            </View>
        </ScrollView>
    );
};

const S = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        fontFamily: 'Press Start 2P', // Utiliza fuente de fallback system si no carga
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 18,
    },
    grid: {
        gap: 16,
    },
    gridDesktop: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    cardWrap: {
        width: '100%',
        maxWidth: 400,
    },
    card: {
        backgroundColor: '#1E110A', // Tono parchment oscuro
        borderWidth: 2,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    glow: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
        pointerEvents: 'none',
    },
    ribbon: {
        position: 'absolute',
        top: 12,
        left: -28,
        transform: [{ rotate: '-45deg' }],
        paddingVertical: 4,
        paddingHorizontal: 28,
        zIndex: 10,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    ribbonTxt: {
        color: '#111',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    iconBox: {
        width: 60,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        zIndex: 1,
    },
    starImg: {
        width: 48,
        height: 48,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    infoBox: {
        flex: 1,
        zIndex: 1,
    },
    coinsAmount: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFD700',
        marginBottom: 4,
        fontFamily: 'System', // Cambiar si tienen la custom font en RN
    },
    packName: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    priceBox: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        minWidth: 90,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 1,
    },
    priceTxt: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 14,
    },
    footer: {
        marginTop: 32,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    footerTxt: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
