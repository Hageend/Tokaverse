import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useSharedValue, 
  interpolate,
  runOnJS
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface CardData {
  id: string;
  pairId: string;
  content: string;
  type: 'concept' | 'def';
}

const PAIRS = [
  { id: '1', concept: 'Tasa Interés', def: '% que cobra el banco' },
  { id: '2', concept: 'I. Compuesto', def: 'Interés sobre interés' },
  { id: '3', concept: 'Inflación', def: 'Alza de precios' },
  { id: '4', concept: 'Presupuesto', def: 'Plan de gastos' },
  { id: '5', concept: 'Activo', def: 'Genera ingresos' },
  { id: '6', concept: 'Pasivo', def: 'Genera gastos' },
];

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

const Card = ({ card, isFlipped, isMatched, onFlip }: { card: CardData, isFlipped: boolean, isMatched: boolean, onFlip: () => void }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(isFlipped || isMatched ? 180 : 0, { duration: 400 });
  }, [isFlipped, isMatched]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <TouchableOpacity 
      onPress={onFlip} 
      disabled={isFlipped || isMatched}
      style={S.cardContainer}
    >
      <Animated.View style={[S.card, S.cardFront, frontStyle]}>
        <Text style={S.cardLogo}>$</Text>
      </Animated.View>
      <Animated.View style={[S.card, S.cardBack, backStyle, isMatched && S.cardMatched]}>
        <Text style={S.cardTxt}>{card.content}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const CardMatchFinance = ({ visible, onComplete, onClose }: Props) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  useEffect(() => {
    if (visible) {
      const deck: CardData[] = [];
      PAIRS.forEach(p => {
        deck.push({ id: `c-${p.id}`, pairId: p.id, content: p.concept, type: 'concept' });
        deck.push({ id: `d-${p.id}`, pairId: p.id, content: p.def, type: 'def' });
      });
      setCards(deck.sort(() => Math.random() - 0.5));
      setFlippedIds([]);
      setMatchedPairs([]);
      setIsEvaluating(false);
      setFeedback(null);
    }
  }, [visible]);

  const handleFlip = (id: string) => {
    if (flippedIds.length >= 2 || isEvaluating) return;
    
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      const [id1, id2] = newFlipped;
      const c1 = cards.find(c => c.id === id1);
      const c2 = cards.find(c => c.id === id2);

      if (c1 && c2 && c1.pairId === c2.pairId) {
        setMatchedPairs(prev => [...prev, c1.pairId]);
        setFlippedIds([]);
        if (matchedPairs.length + 1 === PAIRS.length) {
            setIsEvaluating(true);
            setFeedback({ text: '¡MEMORIA DE INVERSIONISTA!', color: '#4ADE80' });
            setTimeout(() => onComplete(true, 1000), 1500);
        }
      } else {
        setTimeout(() => {
          setFlippedIds([]);
        }, 1000);
      }
    }
  };

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡TIEMPO AGOTADO!', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 2000);
  };

  return (
    <BasePuzzleModal
      visible={visible}
      title="Parejas Financieras"
      duration={60}
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <Text style={S.instruction}>Encuentra el Concepto con su Definición.</Text>
      
      {feedback && (
        <View style={S.feedbackBox}>
          <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
        </View>
      )}

      <View style={S.grid}>
        {cards.map(card => (
          <Card 
            key={card.id}
            card={card}
            isFlipped={flippedIds.includes(card.id)}
            isMatched={matchedPairs.includes(card.pairId)}
            onFlip={() => handleFlip(card.id)}
          />
        ))}
      </View>
    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  instruction: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  cardContainer: {
    width: (width * 0.9 - 80) / 3,
    height: 100,
    position: 'relative',
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    padding: 4,
  },
  cardFront: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardBack: {
    backgroundColor: Colors.primary,
    borderColor: Colors.accent,
  },
  cardMatched: {
    backgroundColor: '#064e3b',
    borderColor: '#4ADE80',
    opacity: 0.6,
  },
  cardLogo: {
    color: Colors.accent,
    fontSize: 32,
    fontWeight: '900',
  },
  cardTxt: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  feedbackBox: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  feedbackTxt: {
    fontSize: 14,
    fontWeight: '900',
  }
});
