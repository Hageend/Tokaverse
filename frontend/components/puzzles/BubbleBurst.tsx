import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useSharedValue, 
  Easing,
  runOnJS,
  SharedValue
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface BubbleData {
  id: string;
  text: string;
  isBad: boolean; // Is it a useless expense?
  x: number;
  y: SharedValue<number>;
}

const ITEMS = [
  { text: 'Renta', isBad: false },
  { text: 'Comida', isBad: false },
  { text: 'Luz/Agua', isBad: false },
  { text: 'Ahorro', isBad: false },
  { text: 'Zapato Lujo', isBad: true },
  { text: 'Skins LoL', isBad: true },
  { text: 'Café $100', isBad: true },
  { text: 'Casino', isBad: true },
  { text: 'Cena Carísima', isBad: true },
];

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

const Bubble = ({ bubble, onPop }: { bubble: BubbleData, onPop: () => void }) => {
  useEffect(() => {
    bubble.y.value = withTiming(-100, { duration: 4000, easing: Easing.linear });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bubble.x },
      { translateY: bubble.y.value }
    ]
  }));

  return (
    <Animated.View style={[S.bubbleContainer, animatedStyle]}>
       <TouchableOpacity style={S.bubble} onPress={onPop}>
          <Text style={S.bubbleTxt}>{bubble.text}</Text>
       </TouchableOpacity>
    </Animated.View>
  );
};

export const BubbleBurst = ({ visible, onComplete, onClose }: Props) => {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [score, setScore] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  useEffect(() => {
    if (visible) {
      setBubbles([]);
      setScore(0);
      setIsEvaluating(false);
      setFeedback(null);

      // Spawner
      const interval = setInterval(() => {
        const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        const newBubble: BubbleData = {
          id: Math.random().toString(),
          text: item.text,
          isBad: item.isBad,
          x: Math.random() * (width * 0.7) - (width * 0.35),
          y: useSharedValue(height * 0.5), // Start from bottom of container
        };
        setBubbles(prev => [...prev, newBubble]);
      }, 800);

      return () => clearInterval(interval);
    }
  }, [visible]);

  const handlePop = (id: string, isBad: boolean) => {
    if (isEvaluating) return;

    if (isBad) {
      const nextScore = score + 1;
      setScore(nextScore);
      setBubbles(prev => prev.filter(b => b.id !== id));
      
      if (nextScore >= 10) {
        setIsEvaluating(true);
        setFeedback({ text: '¡FINANZAS SANEADAS!', color: '#4ADE80' });
        setTimeout(() => onComplete(true, 500), 1500);
      }
    } else {
      setIsEvaluating(true);
      setFeedback({ text: '¡EXPLOTASTE UNA NECESIDAD!', color: '#EF4444' });
      setTimeout(() => onComplete(false, 0), 1500);
    }
  };

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡DEMASIADOS GASTOS HORMIGA!', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 2000);
  };

  return (
    <BasePuzzleModal
      visible={visible}
      title="Burbuja de Gastos"
      duration={30}
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <View style={S.gameArea}>
         <Text style={S.instruction}>Explota solo los <Text style={{color: '#EF4444'}}>Gastos Innecesarios</Text>.</Text>
         <Text style={S.scoreTxt}>BURBUJAS ELIMINADAS: {score} / 10</Text>
         
         <View style={S.canvas}>
            {bubbles.map(b => (
              <Bubble key={b.id} bubble={b} onPop={() => handlePop(b.id, b.isBad)} />
            ))}
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
    height: 400,
    alignItems: 'center',
    overflow: 'hidden',
  },
  instruction: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  scoreTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 20,
  },
  canvas: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  bubbleContainer: {
    position: 'absolute',
    left: '50%',
  },
  bubble: {
    padding: 10,
    backgroundColor: 'rgba(77,97,252,0.2)',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 80,
    alignItems: 'center',
  },
  bubbleTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  feedbackBox: {
    marginTop: 20,
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
