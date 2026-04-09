// components/quest/ShopModal.tsx
// TokaVerse — Bazar Toka: Tienda premium para desbloquear héroes y equipo

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Dimensions, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerStore } from '../../store/usePlayerStore';
import { useInventoryStore, RARITY_COLORS } from '../../store/useInventoryStore';
import { Colors } from '../../constants/Colors';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── DEFINICIÓN DE PRODUCTOS ──────────────────────────────────────────────────
interface ShopItem {
  id:          string;
  name:        string;
  description: string;
  price:       number;
  icon:        string;
  pixelArt?:   string;
  type:        'hero' | 'item' | 'card';
  stats?:      any;
  rarity?:     'common' | 'uncommon' | 'rare' | 'legendary';
}

const SHOP_HEROES: ShopItem[] = [
  { id: 'cat',  name: 'Mascota: Gato', description: 'Ágil y astuto. +15% de probabilidad de esquiva.', price: 150, icon: '🐱', type: 'hero' },
  { id: 'dog',  name: 'Mascota: Perro', description: 'Fiel y fuerte. +20% HP máximo base.', price: 150, icon: '🐶', type: 'hero' },
  { id: 'fox',  name: 'Espíritu: Fox', description: 'Maestro de la magia elemental. Recarga mana un 10% más rápido.', price: 250, icon: '🦊', type: 'hero' },
];

const SHOP_ITEMS: ShopItem[] = [
  { id: 'item_potion_strong', name: 'Mega Poción', description: 'Restaura +100 HP. Imprescindible para jefes.', price: 30, icon: '🧪', pixelArt: 'item_potion_strong', type: 'item', rarity: 'rare' },
  { id: 'item_crystal_mana',  name: 'Cristal de Maná', description: 'Recupera +60 MP de forma mística.', price: 45, icon: '💎', pixelArt: 'item_crystal_mana', type: 'item', rarity: 'rare' },
  { id: 'item_ring_strong',   name: 'Anillo de Poder', description: 'Aumenta permanentemente ATK (+12) y HP (+15).', price: 120, icon: '💍', pixelArt: 'item_ring_strong', type: 'item', rarity: 'rare' },
  { id: 'item_ritual_incense',name: 'Incienso Ritual', description: 'Cura total (HP/MP) y limpieza de estados.', price: 200, icon: '🕯️', pixelArt: 'item_ritual_incense', type: 'item', rarity: 'legendary' },
];

const SHOP_CARDS: ShopItem[] = [
  { id: 'card_xp',   name: 'Inversión: XP', description: 'Carta de fusión que otorga +20% XP en victorias.', price: 80, icon: '🎴', pixelArt: 'item_card_xp', type: 'card', rarity: 'uncommon' },
  { id: 'card_mana', name: 'Flujo Mágico', description: 'Carta de fusión que reduce costos de mana en 5.', price: 150, icon: '🎴', pixelArt: 'item_card_mana', type: 'card', rarity: 'rare' },
];

// ─── COMPONENTE CARD DE PRODUCTO ──────────────────────────────────────────────
function ProductCard({ item, onBuy, isUnlocked }: { item: ShopItem; onBuy: () => void; isUnlocked?: boolean }) {
  const rarityColor = item.rarity ? RARITY_COLORS[item.rarity] : '#ffffff';

  return (
    <View style={[pcStyles.card, { borderColor: rarityColor.startsWith('#') ? rarityColor + '44' : rarityColor }]}>
      <View style={pcStyles.iconArea}>
        <Text style={pcStyles.icon}>{item.icon}</Text>
      </View>
      <View style={pcStyles.info}>
        <Text style={pcStyles.name}>{item.name}</Text>
        <Text style={pcStyles.desc} numberOfLines={2}>{item.description}</Text>
        <View style={pcStyles.footer}>
          <View style={pcStyles.priceTag}>
            <MaterialCommunityIcons name="diamond-stone" size={14} color="#7b5ea7" />
            <Text style={pcStyles.priceTxt}>{item.price}</Text>
          </View>
          <TouchableOpacity 
            style={[pcStyles.buyBtn, isUnlocked && pcStyles.unlockedBtn]} 
            onPress={onBuy}
            disabled={isUnlocked}
          >
            <Text style={pcStyles.buyBtnTxt}>{isUnlocked ? 'OBTENIDO' : 'COMPRAR'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const pcStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1,
    padding: 12, marginBottom: 10, flexDirection: 'row', gap: 12,
  },
  iconArea: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  name: { color: '#e8d5ff', fontWeight: '900', fontSize: 13, marginBottom: 2 },
  desc: { color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 15, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(123,94,167,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priceTxt: { color: '#7b5ea7', fontWeight: '900', fontSize: 13 },
  buyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  unlockedBtn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  buyBtnTxt: { color: '#FFF', fontSize: 10, fontWeight: '900' },
});

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export function ShopModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'hero' | 'item' | 'card'>('hero');
  const { starCoins, unlockedClasses, unlockClass, addStarCoins } = usePlayerStore();
  const { addItem } = useInventoryStore();

  const handleBuy = (item: ShopItem) => {
    if (starCoins < item.price) {
      Alert.alert('Saldo Insuficiente', '¡Aventúrate para obtener StarCoins! 💎');
      return;
    }

    addStarCoins(-item.price);
    if (item.type === 'hero') {
      unlockClass(item.id);
    } else {
      addItem({ 
        icon: item.icon, name: item.name, rarity: item.rarity ?? 'common', 
        type: item.type as any, description: item.description, 
        pixelArt: item.pixelArt, stats: item.stats, weight: 1,
        durability: 10
      }, 'Bazar Toka');
    }
    Alert.alert('¡Éxito!', `Has obtenido: ${item.name}`);
  };

  const currentList = tab === 'hero' ? SHOP_HEROES : tab === 'item' ? SHOP_ITEMS : SHOP_CARDS;

  const translateY = useSharedValue(SCREEN_W); // Usamos SCREEN_W como fallback de altura para ocultar
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 25, stiffness: 120 });
    } else {
      translateY.value = withTiming(600);
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }, sheetStyle]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bazar Toka</Text>
              <Text style={styles.sub}>Canjea tus fragmentos por gloria</Text>
            </View>
            <View style={styles.currency}>
              <MaterialCommunityIcons name="diamond-stone" size={18} color="#7b5ea7" />
              <Text style={styles.currencyNum}>{starCoins}</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {(['hero', 'item', 'card'] as const).map(t => (
              <TouchableOpacity 
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]} 
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
                  {t === 'hero' ? 'Héroes' : t === 'item' ? 'Equipo' : 'Cartas'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {currentList && currentList.length > 0 ? currentList.map(item => (
              <ProductCard 
                key={`${item.type}_${item.id}`} 
                item={item} 
                onBuy={() => handleBuy(item)} 
                isUnlocked={item.type === 'hero' && unlockedClasses.includes(item.id)}
              />
            )) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTxt}>No hay artículos disponibles en esta categoría.</Text>
              </View>
            )}
          </ScrollView>
          
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnTxt}>SALIR DEL BAZAR</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0d0d1a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: '#7b5ea755', paddingHorizontal: 20, paddingTop: 16,
    maxHeight: '85%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { color: '#e8d5ff', fontSize: 22, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  currency: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(123,94,167,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  currencyNum: { color: '#e8d5ff', fontWeight: '900', fontSize: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  tabBtnActive: { backgroundColor: 'rgba(123,94,167,0.2)', borderColor: '#7b5ea7' },
  tabTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '800' },
  tabTxtActive: { color: '#e8d5ff' },
  list: { flex: 1, marginTop: 10 },
  empty: { padding: 40, alignItems: 'center' },
  emptyTxt: { color: 'rgba(255,255,255,0.2)', fontSize: 13, textAlign: 'center' },
  closeBtn: { marginTop: 10, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, alignItems: 'center' },
  closeBtnTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '900' },
});
