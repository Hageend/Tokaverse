// components/league/ProgressMap.tsx
// Mapa de progreso de liga con nodos, camino SVG y drawer de misiones

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Modal, Dimensions, Easing,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

const { width: SW } = Dimensions.get('window');
const MAP_W = SW - 40;
const MAP_H = 340;

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface MapNode {
  id: number;
  label: string;
  icon: string;
  x: number; // 0-340 (design space)
  y: number; // 0-420 (design space)
  state: 'done' | 'active' | 'locked';
}

export interface MapMission {
  id: string;
  icon: string;
  name: string;
  xp: number;
  done: boolean;
}

interface Props {
  nodes: MapNode[];
  missions: MapMission[];
  xpPercent: number;       // 0-100
  leagueName: string;
  xpLabel: string;         // e.g. "850 / 1000 XP para el siguiente rango"
  onMissionComplete?: (id: string) => void;
}

// ── Nodo Individual ───────────────────────────────────────────────────────────
const NodeView = ({
  node, mapW, mapH, onPress, pulse,
}: {
  node: MapNode; mapW: number; mapH: number;
  onPress: () => void; pulse: Animated.Value;
}) => {
  const x = (node.x / 340) * mapW;
  const y = (node.y / 420) * mapH;

  const nodeBg =
    node.state === 'done'   ? '#273444' :
    node.state === 'active' ? '#4d61fc' : '#1e293b';
  const nodeBorder =
    node.state === 'done'   ? '#4d61fc' :
    node.state === 'active' ? '#f59e0b' : 'rgba(255,255,255,0.08)';
  const opacity = node.state === 'locked' ? 0.4 : 1;

  const scale = node.state === 'active'
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] })
    : 1;

  return (
    <Animated.View
      style={[
        nodeStyles.node,
        {
          left: x - 26, top: y - 26,
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: nodeBg,
          borderColor: nodeBorder,
          borderWidth: node.state === 'active' ? 3 : 2,
          opacity,
          transform: [{ scale }],
          shadowColor: node.state === 'active' ? '#f59e0b' : 'transparent',
          shadowOpacity: 0.6,
          shadowRadius: 10,
        },
      ]}
    >
      <TouchableOpacity
        style={nodeStyles.inner}
        onPress={node.state === 'active' ? onPress : undefined}
        activeOpacity={node.state === 'active' ? 0.8 : 1}
      >
        <Text style={{ fontSize: 24 }}>{node.icon}</Text>
        <Text style={[
          nodeStyles.label,
          node.state === 'active' && { color: '#fbbf24', fontWeight: '900' },
          node.state === 'done'   && { color: 'rgba(77,97,252,0.8)' },
        ]}>
          {node.label}
        </Text>
        {node.state === 'done' && (
          <View style={nodeStyles.check}><Text style={{ fontSize: 9, color: '#fff' }}>✓</Text></View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Componente Principal ──────────────────────────────────────────────────────
export function ProgressMap({ nodes, missions: initialMissions, xpPercent, leagueName, xpLabel, onMissionComplete }: Props) {
  const [missions, setMissions] = useState<MapMission[]>(initialMissions);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeNode, setActiveNode] = useState<MapNode | null>(null);

  // Animaciones
  const pulseAnim  = useRef(new Animated.Value(0)).current;
  const xpAnim     = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const drawerAnim  = useRef(new Animated.Value(300)).current;
  const starAnim    = useRef(new Animated.Value(0)).current;

  // XP bar entrada
  useEffect(() => {
    Animated.timing(xpAnim, {
      toValue: xpPercent / 100,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [xpPercent]);

  // Pulso del nodo activo
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const openOverlay = (node: MapNode) => {
    setActiveNode(node);
    setOverlayVisible(true);
    starAnim.setValue(0);
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(starAnim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
    ]).start();
  };

  const closeOverlay = () => {
    Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setOverlayVisible(false);
    });
  };

  const openDrawer = () => {
    closeOverlay();
    setTimeout(() => {
      setDrawerVisible(true);
      Animated.spring(drawerAnim, { toValue: 0, friction: 8, tension: 100, useNativeDriver: true }).start();
    }, 250);
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, { toValue: 400, duration: 300, useNativeDriver: true }).start(() => {
      setDrawerVisible(false);
    });
  };

  const completeMission = (id: string) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, done: true } : m));
    onMissionComplete?.(id);
  };

  // Construir path SVG entre nodos
  const buildPath = () => {
    let d = '';
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const ax = (a.x / 340) * MAP_W;
      const ay = (a.y / 420) * MAP_H;
      const bx = (b.x / 340) * MAP_W;
      const by = (b.y / 420) * MAP_H;
      const cpx = (ax + bx) / 2 + (i % 2 === 0 ? 25 : -25);
      const cpy = (ay + by) / 2;
      if (i === 0) d += `M ${ax} ${ay} `;
      d += `Q ${cpx} ${cpy} ${bx} ${by} `;
    }
    return d;
  };

  const xpBarWidth = xpAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrapper}>
      {/* Header del mapa */}
      <View style={styles.mapHeader}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>TU LIGA</Text>
          <View style={styles.badgeDot} />
        </View>
        <Text style={styles.leagueName}>{leagueName}</Text>
        <Text style={styles.xpHint}>{xpLabel}</Text>
        <View style={styles.xpBarBg}>
          <Animated.View style={[styles.xpBarFill, { width: xpBarWidth }]} />
        </View>
        <Text style={styles.xpPct}>{xpPercent}%</Text>
      </View>

      {/* Mapa de nodos */}
      <Text style={styles.mapTitle}>MAPA DE PROGRESO</Text>
      <View style={[styles.mapContainer, { height: MAP_H }]}>
        {/* Camino SVG */}
        <Svg width={MAP_W} height={MAP_H} style={StyleSheet.absoluteFill}>
          {/* Sombra/Glow del camino */}
          <Path
            d={buildPath()}
            fill="none"
            stroke="rgba(77,97,252,0.15)"
            strokeWidth={10}
            strokeLinecap="round"
          />
          <Path
            d={buildPath()}
            fill="none"
            stroke="rgba(77,97,252,0.2)"
            strokeWidth={4}
            strokeDasharray="8,10"
            strokeLinecap="round"
          />
          <Path
            d={buildPath()}
            fill="none"
            stroke="rgba(77,97,252,0.6)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </Svg>

        {/* Nodos */}
        {nodes.map(node => (
          <NodeView
            key={node.id}
            node={node}
            mapW={MAP_W}
            mapH={MAP_H}
            onPress={() => openOverlay(node)}
            pulse={pulseAnim}
          />
        ))}
      </View>

      {/* ── Overlay de celebración ── */}
      <Modal transparent visible={overlayVisible} animationType="none">
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeOverlay}
          />
          <Animated.View style={{
            transform: [{ scale: starAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
            alignItems: 'center',
          }}>
            {/* Estrella decorativa (pura RN, sin SVG animado complejo) */}
            <View style={styles.starDecor}>
              <Text style={{ fontSize: 60 }}>⭐</Text>
            </View>
            <Text style={styles.overlayTitle}>¡{activeNode?.label} desbloqueado!</Text>
            <Text style={styles.overlaySub}>Completa las misiones para avanzar al siguiente nodo</Text>
            <TouchableOpacity style={styles.overlayBtn} onPress={openDrawer}>
              <Text style={styles.overlayBtnText}>Ver misiones →</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ── Drawer de misiones ── */}
      <Modal transparent visible={drawerVisible} animationType="none">
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={closeDrawer}
        />
        <Animated.View style={[styles.drawer, { transform: [{ translateY: drawerAnim }] }]}>
          <View style={styles.drawerHandle} />
          <Text style={styles.drawerTitle}>Misiones: {activeNode?.label}</Text>
          <Text style={styles.drawerSub}>
            {missions.filter(m => !m.done).length} misiones pendientes
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
            {missions.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.missionRow, m.done && styles.missionDone]}
                onPress={() => !m.done && completeMission(m.id)}
                activeOpacity={m.done ? 1 : 0.75}
              >
                <View style={[styles.missionIcon, m.done && styles.missionIconDone]}>
                  <Text style={{ fontSize: 18 }}>{m.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.missionName, m.done && styles.missionNameDone]}>
                    {m.name}
                  </Text>
                  <Text style={styles.missionXp}>
                    {m.done ? '✓ Completada' : `+${m.xp} XP`}
                  </Text>
                </View>
                <Text style={styles.missionArrow}>{m.done ? '✓' : '›'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeDrawerBtn} onPress={closeDrawer}>
            <Text style={styles.closeDrawerText}>CERRAR</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: 24 },

  mapHeader: { alignItems: 'center', marginBottom: 24, paddingHorizontal: 10 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1.5, borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 30, paddingVertical: 8, paddingHorizontal: 20,
    marginBottom: 12,
  },
  badgeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f59e0b' },
  badgeText: { color: '#f59e0b', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  leagueName: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.5 },
  xpHint: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, fontWeight: '600' },
  xpBarBg: {
    width: '100%', height: 12, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, overflow: 'hidden', marginTop: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.05)',
  },
  xpBarFill: {
    height: '100%', borderRadius: 10,
    backgroundColor: '#4d61fc',
    shadowColor: '#4d61fc', shadowOpacity: 0.8, shadowRadius: 10,
  },
  xpPct: { fontSize: 13, color: 'rgba(255,255,255,0.6)', alignSelf: 'flex-end', marginTop: 6, fontWeight: '800' },

  mapTitle: {
    fontSize: 11, fontWeight: '900', letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.4)', marginBottom: 20,
    textTransform: 'uppercase',
  },
  mapContainer: { width: '100%', position: 'relative' },

  overlay: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  starDecor: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 2, borderColor: '#f59e0b',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#f59e0b', shadowOpacity: 0.5, shadowRadius: 20,
  },
  overlayTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  overlaySub: { color: 'rgba(255,255,255,0.6)', fontSize: 15, marginTop: 12, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  overlayBtn: {
    marginTop: 32,
    backgroundColor: '#4d61fc',
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40,
    shadowColor: '#4d61fc', shadowOpacity: 0.4, shadowRadius: 12,
  },
  overlayBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

  drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  drawer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 2, borderColor: 'rgba(77,97,252,0.4)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30,
  },
  drawerHandle: {
    width: 44, height: 5, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3, alignSelf: 'center', marginBottom: 24,
  },
  drawerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
  drawerSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, fontWeight: '600' },

  missionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  missionDone: { opacity: 0.5, borderColor: 'rgba(34, 197, 94, 0.2)' },
  missionIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(77,97,252,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  missionIconDone: { backgroundColor: 'rgba(34,197,94,0.15)' },
  missionName: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  missionNameDone: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.5)' },
  missionXp: { fontSize: 12, color: Colors.accent, fontWeight: '900', marginTop: 4 },
  missionArrow: { color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '900' },

  closeDrawerBtn: {
    marginTop: 12, backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  closeDrawerText: { color: '#fca5a5', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
});

const nodeStyles = StyleSheet.create({
  node: {
    position: 'absolute',
  },
  inner: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  label: {
    position: 'absolute', top: 54,
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', width: 80, left: -14,
  },
  check: {
    position: 'absolute', top: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#22c55e',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#1e293b',
  },
});
