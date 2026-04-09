import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withSpring
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface BasePuzzleModalProps {
  visible: boolean;
  title: string;
  duration: number; // Duration in seconds
  onTimeUp?: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export const BasePuzzleModal = ({ visible, title, duration, onTimeUp, onClose, children }: BasePuzzleModalProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerWidth = useSharedValue(100);

  useEffect(() => {
    if (visible) {
      setTimeLeft(duration);
      timerWidth.value = 100;
    }
  }, [visible, duration]);

  useEffect(() => {
    if (!visible) return;
    
    if (timeLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(prev - 1, 0);
        timerWidth.value = withTiming((next / duration) * 100, { duration: 1000 });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, visible, duration, onTimeUp]);

  const timerStyle = useAnimatedStyle(() => ({
    width: `${timerWidth.value}%`
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={S.overlay}>
        <View style={S.container}>
          
          <View style={S.header}>
            <Text style={S.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity>
          </View>
          
          <View style={S.timerWrap}>
            <Animated.View style={[S.timerFill, timerStyle, timeLeft <= Math.max(duration * 0.2, 5) && { backgroundColor: '#EF4444' }]} />
            <Text style={S.timerTxt}>00:{timeLeft.toString().padStart(2, '0')}</Text>
          </View>

          <View style={S.contentWrap}>
            {children}
          </View>

        </View>
      </View>
    </Modal>
  );
};

const S = StyleSheet.create({
  overlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  container: {
    width: Math.min(width * 0.9, 500), 
    maxHeight: '90%',
    backgroundColor: '#0f172a',
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: Colors.accent,
    padding: 20
  },
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15
  },
  title: {
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: '900', 
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  timerWrap: {
    height: 16, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 8, 
    overflow: 'hidden', 
    justifyContent: 'center', 
    marginBottom: 15
  },
  timerFill: {
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: Colors.tertiary
  },
  timerTxt: {
    position: 'absolute', 
    width: '100%', 
    textAlign: 'center', 
    color: '#FFF', 
    fontSize: 10, 
    fontWeight: '900', 
    textShadowColor: '#000', 
    textShadowRadius: 4
  },
  contentWrap: {
    flexShrink: 1,
  }
});
