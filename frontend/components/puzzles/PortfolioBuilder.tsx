import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BasePuzzleModal } from './BasePuzzleModal';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type RiskType = 'Conservador' | 'Moderado' | 'Agresivo';

interface Asset {
  id: string;
  name: string;
  amount: number;
  riskWeight: number; // 0 to 1
  color: string;
}

const INITIAL_ASSETS: Asset[] = [
  { id: '1', name: 'Efectivo', amount: 0, riskWeight: 0, color: '#94a3b8' },
  { id: '2', name: 'Bonos', amount: 0, riskWeight: 0.2, color: '#22c55e' },
  { id: '3', name: 'Acciones', amount: 0, riskWeight: 0.7, color: '#3b82f6' },
  { id: '4', name: 'Crypto', amount: 0, riskWeight: 1, color: '#a855f7' },
];

interface Props {
  visible: boolean;
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
}

export const PortfolioBuilder = ({ visible, onComplete, onClose }: Props) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalCapital, setTotalCapital] = useState(10000);
  const [targetRisk, setTargetRisk] = useState<RiskType>('Conservador');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, color: string } | null>(null);

  useEffect(() => {
    if (visible) {
      setAssets(INITIAL_ASSETS.map(a => ({ ...a })));
      setTotalCapital(10000);
      const risks: RiskType[] = ['Conservador', 'Moderado', 'Agresivo'];
      setTargetRisk(risks[Math.floor(Math.random() * risks.length)]);
      setIsEvaluating(false);
      setFeedback(null);
    }
  }, [visible]);

  const remainingFunds = useMemo(() => {
    const allocated = assets.reduce((sum, a) => sum + a.amount, 0);
    return totalCapital - allocated;
  }, [assets, totalCapital]);

  const currentRiskScore = useMemo(() => {
    const allocated = assets.reduce((sum, a) => sum + a.amount, 0);
    if (allocated === 0) return 0;
    const weightedSum = assets.reduce((sum, a) => sum + (a.amount * a.riskWeight), 0);
    return weightedSum / allocated;
  }, [assets]);

  const currentRiskLabel = useMemo((): RiskType => {
    if (currentRiskScore <= 0.3) return 'Conservador';
    if (currentRiskScore <= 0.6) return 'Moderado';
    return 'Agresivo';
  }, [currentRiskScore]);

  const updateAsset = (id: string, delta: number) => {
    if (isEvaluating) return;
    if (delta > 0 && remainingFunds < delta) return;
    
    setAssets(current => current.map(a => {
      if (a.id === id) {
        return { ...a, amount: Math.max(0, a.amount + delta) };
      }
      return a;
    }));
  };

  const handleConfirm = () => {
    if (isEvaluating) return;
    if (remainingFunds > 0) {
      setFeedback({ text: 'Asigna todo el capital disponible', color: '#EF4444' });
      setTimeout(() => setFeedback(null), 1500);
      return;
    }

    setIsEvaluating(true);
    if (currentRiskLabel === targetRisk) {
      setFeedback({ text: `ESTRATEGIA ${targetRisk.toUpperCase()} LOGRADA`, color: '#4ADE80' });
      setTimeout(() => onComplete(true, 1000), 1500);
    } else {
      setFeedback({ text: `RIESGO EQUIVOCADO. Eres ${currentRiskLabel}`, color: '#EF4444' });
      setTimeout(() => onComplete(false, 0), 2000);
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
      title="Gestor de Portafolio"
      duration={30}
      onTimeUp={handleTimeUp}
      onClose={onClose}
    >
      <View style={S.targetContainer}>
        <Text style={S.targetSub}>TU OBJETIVO ES ARMAR UN PORTAFOLIO:</Text>
        <Text style={[S.targetRisk, { color: targetRisk === 'Conservador' ? '#22c55e' : (targetRisk === 'Moderado' ? Colors.accent : '#a855f7') }]}>
          {targetRisk.toUpperCase()}
        </Text>
      </View>

      <View style={S.capitalRow}>
        <View style={S.capItem}>
          <Text style={S.capLabel}>RESTANTE:</Text>
          <Text style={[S.capVal, remainingFunds > 0 && { color: Colors.accent }]}>${remainingFunds}</Text>
        </View>
        <View style={S.capItem}>
          <Text style={S.capLabel}>RIESGO ACTUAL:</Text>
          <Text style={S.capRisk}>{currentRiskLabel}</Text>
        </View>
      </View>

      <View style={S.assetsList}>
        {assets.map(asset => (
          <View key={asset.id} style={S.assetRow}>
            <View style={[S.colorPill, { backgroundColor: asset.color }]} />
            <View style={S.assetInfo}>
              <Text style={S.assetName}>{asset.name}</Text>
              <Text style={S.assetVal}>${asset.amount}</Text>
            </View>
            <View style={S.controls}>
               <TouchableOpacity style={S.ctrlBtn} onPress={() => updateAsset(asset.id, -1000)}>
                  <Ionicons name="remove" size={18} color="#fff" />
               </TouchableOpacity>
               <TouchableOpacity style={S.ctrlBtn} onPress={() => updateAsset(asset.id, 1000)}>
                  <Ionicons name="add" size={18} color="#fff" />
               </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={S.confirmBtn} onPress={handleConfirm} disabled={isEvaluating}>
        <Text style={S.confirmBtnTxt}>CONFIRMAR DISTRIBUCIÓN</Text>
      </TouchableOpacity>

      {feedback && (
        <View style={S.feedbackBox}>
          <Text style={[S.feedbackTxt, { color: feedback.color }]}>{feedback.text}</Text>
        </View>
      )}
    </BasePuzzleModal>
  );
};

const S = StyleSheet.create({
  targetContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  targetSub: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  targetRisk: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 4,
  },
  capitalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  capItem: {
    flex: 1,
    alignItems: 'center',
  },
  capLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '900',
  },
  capVal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  capRisk: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  assetsList: {
    gap: 12,
    marginBottom: 24,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  colorPill: {
    width: 6,
    height: 30,
    borderRadius: 3,
    marginRight: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
  },
  assetVal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  ctrlBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  feedbackBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackTxt: {
    fontSize: 13,
    fontWeight: '900',
  }
});
