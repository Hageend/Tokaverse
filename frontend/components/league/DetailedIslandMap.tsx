// components/league/DetailedIslandMap.tsx
// TokaVerse — Mapa detallado de isla con ProgressMap integrado (puzzles + jefes)

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Dimensions, ScrollView, Platform, useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Island } from '../../data/islands';
import { ProgressMap, MapNode } from './ProgressMap';

const { width: SW, height: SH } = Dimensions.get('window');

interface Props {
  island:   Island | null;
  visible:  boolean;
  onClose:  () => void;
  onBossFight?: (node: MapNode) => void;
}

// ─── Nodos del mapa por isla ──────────────────────────────────────────────────
const ISLAND_NODES: Record<string, MapNode[]> = {
  isla_ahorro: [
    {
      id: 1, label: 'Inicio', icon: '🏠', x: 170, y: 390, state: 'done', type: 'start',
      lore: { title: 'La Isla del Ahorro', content: 'Esta isla es el hogar de la Orden del Ahorro. Aquí aprenderás los fundamentos del dinero inteligente.', npc: 'Maestro Ahorro', emoji: '🧙' },
    },
    {
      id: 2, label: 'Regla 50/30/20', icon: '🧩', x: 255, y: 330, state: 'done', type: 'puzzle',
      puzzle: {
        question: '¿Cuánto deberías ahorrar de tu ingreso mensual según la regla 50/30/20?',
        options: ['10%', '20%', '30%', '50%'],
        answer: 1, xp: 120,
        hint: 'La regla divide el ingreso en necesidades, deseos y ahorro.',
      },
    },
    {
      id: 3, label: 'Gasto Impulsivo', icon: '🎰', x: 130, y: 275, state: 'done', type: 'boss',
      boss: { name: 'Gasto Impulsivo', emoji: '🎰', hp: 80, difficulty: 'Fácil', diffColor: '#22C55E', bossType: 'toka_despensa', xp: 80 },
    },
    {
      id: 4, label: 'Fondo Emergencia', icon: '🧩', x: 230, y: 215, state: 'active', type: 'puzzle',
      puzzle: {
        question: '¿Cuántos meses de gastos deberías tener en tu fondo de emergencia?',
        options: ['1 mes', '3-6 meses', '12 meses', '2 años'],
        answer: 1, xp: 150,
        hint: 'Los expertos recomiendan cubrir entre 3 y 6 meses de gastos básicos.',
      },
    },
    {
      id: 5, label: 'Mora Acumulada', icon: '💸', x: 120, y: 160, state: 'locked', type: 'boss',
      boss: { name: 'Mora Acumulada', emoji: '💸', hp: 120, difficulty: 'Normal', diffColor: '#F59E0B', bossType: 'loan', xp: 150 },
    },
    {
      id: 6, label: 'Lore: Orden', icon: '📖', x: 240, y: 100, state: 'locked', type: 'lore',
      lore: { title: 'La Orden del Ahorro', content: 'Fundada hace 100 años por el Gran Maestro Ahorro, la Orden protege los secretos del dinero inteligente. Su lema: "Cada peso guardado es una batalla ganada."', npc: 'Maestro Ahorro', emoji: '🧙' },
    },
    {
      id: 7, label: 'Cofre Dorado', icon: '🎁', x: 170, y: 44, state: 'locked', type: 'reward',
      reward: { coins: 500, xp: 300, item: 'Carta Legendaria del Ahorro' },
    },
  ],
  isla_inversion: [
    {
      id: 1, label: 'Puerto', icon: '⚓', x: 170, y: 390, state: 'done', type: 'start',
      lore: { title: 'Cumbres de Inversión', content: 'Las montañas más altas del mundo Toka. Aquí el Gremio de Inversores forja el futuro financiero.', npc: 'Mercader Toka', emoji: '🏪' },
    },
    {
      id: 2, label: 'Interés Compuesto', icon: '🧩', x: 255, y: 330, state: 'done', type: 'puzzle',
      puzzle: {
        question: '¿Qué es el interés compuesto?',
        options: ['Interés sobre el capital inicial', 'Interés sobre capital + intereses acumulados', 'Un impuesto bancario', 'El costo de una tarjeta'],
        answer: 1, xp: 200,
        hint: 'Einstein lo llamó "la octava maravilla del mundo".',
      },
    },
    {
      id: 3, label: 'Golem Facturas', icon: '🧱', x: 130, y: 275, state: 'active', type: 'boss',
      boss: { name: 'Golem de Facturas', emoji: '🧱', hp: 200, difficulty: 'Normal', diffColor: '#F59E0B', bossType: 'golem', xp: 200 },
    },
    {
      id: 4, label: 'Diversificación', icon: '🧩', x: 230, y: 215, state: 'locked', type: 'puzzle',
      puzzle: {
        question: '¿Qué significa "no poner todos los huevos en una canasta" en inversiones?',
        options: ['Invertir solo en acciones', 'Diversificar en diferentes activos', 'Guardar dinero en efectivo', 'Invertir en un solo banco'],
        answer: 1, xp: 180,
        hint: 'La diversificación reduce el riesgo distribuyendo inversiones.',
      },
    },
    {
      id: 5, label: 'Abismo Deuda', icon: '🕳️', x: 120, y: 160, state: 'locked', type: 'boss',
      boss: { name: 'Abismo de Deuda', emoji: '🕳️', hp: 500, difficulty: '🌋 Épico', diffColor: '#9333ea', bossType: 'abyss', xp: 600 },
    },
    {
      id: 6, label: 'Cofre Épico', icon: '🎁', x: 170, y: 44, state: 'locked', type: 'reward',
      reward: { coins: 1000, xp: 500, item: 'Carta Épica de Inversión' },
    },
  ],
  isla_neon: [
    {
      id: 1, label: 'Entrada', icon: '🌆', x: 170, y: 390, state: 'done', type: 'start',
      lore: { title: 'Isla Neón', content: 'La ciudad del futuro financiero. Aquí los hackers del dinero dominan las transacciones digitales.', npc: 'Hacker', emoji: '💻' },
    },
    {
      id: 2, label: 'Criptomonedas', icon: '🧩', x: 255, y: 330, state: 'active', type: 'puzzle',
      puzzle: {
        question: '¿Cuál es el principal riesgo de las criptomonedas?',
        options: ['Son muy lentas', 'Alta volatilidad', 'No se pueden vender', 'Son ilegales en México'],
        answer: 1, xp: 160,
        hint: 'El precio puede subir o bajar drásticamente en horas.',
      },
    },
    {
      id: 3, label: 'Tarjeta Maldita', icon: '🃏', x: 130, y: 275, state: 'locked', type: 'boss',
      boss: { name: 'Tarjeta Maldita', emoji: '🃏', hp: 300, difficulty: '🌋 Épico', diffColor: '#FF6B35', bossType: 'credit_card', xp: 400 },
    },
    {
      id: 4, label: 'Cofre Neón', icon: '🎁', x: 170, y: 44, state: 'locked', type: 'reward',
      reward: { coins: 750, xp: 400, item: 'Carta Rara Neón' },
    },
  ],
  isla_abismo: [
    {
      id: 1, label: 'Entrada', icon: '🌑', x: 170, y: 390, state: 'active', type: 'start',
      lore: { title: 'El Abismo', content: 'El lugar más oscuro del mundo Toka. Solo los aventureros más valientes se atreven a entrar. Las deudas más antiguas duermen aquí.', npc: 'Sombra de Deuda', emoji: '🌑' },
    },
    {
      id: 2, label: 'Deuda Sombría', icon: '👾', x: 200, y: 300, state: 'locked', type: 'boss',
      boss: { name: 'Deuda Sombría', emoji: '👾', hp: 200, difficulty: 'Difícil', diffColor: '#EF4444', bossType: 'overdraft', xp: 250 },
    },
    {
      id: 3, label: 'Monstruo Efectivo', icon: '💵', x: 170, y: 150, state: 'locked', type: 'boss',
      boss: { name: 'Monstruo de Efectivo', emoji: '💵', hp: 700, difficulty: '👹 Infernal', diffColor: '#16a34a', bossType: 'cash', xp: 1000 },
    },
    {
      id: 4, label: 'Cofre Oscuro', icon: '🎁', x: 170, y: 44, state: 'locked', type: 'reward',
      reward: { coins: 2000, xp: 1000, item: 'Carta Legendaria del Abismo' },
    },
  ],
};

const ISLAND_MISSIONS: Record<string, { id: string; icon: string; name: string; xp: number; done: boolean }[]> = {
  isla_ahorro: [
    { id: 'm1', icon: '💳', name: 'Completa el puzzle de ahorro', xp: 120, done: true },
    { id: 'm2', icon: '⚔️', name: 'Derrota al Gasto Impulsivo', xp: 80, done: true },
    { id: 'm3', icon: '🧩', name: 'Aprende sobre fondos de emergencia', xp: 150, done: false },
    { id: 'm4', icon: '💸', name: 'Derrota a la Mora Acumulada', xp: 150, done: false },
  ],
  isla_inversion: [
    { id: 'm1', icon: '📈', name: 'Aprende sobre interés compuesto', xp: 200, done: true },
    { id: 'm2', icon: '⚔️', name: 'Derrota al Golem de Facturas', xp: 200, done: false },
    { id: 'm3', icon: '🧩', name: 'Aprende diversificación', xp: 180, done: false },
  ],
  isla_neon: [
    { id: 'm1', icon: '💻', name: 'Aprende sobre criptomonedas', xp: 160, done: false },
    { id: 'm2', icon: '🃏', name: 'Derrota a la Tarjeta Maldita', xp: 400, done: false },
  ],
  isla_abismo: [
    { id: 'm1', icon: '🌑', name: 'Entra al Abismo', xp: 50, done: false },
    { id: 'm2', icon: '👾', name: 'Derrota a la Deuda Sombría', xp: 250, done: false },
    { id: 'm3', icon: '💵', name: 'Derrota al Monstruo de Efectivo', xp: 1000, done: false },
  ],
};

export const DetailedIslandMap = ({ island, visible, onClose, onBossFight }: Props) => {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 1024 && Platform.OS === 'web';
  const [activeTab, setActiveTab] = useState<'map' | 'progress'>('map');

  if (!island) return null;

  const nodes   = ISLAND_NODES[island.id]   ?? ISLAND_NODES.isla_ahorro;
  const missions = ISLAND_MISSIONS[island.id] ?? [];
  const progress = Math.round((island.completedMissions / island.totalMissions) * 100);

  // Dimensiones responsivas para la imagen del mapa
  const mapW = isDesktop ? Math.min(width * 0.55, 700) : width - 32;
  const mapH = isDesktop ? Math.min(height * 0.55, 500) : mapW * 0.65;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={S.overlay}>
        <View style={[S.container, isDesktop && { width: '90%', maxWidth: 1100, height: '92%' }]}>

          {/* Header */}
          <View style={S.header}>
            <View style={{ flex: 1 }}>
              <Text style={S.islandName}>{island.name.toUpperCase()}</Text>
              <Text style={S.islandSub}>{island.completedMissions}/{island.totalMissions} misiones completadas</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={S.closeBtn} accessibilityLabel="Cerrar mapa">
              <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={S.tabs}>
            {(['map', 'progress'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[S.tab, activeTab === tab && S.tabActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[S.tabTxt, activeTab === tab && S.tabTxtActive]}>
                  {tab === 'map' ? '🗺️ Mapa' : '⚔️ Progreso'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            {activeTab === 'map' ? (
              <View style={S.mapSection}>
                {/* Imagen del mapa — dimensionada correctamente */}
                <View style={[S.mapWrapper, { width: mapW, height: mapH, alignSelf: 'center' }]}>
                  <Image
                    source={island.fullMapImage}
                    style={{ width: mapW, height: mapH, borderRadius: 12 }}
                    contentFit="contain"
                    accessibilityLabel={`Mapa de ${island.name}`}
                  />
                  {/* NPCs sobre el mapa */}
                  {island.npcs.map((npc, i) => (
                    <View
                      key={i}
                      style={[S.npcPin, { left: npc.x as any, top: npc.y as any }]}
                    >
                      <View style={[S.npcDot, { backgroundColor: npc.npc.faction === 'red' ? '#ef4444' : npc.npc.faction === 'purple' ? '#a855f7' : npc.npc.faction === 'yellow' ? '#f59e0b' : '#3b82f6' }]} />
                    </View>
                  ))}
                </View>

                {/* Info de la isla */}
                <View style={S.infoBox}>
                  <View style={S.progressRow}>
                    <Text style={S.progressLabel}>Progreso de la isla</Text>
                    <Text style={S.progressPct}>{progress}%</Text>
                  </View>
                  <View style={S.progressTrack}>
                    <View style={[S.progressFill, { width: `${progress}%` as any }]} />
                  </View>

                  {/* Misiones */}
                  <Text style={S.missionsTitle}>Misiones</Text>
                  {missions.map(m => (
                    <View key={m.id} style={[S.missionRow, m.done && S.missionDone]}>
                      <Text style={S.missionIcon}>{m.icon}</Text>
                      <Text style={[S.missionName, m.done && S.missionNameDone]}>{m.name}</Text>
                      <Text style={[S.missionXp, m.done && { color: '#22c55e' }]}>
                        {m.done ? '✓' : `+${m.xp} XP`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              /* Tab de Progreso — ProgressMap integrado */
              <View style={{ paddingBottom: 20 }}>
                <ProgressMap
                  nodes={nodes}
                  missions={missions}
                  xpPercent={progress}
                  leagueName={island.name}
                  xpLabel={`${island.completedMissions} / ${island.totalMissions} misiones`}
                  onMissionComplete={(id) => console.log('Mission done:', id)}
                  onBossFight={onBossFight}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '96%',
    maxHeight: '94%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  islandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  islandSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  closeBtn: { padding: 4 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabTxt: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTxtActive: {
    color: '#fff',
    fontWeight: '900',
  },
  mapSection: {
    padding: 16,
    gap: 16,
  },
  mapWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  npcPin: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  npcDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '800',
  },
  progressPct: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  missionsTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    gap: 10,
  },
  missionDone: { opacity: 0.5 },
  missionIcon: { fontSize: 18 },
  missionName: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  missionNameDone: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.4)',
  },
  missionXp: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '900',
  },
});
