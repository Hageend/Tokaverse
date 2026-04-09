import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface DebtMonster {
  id: string;
  name: string;
  hp: number; // Current balance
  maxHp: number;
  interestRate: number; // % growth per 3 seconds
  icon: string;
}

const INITIAL_DEBTS: DebtMonster[] = [
  { id: '1', name: 'Pequeña', hp: 3000, maxHp: 3000, interestRate: 0.05, icon: 'ghost-outline' },
  { id: '2', name: 'Mediana', hp: 8000, maxHp: 8000, interestRate: 0.08, icon: 'skull-outline' },
  { id: '3', name: 'Gigante', hp: 15000, maxHp: 15000, interestRate: 0.12, icon: 'flame-outline' },
];

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const DebtSnowball = ({ visible, onComplete, onClose }: Props) => {
  const [monsters, setMonsters] = useState<DebtMonster[]>([]);
  const [cashFlow, setCashFlow] = useState(2000); // Standard attack power
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // To handle the "Turns" every 3 seconds
  const [turnCounter, setTurnCounter] = useState(3);

  useEffect(() => {
    if (visible) {
      setMonsters(INITIAL_DEBTS.map(d => ({ ...d })));
      setCashFlow(2000);
      setIsEvaluating(false);
      setFeedback(null);
      setSelectedId('1');
      setTurnCounter(3);
    }
  }, [visible]);

  // Game Logic Loop (Turns)
  useEffect(() => {
    if (!visible || isEvaluating) return;

    const interval = setInterval(() => {
      setTurnCounter(prev => {
        if (prev <= 1) {
          // TURN ACTION: Interest growth
          processTurn();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, monsters, isEvaluating]);

  const processTurn = () => {
    setMonsters(current => {
      const next = current.map(m => {
        if (m.hp <= 0) return m;
        return { ...m, hp: Math.round(m.hp * (1 + m.interestRate)) };
      });
      return next;
    });
  };

  const fireCannon = () => {
    if (!selectedId || isEvaluating) return;

    setMonsters(current => {
      const next = current.map(m => {
        if (m.id === selectedId) {
          const newHp = Math.max(0, m.hp - cashFlow);
          
          // SNOWBALL EFFECT: If monster dies, increase cash flow for others
          if (newHp === 0 && m.hp > 0) {
            setCashFlow(prev => prev + 1000);
          }
          return { ...m, hp: newHp };
        }
        return m;
      });

      // Check WIN condition
      if (next.every(m => m.hp === 0)) {
        setIsEvaluating(true);
        setFeedback({ text: '¡BOLA DE NIEVE IMPARABLE!', color: '#4ADE80' });
        setTimeout(() => onComplete(true, 1200), 1500);
      }
      return next;
    });
  };

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡LAS DEUDAS TE CONSUMIERON!', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 2000);
  };

  return (
    <BasePuzzleModal
      visible={visible}
      title="Bola de Nieve"
      duration={45}
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <View style={S.gameHeader}>
        <Text style={S.subtitle}>Tus deudas crecen cada <Text style={{color: '#EF4444'}}>3s</Text></Text>
        <View style={S.cashFlowBadge}>
          <Text style={S.cashLabel}>PODER DE PAGO: </Text>
          <Text style={S.cashVal}>${cashFlow}</Text>
        </View>
      </View>

      <View style={S.monsterContainer}>
        {monsters.map(m => (
          <TouchableOpacity 
            key={m.id} 
            activeOpacity={0.8}
            onPress={() => m.hp > 0 && setSelectedId(m.id)}
            style={[S.monsterCard, selectedId === m.id && S.monsterActive, m.hp === 0 && S.monsterDead]}
          >
            <Ionicons name={m.icon as any} size={24} color={m.hp === 0 ? '#475569' : (selectedId === m.id ? Colors.accent : '#fff')} />
            <Text style={[S.monsterName, m.hp === 0 && { color: '#475569' }]}>{m.name}</Text>
            <View style={S.hpBar}>
               <View style={[S.hpFill, { width: `${(m.hp / m.maxHp) * 100}%` }]} />
            </View>
            <Text style={S.hpTxt}>${m.hp}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={S.actionArea}>
         <View style={S.turnTimer}>
            <Text style={S.turnTxt}>SIGUIENTE INTERÉS EN: {turnCounter}s</Text>
         </View>
         
         <TouchableOpacity style={S.fireBtn} onPress={fireCannon} disabled={isEvaluating}>
            <Ionicons name="flash" size={24} color="#0f172a" />
            <Text style={S.fireTxt}>¡PAGAR AHORA!</Text>
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
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cashFlowBadge: {
    backgroundColor: 'rgba(77,97,252,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(77,97,252,0.3)',
    flexDirection: 'row',
  },
  cashLabel: { color: Colors.textSecondary, fontSize: 10, fontWeight: '800' },
  cashVal: { color: Colors.accent, fontSize: 10, fontWeight: '900' },
  monsterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 30,
  },
  monsterCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  monsterActive: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(234, 179, 8, 0.05)',
  },
  monsterDead: {
    opacity: 0.5,
    backgroundColor: '#0f172a',
  },
  monsterName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  hpBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  hpTxt: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  actionArea: {
    alignItems: 'center',
    gap: 12,
  },
  turnTimer: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
  },
  turnTxt: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
  },
  fireBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  fireTxt: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  feedbackBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    alignItems: 'center',
  },
  feedbackTxt: {
    fontSize: 16,
    fontWeight: '900',
  }
});
