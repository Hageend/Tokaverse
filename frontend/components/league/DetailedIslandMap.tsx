// components/league/DetailedIslandMap.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  TouchableOpacity, 
  Modal, 
  Dimensions, 
  ScrollView 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Island, NPCInstance } from '../../data/islands';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface DetailedIslandMapProps {
  island: Island | null;
  visible: boolean;
  onClose: () => void;
}

// Mapeo de facciones a placeholders (según requerimiento de FASE 1)
const NPC_ASSETS: Record<string, any> = {
  red: require('../../assets/images/chars/char_knigh_red.png'),
  blue: require('../../assets/images/chars/char_knigh.png'),
  yellow: require('../../assets/images/chars/char_archer.png'),
  purple: require('../../assets/images/chars/char_magedark.png'),
};

export const DetailedIslandMap = ({ island, visible, onClose }: DetailedIslandMapProps) => {
  if (!island) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={S.overlay}>
        <View style={S.container}>
          {/* Cabecera del Mapa */}
          <View style={S.header}>
            <View>
              <Text style={S.islandName}>{island.name.toUpperCase()}</Text>
              <Text style={S.islandSub}>Explora y completa misiones</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={S.closeBtn}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Área del Mapa a Gran Escala */}
          <View style={S.mapWrapper}>
            <ImageBackground 
              source={island.fullMapImage} 
              style={S.mapBackground}
              resizeMode="cover"
            >
              {/* Renderizado de NPCs en posiciones relativas (%) */}
              {island.npcs.map((npcInstance, index) => (
                <View 
                  key={index} 
                  style={[
                    S.npcWrapper, 
                    { top: npcInstance.y as any, left: npcInstance.x as any }
                  ]}
                >
                  <Image 
                    source={NPC_ASSETS[npcInstance.npc.faction] || NPC_ASSETS.blue}
                    style={S.npcSprite}
                    contentFit="contain"
                  />
                  <View style={S.npcIndicator} />
                </View>
              ))}
            </ImageBackground>
          </View>

          {/* Footer: Progreso de la Isla */}
          <View style={S.footer}>
            <View style={S.progressInfo}>
              <Text style={S.progressLabel}>Progreso de la Isla</Text>
              <Text style={S.progressValue}>{island.completedMissions} / {island.totalMissions} Misiones</Text>
            </View>
            <View style={S.progressBarContainer}>
              <View 
                style={[
                  S.progressBarFill, 
                  { width: `${(island.completedMissions / island.totalMissions) * 100}%` }
                ]} 
              />
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
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '95%',
    height: '92%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  islandName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  islandSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  closeBtn: {
    padding: 5,
  },
  mapWrapper: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
  },
  npcWrapper: {
    position: 'absolute',
    width: 60,
    height: 60,
    marginLeft: -30, // Centrar el sprite
    marginTop: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  npcSprite: {
    width: 50,
    height: 50,
  },
  npcIndicator: {
    width: 10,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 5,
    marginTop: -5,
  },
  footer: {
    padding: 24,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  progressInfo: {
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
  progressValue: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 6,
  },
});
