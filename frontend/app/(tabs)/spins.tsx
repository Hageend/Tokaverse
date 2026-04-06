import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { usePlayerStore } from '../../store/usePlayerStore';
import { COIN_SPRITES, ITEM_SPRITES } from '../../data/classSkills';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, 
  Easing, runOnJS, FadeIn, FadeInRight, FadeInUp
} from 'react-native-reanimated';

const PRIZES = [
  { id: 1, label: '50 Estrellas', icon: 'star', color: '#fbbf24', val: 50 },
  { id: 2, label: 'Poción HP', icon: 'medkit', color: '#ef4444', val: 'item' },
  { id: 3, label: '100 Estrellas', icon: 'star', color: '#f59e0b', val: 100 },
  { id: 4, label: 'Cofre Raro', icon: 'gift', color: '#a855f7', val: 'chest' },
  { id: 5, label: '10 Estrellas', icon: 'star', color: '#64748b', val: 10 },
  { id: 6, label: 'Poción MP', icon: 'water', color: '#3b82f6', val: 'item' },
];

export default function SpinsScreen() {
  const { starCoins, addStarCoins } = usePlayerStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const rot = useSharedValue(0);

  const handleSpin = () => {
    if (busy || starCoins < 50) return;
    setBusy(true);
    addStarCoins(-50);
    
    const targetIdx = Math.floor(Math.random() * PRIZES.length);
    const extraRots = 5 + Math.floor(Math.random() * 5);
    const targetRot = (extraRots * 360) + (targetIdx * (360 / PRIZES.length));
    
    rot.value = withTiming(targetRot, { 
      duration: 3500, 
      easing: Easing.bezier(0.12, 0, 0.39, 0)
    }, () => {
      runOnJS(finalizeSpin)(PRIZES[targetIdx]);
    });
  };

  const finalizeSpin = (win: any) => {
    setResult(win);
    if (typeof win.val === 'number') addStarCoins(win.val);
    setTimeout(() => { setBusy(false); }, 1000);
  };

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot.value}deg` }]
  }));

  const renderWheel = () => (
    <View style={S.wheelContainer}>
      <Animated.View style={[S.glowRing, { opacity: busy ? 1 : 0.4 }]} />
      <Animated.View style={[S.wheel, wheelStyle]}>
        {PRIZES.map((p, i) => (
          <View key={p.id} style={[S.sector, { transform: [{ rotateZ: `${i * (360/PRIZES.length)}deg` }] }]}>
            <View style={[S.sectorFill, { backgroundColor: p.color + '15', borderRightColor: p.color + '44' }]} />
            <View style={S.sectorIcon}>
               <Ionicons name={p.icon as any} size={20} color={p.color} />
            </View>
          </View>
        ))}
      </Animated.View>
      <View style={S.pointer} />
      <TouchableOpacity 
        style={[S.spinBtn, (busy || starCoins < 50) && S.spinBtnDisabled]} 
        onPress={handleSpin}
        disabled={busy || starCoins < 50}
      >
        <Text style={S.spinBtnTxt}>{busy ? 'GIRANDO...' : '¡GIRAR!'}</Text>
        <Text style={S.spinCost}>50 ✦</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <View style={S.header}>
        <Text style={S.title}>RUEDA ASTRAL</Text>
        <Text style={S.subtitle}>Pon a prueba tu fortuna, aventurero</Text>
      </View>

      {isDesktop ? (
        <View style={S.webLayout}>
          <View style={S.leftCol}>{renderWheel()}</View>
          <View style={S.rightCol}>
            <Animated.View entering={FadeInRight} style={S.prizeList}>
              <Text style={S.prizeTitle}>PREMIOS POSIBLES</Text>
              {PRIZES.map((p, i) => (
                <View key={p.id} style={S.prizeRow}>
                  <Ionicons name={p.icon as any} size={18} color={p.color} />
                  <Text style={S.prizeLabel}>{p.label}</Text>
                </View>
              ))}
              
              <View style={S.balanceCard}>
                 <Text style={S.balLabel}>TUS ESTRELLAS</Text>
                 <View style={S.balRow}>
                   <Image source={COIN_SPRITES.star} style={S.starIcon} contentFit="contain" />
                   <Text style={S.balText}>{starCoins}</Text>
                 </View>
              </View>
            </Animated.View>
          </View>
        </View>
      ) : (
        <>
          {renderWheel()}
          <View style={{ height: 40 }} />
          <View style={S.prizeList}>
             <Text style={S.balLabel}>TUS ESTRELLAS: {starCoins} ✦</Text>
          </View>
        </>
      )}

      {result && !busy && (
        <Animated.View entering={FadeInUp} style={S.resultOverlay}>
          <Text style={S.resText}>¡GANASTE!</Text>
          <Text style={[S.resWin, { color: result.color }]}>{result.label.toUpperCase()}</Text>
          <TouchableOpacity style={S.resClose} onPress={() => setResult(null)}>
            <Text style={S.resCloseTxt}>ACEPTAR</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 24, paddingBottom: 100 },
  header: { marginBottom: 40, alignItems: Platform.OS === 'web' ? 'flex-start' : 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#a855f7', letterSpacing: 4 },
  subtitle: { fontSize: 11, color: '#64748b', fontWeight: '700', letterSpacing: 1, marginTop: 4 },

  webLayout: { flexDirection: 'row', alignItems: 'center', gap: 60 },
  leftCol: { flex: 0.6, alignItems: 'center' },
  rightCol: { flex: 0.4 },

  wheelContainer: { width: 320, height: 320, justifyContent: 'center', alignItems: 'center' },
  glowRing: { position: 'absolute', width: 340, height: 340, borderRadius: 170, borderWidth: 4, borderColor: '#a855f733', borderStyle: 'dotted' },
  wheel: { width: 300, height: 300, borderRadius: 150, backgroundColor: '#0f172a', borderWidth: 4, borderColor: '#1e293b', overflow: 'hidden' },
  sector: { position: 'absolute', width: 300, height: 300, left: 0, top: 0, alignItems: 'center' },
  sectorFill: { position: 'absolute', width: 150, height: 300, right: 0, borderRightWidth: 1, borderRightColor: '#ffffff10' },
  sectorIcon: { marginTop: 30, transform: [{ rotateZ: '0deg' }] },
  pointer: { position: 'absolute', top: -10, width: 20, height: 30, backgroundColor: '#fbbf24', borderRadius: 4, zIndex: 10, borderWidth: 2, borderColor: '#000' },
  spinBtn: { 
    position: 'absolute', width: 90, height: 90, borderRadius: 45, 
    backgroundColor: '#1e293b', borderWidth: 4, borderColor: '#fbbf24',
    justifyContent: 'center', alignItems: 'center', zIndex: 20,
    ...Platform.select({ ios: { shadowColor: '#fbbf24', shadowOpacity: 0.3, shadowRadius: 10 } })
  },
  spinBtnDisabled: { opacity: 0.5, borderColor: '#64748b' },
  spinBtnTxt: { color: '#FFF', fontWeight: '900', fontSize: 10 },
  spinCost: { color: '#fbbf24', fontSize: 12, fontWeight: '900', marginTop: 4 },

  prizeList: { backgroundColor: '#0f172a80', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1e293b' },
  prizeTitle: { color: '#64748b', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
  prizeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  prizeLabel: { color: '#f1f5f9', fontSize: 13, fontWeight: '700' },

  balanceCard: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#1e293b' },
  balLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', marginBottom: 8 },
  balRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starIcon: { width: 18, height: 18 },
  balText: { fontSize: 24, fontWeight: '900', color: '#FFF' },

  resultOverlay: { 
    position: 'absolute', top: '40%', left: '10%', right: '10%', 
    backgroundColor: '#0f172a', padding: 32, borderRadius: 24, 
    alignItems: 'center', borderWidth: 2, borderColor: '#fbbf24',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 40 } })
  },
  resText: { color: '#64748b', fontWeight: '900', fontSize: 12, letterSpacing: 3 },
  resWin: { fontSize: 24, fontWeight: '900', marginTop: 8, marginBottom: 24 },
  resClose: { backgroundColor: '#fbbf24', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  resCloseTxt: { color: '#000', fontWeight: '900', fontSize: 13 },
});
