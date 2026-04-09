import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Receipt {
  name: string;
  amount: number;
  category: string;
}

const ITEMS: Receipt[] = [
  { name: 'Spotify', amount: 129, category: 'Entretenimiento' },
  { name: 'Oxxo', amount: 85, category: 'Hormiga' },
  { name: 'Walmart', amount: 1450, category: 'Súper' },
  { name: 'Uber', amount: 210, category: 'Transporte' },
  { name: 'Starbucks', amount: 95, category: 'Hormiga' },
];

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const TransactionMemory = ({ visible, onComplete, onClose }: Props) => {
  const [phase, setPhase] = useState<'observe' | 'answer'>('observe');
  const [questionData, setQuestionData] = useState<{ q: string, options: string[], correctIdx: number } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);
  const [viewedItems, setViewedItems] = useState<Receipt[]>([]);

  useEffect(() => {
    if (visible) {
      setPhase('observe');
      const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
      setViewedItems(shuffled);
      setIsEvaluating(false);
      setFeedback(null);

      // Random Question Logic
      const qNum = Math.floor(Math.random() * 3);
      let q = "", options: string[] = [], correctIdx = 0;

      if (qNum === 0) {
        q = "¿Cuál fue el gasto más costoso?";
        const sorted = [...shuffled].sort((a,b) => b.amount - a.amount);
        const correct = sorted[0].name;
        options = [correct, sorted[1].name, sorted[2].name].sort(() => Math.random() - 0.5);
        correctIdx = options.indexOf(correct);
      } else if (qNum === 1) {
        q = "¿Cuánto se gastó en el concepto más barato?";
        const sorted = [...shuffled].sort((a,b) => a.amount - b.amount);
        const correct = `$${sorted[0].amount}`;
        options = [correct, `$${sorted[1].amount}`, `$${sorted[2].amount}`].sort(() => Math.random() - 0.5);
        correctIdx = options.indexOf(correct);
      } else {
        q = "¿Cuál de estos conceptos NO apareció?";
        const notIn = "Netflix";
        options = [shuffled[0].name, shuffled[1].name, notIn].sort(() => Math.random() - 0.5);
        correctIdx = options.indexOf(notIn);
      }
      
      setQuestionData({ q, options, correctIdx });

      // After 4 seconds, change phase
      const timer = setTimeout(() => {
        setPhase('answer');
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡TIEMPO AGOTADO!', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 2000);
  };

  const handleAnswer = (idx: number) => {
    if (idx === questionData?.correctIdx) {
      setIsEvaluating(true);
      setFeedback({ text: '¡FOTOMEMORIA PERFECTA!', color: '#4ADE80' });
      setTimeout(() => onComplete(true, 800), 1500);
    } else {
      setIsEvaluating(true);
      setFeedback({ text: 'MEMORIA BORROSA... Inténtalo de nuevo.', color: '#EF4444' });
      setTimeout(() => onComplete(false, 0), 1500);
    }
  };

  return (
    <BasePuzzleModal
      visible={visible}
      title="Memoria Fotográfica"
      duration={15} // Total timer includes observation and answer
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      {phase === 'observe' ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={S.observeArea}>
          <Text style={S.phaseTitle}>OBSERVA LOS RECIBOS (4s)</Text>
          <View style={S.receiptsList}>
            {viewedItems.map((item, i) => (
              <View key={i} style={S.receiptItem}>
                <Text style={S.itemText}>{item.name}</Text>
                <Text style={S.itemAmount}>${item.amount}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn} style={S.answerArea}>
          <Text style={S.question}>{questionData?.q}</Text>
          
          {feedback ? (
            <View style={S.feedbackBox}>
              <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
            </View>
          ) : (
            <View style={S.optionsRow}>
              {questionData?.options.map((opt, i) => (
                <TouchableOpacity 
                   key={i} 
                   style={S.optionBtn}
                   onPress={() => handleAnswer(i)}
                >
                  <Text style={S.optionTxt}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      )}
    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  observeArea: {
    alignItems: 'center',
  },
  phaseTitle: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 2,
  },
  receiptsList: {
    width: '100%',
    gap: 8,
  },
  receiptItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: Colors.tertiary,
  },
  itemText: {
    color: '#fff',
    fontWeight: '700',
  },
  itemAmount: {
    color: Colors.accent,
    fontWeight: '900',
  },
  answerArea: {
    alignItems: 'center',
  },
  question: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  optionsRow: {
    width: '100%',
    gap: 12,
  },
  optionBtn: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  feedbackBox: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  feedbackTxt: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  }
});
