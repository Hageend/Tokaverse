import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Modal, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';
import Ruleta, { SpinReward } from '../../components/navigation/Ruleta';
import CartaRecompensa from '../../components/navigation/CartaRecompensa';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// ─── API URL Helper ──────────────────────────────────────────────────────
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
    return 'http://localhost:3000';
  }
  return `http://${host}:3000`;
};

const API_URL = getApiUrl();
const USER_ID = 1;

export default function SpinsScreen() {
  const [rewards, setRewards] = useState<SpinReward[]>([]);
  const [availableSpins, setAvailableSpins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastReward, setLastReward] = useState<SpinReward | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch rewards ──────────────────────────────────────────────────
  const fetchRewards = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/spins/${USER_ID}/rewards`);
      if (!res.ok) throw new Error('Error cargando recompensas');
      const data = await res.json();
      setRewards(data.rewards);
      setAvailableSpins(data.availableSpins);
    } catch (e: any) {
      console.error('fetchRewards error:', e);
      setError(e.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  // ── Spin handler ───────────────────────────────────────────────────
  const handleSpin = async (): Promise<{ reward: SpinReward; remainingSpins: number } | null> => {
    try {
      setLastReward(null);
      setShowModal(false);
      const res = await fetch(`${API_URL}/spins/${USER_ID}/spin`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Error al girar');
        return null;
      }
      const data = await res.json();
      setAvailableSpins(data.remainingSpins);

      // Show modal after animation completes
      setTimeout(() => {
        setLastReward(data.reward);
        setShowModal(true);
      }, 6200);

      return data;
    } catch (e: any) {
      console.error('Spin error:', e);
      setError(e.message || 'Error de conexión');
      return null;
    }
  };

  // ── Claim handler ──────────────────────────────────────────────────
  const handleClaim = () => {
    setShowModal(false);
    setLastReward(null);
    // Refresh spin data
    fetchRewards();
  };

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando ruleta...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.title}>
            Ruleta <Text style={{ color: '#FDE047' }}>TOKA</Text>
          </Text>
          <Text style={styles.subtitle}>
            Arrastra la rueda o toca GIRAR para descubrir tu recompensa épica.
          </Text>
        </Animated.View>

        {/* Spin balance */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.spinsBadge}>
          <Ionicons name="ticket-outline" size={18} color="#FDE047" />
          <Text style={styles.spinsText}>
            {availableSpins} giro{availableSpins !== 1 ? 's' : ''} disponible{availableSpins !== 1 ? 's' : ''}
          </Text>
        </Animated.View>

        {/* Error banner */}
        {error && (
          <Pressable style={styles.errorBox} onPress={() => setError(null)}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorDismiss}>Tocar para cerrar</Text>
          </Pressable>
        )}

        {/* Wheel */}
        {rewards.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Ruleta
              rewards={rewards}
              disabled={availableSpins <= 0}
              onSpin={handleSpin}
            />
          </Animated.View>
        )}

        {/* No spins notice */}
        {availableSpins <= 0 && !lastReward && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.noSpinsBox}>
            <Ionicons name="sad-outline" size={24} color="#94A3B8" />
            <Text style={styles.noSpinsText}>
              ¡No tienes giros! Completa misiones para obtener más.
            </Text>
          </Animated.View>
        )}

        <View style={styles.footerSpacing} />
      </ScrollView>

      {/* ━━ REWARD MODAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Modal visible={showModal} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          {/* Scrim */}
          <Pressable style={styles.modalScrim} onPress={handleClaim} />

          {/* Sparkle decorations */}
          <Animated.View entering={FadeIn.delay(200)} style={styles.sparkleContainer}>
            {['✦', '✧', '⭐', '✨', '💫', '✦'].map((s, i) => (
              <Text
                key={i}
                style={[
                  styles.sparkle,
                  {
                    top: `${15 + Math.random() * 70}%`,
                    left: `${5 + Math.random() * 90}%`,
                    fontSize: 14 + Math.random() * 18,
                    opacity: 0.3 + Math.random() * 0.5,
                  },
                ]}
              >
                {s}
              </Text>
            ))}
          </Animated.View>

          {/* Card */}
          <View style={styles.modalContent}>
            {lastReward && (
              <CartaRecompensa reward={lastReward} onClaim={handleClaim} />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },
  spinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(253, 224, 71, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  spinsText: {
    color: '#FDE047',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#FCA5A5',
    textAlign: 'center',
    fontSize: 13,
  },
  errorDismiss: {
    color: 'rgba(252,165,165,0.5)',
    fontSize: 11,
    marginTop: 4,
  },
  noSpinsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  noSpinsText: {
    color: '#94A3B8',
    fontSize: 13,
    flex: 1,
  },
  footerSpacing: {
    height: 100,
  },
  hintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // ── Modal styles ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
  },
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
    color: '#FDE047',
  },
  modalContent: {
    width: '90%',
    maxWidth: 380,
    zIndex: 10,
  },
});
