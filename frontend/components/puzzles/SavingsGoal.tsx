import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const SavingsGoal = ({ visible, onComplete, onClose }: Props) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  // Initial State: Needs to save 5k in 2 months -> 2.5k per month.
  // Income 8k, Base Expenses 6.5k -> Savings 1.5k. Gap: 1k/month.
  const [expenses, setExpenses] = useState({
    subscriptions: 800,
    leisure: 1500,
    clothing: 1200,
  });

  const income = 8000;
  const targetMonthlySaving = 2500;
  const currentMonthlySaving = useMemo(() => {
     const totalExpenses = (6500 - 800 - 1500 - 1200) + expenses.subscriptions + expenses.leisure + expenses.clothing;
     return income - totalExpenses;
  }, [expenses]);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setExpenses({ subscriptions: 800, leisure: 1500, clothing: 1200 });
      setIsEvaluating(false);
      setFeedback(null);
      progress.value = 0;
    }
  }, [visible]);

  useEffect(() => {
    const p = Math.min(currentMonthlySaving / targetMonthlySaving, 1);
    progress.value = withSpring(p);
  }, [currentMonthlySaving]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: progress.value >= 1 ? '#4ADE80' : Colors.accent,
  }));

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡TIEMPO AGOTADO!', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 2000);
  };

  const updateExpense = (key: keyof typeof expenses, delta: number) => {
    setExpenses(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta)
    }));
  };

  const handleConfirm = () => {
    if (isEvaluating) return;
    
    if (currentMonthlySaving >= targetMonthlySaving) {
      setIsEvaluating(true);
      setFeedback({ text: '¡PLAN DE AHORRO LOGRADO!', color: '#4ADE80' });
      setTimeout(() => onComplete(true, 900), 2000);
    } else {
      setFeedback({ text: 'Aún no llegas a la meta mensual de $2,500', color: '#EF4444' });
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  return (
    <BasePuzzleModal
      visible={visible}
      title="Ajuste de Presupuesto"
      duration={45}
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <View style={S.infoBox}>
        <Text style={S.infoTitle}>META: $5,000 en 2 meses</Text>
        <Text style={S.infoSub}>Debes ahorrar <Text style={{fontWeight:'900', color: Colors.accent}}>$2,500 cada mes</Text>.</Text>
      </View>

      <View style={S.progressWrapper}>
         <Text style={S.progressLabel}>Ahorro Mensual Proyectado: ${currentMonthlySaving}</Text>
         <View style={S.track}>
            <Animated.View style={[S.fill, progressBarStyle]} />
         </View>
      </View>

      <View style={S.slidersContainer}>
        {Object.entries(expenses).map(([key, val]) => (
          <View key={key} style={S.expenseRow}>
            <View style={S.expenseHeader}>
               <Text style={S.expenseLabel}>{key.toUpperCase()}</Text>
               <Text style={S.expenseValue}>${val}</Text>
            </View>
            <View style={S.controls}>
               <TouchableOpacity style={S.controlBtn} onPress={() => updateExpense(key as any, -100)}>
                 <Text style={S.controlTxt}>-</Text>
               </TouchableOpacity>
               <TouchableOpacity style={S.controlBtn} onPress={() => updateExpense(key as any, 100)}>
                 <Text style={S.controlTxt}>+</Text>
               </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {feedback ? (
        <View style={S.feedbackBox}>
          <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
        </View>
      ) : (
        <TouchableOpacity style={S.confirmBtn} onPress={handleConfirm}>
          <Text style={S.confirmBtnTxt}>CONFIRMAR PLAN</Text>
        </TouchableOpacity>
      )}
    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  infoSub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  progressWrapper: {
    marginBottom: 24,
  },
  progressLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  track: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  slidersContainer: {
    gap: 16,
    marginBottom: 24,
  },
  expenseRow: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expenseHeader: {
    flex: 1,
  },
  expenseLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  expenseValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  controlTxt: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  confirmBtn: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnTxt: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  feedbackBox: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackTxt: {
    fontSize: 14,
    fontWeight: '900',
  }
});
