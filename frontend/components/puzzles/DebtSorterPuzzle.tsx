import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

interface DebtCard {
  id: string;
  name: string;
  balance: number;
  interest: number; // Percentage
}

const INITIAL_DEBTS: DebtCard[] = [
  { id: '1', name: 'Tarjeta Clásica', balance: 15000, interest: 65 },
  { id: '2', name: 'Auto', balance: 120000, interest: 16 },
  { id: '3', name: 'Préstamo Nómina', balance: 25000, interest: 35 },
  { id: '4', name: 'Microcrédito App', balance: 5000, interest: 95 },
  { id: '5', name: 'Crédito Hipotecario', balance: 800000, interest: 10 },
];

interface DebtSorterPuzzleProps {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const DebtSorterPuzzle = ({ visible, onComplete, onClose }: DebtSorterPuzzleProps) => {
  const [debts, setDebts] = useState<DebtCard[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    if (visible) {
      // Shuffle intentionally so it's not sorted
      const shuffled = [...INITIAL_DEBTS].sort(() => Math.random() - 0.5);
      setDebts(shuffled);
      setSelectedIndex(null);
      setFeedback(null);
      setIsEvaluating(false);
    }
  }, [visible]);

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡TIEMPO AGOTADO!', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 1500);
  };

  const handleCardPress = (index: number) => {
    if (isEvaluating) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      if (selectedIndex !== index) {
        // Swap
        const newDebts = [...debts];
        const temp = newDebts[selectedIndex];
        newDebts[selectedIndex] = newDebts[index];
        newDebts[index] = temp;
        setDebts(newDebts);
      }
      setSelectedIndex(null);
    }
  };

  const handleConfirm = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setSelectedIndex(null);

    // Validate (Avalanche method: Highest interest first)
    let isCorrect = true;
    for (let i = 0; i < debts.length - 1; i++) {
        if (debts[i].interest < debts[i + 1].interest) {
            isCorrect = false;
            break;
        }
    }

    if (isCorrect) {
      setFeedback({ text: '¡MÉTODO AVALANCHA CORRECTO!', color: '#4ADE80' });
      setTimeout(() => onComplete(true, 500), 1500);
    } else {
      setFeedback({ text: 'ORDEN INCORRECTO (Revisa el %)', color: '#EF4444' });
      setTimeout(() => onComplete(false, 0), 2000); // Give them time to read before close or reset
    }
  };

  return (
    <BasePuzzleModal
      visible={visible}
      title="Método Avalancha"
      duration={45} // 45 seconds to solve
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <Text style={S.instruction}>
        Ordena las deudas de <Text style={{color: '#EF4444'}}>mayor</Text> a <Text style={{color: '#4ADE80'}}>menor</Text> tasa de interés (%).
      </Text>
      <Text style={S.subInstruction}>
        Toca una tarjeta y luego otra para intercambiarlas.
      </Text>

      {feedback && (
        <View style={S.feedbackBox}>
          <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
        </View>
      )}

      <View style={S.cardsContainer}>
        {debts.map((item, index) => {
          const isSelected = selectedIndex === index;
          return (
            <Animated.View 
                key={item.id} 
                layout={Layout.springify()} 
            >
                <TouchableOpacity 
                    style={[S.card, isSelected && S.cardSelected]}
                    onPress={() => handleCardPress(index)}
                    activeOpacity={0.8}
                >
                    <View style={S.cardLeft}>
                        <View style={S.orderBadge}>
                            <Text style={S.orderBadgeTxt}>{index + 1}</Text>
                        </View>
                        <View>
                            <Text style={S.cardName}>{item.name}</Text>
                            <Text style={S.cardBalance}>Saldo: ${item.balance.toLocaleString()}</Text>
                        </View>
                    </View>
                    <View style={S.cardRight}>
                        <View style={S.interestPill}>
                            <Ionicons name="flame" size={12} color="#EF4444" />
                            <Text style={S.interestTxt}>{item.interest}%</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <TouchableOpacity 
        style={[S.confirmBtn, isEvaluating && { opacity: 0.5 }]} 
        onPress={handleConfirm}
        disabled={isEvaluating}
      >
        <Text style={S.confirmBtnTxt}>CONFIRMAR ORDEN</Text>
      </TouchableOpacity>
    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  instruction: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subInstruction: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic'
  },
  cardsContainer: {
    gap: 8,
    marginBottom: 20
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    transform: [{ scale: 1.02 }]
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeTxt: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  cardName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 2,
  },
  cardBalance: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 4,
  },
  interestTxt: {
    color: '#EF4444',
    fontWeight: '900',
    fontSize: 14,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  confirmBtnTxt: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  feedbackBox: {
    padding: 12, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 15
  },
  feedbackTxt: {
    fontSize: 14, 
    fontWeight: '900', 
    letterSpacing: 1
  },
});
