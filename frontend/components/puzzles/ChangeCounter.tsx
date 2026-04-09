import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

const DENOMINATIONS = [
  { value: 100, label: '$100', type: 'bill' },
  { value: 50, label: '$50', type: 'bill' },
  { value: 20, label: '$20', type: 'bill' },
  { value: 10, label: '$10', type: 'coin' },
  { value: 5, label: '$5', type: 'coin' },
  { value: 1, label: '$1', type: 'coin' },
  { value: 0.5, label: '50¢', type: 'coin' },
];

export const ChangeCounter = ({ visible, onComplete, onClose }: Props) => {
  const [currentAmount, setCurrentAmount] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  // Hardcoded scenario for simplicity, but can be dynamic later
  const price = 342;
  const payment = 500;
  const targetChange = payment - price; // 158

  useEffect(() => {
    if (visible) {
      setCurrentAmount(0);
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

  const addAmount = (val: number) => {
    if (isEvaluating) return;
    setCurrentAmount(prev => prev + val);
  };

  const resetAmount = () => {
    if (isEvaluating) return;
    setCurrentAmount(0);
  };

  const handleConfirm = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);

    if (Math.abs(currentAmount - targetChange) < 0.01) {
      setFeedback({ text: '¡CAMBIO EXACTO!', color: '#4ADE80' });
      setTimeout(() => onComplete(true, 800), 2000);
    } else {
      setFeedback({ text: `Equivocado. Era $${targetChange.toFixed(2)}`, color: '#EF4444' });
      setTimeout(() => onComplete(false, 0), 2000);
    }
  };

  return (
    <BasePuzzleModal
      visible={visible}
      title="Cajero Veloz"
      duration={30}
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <View style={S.scenarioBox}>
        <Text style={S.scenarioTxt}>El cliente paga <Text style={{color: Colors.accent}}>${payment}</Text></Text>
        <Text style={S.scenarioTxt}>Por una compra de <Text style={{color: '#EF4444'}}>${price}</Text></Text>
      </View>

      <View style={S.counterBox}>
        <Text style={S.counterSub}>Tu cambio actual:</Text>
        <Text style={[S.counterTxt, currentAmount > targetChange && { color: '#EF4444' }]}>
          ${currentAmount.toFixed(2)}
        </Text>
      </View>

      {feedback ? (
        <View style={S.feedbackBox}>
          <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
        </View>
      ) : (
        <View style={S.interactionArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.denominationsContainer}>
            {DENOMINATIONS.map((d, i) => (
              <TouchableOpacity 
                key={i} 
                style={[S.moneyBtn, d.type === 'coin' ? S.coinBtn : S.billBtn]}
                onPress={() => addAmount(d.value)}
              >
                <Text style={S.moneyTxt}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={S.actionsRow}>
            <TouchableOpacity style={S.resetBtn} onPress={resetAmount}>
              <Text style={S.resetBtnTxt}>LIMPIAR (-)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={S.confirmBtn} onPress={handleConfirm}>
              <Text style={S.confirmBtnTxt}>ENTREGAR CAMBIO</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  scenarioBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scenarioTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  counterBox: {
    alignItems: 'center',
    marginBottom: 30,
  },
  counterSub: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  counterTxt: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  interactionArea: {
    alignItems: 'center',
    width: '100%',
  },
  denominationsContainer: {
    gap: 12,
    paddingHorizontal: 10,
    paddingBottom: 10, // Shadow padding
  },
  moneyBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  billBtn: {
    width: 80,
    height: 50,
    backgroundColor: '#15803d',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  coinBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ca8a04',
    borderWidth: 2,
    borderColor: '#facc15',
  },
  moneyTxt: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 20,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnTxt: {
    color: '#EF4444',
    fontWeight: '900',
    fontSize: 12,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnTxt: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  feedbackBox: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  feedbackTxt: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  }
});
