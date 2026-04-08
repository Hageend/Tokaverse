// TokaVerse — High-Fidelity Retro Pixel Art Progress Map (Phone Optimized)
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Dimensions, Animated, Easing, Platform, Alert,
} from 'react-native';
import Svg, { Path, Rect, Circle, G, ForeignObject, Line, Text as SvgText } from 'react-native-svg';

import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../../store/usePlayerStore';


const { width: SW } = Dimensions.get('window');
const ISLAND_W = 260;
const ISLAND_H = 200;
const BRIDGE_W = 40;
const SNAP_INTERVAL = ISLAND_W + BRIDGE_W;

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#0a0a1a',
  hud: '#0d0d22',
  border: '#1e1e24',
  path: '#eab308',
  pathShadow: '#a16207',
  xpFill: '#22c55e',
  xpTrack: '#1a1a3e',
  accent: '#eab308',
  locked: '#2a2a3a',
  lockedStroke: '#444',
  textMuted: '#ccc',
};

const NODE_COLORS = {
  start: { fill: '#22c55e', stroke: '#16a34a', dark: '#15803d' },
  puzzle: { fill: '#3b82f6', stroke: '#1d4ed8', dark: '#1e40af' },
  lore: { fill: '#8b5cf6', stroke: '#6d28d9', dark: '#5b21b6' },
  reward: { fill: '#f59e0b', stroke: '#d97706', dark: '#b45309' },
  boss: { fill: '#ef4444', stroke: '#b91c1c', dark: '#7f1d1d' },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  lock: () => (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Rect x="4" y="8" width="10" height="8" rx="1" fill="#888" />
      <Rect x="6" y="4" width="6" height="6" rx="3" fill="none" stroke="#888" strokeWidth="2" />
      <Rect x="8" y="11" width="2" height="3" rx="1" fill="#555" />
    </Svg>
  ),
  start: () => (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Path d="M9 2l2 5h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" fill="#fff" />
    </Svg>
  ),
  puzzle: () => (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Rect x="2" y="2" width="6" height="6" rx="1" fill="#93c5fd" />
      <Rect x="10" y="2" width="6" height="6" rx="1" fill="#60a5fa" />
      <Rect x="2" y="10" width="6" height="6" rx="1" fill="#60a5fa" />
      <Rect x="10" y="10" width="6" height="6" rx="1" fill="#93c5fd" />
      <Rect x="7" y="7" width="4" height="4" fill="#1d4ed8" />
    </Svg>
  ),
  lore: () => (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Rect x="3" y="2" width="12" height="14" rx="1" fill="#c4b5fd" />
      <Rect x="5" y="5" width="8" height="1.5" rx="0.5" fill="#6d28d9" />
      <Rect x="5" y="8" width="8" height="1.5" rx="0.5" fill="#6d28d9" />
      <Rect x="5" y="11" width="5" height="1.5" rx="0.5" fill="#6d28d9" />
    </Svg>
  ),
  reward: () => (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Rect x="3" y="8" width="12" height="8" rx="1" fill="#fcd34d" />
      <Rect x="2" y="6" width="14" height="3" rx="1" fill="#f59e0b" />
      <Rect x="7" y="2" width="4" height="7" rx="1" fill="#f59e0b" />
      <Rect x="8" y="2" width="2" height="7" rx="0.5" fill="#fcd34d" />
    </Svg>
  ),
  boss: () => (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Rect x="3" y="6" width="12" height="9" rx="2" fill="#f87171" />
      <Circle cx="7" cy="10" r="1.5" fill="#7f1d1d" />
      <Circle cx="11" cy="10" r="1.5" fill="#7f1d1d" />
      <Rect x="3" y="4" width="3" height="4" rx="1" fill="#ef4444" />
      <Rect x="12" y="4" width="3" height="4" rx="1" fill="#ef4444" />
      <Rect x="7" y="2" width="4" height="3" rx="1" fill="#ef4444" />
    </Svg>
  ),
};

// ─── Tile Generators ───────────────────────────────────────────────────────────
const TileGenerators = {
  grass: (w: number, h: number) => {
    const tiles = [];
    for (let r = 0; r < h / 16; r++) {
      for (let c = 0; c < w / 16; c++) {
        const v = ((r * 16 + c) * 7 + 13) % 4;
        const g = ['#1a3a1a', '#163016', '#1f4a1f', '#1c3c1c'][v];
        tiles.push(<Rect key={`t-${r}-${c}`} x={c * 16} y={r * 16} width={16} height={16} fill={g} />);
        if (Math.random() > 0.85) {
          tiles.push(<Rect key={`d-${r}-${c}`} x={c * 16 + 6} y={r * 16 + 10} width={4} height={6} fill="#2d5a2d" opacity={0.7} />);
        }
      }
    }
    return tiles;
  },
  neon: (w: number, h: number) => {
    const tiles = [];
    for (let r = 0; r < h / 20; r++) {
      for (let c = 0; c < w / 20; c++) {
        const v = ((r * 20 + c) * 11 + 5) % 4;
        const g = ['#1a0a2e', '#200d38', '#160826', '#240f40'][v];
        tiles.push(<Rect key={`t-${r}-${c}`} x={c * 20} y={r * 20} width={20} height={20} fill={g} />);
        if ((r + c) % 5 === 0) {
          tiles.push(<Rect key={`d-${r}-${c}`} x={c * 20 + 8} y={r * 20 + 8} width={4} height={4} fill="#ff005522" rx={1} />);
        }
      }
    }
    return tiles;
  },
  dark: (w: number, h: number) => {
    const tiles = [];
    for (let r = 0; r < h / 14; r++) {
      for (let c = 0; c < w / 14; c++) {
        const v = ((r * 14 + c) * 3 + 9) % 3;
        const g = ['#0d0d0d', '#111116', '#0a0a12'][v];
        tiles.push(<Rect key={`t-${r}-${c}`} x={c * 14} y={r * 14} width={14} height={14} fill={g} />);
        if ((r + c) % 6 === 0) tiles.push(<Circle key={`c-${r}-${c}`} cx={c * 14 + 7} cy={r * 14 + 7} r={1} fill="#333" opacity={0.5} />);
      }
    }
    return tiles;
  },
  sky: (w: number, h: number) => {
    const tiles = [];
    for (let r = 0; r < h / 18; r++) {
      for (let c = 0; c < w / 18; c++) {
        const v = ((r * 18 + c) * 5 + 3) % 3;
        const g = ['#0a1a2e', '#0c2040', '#081530'][v];
        tiles.push(<Rect key={`t-${r}-${c}`} x={c * 18} y={r * 18} width={18} height={18} fill={g} />);
        if (Math.random() > 0.9) {
          tiles.push(<Rect key={`s-${r}-${c}`} x={c * 18 + 5} y={r * 18 + 5} width={2} height={2} fill="#ffffff22" />);
        }
      }
    }
    return tiles;
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────────
export type NodeType = 'start' | 'puzzle' | 'boss' | 'lore' | 'reward' | 'end';
export type NodeState = 'done' | 'active' | 'locked';

export interface MapNode {
  id: number;
  label: string;
  icon: string;
  x: number;
  y: number;
  state: NodeState;
  type: NodeType;
  puzzle?: any;
  boss?: any;
  lore?: any;
  reward?: any;
}

export interface WorldZone {
  id: string;
  name: string;
  themeColor: string;
  nodes: MapNode[];
  tileType?: 'grass' | 'neon' | 'dark' | 'sky';
}

export interface MapMission {
  id: string;
  icon: string;
  name: string;
  xp: number;
  done: boolean;
}

interface ProgressMapProps {
  missions: MapMission[];
  xpPercent: number;
  leagueName: string;
  xpLabel: string;
  onMissionComplete?: (id: string) => void;
  onBossFight?: (node: MapNode) => void;
  zones?: WorldZone[];
}

// ─── Components ───────────────────────────────────────────────────────────────
const Bridge = () => (
  <View style={S.bridge}>
    <Svg width="40" height="28" viewBox="0 0 40 28">
      <Rect x="0" y="10" width="40" height="8" fill="#8B6914" />
      <Rect x="0" y="10" width="40" height="3" fill="#A07820" />
      <Rect x="4" y="6" width="4" height="16" fill="#6B4F10" />
      <Rect x="32" y="6" width="4" height="16" fill="#6B4F10" />
      <Line x1="6" y1="6" x2="34" y2="6" stroke="#5a3e0a" strokeWidth="2" strokeDasharray="3,3" />
    </Svg>
  </View>
);

const NodePulse = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true })
    ).start();
  }, []);
  return (
    <View style={S.pulsePosition}>
      <Animated.View 
        style={[
          S.pulseRing, 
          { 
            opacity: anim.interpolate({ inputRange: [0.8, 1], outputRange: [0.7, 0] }),
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.8] }) }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          S.pulseRing, 
          { 
            opacity: anim.interpolate({ inputRange: [0.5, 1], outputRange: [0.4, 0] }),
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.6] }) }]
          }
        ]} 
      />
    </View>
  );
};

const PixelNode = ({ node, width, height, onPress }: any) => {
  const px = (node.x / 100) * width;
  const py = (node.y / 100) * height;
  const col = NODE_COLORS[node.type as keyof typeof NODE_COLORS] || NODE_COLORS.puzzle;
  const locked = node.state === 'locked';
  const done = node.state === 'done';
  const active = node.state === 'active';
  const size = node.type === 'boss' ? 44 : 38;
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -4, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [active]);
  return (
    <Animated.View 
      style={[
        S.nodeBtn, 
        { left: px, top: py, width: size, height: size },
        active ? { transform: [{ translateX: -size/2 }, { translateY: -size/2 }, { translateY: floatAnim }] } : { transform: [{ translateX: -size/2 }, { translateY: -size/2 }] }
      ]}
    >
      <TouchableOpacity 
        activeOpacity={locked ? 1 : 0.7} 
        onPress={() => !locked && onPress(node)}
        style={{ width: size, height: size }}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Rect 
            x="2" y="2" width={size - 4} height={size - 4} rx="2"
            fill={done ? col.dark : locked ? '#2a2a3a' : col.fill}
            stroke={locked ? '#444' : col.stroke} 
            strokeWidth={node.type === 'boss' ? 4 : 3}
          />
          <Rect x="2" y="2" width={size - 4} height={Math.floor((size - 4) / 3)} rx="2" fill={locked ? '#3a3a4a' : 'rgba(255,255,255,0.18)'} />
          <Rect x="2" y={size - 10} width={size - 4} height="8" fill={locked ? '#111' : col.dark} rx={0} opacity="0.6" />
          <ForeignObject x={Math.floor(size / 2) - 9} y={Math.floor(size / 2) - 9} width="18" height="18">
            <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
              {(Icons[node.type as keyof typeof Icons] || Icons.puzzle)()}
            </View>
          </ForeignObject>

          {done && (
             <G transform={`translate(${size - 10}, 2)`}>
                <Rect width="8" height="8" rx="1" fill="#22c55e" />
                <SvgText 
                  x="4" y="6.5" textAnchor="middle" fontSize="6" fill="#fff" 
                  fontWeight="900" fontFamily={Platform.OS === 'ios' ? 'Courier' : 'monospace'}
                >✓</SvgText>

             </G>
          )}
        </Svg>
      </TouchableOpacity>
      {active && <NodePulse />}
    </Animated.View>
  );
};

const IslandView = ({ zone, onNodePress }: any) => {
  const w = ISLAND_W;
  const h = ISLAND_H;
  const tileType = (zone.tileType || 'grass') as keyof typeof TileGenerators;
  const paths = useMemo(() => {
    const pts = zone.nodes.map((n: any) => ({ x: (n.x / 100) * w, y: (n.y / 100) * h }));
    let d = pts.map((p: any, i: number) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
    const unlockedPts = zone.nodes.filter((n: any) => n.state !== 'locked').map((n: any) => ({ x: (n.x / 100) * w, y: (n.y / 100) * h }));
    let du = unlockedPts.length > 1 ? unlockedPts.map((p: any, i: number) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ') : '';
    return { full: d, unlocked: du };
  }, [zone.nodes]);
  return (
    <View style={S.islandWrapper}>
      <View style={S.islandInner}>
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
          {TileGenerators[tileType](w, h)}
          {paths.full && (
            <Path d={paths.full} fill="none" stroke="#333" strokeWidth="10" strokeLinecap="square" strokeDasharray="14,10" opacity="0.5" />
          )}
          {paths.unlocked && (
            <G>
              <Path d={paths.unlocked} fill="none" stroke={COLORS.pathShadow} strokeWidth="14" strokeLinecap="square" strokeDasharray="16,12" transform="translate(0,3)" opacity="0.6" />
              <Path 
                d={paths.unlocked} 
                fill="none" 
                stroke={COLORS.path} 
                strokeWidth="12" 
                strokeLinecap="square" 
                strokeDasharray="16,12"
              />
            </G>
          )}
        </Svg>
        {zone.nodes.map((node: any) => (
          <PixelNode key={node.id} node={node} width={w} height={h} onPress={onNodePress} />
        ))}
      </View>
      <View style={S.zoneLabel}>
        <Text style={S.zoneLabelText}>{zone.name}</Text>
      </View>
    </View>
  );
};

export function ProgressMap({
  missions,
  xpPercent,
  leagueName,
  xpLabel,
  onMissionComplete,
  onBossFight,
  zones = [],
}: ProgressMapProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [selectedZone, setSelectedZone] = useState<WorldZone | null>(null);


  const handleNodePress = (node: MapNode) => {
    const zone = zones.find(z => z.nodes.some(n => n.id === node.id));
    if (node.type === 'boss' && node.state === 'active') {
      onBossFight?.(node);
      return;
    }
    setSelectedNode(node);
    setSelectedZone(zone || null);
    setModalVisible(true);
  };

  const handleComplete = () => {
    if (selectedNode) {
      onMissionComplete?.(String(selectedNode.id));
      setModalVisible(false);
    }
  };

  const xpPercentAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(xpPercentAnim, { toValue: xpPercent, duration: 800, useNativeDriver: false }).start();
  }, [xpPercent]);

  return (
    <View style={S.mapRoot}>
      {/* HUD Header */}
      <View style={S.hud}>
        <Text style={S.hudLeague}>{leagueName.toUpperCase()}</Text>
        <View style={S.hudXp}>
          <Text style={S.xpText}>XP</Text>
          <View style={S.xpBar}>
            <Animated.View style={[S.xpFill, { width: xpPercentAnim.interpolate({ inputRange:[0,100], outputRange:['0%','100%'] }) }]} />
          </View>
          <Text style={S.xpText}>{xpLabel}</Text>
        </View>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.scrollContent}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
      >
        {zones.map((zone, i) => (
          <React.Fragment key={zone.id}>
            <IslandView zone={zone} onNodePress={handleNodePress} />
            {i < zones.length - 1 && <Bridge />}
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Retro Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={S.modalOverlay}>
           <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={S.modalContent}>
            {selectedZone && <Text style={S.modalZoneName}>{selectedZone.name}</Text>}
            <Text style={[S.modalTitle, { color: NODE_COLORS[selectedNode?.type as keyof typeof NODE_COLORS]?.fill || COLORS.accent }]}>
              {selectedNode?.type?.toUpperCase()} — {selectedNode?.label}
            </Text>
            <View style={S.modalBodyBox}>
                <Text style={S.modalBody}>
                    {selectedNode?.type === 'puzzle' ? (selectedNode.puzzle?.question || 'Misión de puzzle disponible.') : 
                     selectedNode?.type === 'lore' ? (selectedNode.lore?.content || 'Misión de historia disponible.') : 
                     selectedNode?.type === 'reward' ? `Reclama: ${selectedNode.reward?.coins ?? 100} monedas y ${selectedNode.reward?.xp ?? 50} XP` :
                     'Información de la misión financiera.'}
                </Text>
                
                {selectedNode?.type === 'puzzle' && selectedNode.puzzle?.options && (
                    <View style={S.puzzleOptions}>
                        {selectedNode.puzzle.options.map((opt: string, i: number) => (
                            <TouchableOpacity key={i} style={S.puzzleBtn} onPress={() => {
                                if (i === selectedNode.puzzle.answer) {
                                    handleComplete();
                                } else {
                                    Alert.alert('Incorrecto', selectedNode.puzzle.hint);
                                }
                            }}>
                                <Text style={S.puzzleBtnText}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
            
            <View style={S.modalFooter}>
                {selectedNode?.type !== 'puzzle' && (
                    <TouchableOpacity style={S.modalClose} onPress={handleComplete}>
                        <Text style={S.modalCloseText}>[ COMPLETAR ]</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[S.modalClose, { backgroundColor: '#333', marginTop: 8 }]} onPress={() => setModalVisible(false)}>
                    <Text style={S.modalCloseText}>[ CERRAR ]</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  mapRoot: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    overflow: 'hidden',
    height: 380, // Optimized for phone view
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#1a1a3e'
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.hud,
    borderBottomWidth: 3,
    borderBottomColor: '#1a1a3e',
  },
  hudLeague: {
    fontSize: 8,
    color: COLORS.accent,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hudXp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpText: {
    fontSize: 7,
    color: '#aaa',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  xpBar: {
    width: 60, // Fixed width for mobile
    height: 8,
    backgroundColor: COLORS.xpTrack,
    borderWidth: 2,
    borderColor: '#333',
  },
  xpFill: {
    height: '100%',
    backgroundColor: COLORS.xpFill,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
  },
  islandWrapper: {
    alignItems: 'center',
    width: ISLAND_W,
  },
  islandInner: {
    width: ISLAND_W,
    height: ISLAND_H,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#1e1e24',
    borderBottomWidth: 10,
    backgroundColor: '#111',
    position: 'relative',
  },
  zoneLabel: {
    position: 'absolute',
    bottom: -18,
    left: 8,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.accent,
    zIndex: 10
  },
  zoneLabelText: {
    fontSize: 6,
    color: COLORS.accent,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1
  },
  bridge: {
    width: BRIDGE_W,
    height: 28,
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: -20, // Adjust vertically
  },
  nodeBtn: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsePosition: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none'
  },
  pulseRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: COLORS.hud,
    borderWidth: 3,
    borderColor: COLORS.accent,
    padding: 20,
    borderRadius: 4,
  },
  modalZoneName: {
    fontSize: 7,
    color: '#666',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalTitle: {
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 12,
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalBodyBox: {
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 7,
    color: '#ccc',
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  puzzleOptions: {
    marginTop: 12,
    gap: 8,
  },
  puzzleBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  puzzleBtnText: {
    color: '#fff',
    fontSize: 7,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalFooter: {
    marginTop: 4,
  },
  modalClose: {
    backgroundColor: COLORS.accent,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 7,
    color: COLORS.bg,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
