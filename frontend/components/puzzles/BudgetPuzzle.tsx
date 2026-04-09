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

interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  expectedCategory: 'needs' | 'wants' | 'savings';
}

interface BudgetPuzzleProps {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

const ITEMS: BudgetItem[] = [
  { id: '1', name: 'Renta Mensual', amount: 500, expectedCategory: 'needs' },
  { id: '2', name: 'Zapatos Nuevos', amount: 120, expectedCategory: 'wants' },
  { id: '3', name: 'Fondo de Emergencia', amount: 200, expectedCategory: 'savings' },
  { id: '4', name: 'Supermercado', amount: 300, expectedCategory: 'needs' },
  { id: '5', name: 'Suscripción CINE+', amount: 30, expectedCategory: 'wants' },
  { id: '6', name: 'Inversión ETF', amount: 150, expectedCategory: 'savings' },
];

export const BudgetPuzzle = ({ visible, onComplete, onClose }: BudgetPuzzleProps) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [pendingItems, setPendingItems] = useState<BudgetItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  
  // Categorías llenadas
  const [needs, setNeeds] = useState<BudgetItem[]>([]);
  const [wants, setWants] = useState<BudgetItem[]>([]);
  const [savings, setSavings] = useState<BudgetItem[]>([]);
  
  // Feedback
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  // Animaciones Timer
  const timerWidth = useSharedValue(100);

  useEffect(() => {
    if (visible) {
      setPendingItems([...ITEMS].sort(() => Math.random() - 0.5));
      setNeeds([]);
      setWants([]);
      setSavings([]);
      setTimeLeft(30);
      setSelectedItem(null);
      setFeedback(null);
      timerWidth.value = 100;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    
    if (timeLeft <= 0) {
      checkWinCondition();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        timerWidth.value = withTiming((next / 30) * 100, { duration: 1000 });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, visible]);

  // Si no quedan ítems, evaluar victoria auto
  useEffect(() => {
    if (visible && pendingItems.length === 0 && ITEMS.length > 0) {
      checkWinCondition();
    }
  }, [pendingItems]);

  const checkWinCondition = () => {
    let errors = 0;
    const checkTarget = (list: BudgetItem[], type: string) => {
        list.forEach(i => { if (i.expectedCategory !== type) errors++; });
    };
    checkTarget(needs, 'needs');
    checkTarget(wants, 'wants');
    checkTarget(savings, 'savings');
    
    // Contamos ítems no categorizados como error
    errors += pendingItems.length;

    if (errors === 0) {
      setTimeout(() => onComplete(true, 1000), 1000);
      setFeedback({ text: '¡PRESUPUESTO PERFECTO!', color: '#4ADE80' });
    } else {
      setTimeout(() => onComplete(false, 0), 1500);
      setFeedback({ text: `MAL BALANCE (${errors} Errores)`, color: '#EF4444' });
    }
  };

  const handleSelect = (item: BudgetItem) => {
    setSelectedItem(item);
  };

  const handleDrop = (category: 'needs' | 'wants' | 'savings') => {
    if (!selectedItem) return;

    // Quitar de pending
    setPendingItems(prev => prev.filter(i => i.id !== selectedItem.id));

    // Agregar a categoría
    if (category === 'needs') setNeeds(prev => [...prev, selectedItem]);
    if (category === 'wants') setWants(prev => [...prev, selectedItem]);
    if (category === 'savings') setSavings(prev => [...prev, selectedItem]);

    setSelectedItem(null);
  };

  const timerStyle = useAnimatedStyle(() => ({
    width: `${timerWidth.value}%`
  }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide">
      <View style={S.overlay}>
        <View style={S.container}>
          
          <View style={S.header}>
            <Text style={S.title}>RETO 50/30/20</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity>
          </View>
          
          <View style={S.timerWrap}>
            <Animated.View style={[S.timerFill, timerStyle, timeLeft <= 5 && { backgroundColor: '#EF4444' }]} />
            <Text style={S.timerTxt}>00:{timeLeft.toString().padStart(2, '0')}</Text>
          </View>

          {feedback && (
            <View style={S.feedbackBox}>
              <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
            </View>
          )}

          {/* ÁREA DE ITEMS PENDIENTES */}
          <View style={S.pendingArea}>
            <Text style={S.areaTitle}>Ingresos y Gastos Pendientes</Text>
            <View style={S.itemsGrid}>
              {pendingItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[S.itemCard, isSelected && S.itemActive]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={S.itemName}>{item.name}</Text>
                    <Text style={S.itemAmount}>${item.amount}</Text>
                  </TouchableOpacity>
                );
              })}
              {pendingItems.length === 0 && <Text style={S.emptyTxt}>Todo categorizado.</Text>}
            </View>
          </View>

          {/* CAJAS OBJETIVO */}
          <View style={S.dropArea}>
            <Text style={S.instruction}>
              Toca un ítem arriba y luego toca la caja correcta.
            </Text>
            
            <View style={S.boxesWrapper}>
              <TouchableOpacity style={[S.box, S.boxNeeds]} onPress={() => handleDrop('needs')} activeOpacity={selectedItem ? 0.6 : 1}>
                <Text style={S.boxTitle}>NECESIDADES (50%)</Text>
                <Text style={S.boxCount}>{needs.length} ítems</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[S.box, S.boxWants]} onPress={() => handleDrop('wants')} activeOpacity={selectedItem ? 0.6 : 1}>
                <Text style={S.boxTitle}>DESEOS (30%)</Text>
                <Text style={S.boxCount}>{wants.length} ítems</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[S.box, S.boxSavings]} onPress={() => handleDrop('savings')} activeOpacity={selectedItem ? 0.6 : 1}>
                <Text style={S.boxTitle}>AHORRO (20%)</Text>
                <Text style={S.boxCount}>{savings.length} ítems</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const S = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center'
  },
  container: {
    width: Math.min(width * 0.9, 500), backgroundColor: '#0f172a',
    borderRadius: 16, borderWidth: 2, borderColor: Colors.accent,
    padding: 20
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15
  },
  title: {
    color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1
  },
  timerWrap: {
    height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', justifyContent: 'center', marginBottom: 20
  },
  timerFill: {
    ...StyleSheet.absoluteFillObject, backgroundColor: Colors.tertiary
  },
  timerTxt: {
    position: 'absolute', width: '100%', textAlign: 'center', color: '#FFF', fontSize: 10, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 4
  },
  feedbackBox: {
    padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, alignItems: 'center', marginBottom: 15
  },
  feedbackTxt: {
    fontSize: 16, fontWeight: '900', letterSpacing: 1
  },
  pendingArea: {
    backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
  },
  areaTitle: {
    color: '#aaa', fontSize: 12, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase'
  },
  itemsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8
  },
  itemCard: {
    backgroundColor: '#1e293b', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#475569', borderRadius: 8, padding: 10, width: '48%'
  },
  itemActive: {
    backgroundColor: 'rgba(0,212,255,0.15)', borderColor: Colors.tertiary, borderStyle: 'solid'
  },
  itemName: {
    color: '#FFF', fontSize: 11, fontWeight: '700', marginBottom: 4
  },
  itemAmount: {
    color: Colors.accent, fontSize: 14, fontWeight: '900'
  },
  emptyTxt: {
    color: '#666', fontStyle: 'italic', padding: 10
  },
  dropArea: {
    marginTop: 10
  },
  instruction: {
    color: Colors.tertiary, fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 15
  },
  boxesWrapper: {
    gap: 10
  },
  box: {
    padding: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center'
  },
  boxNeeds: { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: '#3b82f6' },
  boxWants: { backgroundColor: 'rgba(168,85,247,0.1)', borderColor: '#a855f7' },
  boxSavings: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: '#22c55e' },
  boxTitle: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  boxCount: { color: '#aaa', fontSize: 10, marginTop: 4, fontWeight: '700' }
});
