// components/quest/LootDropModal.tsx
// TokaVerse — Modal de Loot con animación de fan de cartas
// Inspirado en el CSS card effect (fan-out al hover)

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Pressable,
  Dimensions, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay,
  withTiming, Easing, interpolate, FadeIn, FadeOut, ZoomIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { BossDropItem, ItemRarity } from '../../store/useInventoryStore';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Todos los items correctamente mapeados ────────────────────────────────────
export const ITEM_ASSETS: Record<string, any> = {
  item_card:            require('../../assets/images/items/item_card.png'),
  item_card_energy:     require('../../assets/images/items/item_card_energy.png'),
  item_card_hp:         require('../../assets/images/items/item_card_hp.png'),
  item_card_mana:       require('../../assets/images/items/item_card_mana.png'),
  item_card_strong:     require('../../assets/images/items/item_card_strong.png'),
  item_card_xp:         require('../../assets/images/items/item_card_xp.png'),
  item_chest:           require('../../assets/images/items/item_chest.png'),
  item_compass:         require('../../assets/images/items/item_compass.png'),
  item_crystal_mana:    require('../../assets/images/items/item_crystal_mana.png'),
  item_potion:          require('../../assets/images/items/item_potion.png'),
  item_potion_HP:       require('../../assets/images/items/item_potion_HP.png'),
  item_potion_energy:   require('../../assets/images/items/item_potion_energy.png'),
  item_potion_mana:     require('../../assets/images/items/item_potion_mana.png'),
  item_potion_strong:   require('../../assets/images/items/item_potion_strong.png'),
  item_ring_mana:       require('../../assets/images/items/item_ring_mana.png'),
  item_ring_shield:     require('../../assets/images/items/item_ring_shield.png'),
  item_ring_strong:     require('../../assets/images/items/item_ring_strong.png'),
  item_ritual_incense:  require('../../assets/images/items/item_ritual_incense.png'),
  item_shield:          require('../../assets/images/items/item_shield.png'),
  item_shield_elemental:require('../../assets/images/items/item_shield_elemental.png'),
  item_sword:           require('../../assets/images/items/item_sword.png'),
  item_sword_Thunder:   require('../../assets/images/items/item_sword_Thunder.png'),
  item_sword_diamond:   require('../../assets/images/items/item_sword_diamond.png'),
  item_sword_infernal:  require('../../assets/images/items/item_sword_infernal.png'),
};

// ─── Helpers de rareza ─────────────────────────────────────────────────────────
const RARITY_CONFIG: Record<ItemRarity, { color: string; label: string; glow: string }> = {
  common:    { color: '#8b9ab8', label: 'Común',        glow: 'rgba(139,154,184,0.3)' },
  uncommon:  { color: '#22c55e', label: 'Poco Común',   glow: 'rgba(34,197,94,0.3)'   },
  rare:      { color: '#818cf8', label: 'Raro',         glow: 'rgba(129,140,248,0.4)' },
  legendary: { color: '#fbbf24', label: '⭐ Legendario', glow: 'rgba(251,191,36,0.5)'  },
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface LootDropDisplay {
  guaranteed: BossDropItem;
  random?: BossDropItem | null;
  bossName: string;
}

interface Props {
  visible: boolean;
  loot: LootDropDisplay | null;
  onClaim: (guaranteed: BossDropItem, random?: BossDropItem | null) => void;
  onClose: () => void;
}

// ─── Componente de carta individual ──────────────────────────────────────────
const LootCard = ({
  item,
  index,
  total,
  isExpanded,
  onPress,
}: {
  item: BossDropItem;
  index: number;
  total: number;
  isExpanded: boolean;
  onPress: () => void;
}) => {
  const rarity = RARITY_CONFIG[item.rarity];
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(0.8);

  // Fan rotation: distribuye las cartas en abanico
  const fanAngle = total <= 1 ? 0 : ((index / (total - 1)) - 0.5) * 30;
  const fanX = total <= 1 ? 0 : ((index / (total - 1)) - 0.5) * 80;

  useEffect(() => {
    // Entrada con delay escalonado
    setTimeout(() => {
      rotation.value = withSpring(isExpanded ? fanAngle : 0, { damping: 12, stiffness: 100 });
      translateX.value = withSpring(isExpanded ? fanX : 0, { damping: 12, stiffness: 100 });
      translateY.value = withSpring(isExpanded ? (Math.abs(fanAngle) * 1.5) : 0, { damping: 12 });
      cardScale.value = withSpring(isExpanded ? 1 : 0.85, { damping: 12 });
    }, index * 80);
  }, [isExpanded]);

  useEffect(() => {
    // Animación de entrada
    cardScale.value = withDelay(index * 120, withSpring(1, { damping: 10 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: cardScale.value },
    ],
    zIndex: isExpanded ? (total - index) : 10,
  }));

  return (
    <Animated.View style={[styles.cardWrapper, animStyle]}>
      <Pressable onPress={onPress} style={({ pressed }) => [
        styles.card,
        { borderColor: rarity.color, shadowColor: rarity.glow },
        pressed && { transform: [{ scale: 0.96 }] }
      ]}>
        {/* Glow background tinted by rarity */}
        <View style={[styles.cardGlow, { backgroundColor: rarity.glow }]} />

        {/* Item image */}
        <View style={styles.itemImgContainer}>
          {item.pixelArt && ITEM_ASSETS[item.pixelArt] ? (
            <Image
              source={ITEM_ASSETS[item.pixelArt]}
              style={styles.itemImg}
              contentFit="contain"
            />
          ) : (
            <Text style={styles.itemEmoji}>{item.icon}</Text>
          )}
        </View>

        {/* Rarity badge */}
        <View style={[styles.rarityBadge, { backgroundColor: rarity.color + '22', borderColor: rarity.color + '66' }]}>
          <Text style={[styles.rarityTxt, { color: rarity.color }]}>{rarity.label}</Text>
        </View>

        {/* Name & description */}
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        {item.description && (
          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        )}

        {/* Stats */}
        {item.stats && (
          <View style={styles.statsRow}>
            {item.stats.atk != null && item.stats.atk > 0 && (
              <View style={[styles.statChip, { backgroundColor: '#ef444420', borderColor: '#ef444455' }]}>
                <Text style={[styles.statTxt, { color: '#ef4444' }]}>⚔️ +{item.stats.atk}</Text>
              </View>
            )}
            {item.stats.def != null && item.stats.def > 0 && (
              <View style={[styles.statChip, { backgroundColor: '#3b82f620', borderColor: '#3b82f655' }]}>
                <Text style={[styles.statTxt, { color: '#3b82f6' }]}>🛡️ +{item.stats.def}</Text>
              </View>
            )}
            {item.stats.hp != null && item.stats.hp > 0 && (
              <View style={[styles.statChip, { backgroundColor: '#22c55e20', borderColor: '#22c55e55' }]}>
                <Text style={[styles.statTxt, { color: '#22c55e' }]}>❤️ +{item.stats.hp}</Text>
              </View>
            )}
            {item.stats.mana != null && item.stats.mana > 0 && (
              <View style={[styles.statChip, { backgroundColor: '#a78bfa20', borderColor: '#a78bfa55' }]}>
                <Text style={[styles.statTxt, { color: '#a78bfa' }]}>💧 +{item.stats.mana}</Text>
              </View>
            )}
          </View>
        )}

        {/* Type badge bottom */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeTxt}>
            {item.type === 'card' ? '🎴 Carta' :
             item.type === 'weapon' ? '⚔️ Arma' :
             item.type === 'protection' ? '🛡️ Protección' :
             item.type === 'consumable' ? '🧪 Consumible' : item.type}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Modal Principal ──────────────────────────────────────────────────────────
export const LootDropModal = ({ visible, loot, onClaim, onClose }: Props) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (visible) {
      // Arrancar en modo apilado, expandir después de un respiro
      setExpanded(false);
      setTimeout(() => setExpanded(true), 400);
    }
  }, [visible]);

  if (!loot) return null;

  const items: BossDropItem[] = [loot.guaranteed];
  if (loot.random) items.push(loot.random);

  const handleClaim = () => {
    onClaim(loot.guaranteed, loot.random);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View entering={ZoomIn.duration(300).springify().damping(15)} exiting={FadeOut.duration(200)} style={styles.overlay}>

        {/* Header */}
        <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.header}>
          <Text style={styles.headerEmoji}>⚔️</Text>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>¡Victoria!</Text>
            <Text style={styles.headerSub}>Loot de {loot.bossName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </Animated.View>

        {/* Instruction */}
        <Animated.Text entering={FadeIn.delay(300)} style={styles.instruction}>
          {expanded ? 'Toca una carta para más info' : 'Revelando tu botín...'}
        </Animated.Text>

        {/* Card Fan */}
        <View style={styles.fanContainer}>
          {items.map((item, i) => (
            <LootCard
              key={`loot_${i}`}
              item={item}
              index={i}
              total={items.length}
              isExpanded={expanded}
              onPress={() => setExpanded(e => !e)}
            />
          ))}
        </View>

        {/* Item count */}
        <Animated.View entering={FadeIn.delay(600)} style={styles.countRow}>
          <View style={styles.countPill}>
            <Text style={styles.countTxt}>🎁 {items.length} {items.length === 1 ? 'objeto' : 'objetos'}</Text>
          </View>
        </Animated.View>

        {/* Claim Button */}
        <Animated.View entering={FadeIn.delay(700)} style={styles.claimBtnWrap}>
          <TouchableOpacity style={styles.claimBtn} onPress={handleClaim} activeOpacity={0.8}>
            <Ionicons name="bag-check" size={20} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.claimBtnTxt}>Reclamar Todo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
            <Text style={styles.skipTxt}>Dejar ir</Text>
          </TouchableOpacity>
        </Animated.View>

      </Animated.View>
    </Modal>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const CARD_W = 180;
const CARD_H = 280;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 8, 24, 0.96)',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 8,
    width: '100%',
  },
  headerEmoji: { fontSize: 32 },
  headerText: { flex: 1 },
  headerTitle: { color: '#fbbf24', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },

  instruction: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 40,
    textTransform: 'uppercase',
  },

  // Fan area
  fanContainer: {
    width: SW,
    height: CARD_H + 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
  },
  card: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.8,
    elevation: 12,
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },

  itemImgContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
  },
  itemImg: { width: 80, height: 80 },
  itemEmoji: { fontSize: 48 },

  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  rarityTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  itemName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  itemDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 10,
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    marginBottom: 10,
  },
  statChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statTxt: { fontSize: 11, fontWeight: '900' },

  typeBadge: {
    marginTop: 'auto',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },

  // Count
  countRow: { marginTop: 16, marginBottom: 8 },
  countPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
  },
  countTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },

  // Buttons
  claimBtnWrap: { width: '100%', maxWidth: 340, alignSelf: 'center', paddingHorizontal: 24, gap: 10, marginTop: 8 },
  claimBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#fbbf24', shadowOpacity: 0.4, shadowRadius: 15,
    elevation: 8,
  },
  claimBtnTxt: { color: '#000', fontSize: 17, fontWeight: '900' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '700' },
});
