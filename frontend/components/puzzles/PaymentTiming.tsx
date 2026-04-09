import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  useSharedValue, 
  withSequence,
  Easing
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const PaymentTiming = ({ visible, onComplete, onClose }: Props) => {
  const [hits, setHits] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);
  
  const cursorPos = useSharedValue(0); // 0 to 100

  useEffect(() => {
    if (visible) {
      setHits(0);
      setIsEvaluating(false);
      setFeedback(null);
      cursorPos.value = 0;
      
      // Infinite cursor loop
      cursorPos.value = withRepeat(
        withSequence(
          withTiming(100, { duration: 800, easing: Easing.linear }),
          withTiming(0, { duration: 800, easing: Easing.linear })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const cursorStyle = useAnimatedStyle(() => ({
    left: `${cursorPos.value}%`,
  }));

  const handlePay = () => {
    if (isEvaluating) return;

    const currentPos = cursorPos.value;
    // Green zone is between 40 and 60
    if (currentPos >= 40 && currentPos <= 60) {
      const nextHits = hits + 1;
      setHits(nextHits);
      if (nextHits >= 3) {
        setIsEvaluating(true);
        setFeedback({ text: '¡PAGADO A TIEMPO! Sin intereses moratorios.', color: '#4ADE80' });
        setTimeout(() => onComplete(true, 700), 1500);
      }
    } else {
      setFeedback({ text: '¡PAGO TARDÍO! Intereses generados.', color: '#EF4444' });
      setTimeout(() => setFeedback(null), 800);
      // In a real scenario we'd deduct time from BasePuzzleModal, but for simplicity here we just feedback.
    }
  };

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡MUY TARDE! Tu crédito se arruinó.', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 2000);
  };

  return (
    <BasePuzzleModal
      visible={visible}
      title="Pago en Tiempo"
      duration={20}
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <View style={S.gameArea}>
        <Text style={S.instruction}>Presiona "PAGAR" cuando el cursor esté en la zona verde.</Text>
        
        <View style={S.hitsContainer}>
           <Text style={S.hitsTxt}>PAGOS LOGRADOS: {hits} / 3</Text>
        </View>

        <View style={S.track}>
          <View style={S.greenZone} />
          <Animated.View style={[S.cursor, cursorStyle]} />
        </View>

        <TouchableOpacity style={S.payBtn} onPress={handlePay} disabled={isEvaluating}>
           <Text style={S.payBtnTxt}>¡PAGAR AHORA!</Text>
        </TouchableOpacity>
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
  instruction: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
  hitsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hitsTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  track: {
    width: '100%',
    height: 40,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  greenZone: {
    position: 'absolute',
    left: '40%',
    width: '20%',
    height: '100%',
    backgroundColor: '#22c55e',
    opacity: 0.3,
  },
  cursor: {
    width: 6,
    height: '100%',
    backgroundColor: Colors.accent,
    position: 'absolute',
    marginLeft: -3,
    shadowColor: Colors.accent,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  payBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  payBtnTxt: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
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
