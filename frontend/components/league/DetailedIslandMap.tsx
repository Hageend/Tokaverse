import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions, 
  ScrollView 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Island, MapNode } from '../../data/islands';
import { createShadow, createTextShadow } from '../../utils/styleUtils';
import { usePlayerStore } from '../../store/usePlayerStore';
import { DecorativeBattle } from './DecorativeBattle';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Dimensiones lógicas del mapa (ajustables)
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 800;

interface Props {
  island: Island | null;
  visible: boolean;
  onClose: () => void;
  onNodePress: (node: MapNode) => void;
}

const NPC_ASSETS: Record<string, any> = {
  red: require('../../assets/images/chars/char_knigh_red.png'),
  blue: require('../../assets/images/chars/char_knigh.png'),
  yellow: require('../../assets/images/chars/char_archer.png'),
  purple: require('../../assets/images/chars/char_magedark.png'),
};

// ─── COMPONENTE MEMOIZADO PARA NODOS ───
const MemoNode = React.memo(({ 
  node, 
  status, 
  onPress, 
  animatedStyle,
  getCoord 
}: { 
  node: MapNode; 
  status: 'done' | 'active' | 'locked'; 
  onPress: () => void;
  animatedStyle: any;
  getCoord: (v: any, m: number) => number;
}) => {
  const isActive = status === 'active';
  const isLocked = status === 'locked';
  const isDone   = status === 'done';

  return (
    <View style={[S.nodeWrapper, { 
      top: getCoord(node.y, MAP_HEIGHT), 
      left: getCoord(node.x, MAP_WIDTH) 
    }]}>
      <Animated.View style={isActive ? animatedStyle : null}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          disabled={isLocked}
          style={[
            S.nodeCircle,
            isActive && S.nodeActive,
            isLocked && S.nodeLocked,
            isDone && S.nodeDone
          ]}
        >
          <Text style={S.nodeIcon}>{node.icon || '📍'}</Text>
          {isDone && (
            <View style={S.checkBadge}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={[S.nodeLabel, isLocked && { opacity: 0.3 }]}>
          {node.label}
        </Text>
      </Animated.View>
    </View>
  );
});

export const DetailedIslandMap = ({ island, visible, onClose, onNodePress }: Props) => {
  const islandProgress = usePlayerStore(s => s.islandProgress);
  const bounceValue = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      bounceValue.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const animatedNodeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceValue.value }],
  }));

  if (!island) return null;

  // Filtramos y ordenamos nodos
  const pathNodes = [...island.nodes]
    .filter(n => typeof n.pathOrder === 'number')
    .sort((a, b) => (a.pathOrder ?? 0) - (b.pathOrder ?? 0));

  const islandDoneNodes = islandProgress[island.id] || [];
  
  // Determinamos el progreso actual
  const lastPathOrderDone = pathNodes
    .filter(n => islandDoneNodes.includes(n.id))
    .reduce((max, n) => Math.max(max, n.pathOrder || 0), 0);

  const getCoord = (val: string | number, max: number) => {
    if (typeof val === 'string' && val.endsWith('%')) {
      return (parseFloat(val) / 100) * max;
    }
    return parseFloat(val as string);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={S.overlay}>
        <View style={S.container}>
          
          {/* ─── CABECERA DEL MAPA ─── */}
          <View style={S.header}>
            <View style={{ flex: 1 }}>
              <Text style={S.islandName}>{island.name.toUpperCase()}</Text>
              <Text style={S.islandSub}>{island.completedMissions} / {island.totalMissions} Misiones </Text>
            </View>
            <View style={S.panningHint}>
               <Ionicons name="move" size={12} color="rgba(255,255,255,0.4)" />
               <Text style={S.panningHintTxt}>ARRASTRA PARA EXPLORAR</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={S.closeBtn}>
              <Ionicons name="close-circle" size={36} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* ─── ÁREA DE EXPLORACIÓN (SOPORTE PANNING) ─── */}
          <View style={S.mapWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ width: MAP_WIDTH }}
            >
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ height: MAP_HEIGHT }}
              >
                <View style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}>
                  <Image 
                    source={island.fullMapImage} 
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  
                  {/* Ruta SVG */}
                  <Svg 
                    height="100%" 
                    width="100%" 
                    viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  >
                    {pathNodes.map((node, i) => {
                      if (i === 0) return null;
                      const prev = pathNodes[i - 1];
                      const isReached = islandDoneNodes.includes(node.id) || (node.pathOrder || 0) <= lastPathOrderDone + 1;
                      
                      return (
                        <Line
                          key={`line-${i}`}
                          x1={getCoord(prev.x, MAP_WIDTH)}
                          y1={getCoord(prev.y, MAP_HEIGHT)}
                          x2={getCoord(node.x, MAP_WIDTH)}
                          y2={getCoord(node.y, MAP_HEIGHT)}
                          stroke={isReached ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)"}
                          strokeWidth="2"
                          strokeDasharray={isReached ? "0" : "5,5"}
                        />
                      );
                    })}
                  </Svg>

                    {/* Microbatallas decorativas (Tiny Swords fighting) */}
                    {island.battles?.map((battle) => (
                      <DecorativeBattle 
                        key={battle.id}
                        factionA={battle.factionA}
                        factionB={battle.factionB}
                        x={battle.x}
                        y={battle.y}
                        getCoord={getCoord}
                        maxWidth={MAP_WIDTH}
                        maxHeight={MAP_HEIGHT}
                      />
                    ))}

                    {/* NPCs Estáticos */}
                    {island.npcs.map((npc, i) => (
                    <View 
                      key={`npc-${i}`} 
                      style={[S.npcWrapper, { 
                        top: getCoord(npc.y, MAP_HEIGHT), 
                        left: getCoord(npc.x, MAP_WIDTH) 
                      }]}
                    >
                      <Image source={npc?.npc?.faction ? NPC_ASSETS[npc.npc.faction] : NPC_ASSETS.blue} style={S.npcSprite} contentFit="contain" />
                    </View>
                  ))}

                  {/* Nodos de Progreso */}
                  {island.nodes.map((node) => {
                    let status: 'done' | 'active' | 'locked' = 'locked';
                    
                    if (islandDoneNodes.includes(node.id)) {
                      status = 'done';
                    } else if ((node.pathOrder || 0) === lastPathOrderDone + 1 || (!node.pathOrder && islandDoneNodes.length === 0)) {
                      status = 'active';
                    } else if (node.type === 'start' && islandDoneNodes.length === 0) {
                      status = 'active'; // El primer nodo siempre está activo si no hay progreso
                    }

                    return (
                      <MemoNode 
                        key={node.id} 
                        node={node} 
                        status={status} 
                        onPress={() => onNodePress(node)}
                        animatedStyle={animatedNodeStyle}
                        getCoord={getCoord}
                      />
                    );
                  })}
                </View>
              </ScrollView>
            </ScrollView>
          </View>

          {/* ─── BARRA DE PROGRESO INFERIOR ─── */}
          <View style={S.footer}>
             <View style={S.progressRow}>
                <Text style={S.progressLabel}>Progreso de la Isla</Text>
                <Text style={S.progressPercent}>{Math.round((island.completedMissions / (island.totalMissions || 1)) * 100)}%</Text>
             </View>
             <View style={S.progressTrack}>
                <View style={[S.progressFill, { width: `${(islandDoneNodes.length / (island.totalMissions || 1)) * 100}%` as any }]} />
             </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '95%',
    height: '92%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  islandName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.5,
  },
  islandSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  closeBtn: {},
  mapWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  panningHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginRight: 10,
  },
  panningHintTxt: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  mapBackground: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  },
  nodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    width: 90,
    marginLeft: -45,
    marginTop: -45,
  },
  nodeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1a2234',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow('#000', 0, 6, 0.6, 8, 12),
  },
  nodeActive: {
    borderColor: Colors.accent,
    backgroundColor: '#2d3748',
  },
  nodeLocked: {
    opacity: 0.4,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  nodeDone: {
    borderColor: '#22c55e',
    backgroundColor: '#064e3b',
  },
  nodeIcon: { fontSize: 28 },
  nodeLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    ...createTextShadow('rgba(0,0,0,0.9)', 1, 1, 3),
    textTransform: 'uppercase',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10b981',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  npcWrapper: {
    position: 'absolute',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  npcSprite: { width: 48, height: 48 },
  footer: {
    padding: 24,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.accent,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 5,
  },
});
