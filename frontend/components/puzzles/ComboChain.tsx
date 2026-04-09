import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  useSharedValue,
  withSpring,
  ZoomIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type Direction = 'up' | 'down' | 'left' | 'right';

const COMMANDS: Record<Direction, { label: string, color: string, icon: string }> = {
  up: { label: '¡AHORRA!', color: '#4ADE80', icon: 'trending-up' },
  down: { label: '¡PAGA!', color: '#EF4444', icon: 'card' },
  left: { label: '¡REDUCE!', color: '#f59e0b', icon: 'arrow-down-circle' },
  right: { label: '¡INVIERTE!', color: '#3b82f6', icon: 'rocket' },
};

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const ComboChain = ({ visible, onComplete, onClose }: Props) => {
  const [currentCommand, setCurrentCommand] = useState<Direction>('up');
  const [hits, setHits] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setHits(0);
      setIsEvaluating(false);
      setFeedback(null);
      generateNext();
    }
  }, [visible]);

  const generateNext = () => {
    const dirs: Direction[] = ['up', 'down', 'left', 'right'];
    let next: Direction;
    do {
      next = dirs[Math.floor(Math.random() * dirs.length)];
    } while (next === currentCommand);
    setCurrentCommand(next);
    scale.value = withSequence(withTiming(1.2, { duration: 100 }), withSpring(1));
  };

  const handlePress = (dir: Direction) => {
    if (isEvaluating) return;

    if (dir === currentCommand) {
      const nextHits = hits + 1;
      setHits(nextHits);
      if (nextHits >= 10) {
        setIsEvaluating(true);
        setFeedback({ text: '¡CADENA PERFECTA! Eres un maestro financiero.', color: '#4ADE80' });
        setTimeout(() => onComplete(true, 1000), 1500);
      } else {
        generateNext();
      }
    } else {
      setIsEvaluating(true);
      setFeedback({ text: '¡COMBO ROTO! Error de secuencia.', color: '#EF4444' });
      setTimeout(() => onComplete(false, 0), 1500);
    }
  };

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡DEMASIADO LENTO!', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 1500);
  };

  const currentData = COMMANDS[currentCommand];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <BasePuzzleModal
      visible={visible}
      title="Cadena Financiera"
      duration={25}
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <View style={S.gameArea}>
        <Text style={S.hitsTxt}>COMBO: x{hits}</Text>
        
        <View style={S.displayBox}>
          <Animated.View style={[S.commandCenter, animatedStyle, { borderColor: currentData.color }]}>
             <Ionicons name={currentData.icon as any} size={40} color={currentData.color} />
             <Text style={[S.commandTxt, { color: currentData.color }]}>{currentData.label}</Text>
          </Animated.View>
        </View>

        <View style={S.controls}>
          <View style={S.row}>
            <TouchableOpacity style={S.btn} onPress={() => handlePress('up')}>
              <Ionicons name="arrow-up" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={S.row}>
            <TouchableOpacity style={S.btn} onPress={() => handlePress('left')}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ width: 60 }} />
            <TouchableOpacity style={S.btn} onPress={() => handlePress('right')}>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={S.row}>
            <TouchableOpacity style={S.btn} onPress={() => handlePress('down')}>
              <Ionicons name="arrow-down" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {feedback && (
        <View style={S.feedbackBox}>
          <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
        </View>
      )}
    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  gameArea: {
    alignItems: 'center',
    gap: 20,
  },
  hitsTxt: {
    color: Colors.accent,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  displayBox: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commandCenter: {
    padding: 24,
    borderRadius: 70,
    borderWidth: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  commandTxt: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
  },
  controls: {
    gap: 10,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  btn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  feedbackBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackTxt: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  }
});
