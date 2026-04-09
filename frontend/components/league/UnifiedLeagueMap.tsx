// components/league/UnifiedLeagueMap.tsx
import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { Image } from 'expo-image';
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
  island: Island;
  onNodePress: (node: MapNode) => void;
}

const NPC_ASSETS: Record<string, any> = {
  red: require('../../assets/images/chars/char_knigh_red.png'),
  blue: require('../../assets/images/chars/char_knigh.png'),
  yellow: require('../../assets/images/chars/char_archer.png'),
  purple: require('../../assets/images/chars/char_magedark.png'),
};

export const UnifiedLeagueMap = ({ island, onNodePress }: Props) => {
  const bounceValue = useSharedValue(0);

  useEffect(() => {
    bounceValue.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedNodeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceValue.value }],
  }));

  // Ordenar nodos que tengan pathOrder para el trazado de la ruta
  const pathNodes = island.nodes
    .filter(n => typeof n.pathOrder === 'number')
    .sort((a, b) => (a.pathOrder ?? 0) - (b.pathOrder ?? 0));

  const getCoord = (val: string | number) => 
    typeof val === 'string' ? parseFloat(val) : val;

  return (
    <ImageBackground 
      source={island.fullMapImage} 
      style={S.container}
      resizeMode="cover"
    >
      {/* ─── RUTA SVG ─── */}
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
              key={`path-${i}`}
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

      {/* ─── RENDER NODOS ─── */}
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
                    <Text style={S.checkTxt}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[S.nodeLabel, isLocked && S.labelLocked]}>
                {node.label}
              </Text>
            </Animated.View>
          </View>
        );
      })}

      {/* ─── RENDER NPCs ─── */}
      {island.npcs.map((npc, i) => (
        <View 
          key={`npc-${i}`} 
          style={[S.npcWrapper, { top: npc.y as any, left: npc.x as any }]}
        >
          <Image 
            source={NPC_ASSETS[npc.npc.faction]} 
            style={S.npcSprite} 
            contentFit="contain" 
          />
        </View>
      ))}
    </ImageBackground>
  );
};

const S = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  nodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    width: 80,
    marginLeft: -40,
    marginTop: -40,
  },
  nodeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1e293b',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  nodeActive: {
    borderColor: Colors.accent,
    backgroundColor: '#334155',
  },
  nodeLocked: {
    opacity: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  nodeDone: {
    borderColor: '#22c55e',
    backgroundColor: '#064e3b',
  },
  nodeIcon: {
    fontSize: 24,
  },
  nodeLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textTransform: 'uppercase',
  },
  labelLocked: {
    color: 'rgba(255,255,255,0.3)',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#22c55e',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  checkTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  npcSprite: {
    width: 44,
    height: 44,
  },
});
