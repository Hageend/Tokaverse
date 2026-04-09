import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';

interface InvoiceItem {
  id: string;
  concept: string;
  amount: number;
  isHiddenCharge: boolean;
}

const INVOICE_DATA: InvoiceItem[] = [
  { id: '1', concept: 'Consumo Restaurante', amount: 850.00, isHiddenCharge: false },
  { id: '2', concept: 'Propina Sugerida 15%', amount: 127.50, isHiddenCharge: false },
  { id: '3', concept: 'Seguro de Robo Express (No solicitado)', amount: 250.00, isHiddenCharge: true }, // Hidden
  { id: '4', concept: 'Suscripción CINE+', amount: 199.00, isHiddenCharge: false },
  { id: '5', concept: 'Comisión Mantenimiento de Cuenta', amount: 50.00, isHiddenCharge: false },
  { id: '6', concept: 'Cargo por Reconexión Fantasma', amount: 350.00, isHiddenCharge: true }, // Hidden
  { id: '7', concept: 'Gasolina', amount: 600.00, isHiddenCharge: false },
  { id: '8', concept: 'Cobro Administrativo Adicional', amount: 100.00, isHiddenCharge: true }, // Hidden
  { id: '9', concept: 'Compra Supermercado', amount: 1250.80, isHiddenCharge: false },
  { id: '10', concept: 'IVA (16%)', amount: 140.00, isHiddenCharge: false },
];

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const InvoiceScanner = ({ visible, onComplete, onClose }: Props) => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [crossedOutIds, setCrossedOutIds] = useState<Set<string>>(new Set());
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  useEffect(() => {
    if (visible) {
      // Shuffle the items a bit to make it less predictable, but keep IVA at bottom maybe? 
      // Let's just shuffle the middle ones if we want, or just randomize all. Let's randomize all for gameplay.
      const shuffled = [...INVOICE_DATA].sort(() => Math.random() - 0.5);
      setItems(shuffled);
      setCrossedOutIds(new Set());
      setIsEvaluating(false);
      setFeedback(null);
    }
  }, [visible]);

  const totalHiddenCharges = INVOICE_DATA.filter(i => i.isHiddenCharge).length;

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡TIEMPO AGOTADO! No encontraste todos.', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 2000);
  };

  const handleLinePress = (item: InvoiceItem) => {
    if (isEvaluating) return;

    if (!item.isHiddenCharge) {
      // Penalize or fail immediately? Let's fail immediately to make it strict.
      setIsEvaluating(true);
      setFeedback({ text: `ERROR: "${item.concept}" es un cargo válido.`, color: '#EF4444' });
      setTimeout(() => onComplete(false, 0), 2500);
      return;
    }

    const newCrossed = new Set(crossedOutIds);
    newCrossed.add(item.id);
    setCrossedOutIds(newCrossed);

    // Check Win
    if (newCrossed.size === totalHiddenCharges) {
      setIsEvaluating(true);
      setFeedback({ text: '¡EXCELENTE! Cazaste todos los cargos fantasma.', color: '#4ADE80' });
      setTimeout(() => onComplete(true, 800), 2500);
    }
  };

  return (
    <BasePuzzleModal
      visible={visible}
      title="Cazador de Cargos"
      duration={40} // 40 seconds to scan
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <Text style={S.instruction}>
        El banco te envió este estado de cuenta. Encuentra y tacha (toca) los <Text style={{color: '#EF4444', fontWeight: 'bold'}}>{totalHiddenCharges} cargos abusivos u ocultos</Text>. Si tachas uno válido, pierdes.
      </Text>

      {feedback ? (
        <View style={S.feedbackBox}>
          <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
        </View>
      ) : (
        <View style={S.receiptContainer}>
          <View style={S.receiptHeader}>
            <Text style={S.receiptHeaderTxt}>ESTADO DE CUENTA</Text>
            <Text style={S.receiptDateTxt}>12 AGO 2026</Text>
          </View>
          <View style={S.divider} />

          <ScrollView style={S.scrollView} showsVerticalScrollIndicator={true}>
            {items.map((item) => {
              const isCrossed = crossedOutIds.has(item.id);

              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={S.lineItem}
                  onPress={() => handleLinePress(item)}
                  activeOpacity={0.6}
                  disabled={isCrossed} // Prevent double tapping
                >
                  <Text style={[S.conceptText, isCrossed && S.crossedText]}>
                    {item.concept}
                  </Text>
                  <Text style={[S.amountText, isCrossed && S.crossedText]}>
                    ${item.amount.toFixed(2)}
                  </Text>
                  
                  {isCrossed && (
                    <View style={S.strikeLine} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={S.divider} />
          <View style={S.receiptFooter}>
             <Text style={S.totalLabel}>TOTAL A PAGAR:</Text>
             <Text style={S.totalAmount}>
               ${items.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}
             </Text>
          </View>
        </View>
      )}

    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  instruction: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  receiptContainer: {
    backgroundColor: '#f8fafc', // Paper color
    borderRadius: 8,
    padding: 16,
    maxHeight: 380, // Limit height to force scrolling
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptHeaderTxt: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  receiptDateTxt: {
    color: '#475569',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    width: '100%',
    marginVertical: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  scrollView: {
    flexGrow: 0,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    position: 'relative',
  },
  conceptText: {
    color: '#334155',
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
    paddingRight: 10,
  },
  amountText: {
    color: '#0f172a',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  crossedText: {
    color: '#94a3b8',
  },
  strikeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 3,
    backgroundColor: '#EF4444',
    transform: [{ rotate: '-1deg' }], // Slight angle to look like a red marker stroke
    opacity: 0.8,
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  totalLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  totalAmount: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
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
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 24,
  }
});
