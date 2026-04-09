import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export interface MiniIslandState {
  id: string;
  name: string;
  questsCompleted: number;
  totalQuests: number;
  unlocked: boolean;
  emoji: string;
}

interface MiniIslandsProps {
  islands: MiniIslandState[];
}

export const MiniIslands = ({ islands }: MiniIslandsProps) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="map" size={16} color={Colors.tertiary} />
        <Text style={styles.headerTitle}>Mapa de Islas</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {islands.map((island) => {
          const progress = island.totalQuests > 0 ? (island.questsCompleted / island.totalQuests) * 100 : 0;
          
          return (
            <TouchableOpacity
              key={island.id}
              style={[styles.islandBtn, !island.unlocked && styles.locked]}
              onPress={() => island.unlocked && router.push('/(tabs)/league')}
              activeOpacity={0.7}
            >
              <View style={styles.emojiContainer}>
                <Text style={styles.emoji}>{island.emoji}</Text>
                {!island.unlocked && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.8)" />
                  </View>
                )}
              </View>

              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {island.name}
                </Text>
                
                {island.unlocked ? (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.quests}>
                      {island.questsCompleted}/{island.totalQuests}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.lockedText}>Bloqueado</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 14,
    gap: 12,
  },
  islandBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    width: 140,
    alignItems: 'center',
    gap: 8,
  },
  locked: {
    opacity: 0.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  emojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emoji: {
    fontSize: 24,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    alignItems: 'center',
    width: '100%',
  },
  name: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.tertiary,
    borderRadius: 2,
  },
  quests: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
  },
  lockedText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    fontStyle: 'italic',
  },
});
