import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Scenario {
  text: string;
  options: {
    label: string;
    impact: string;
    isOptimal: boolean;
  }[];
}

const STEPS: Scenario[] = [
  {
    text: "¡EMERGENCIA! Tu auto se descompuso. La reparación cuesta $3,000. Solo tienes $1,000 en tu fondo de ahorro.",
    options: [
      { label: "Usar mis $1k de ahorro y pagar $2k con Tarjeta (60% CAT)", impact: "Deuda cara generada", isOptimal: false },
      { label: "Pagar todo con Préstamo Personal (30% CAT)", impact: "Intereses moderados", isOptimal: true },
      { label: "Pedir prestado a un familiar (0% de interés)", impact: "Deuda moral, pero financieramente ideal", isOptimal: true },
    ]
  },
  {
    text: "Mes siguiente: Tienes $2,000 extra de ahorro mensual. ¿Cómo los usas para sanar el golpe?",
    options: [
      { label: "Pagar el mínimo de la tarjeta y ahorrar el resto", impact: "Intereses te consumirán", isOptimal: false },
      { label: "Liquidar la deuda más cara de inmediato", impact: "Fondo de emergencia recuperándose", isOptimal: true },
      { label: "Irte de viaje para olvidar el estrés", impact: "Crisis financiera inminente", isOptimal: false },
    ]
  }
];

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const CrisisManager = ({ visible, onComplete, onClose }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setIsEvaluating(false);
      setFeedback(null);
      setScore(0);
    }
  }, [visible]);

  const handleOption = (isOptimal: boolean) => {
    if (isEvaluating) return;

    if (isOptimal) setScore(prev => prev + 500);

    if (currentStep + 1 < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishGame(isOptimal);
    }
  };

  const finishGame = (lastIsOptimal: boolean) => {
    const finalScore = score + (lastIsOptimal ? 500 : 0);
    setIsEvaluating(true);

    if (finalScore >= 1000) {
      setFeedback({ text: '¡GENIO DE LAS CRISIS! Mantuviste tu salud financiera.', color: '#4ADE80' });
      setTimeout(() => onComplete(true, finalScore), 2000);
    } else if (finalScore >= 500) {
      setFeedback({ text: 'SOBREVIVISTE. Pero quedó una cicatriz en tu bolsillo.', color: Colors.accent });
      setTimeout(() => onComplete(true, finalScore), 2000);
    } else {
      setFeedback({ text: 'BANCARROTA. Tus decisiones agravaron la crisis.', color: '#EF4444' });
      setTimeout(() => onComplete(false, 0), 2000);
    }
  };

  const handleTimeUp = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setFeedback({ text: '¡SE TE ACABÓ EL TIEMPO PARA DECIDIR!', color: '#EF4444' });
    setTimeout(() => onComplete(false, 0), 2000);
  };

  const currentScenario = STEPS[currentStep];

  return (
    <BasePuzzleModal
      visible={visible}
      title="Gestor de Crisis"
      duration={40}
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <View style={S.container}>
        <Animated.View key={currentStep} entering={FadeIn} style={S.dialogueBox}>
           <Text style={S.stepTxt}>PASO {currentStep + 1} DE {STEPS.length}</Text>
           <Text style={S.scenarioTxt}>{currentScenario.text}</Text>
        </Animated.View>

        {feedback ? (
          <View style={S.feedbackArea}>
             <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
          </View>
        ) : (
          <ScrollView style={S.optionsList}>
            {currentScenario.options.map((opt, i) => (
              <TouchableOpacity 
                key={i} 
                style={S.optionBtn}
                onPress={() => handleOption(opt.isOptimal)}
              >
                <Text style={S.optionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  container: {
    height: 400,
  },
  dialogueBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  stepTxt: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
  },
  scenarioTxt: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  optionsList: {
    gap: 12,
  },
  optionBtn: {
    backgroundColor: '#1e293b',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackArea: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  feedbackTxt: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
  }
});
