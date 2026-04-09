import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const InterestCalculator = ({ visible, onComplete, onClose }: Props) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  // The trivia question (Could be randomized from a list later)
  const question = "¿Deuda de $1,000 al 10% mensual. ¿Cuánto debes en el mes 2 sin pagar nada? (Interés compuesto)";
  const options = [
    { label: '$1,100', isCorrect: false },
    { label: '$1,200', isCorrect: false },
    { label: '$1,210', isCorrect: true }, // 1000 * 1.1 = 1100 -> 1100 * 1.1 = 1210
    { label: '$1,010', isCorrect: false },
  ];

  useEffect(() => {
    if (visible) {
      setIsEvaluating(false);
      setFeedback(null);
    }
  }, [visible]);

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡TIEMPO AGOTADO!', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 2000);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    if (isCorrect) {
      setFeedback({ text: '¡CORRECTO! El interés compuesto no perdona.', color: '#4ADE80' });
      setTimeout(() => onComplete(true, 1000), 2500);
    } else {
      setFeedback({ text: 'INCORRECTO. Olvidaste capitalizar el interés.', color: '#EF4444' });
      setTimeout(() => onComplete(false, 0), 2500);
    }
  };

  return (
    <BasePuzzleModal
      visible={visible}
      title="Cálculo Rápido"
      duration={20} // Just 20 seconds! Fast paced.
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <View style={S.questionBox}>
        <Text style={S.questionTxt}>{question}</Text>
      </View>

      {feedback ? (
        <View style={S.feedbackBox}>
          <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
        </View>
      ) : (
        <View style={S.optionsGrid}>
          {options.map((opt, i) => (
            <TouchableOpacity 
              key={i} 
              style={S.optionBtn}
              onPress={() => handleAnswer(opt.isCorrect)}
            >
              <Text style={S.optionBtnTxt}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  questionBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  questionTxt: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionBtn: {
    width: '48%',
    backgroundColor: '#1e293b',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#475569',
  },
  optionBtnTxt: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: '900',
  },
  feedbackBox: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  feedbackTxt: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
  }
});
