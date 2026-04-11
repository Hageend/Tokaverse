import React, { useState, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Dimensions, Modal, Platform 
} from 'react-native';
import Animated, { 
  useSharedValue, useAnimatedStyle, withTiming, 
  Easing, runOnJS, withSpring, ZoomIn
} from 'react-native-reanimated';
import { Svg, G, Path, Text as SvgText, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_W * 0.85, 340);
const RADIUS = WHEEL_SIZE / 2;

interface Prize {
  id: number;
  label: string;
  icon: string;
  color: string;
  action: () => void;
}

const PRIZES: Prize[] = [
  { id: 0, label: '50 Coins', icon: '💰', color: '#1e1e3a', action: () => usePlayerStore.getState().addStarCoins(50) },
  { 
    id: 1, label: 'Poción HP', icon: '🧪', color: '#2a2a5a', 
    action: () => useInventoryStore.getState().addItem({
      icon: '🧪', pixelArt: 'item_potion_HP', name: 'Poción de HP (Spin)', rarity: 'uncommon', type: 'consumable', stats: { hp: 40 }, description: 'Recuperada en la ruleta.'
    }, 'Ruleta de la Suerte')
  },
  { id: 2, label: '100 Coins', icon: '💰', color: '#1e1e3a', action: () => usePlayerStore.getState().addStarCoins(100) },
  { 
    id: 3, label: 'Espada Rara', icon: '⚔️', color: '#3a2a6a', 
    action: () => useInventoryStore.getState().addItem({
      icon: '🗡️', pixelArt: 'item_sword', name: 'Hoja de la Suerte', rarity: 'rare', type: 'weapon', stats: { atk: 18 }, durability: 20, weaponStyle: 'sword', description: 'Forjada por el azar.'
    }, 'Ruleta de la Suerte')
  },
  { id: 4, label: '250 Coins', icon: '💰', color: '#1e1e3a', action: () => usePlayerStore.getState().addStarCoins(250) },
  { 
    id: 5, label: 'Carta Rara', icon: '🎴', color: '#4a2a7a', 
    action: () => useInventoryStore.getState().addItem({
      icon: '🎴', pixelArt: 'item_card_mana', name: 'Carta: Destino', rarity: 'rare', type: 'card', templateId: 'r002', element: 'dark', description: 'El destino en tus manos.'
    }, 'Ruleta de la Suerte')
  },
  { id: 6, label: '500 Coins', icon: '💎', color: '#1e1e3a', action: () => usePlayerStore.getState().addStarCoins(500) },
  { 
    id: 7, label: '¡LEGENDARIO!', icon: '⭐', color: '#fbbf24', 
    action: () => useInventoryStore.getState().addItem({
      icon: '👑', pixelArt: 'item_sword_diamond', name: 'Excalibur Fortuna', rarity: 'legendary', type: 'weapon', stats: { atk: 45 }, durability: 30, weaponStyle: 'sword', description: 'El premio gordo de la ruleta.'
    }, 'Ruleta de la Suerte')
  },
];

export function LuckySpinModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const rotation = useSharedValue(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Prize | null>(null);
  
  const { consumeSpinItem, getSpinBalance } = useInventoryStore();
  const balance = getSpinBalance();

  const handleSpin = () => {
    if (isSpinning || balance <= 0) return;

    const success = consumeSpinItem();
    if (!success) return;

    setIsSpinning(true);
    setWinner(null);

    // 5 a 10 vueltas completas + offset del premio
    const spins = 5 + Math.floor(Math.random() * 5);
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const segmentAngle = 360 / PRIZES.length;
    
    // El 0 de la ruleta suele estar arriba (270 deg) o derecha (0 deg). 
    const targetRotation = rotation.value + (spins * 360) + (prizeIndex * segmentAngle);

    // Haptic feedback logic: disparar al cruzar cada segmento
    const lastSegment = { value: -1 };
    
    rotation.value = withTiming(targetRotation, {
      duration: 5000,
      easing: Easing.bezier(0.15, 0, 0, 1),
    }, (finished) => {
      if (finished) {
        runOnJS(onSpinEnd)(prizeIndex);
      }
    });

    // Monitorear progreso de rotación para hápticos
    const hapticInterval = setInterval(() => {
      if (!isSpinning) {
        clearInterval(hapticInterval);
        return;
      }
      const currentAngle = rotation.value % 360;
      const currentSeg = Math.floor(currentAngle / segmentAngle);
      if (currentSeg !== lastSegment.value) {
        lastSegment.value = currentSeg;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 50);
  };

  const onSpinEnd = (prizeIndex: number) => {
    setIsSpinning(false);
    const prize = PRIZES[prizeIndex];
    setWinner(prize);
    prize.action();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const renderSegments = () => {
    const angle = 360 / PRIZES.length;
    return PRIZES.map((prize, i) => {
      const startAngle = i * angle;
      const endAngle = (i + 1) * angle;
      
      // Cálculo de arco para Path
      const x1 = RADIUS + RADIUS * Math.cos((Math.PI * startAngle) / 180);
      const y1 = RADIUS + RADIUS * Math.sin((Math.PI * startAngle) / 180);
      const x2 = RADIUS + RADIUS * Math.cos((Math.PI * endAngle) / 180);
      const y2 = RADIUS + RADIUS * Math.sin((Math.PI * endAngle) / 180);

      const pathData = `M${RADIUS},${RADIUS} L${x1},${y1} A${RADIUS},${RADIUS} 0 0,1 ${x2},${y2} Z`;

      return (
        <G key={i}>
          <Path d={pathData} fill={prize.color} stroke="#000" strokeWidth="1" />
          <G transform={`rotate(${startAngle + angle / 2}, ${RADIUS}, ${RADIUS})`}>
            <SvgText
              x={RADIUS + RADIUS * 0.65}
              y={RADIUS}
              fill={prize.id === 7 ? '#000' : '#FFF'}
              fontSize="10"
              fontWeight="900"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {prize.icon}
            </SvgText>
          </G>
        </G>
      );
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={S.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={!isSpinning ? onClose : undefined} />
        
        <View style={S.container}>
          <Text style={S.title}>RULETA DE LA SUERTE</Text>
          <Text style={S.subtitle}>Tiradas disponibles: {balance}</Text>

          <View style={S.wheelWrapper}>
            {/* Puntero */}
            <View style={S.pointer}>
              <Ionicons name="caret-down" size={32} color={Colors.accent} />
            </View>

            <Animated.View style={[S.wheel, animatedStyle]}>
              <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
                {/* Neon Outer GLow */}
                <Circle cx={RADIUS} cy={RADIUS} r={RADIUS - 2} fill="transparent" stroke={Colors.primary} strokeWidth="4" opacity={0.3} />
                <Circle cx={RADIUS} cy={RADIUS} r={RADIUS - 5} fill="transparent" stroke={Colors.primary} strokeWidth="2" opacity={0.6} />
                
                <Circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill="#0d0d1a" />
                {renderSegments()}
                
                {/* Center Cap */}
                <Circle cx={RADIUS} cy={RADIUS} r={RADIUS * 0.18} fill="#0d0d1a" stroke="#fbbf24" strokeWidth="2" />
                <Circle cx={RADIUS} cy={RADIUS} r={RADIUS * 0.08} fill="#fbbf24" />
              </Svg>
            </Animated.View>
          </View>

          <TouchableOpacity 
            style={[S.spinBtn, (isSpinning || balance <= 0) && S.spinBtnDisabled]} 
            onPress={handleSpin}
            disabled={isSpinning || balance <= 0}
          >
            <Text style={S.spinBtnTxt}>{isSpinning ? 'GIRANDO...' : '¡GIRAR!'}</Text>
          </TouchableOpacity>

          {winner && (
            <Animated.View entering={ZoomIn.springify()} style={S.winnerBadge}>
              <Text style={S.winnerIcon}>{winner.icon}</Text>
              <Text style={S.winnerLabel}>¡GANASTE: {winner.label}!</Text>
            </Animated.View>
          )}

          {!isSpinning && (
            <TouchableOpacity style={S.closeBtn} onPress={onClose}>
              <Text style={S.closeBtnTxt}>CERRAR</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  container: {
    width: '90%', maxWidth: 400,
    backgroundColor: '#0d0d1a', borderRadius: 24,
    borderWidth: 2, borderColor: '#7b5ea755',
    padding: 30, alignItems: 'center',
  },
  title: { color: Colors.accent, fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', marginBottom: 25 },
  wheelWrapper: {
    width: WHEEL_SIZE, height: WHEEL_SIZE,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 30, position: 'relative'
  },
  pointer: {
    position: 'absolute', top: -15, zIndex: 10,
    transform: [{ translateY: -5 }],
  },
  wheel: { width: WHEEL_SIZE, height: WHEEL_SIZE },
  spinBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 40, paddingVertical: 15,
    borderRadius: 30, shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 10,
  },
  spinBtnDisabled: { backgroundColor: '#333', shadowOpacity: 0 },
  spinBtnTxt: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  winnerBadge: {
    marginTop: 20, backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#fbbf2433'
  },
  winnerIcon: { fontSize: 24 },
  winnerLabel: { color: '#fbbf24', fontSize: 14, fontWeight: '900' },
  closeBtn: { marginTop: 20, padding: 10 },
  closeBtnTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '800' },
});
