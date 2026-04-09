// components/league/DetailedIslandMap.tsx
import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  TouchableOpacity, 
  Modal, 
  Dimensions 
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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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

export const DetailedIslandMap = ({ island, visible, onClose, onNodePress }: Props) => {
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

  // Ordenar nodos que tengan pathOrder para la ruta SVG
  const pathNodes = [...island.nodes]
    .filter(n => typeof n.pathOrder === 'number')
    .sort((a, b) => (a.pathOrder ?? 0) - (b.pathOrder ?? 0));

  const getCoord = (val: string | number) => 
    typeof val === 'string' ? parseFloat(val) : val;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={S.overlay}>
        <View style={S.container}>
          
          {/* ─── CABECERA DEL MAPA ─── */}
          <View style={S.header}>
            <View style={{ flex: 1 }}>
              <Text style={S.islandName}>{island.name.toUpperCase()}</Text>
              <Text style={S.islandSub}>{island.completedMissions} / {island.totalMissions} Misiones completadas</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={S.closeBtn}>
              <Ionicons name="close-circle" size={36} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* ─── ÁREA DE EXPLORACIÓN ─── */}
          <View style={S.mapWrapper}>
            <ImageBackground 
              source={island.fullMapImage} 
              style={S.mapBackground}
              resizeMode="cover"
            >
              {/* Ruta SVG */}
              <Svg 
                height="100%" 
                width="100%" 
                viewBox="0 0 100 100" 
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              >
                {pathNodes.map((node, i) => {
                  if (i === 0) return null;
                  const prev = pathNodes[i - 1];
                  return (
                    <Line
                      key={`line-${i}`}
                      x1={getCoord(prev.x)}
                      y1={getCoord(prev.y)}
                      x2={getCoord(node.x)}
                      y2={getCoord(node.y)}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="0.8"
                      strokeDasharray="2,2"
                    />
                  );
                })}
              </Svg>

              {/* NPCs */}
              {island.npcs.map((npc, i) => (
                <View 
                  key={`npc-${i}`} 
                  style={[S.npcWrapper, { top: npc.y as any, left: npc.x as any }]}
                >
                  <Image source={NPC_ASSETS[npc.npc.faction]} style={S.npcSprite} contentFit="contain" />
                </View>
              ))}

              {/* Nodos de Progreso */}
              {island.nodes.map((node) => {
                const isActive = node.state === 'active';
                const isLocked = node.state === 'locked';
                const isDone   = node.state === 'done';

                return (
                  <View 
                    key={node.id} 
                    style={[S.nodeWrapper, { top: node.y as any, left: node.x as any }]}
                  >
                    <Animated.View style={isActive ? animatedNodeStyle : null}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => !isLocked && onNodePress(node)}
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
              })}
            </ImageBackground>
          </View>

          {/* ─── BARRA DE PROGRESO INFERIOR ─── */}
          <View style={S.footer}>
             <View style={S.progressRow}>
                <Text style={S.progressLabel}>Progreso de la Isla</Text>
                <Text style={S.progressPercent}>{Math.round((island.completedMissions/island.totalMissions)*100)}%</Text>
             </View>
             <View style={S.progressTrack}>
                <View style={[S.progressFill, { width: `${(island.completedMissions/island.totalMissions)*100}%` as any }]} />
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
  mapBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 12,
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
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
