import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated';

type Category = 'necesidad' | 'deseo' | 'hormiga';

interface Transaction {
  id: string;
  concept: string;
  amount: number;
  correctCategory: Category;
}

const ALL_TRANSACTIONS: Transaction[] = [
  { id: '1', concept: 'Despensa Walmart', amount: 850, correctCategory: 'necesidad' },
  { id: '2', concept: 'Suscripción CINE+', amount: 199, correctCategory: 'deseo' },
  { id: '3', concept: 'Café Sirena', amount: 95, correctCategory: 'hormiga' },
  { id: '4', concept: 'Gasolina Coche', amount: 600, correctCategory: 'necesidad' },
  { id: '5', concept: 'Skin Videojuego', amount: 250, correctCategory: 'deseo' },
  { id: '6', concept: 'Snacks Oxxo', amount: 45, correctCategory: 'hormiga' },
  { id: '7', concept: 'Recibo de Luz', amount: 350, correctCategory: 'necesidad' },
];

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const TransactionTagger = ({ visible, onComplete, onClose }: Props) => {
  const [queue, setQueue] = useState<Transaction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  useEffect(() => {
    if (visible) {
      // Tomamos 5 al azar
      const shuffled = [...ALL_TRANSACTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
      setQueue(shuffled);
      setCurrentIndex(0);
      setIsEvaluating(false);
      setFeedback(null);
    }
  }, [visible]);

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡TIEMPO AGOTADO!', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 1000);
  };

  const handleCategorize = (category: Category) => {
    if (isEvaluating) return;

    const currentTx = queue[currentIndex];

    if (currentTx.correctCategory !== category) {
      setIsEvaluating(true);
      setFeedback({ text: `Equivocación. Era una ${currentTx.correctCategory.toUpperCase()}`, color: '#EF4444' });
      setTimeout(() => onComplete(false, 0), 2000);
      return;
    }

    if (currentIndex + 1 >= queue.length) {
      // Finished all correctly!
      setIsEvaluating(true);
      setFeedback({ text: '¡100% CORRECTO!', color: '#4ADE80' });
      setTimeout(() => onComplete(true, 600), 1500);
    } else {
      // Next card
      setCurrentIndex(prev => prev + 1);
    }
  };

  const currentTx = queue[currentIndex];

  return (
    <BasePuzzleModal
      visible={visible}
      title="Etiquetado Rápido"
      duration={30} // 30 seconds to categorize 5 items
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <Text style={S.instruction}>
        Clasifica la transacción mostrada antes de que termine el tiempo. Un error arruinará la racha.
      </Text>

      {feedback ? (
        <View style={S.feedbackBox}>
          <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
        </View>
      ) : currentTx ? (
        <View style={S.cardArea}>
          <Animated.View 
            key={currentTx.id} 
            entering={FadeInRight} 
            exiting={FadeOutLeft}
            style={S.activeCard}
          >
            <Text style={S.txCounter}>Transacción {currentIndex + 1} de {queue.length}</Text>
            <Text style={S.txConcept}>{currentTx.concept}</Text>
            <Text style={S.txAmount}>${currentTx.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</Text>
          </Animated.View>

          <View style={S.buttonsRow}>
            <TouchableOpacity style={[S.actionBtn, { borderColor: '#3b82f6' }]} onPress={() => handleCategorize('necesidad')}>
              <Text style={[S.actionBtnTxt, { color: '#60a5fa' }]}>NECESIDAD</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[S.actionBtn, { borderColor: '#a855f7' }]} onPress={() => handleCategorize('deseo')}>
              <Text style={[S.actionBtnTxt, { color: '#c084fc' }]}>DESEO</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[S.actionBtn, { borderColor: '#f59e0b' }]} onPress={() => handleCategorize('hormiga')}>
              <Text style={[S.actionBtnTxt, { color: '#fbbf24' }]}>G. HORMIGA</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  instruction: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardArea: {
    alignItems: 'center',
  },
  activeCard: {
    backgroundColor: '#1e293b',
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  txCounter: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  txConcept: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  txAmount: {
    color: Colors.accent,
    fontSize: 26,
    fontWeight: '900',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnTxt: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  feedbackBox: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  feedbackTxt: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
  }
});
