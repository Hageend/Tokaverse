// components/ui/WeatherBanner.tsx
// TokaVerse RPG — Banner dinámico que reacciona al clima y la dificultad

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { WeatherEngine, WeatherType } from '../../engine/WeatherEngine';
import { DialogueEngine } from '../../engine/DialogueEngine';
import { AdaptiveDifficulty, PlayerPerformance } from '../../utils/AdaptiveDifficulty';
import { EXPERIMENTAL_NPCS, LoreNPC } from '../../data/lore';
import { Ionicons } from '@expo/vector-icons';

const { width: SW } = Dimensions.get('window');
const isDesktop = SW >= 1024;

interface Props {
  playerPerformance?: PlayerPerformance;
}

export const WeatherBanner = ({ playerPerformance }: Props) => {
  const [currentWeather, setCurrentWeather] = useState<WeatherType>('clear');
  const [dialogueData, setDialogueData] = useState<{ speaker: LoreNPC, line: string } | null>(null);
  
  // Fake simulated performance for demo if not provided
  const performance: PlayerPerformance = playerPerformance || {
    winRate: 0.85,
    avgTurnsToWin: 5,
    avgDamageTaken: 0.1,
    consecutiveLosses: 0,
    consecutiveWins: 10,
    totalCombats: 50,
  };

  const difficulty = AdaptiveDifficulty.recommend(performance);

  useEffect(() => {
    // 1. Obtener clima inicial
    const weather = WeatherEngine.getCurrentWeather();
    setCurrentWeather(weather);

    // 2. Generar diálogo dinámico
    const data = DialogueEngine.getDynamicDialogue({
      weather,
      difficulty,
      playerLevel: 10, // Hardcoded for demo
    }, EXPERIMENTAL_NPCS);
    
    setDialogueData(data);

    // Poll for weather changes every 1 min
    const interval = setInterval(() => {
      const newWeather = WeatherEngine.getCurrentWeather();
      if (newWeather !== weather) {
        setCurrentWeather(newWeather);
        setDialogueData(DialogueEngine.getDynamicDialogue({
          weather: newWeather,
          difficulty,
          playerLevel: 10,
        }, EXPERIMENTAL_NPCS));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [difficulty]);

  const weatherInfo = WeatherEngine.getWeatherInfo(currentWeather);

  // Animaciones de peligro / clima extremo
  const pulseOpacity = useSharedValue(0);
  useEffect(() => {
    if (weatherInfo.uiIntensity > 0) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(weatherInfo.uiIntensity * 0.4, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 0;
    }
  }, [currentWeather, weatherInfo.uiIntensity]);

  const pulseStyle = useAnimatedStyle(() => ({
    backgroundColor: weatherInfo.color,
    opacity: pulseOpacity.value,
  }));

  if (!dialogueData) return null;

  return (
    <Animated.View entering={FadeInUp.springify()} exiting={FadeOutUp} style={[S.container, { borderColor: weatherInfo.color + '55' }]}>
      {/* Célula de pulso climático */}
      <Animated.View style={[StyleSheet.absoluteFill, S.pulseLayer, pulseStyle]} pointerEvents="none" />

      {/* Cabecera del Clima */}
      <View style={S.weatherHeader}>
        <View style={S.weatherTitleRow}>
          <Text style={S.weatherIcon}>{weatherInfo.icon}</Text>
          <View>
            <Text style={[S.weatherName, { color: weatherInfo.color }]}>{weatherInfo.name.toUpperCase()}</Text>
            <Text style={S.weatherDesc}>{weatherInfo.description}</Text>
          </View>
        </View>
        <View style={S.difficultyBadge}>
          <Text style={S.difficultyText}>DIF: {difficulty.toUpperCase()}</Text>
        </View>
      </View>

      {/* Caja de Diálogo del NPC */}
      <View style={S.dialogueBox}>
        <View style={S.npcAvatar}>
          <Ionicons name="person" size={24} color="#FFF" />
        </View>
        <View style={S.npcContent}>
          <View style={S.npcHeader}>
            <Text style={S.npcName}>{dialogueData.speaker.name}</Text>
            <Text style={S.npcTitle}> · {dialogueData.speaker.title}</Text>
          </View>
          <Text style={S.npcFaction}>{dialogueData.speaker.faction}</Text>
          <Text style={S.npcLine}>"{dialogueData.line}"</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const S = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  pulseLayer: {
    borderRadius: 15,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  weatherTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  weatherIcon: {
    fontSize: 28,
  },
  weatherName: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  weatherDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 16,
    paddingRight: 20,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  difficultyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dialogueBox: {
    flexDirection: 'row',
    gap: 12,
  },
  npcAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  npcContent: {
    flex: 1,
  },
  npcHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  npcName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
  npcTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
  },
  npcFaction: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  npcLine: {
    color: '#E2E8F0',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
