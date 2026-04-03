// components/quest/InventoryModal.tsx
// TokaVerse — Modal de inventario RPG con grid de slots y Reanimated 3

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Dimensions, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withRepeat, withSequence,
  FadeIn, FadeOut, SlideInDown, SlideOutDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useInventoryStore, InventoryItem, ItemRarity,
  RARITY_COLORS, RARITY_LABELS, SLOT_RULES,
} from '../../store/useInventoryStore';
import { Colors } from '../../constants/Colors';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS       = 5;
const SLOT_SIZE  = Math.floor((SCREEN_W - 48 - (COLS - 1) * 6) / COLS);

// ─── Mapeo de Assets Pixel Art ────────────────────────────────────────────────
const PIXEL_ART_ASSETS: Record<string, any> = {
  item_chest:             require('../../assets/images/items/item_chest.png'),
  item_sword:             require('../../assets/images/items/item_sword.png'),
  item_sword_diamond:     require('../../assets/images/items/item_sword_diamond.png'),
  item_sword_infernal:    require('../../assets/images/items/item_sword_infernal.png'),
  item_sword_Thunder:     require('../../assets/images/items/item_sword_Thunder.png'),
  item_shield:            require('../../assets/images/items/item_shield.png'),
  item_shield_chest:      require('../../assets/images/items/item_shield_chest.png'),
  item_shield_elemental:  require('../../assets/images/items/item_shield_elemental.png'),
  item_potion:            require('../../assets/images/items/item_potion.png'),
  item_potion_HP:         require('../../assets/images/items/item_potion_HP.png'),
  item_potion_energy:     require('../../assets/images/items/item_potion_energy.png'),
  item_potion_mana:       require('../../assets/images/items/item_potion_mana.png'),
  item_potion_strong:     require('../../assets/images/items/item_potion_strong.png'),
  item_card:              require('../../assets/images/items/item_card.png'),
  item_card_hp:           require('../../assets/images/items/item_card_hp.png'),
  item_card_mana:         require('../../assets/images/items/item_card_mana.png'),
  item_card_xp:           require('../../assets/images/items/item_card_xp.png'),
  item_card_energy:       require('../../assets/images/items/item_card_energy.png'),
  item_card_strong:       require('../../assets/images/items/item_card_strong.png'),
  item_ring_mana:         require('../../assets/images/items/item_ring_mana.png'),
  item_ring_shield:       require('../../assets/images/items/item_ring_shield.png'),
  item_ring_strong:       require('../../assets/images/items/item_ring_strong.png'),
  item_crystal_mana:      require('../../assets/images/items/item_crystal_mana.png'),
  item_compass:           require('../../assets/images/items/item_compass.png'),
  item_ritual_incense:    require('../../assets/images/items/item_ritual_incense.png'),
  item_tinypotion_energy: require('../../assets/images/items/item_tinypotion_energy.png'),
};

// ─── Dot de rareza ────────────────────────────────────────────────────────────
function RarityDot({ rarity }: { rarity: ItemRarity }) {
  return (
    <View style={[rdStyles.dot, { backgroundColor: RARITY_COLORS[rarity] }]} />
  );
}
const rdStyles = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 4, right: 4 },
});

// ─── Slot legendario con glow pulsante ────────────────────────────────────────
function LegendaryGlow() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.4, { duration: 800 })),
      -1, true,
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[lgStyles.glow, glowStyle]} pointerEvents="none" />
  );
}
const lgStyles = StyleSheet.create({
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});

// ─── Slot del inventario ──────────────────────────────────────────────────────
interface InventorySlotProps {
  item?:      InventoryItem;
  index:      number;
  isSelected: boolean;
  onPress:    () => void;
}
function InventorySlot({ item, index, isSelected, onPress }: InventorySlotProps) {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const borderColor = item ? RARITY_COLORS[item.rarity] : 'rgba(255,255,255,0.08)';
  const bgColor     = item
    ? item.rarity === 'legendary' ? '#1a1500'
    : item.rarity === 'rare'     ? '#0d0a1e'
    : 'rgba(255,255,255,0.03)'
    : 'rgba(10,10,30,0.8)';

  const handlePress = () => {
    if (!item) return;
    scale.value = withSequence(withTiming(0.92, { duration: 80 }), withSpring(1));
    onPress();
  };

  const durPercent = item?.durability !== undefined && item?.maxDurability 
    ? (item.durability / item.maxDurability) * 100 
    : null;

  return (
    <Animated.View style={[{ width: SLOT_SIZE, height: SLOT_SIZE }, scaleStyle]}>
      <TouchableOpacity
        style={[
          slotStyles.slot,
          { borderColor, backgroundColor: bgColor },
          !item && slotStyles.emptySlot,
          isSelected && { borderColor: Colors.tertiary, borderWidth: 2 },
          item?.isEquipped && { borderColor: Colors.accent, borderWidth: 2 },
        ]}
        onPress={handlePress}
        disabled={!item}
        activeOpacity={0.8}
      >
        {item ? (
          <>
            {item.rarity === 'legendary' && <LegendaryGlow />}
            
            {item.pixelArt ? (
              <Image 
                source={PIXEL_ART_ASSETS[item.pixelArt]} 
                style={slotStyles.pixelImg} 
                contentFit="contain" 
              />
            ) : (
              <Text style={slotStyles.itemIcon}>{item.icon}</Text>
            )}

            {item.isEquipped && (
              <View style={slotStyles.equipTag}>
                <Text style={slotStyles.equipTagText}>E</Text>
              </View>
            )}

            {durPercent !== null && (
              <View style={slotStyles.durBarBg}>
                <View style={[slotStyles.durBarFill, { width: `${durPercent}%` as any, backgroundColor: durPercent < 30 ? '#ef4444' : '#22c55e' }]} />
              </View>
            )}

            <RarityDot rarity={item.rarity} />
          </>
        ) : (
          <Text style={slotStyles.emptyNum}>{index + 1}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
const slotStyles = StyleSheet.create({
  slot: {
    width: '100%', height: '100%',
    borderWidth: 1.5, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', position: 'relative',
  },
  emptySlot:    { opacity: 0.4 },
  pixelImg:     { width: '70%', height: '70%' },
  itemIcon:     { fontSize: 22, textAlign: 'center' },
  emptyNum:     { color: 'rgba(255,255,255,0.08)', fontSize: 10, fontWeight: '700' },
  equipTag: {
    position: 'absolute', top: 2, left: 2,
    backgroundColor: Colors.accent, borderRadius: 4,
    width: 12, height: 12, justifyContent: 'center', alignItems: 'center',
  },
  equipTagText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  durBarBg: {
    position: 'absolute', bottom: 12, left: 6, right: 6,
    height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1.5,
    overflow: 'hidden',
  },
  durBarFill: { height: '100%', borderRadius: 1.5 },
});

// ─── Panel de detalle del ítem ────────────────────────────────────────────────
function ItemDetail({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const rarityColor = RARITY_COLORS[item.rarity];
  const { equipItem } = useInventoryStore();

  const isEquippable = item.type === 'weapon' || item.type === 'protection';

  return (
    <Animated.View entering={FadeIn.duration(200)} style={[detStyles.panel, { borderColor: rarityColor + '55' }]}>
      <View style={detStyles.header}>
        {item.pixelArt ? (
          <Image 
            source={PIXEL_ART_ASSETS[item.pixelArt]} 
            style={{ width: 44, height: 44 }} 
            contentFit="contain" 
          />
        ) : (
          <Text style={detStyles.icon}>{item.icon}</Text>
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={detStyles.name}>{item.name}</Text>
          <Text style={[detStyles.rarity, { color: rarityColor }]}>{RARITY_LABELS[item.rarity]}</Text>
          <Text style={detStyles.source}>Obtenido de: {item.obtainedFrom}</Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      <Text style={detStyles.desc}>{item.description}</Text>

      {/* Stats Display */}
      {item.stats && (
        <View style={detStyles.statsRow}>
          {item.stats.atk !== undefined && (
            <View style={detStyles.statBadge}>
              <Text style={detStyles.statLabel}>ATK</Text>
              <Text style={detStyles.statValue}>+{item.stats.atk}</Text>
            </View>
          )}
          {item.stats.def !== undefined && (
            <View style={detStyles.statBadge}>
              <Text style={detStyles.statLabel}>DEF</Text>
              <Text style={detStyles.statValue}>+{item.stats.def}</Text>
            </View>
          )}
          {item.durability !== undefined && (
            <View style={detStyles.statBadge}>
              <Text style={detStyles.statLabel}>USOS</Text>
              <Text style={detStyles.statValue}>{item.durability}/{item.maxDurability}</Text>
            </View>
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <View style={[detStyles.typeBadge, { borderColor: rarityColor + '33' }]}>
          <Text style={[detStyles.typeText, { color: rarityColor }]}>
            {item.type === 'card' ? '🃏 Carta' : item.type === 'weapon' ? '⚔️ Arma' : item.type === 'protection' ? '🛡️ Protección' : item.type === 'consumable' ? '🧪 Consumible' : '🎰 Spin'}
          </Text>
        </View>

        {isEquippable && (
          <TouchableOpacity 
            style={[detStyles.equipBtn, item.isEquipped && detStyles.unequipBtn]} 
            onPress={() => equipItem(item.id)}
          >
            <Text style={detStyles.equipBtnTxt}>
              {item.isEquipped ? 'DESEQUIPAR' : 'EQUIPAR'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
const detStyles = StyleSheet.create({
  panel: { backgroundColor: '#0d0d1a', borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  icon: { fontSize: 32, textAlign: 'center', width: 44 },
  name: { color: '#e8d5ff', fontSize: 14, fontWeight: '900' },
  rarity: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  source: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 },
  desc: { color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', gap: 4, alignItems: 'center',
  },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800' },
  statValue: { color: Colors.tertiary, fontSize: 11, fontWeight: '900' },
  typeBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.03)' },
  typeText: { fontSize: 11, fontWeight: '800' },
  equipBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 4, justifyContent: 'center',
  },
  unequipBtn: { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: '#ef4444' },
  equipBtnTxt: { color: '#FFF', fontSize: 10, fontWeight: '900' },
});

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
interface InventoryModalProps {
  visible:  boolean;
  onClose:  () => void;
}

export function InventoryModal({ visible, onClose }: InventoryModalProps) {
  const insets = useSafeAreaInsets();
  const { items, maxSlots } = useInventoryStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = items.find(i => i.id === selectedId) ?? null;

  // Slide-up animation
  const translateY = useSharedValue(600);
  const overlayOp  = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOp.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
    } else {
      overlayOp.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(600, { duration: 280 });
      setSelectedId(null);
    }
  }, [visible]);

  const sheetStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOp.value }));

  // Grid data: fill slots up to maxSlots
  const slots = Array.from({ length: maxSlots }, (_, i) => items[i] ?? null);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Dimmed background */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }, overlayStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, sheetStyle]}>

        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image 
              source={PIXEL_ART_ASSETS.item_chest} 
              style={{ width: 24, height: 24 }} 
              contentFit="contain" 
            />
            <View>
              <Text style={styles.sheetTitle}>Inventario</Text>
              <Text style={styles.sheetSub}>{items.length}/{maxSlots} slots usados</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close-circle" size={26} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        {/* Slot usage bar */}
        <View style={styles.slotBarBg}>
          <Animated.View style={[styles.slotBarFill, { width: `${(items.length / maxSlots) * 100}%` as any }]} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>

          {/* Grid */}
          <View style={styles.grid}>
            {slots.map((item, idx) => (
              <InventorySlot
                key={item?.id ?? `empty_${idx}`}
                item={item ?? undefined}
                index={idx}
                isSelected={selectedId === item?.id}
                onPress={() => setSelectedId(item?.id === selectedId ? null : item?.id ?? null)}
              />
            ))}
          </View>

          {/* Item detail panel */}
          {selectedItem && (
            <ItemDetail item={selectedItem} onClose={() => setSelectedId(null)} />
          )}

          {/* Slot expansion banner */}
          <View style={styles.expansionBanner}>
            <Ionicons name="lock-closed" size={12} color="#7b5ea7" />
            <Text style={styles.expansionTxt}>
              Sube a <Text style={{ color: '#c0c0c0', fontWeight: '800' }}>Liga Plata</Text> para desbloquear{' '}
              <Text style={{ color: '#fbbf24', fontWeight: '800' }}>+5 slots</Text>
            </Text>
          </View>

          {/* Spin reserved section */}
          <View style={styles.spinSection}>
            <Text style={styles.spinTitle}>🎰 TokaSpins</Text>
            <Text style={styles.spinSub}>Los slots de spin están reservados para futuras actualizaciones.</Text>
            <View style={styles.spinComingSoon}>
              <Text style={styles.spinComingSoonTxt}>🔒 Próximamente</Text>
            </View>
          </View>

        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0d0d1a',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderTopWidth: 1.5, borderColor: '#7b5ea755',
    paddingHorizontal: 16, paddingTop: 10,
    maxHeight: '88%',
    shadowColor: '#7b5ea7', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center', marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10,
  },
  sheetTitle: { color: '#e8d5ff', fontSize: 18, fontWeight: '900' },
  sheetSub:   { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
  closeBtn:   { padding: 2 },

  slotBarBg: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2,
    overflow: 'hidden', marginBottom: 14,
  },
  slotBarFill: {
    height: '100%', borderRadius: 2, backgroundColor: '#7b5ea7',
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4,
  },

  expansionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(123,94,167,0.08)',
    borderWidth: 1, borderColor: '#7b5ea733',
    borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 12,
  },
  expansionTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 11, flex: 1 },

  spinSection: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 14,
  },
  spinTitle: { color: '#e8d5ff', fontWeight: '900', fontSize: 13, marginBottom: 4 },
  spinSub:   { color: 'rgba(255,255,255,0.3)', fontSize: 11, lineHeight: 16, marginBottom: 10 },
  spinComingSoon: {
    backgroundColor: 'rgba(123,94,167,0.1)', borderRadius: 8,
    borderWidth: 1, borderColor: '#7b5ea744',
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
  },
  spinComingSoonTxt: { color: '#7b5ea7', fontSize: 11, fontWeight: '800' },
});

export default InventoryModal;
