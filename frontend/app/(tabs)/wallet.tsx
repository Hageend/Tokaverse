import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Colors } from '../../constants/Colors';
import { COIN_SPRITES } from '../../data/classSkills';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';

export default function WalletScreen() {
  const { starCoins } = usePlayerStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const transactions = [
    { id: '1', type: 'recompensa', amount: 150, date: 'Hoy, 14:20', desc: 'Victoria: Rey Goblin' },
    { id: '2', type: 'compra', amount: -50, date: 'Ayer, 18:30', desc: 'Poción de Vida x2' },
    { id: '3', type: 'recompensa', amount: 80, date: 'Ayer, 09:15', desc: 'Quest: Limpieza de Bosque' },
    { id: '4', type: 'compra', amount: -200, date: '04 Abr, 21:00', desc: 'Desbloqueo de Clase: Mago' },
  ];

  const renderBalance = () => (
    <Animated.View entering={FadeInUp} style={[S.card, isDesktop && S.desktopBalanceCard]}>
      <Text style={S.cardLabel}>SALDO TOTAL</Text>
      <View style={S.balanceRow}>
        <Image source={COIN_SPRITES.star} style={S.starIcon} contentFit="contain" />
        <Text style={S.balanceText}>{starCoins}</Text>
      </View>
      <View style={S.statsRow}>
        <View style={S.statItem}>
          <Text style={S.statVal}>84%</Text>
          <Text style={S.statLab}>AHORRO</Text>
        </View>
        <View style={S.divider} />
        <View style={S.statItem}>
          <Text style={S.statVal}>+15%</Text>
          <Text style={S.statLab}>INTERÉS</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderHistory = () => (
    <View style={[S.historyBox, isDesktop && S.desktopHistoryBox]}>
      <Text style={S.historyTitle}>ÚLTIMOS MOVIMIENTOS</Text>
      {transactions.map((t, i) => (
        <Animated.View entering={FadeInLeft.delay(i * 100)} key={t.id} style={S.tRow}>
          <View style={[S.tIconBox, { backgroundColor: t.amount > 0 ? '#22c55e20' : '#ef444420' }]}>
            <Ionicons name={t.amount > 0 ? 'arrow-up' : 'arrow-down'} size={14} color={t.amount > 0 ? '#22c55e' : '#ef4444'} />
          </View>
          <View style={S.tInfo}>
            <Text style={S.tDesc}>{t.desc}</Text>
            <Text style={S.tDate}>{t.date}</Text>
          </View>
          <Text style={[S.tAmount, { color: t.amount > 0 ? '#22c55e' : '#ef4444' }]}>
            {t.amount > 0 ? '+' : ''}{t.amount}
          </Text>
        </Animated.View>
      ))}
    </View>
  );

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content}>
      <View style={S.header}>
        <Text style={S.title}>BÓVEDA REAL</Text>
        <Text style={S.subtitle}>Administra tu tesorería de aventurero</Text>
      </View>

      {isDesktop ? (
        <View style={S.webLayout}>
          <View style={S.leftCol}>{renderBalance()}</View>
          <View style={S.rightCol}>{renderHistory()}</View>
        </View>
      ) : (
        <>
          {renderBalance()}
          {renderHistory()}
        </>
      )}
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 24, paddingBottom: 100 },
  header: { marginBottom: 32, alignItems: Platform.OS === 'web' ? 'flex-start' : 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#fbbf24', letterSpacing: 4 },
  subtitle: { fontSize: 12, color: '#64748b', fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  
  webLayout: { flexDirection: 'row', gap: 32 },
  leftCol: { flex: 0.4 },
  rightCol: { flex: 0.6 },

  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#1e293b',
    padding: 32,
    ...Platform.select({ ios: { shadowColor: '#fbbf24', shadowOpacity: 0.1, shadowRadius: 20 }, default: { elevation: 10 } }),
  },
  desktopBalanceCard: { minHeight: 400, justifyContent: 'center' },
  cardLabel: { color: '#64748b', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  starIcon: { width: 32, height: 32 },
  balanceText: { fontSize: 42, fontWeight: '900', color: '#FFF' },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 24, borderTopWidth: 1, borderTopColor: '#1e293b' },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { color: '#22c55e', fontSize: 18, fontWeight: '900' },
  statLab: { color: '#64748b', fontSize: 9, fontWeight: '800', marginTop: 4 },
  divider: { width: 1, height: 30, backgroundColor: '#1e293b' },

  historyBox: { marginTop: 32, flex: 1 },
  desktopHistoryBox: { marginTop: 0 },
  historyTitle: { color: '#64748b', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
  tRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f172a80', 
    padding: 16, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1e293b'
  },
  tIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tInfo: { flex: 1, marginLeft: 16 },
  tDesc: { color: '#f1f5f9', fontSize: 14, fontWeight: '700' },
  tDate: { color: '#64748b', fontSize: 11, marginTop: 2 },
  tAmount: { fontSize: 16, fontWeight: '900' },
});
