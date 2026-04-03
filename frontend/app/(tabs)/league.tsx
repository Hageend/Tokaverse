import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { Colors } from '../../constants/Colors';
import { io, Socket } from 'socket.io-client';
import LottieView from 'lottie-react-native';
import Constants from 'expo-constants';
import { LeagueRanking } from '../../components/league/LeagueRanking';

interface UserProfile {
  id: string;
  xp: number;
  level: number;
}

interface League {
  id: string;
  name: string;
  description: string;
  tier: 'cobre' | 'plata' | 'oro' | 'estrella';
  level: number;
  minLevel: number;
  users: string[];
  ranking: UserLeagueStats[];
  endDate?: number;
}

interface UserLeagueStats {
  userId: string;
  leagueId: string;
  points: number;
  position: number;
  rewards: string[];
  xp?: number;
  xpToNext?: number;
}

const LEAGUE_ASSETS: Record<string, any> = {
  cobre: require('../../assets/images/coin_cobre.png'),
  plata: require('../../assets/images/coin_plata.png'),
  oro: require('../../assets/images/coin_oro.png'),
  estrella: require('../../assets/images/coin_estrella.png')
};

const USER_ID = 'user_123'; // Usuario Simulado

const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  let host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
    return 'http://localhost:3000';
  }
  return `http://${host}:3000`;
};

const API_URL = getApiUrl();

const QUESTS = [
  { id: 'q_despensa', name: '🛒 Compras de Despensa', points: 100 },
  { id: 'q_combustible', name: '⛽ Carga de Gasolina', points: 150 },
  { id: 'q_connect', name: '📋 Comprobación de Gasto', points: 200 },
  { id: 'q_total', name: '💰 Dispersión Recibida', points: 300 }
];

export default function LeagueScreen() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
  
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});
  const confettiRef = useRef<LottieView>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const handleNetworkError = (err: any) => {
    console.error('Network Error:', err);
    Alert.alert(
      'Fallo de Red Local',
      `No se pudo alcanzar el backend alojado en:\n${API_URL}\n\nSi estás probando desde un celular, revisa tu conexión o el Firewall local.`
    );
  };

  const fetchInitialData = async () => {
    try {
      // 1. Cargar Perfil de Usuario
      const userRes = await fetch(`${API_URL}/users/${USER_ID}/profile`);
      if (userRes.ok) {
         setUserProfile(await userRes.json());
      }
      
      // 2. Cargar Ligas Guardadas
      const leagueRes = await fetch(`${API_URL}/leagues`);
      if (!leagueRes.ok) throw new Error('Servidor de Ligas falló');
      setLeagues(await leagueRes.json());

    } catch (err) {
      handleNetworkError(err);
      setLeagues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    // Sockets Reactivos Globales
    const socket = io(API_URL);
    socketRef.current = socket;

    socket.on('leagueUpdated', (updatedLeague: League) => {
      setLeagues(prevLeagues => 
        prevLeagues.map(l => l.id === updatedLeague.id ? updatedLeague : l)
      );
    });

    socket.on('userUpdated', (updatedProfile: UserProfile) => {
       if (updatedProfile.id === USER_ID) {
          setUserProfile(updatedProfile);
       }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimes: Record<string, string> = {};
      const now = Date.now();
      leagues.forEach(l => {
        if (l.endDate) {
          const diff = l.endDate - now;
          if (diff <= 0) {
            newTimes[l.id] = 'Torneo Finalizado';
          } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            newTimes[l.id] = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
          }
        }
      });
      setTimeRemaining(newTimes);
    }, 1000);
    return () => clearInterval(interval);
  }, [leagues]);

  const handleSimulateTransaction = async (amountXp: number, source: string) => {
    try {
      const res = await fetch(`${API_URL}/users/${USER_ID}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountXp, source })
      });
      const data = await res.json();
      if (!data.success) {
        Alert.alert('Aviso', data.message);
      } else if (data.msg) {
        Alert.alert('Tokaverse Info', data.msg);
      }
    } catch (err) {
      handleNetworkError(err);
    }
  };

  const handleJoin = async (leagueId: string) => {
    try {
      const res = await fetch(`${API_URL}/leagues/${leagueId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID })
      });
      const data = await res.json();
      if (!data.success) {
         Alert.alert('Alerta', data.message);
      }
    } catch (err) {
      handleNetworkError(err);
    }
  };

  const handleCompleteQuest = async (leagueId: string, questId: string, points: number) => {
    try {
      const res = await fetch(`${API_URL}/leagues/${leagueId}/quests/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, questId })
      });
      const data = await res.json();
      if (!data.success) {
        Alert.alert('Aviso', data.message);
      } else {
        Alert.alert('Éxito', data.message);
      }
    } catch (err) {
      handleNetworkError(err);
    }
  };

  const handleResolveTournament = async (leagueId: string) => {
    try {
      const res = await fetch(`${API_URL}/leagues/${leagueId}/resolve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        confettiRef.current?.play();
      }
    } catch (err) {
      handleNetworkError(err);
    }
  };

  if (loading || !userProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // XP Progress Calculation logic for UI 
  // Nivel 1: Ronin (0 -> 2.5k), Nivel 2: Genin (2.5k -> 10k), Nivel 3: Chunin (10k -> 35k), Nivel 4: Jonin (MAX)
  const XP_THRESHOLDS = [0, 2500, 10000, 35000, 100000];
  const currentThreshold = XP_THRESHOLDS[userProfile.level] || 35000;
  const prevThreshold = XP_THRESHOLDS[userProfile.level - 1] || 0;
  const progressPercent = userProfile.level >= 4 ? 100 : Math.min(100, Math.floor(((userProfile.xp - prevThreshold) / (currentThreshold - prevThreshold)) * 100));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {showConfetti && (
        <View style={styles.confettiOverlay} pointerEvents="none">
          <LottieView
            ref={confettiRef}
            source={require('../../assets/confetti.json')}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>TOKA LIGAS</Text>
        <Text style={styles.subtitle}>Supera misiones, sube de nivel y reclama la gloria.</Text>
        
        {/* --- GLOBAL XP BAR COMPONENT --- */}
        <View style={styles.xpCard}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
             <Text style={styles.xpTitle}>Tú Nivel Global: {userProfile.level}</Text>
             <Text style={styles.xpAmount}>{userProfile.xp} XP</Text>
           </View>
           
           <View style={styles.progressBarBg}>
               <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
           </View>
           <Text style={styles.xpThresholdCaption}>Faltan {Math.max(0, currentThreshold - userProfile.xp)} XP para el próximo nivel.</Text>

           {/* TRANSACTION SIMULATORS (Toka Products) */}
           <View style={styles.transactionHub}>
               <TouchableOpacity style={styles.txnButton} onPress={() => handleSimulateTransaction(100, 'Toka Despensa')}>
                   <Text style={styles.txnBtnText}>🛍 Compra Despensa (+100 XP)</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.txnButton, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }]} onPress={() => handleSimulateTransaction(150, 'Toka Combustible')}>
                   <Text style={[styles.txnBtnText, { color: '#60A5FA' }]}>⛽ Carga Gasolina (+150 XP)</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.txnButton, { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }]} onPress={() => handleSimulateTransaction(200, 'Toka Connect')}>
                   <Text style={[styles.txnBtnText, { color: '#C084FC' }]}>📋 Gasto Comprobado (+200 XP)</Text>
               </TouchableOpacity>
           </View>
        </View>

        {leagues.length === 0 ? (
          <Text style={styles.noLeagues}>No hay torneos disponibles.</Text>
        ) : (
          leagues.map((league) => {
            const isMember = league.users.includes(USER_ID);
            const myStats = league.ranking.find(r => r.userId === USER_ID);
            const isExpanded = expandedLeague === league.id;
            const isLocked = userProfile.level < league.minLevel;

            return (
              <View key={league.id} style={[styles.leagueCard, isLocked && styles.leagueLocked]}>
                
                {/* Timer Ribbon */}
                {league.endDate && !isLocked && (
                  <View style={styles.timerRibbon}>
                     <Text style={styles.timerRibbonText}>
                       ⏳ {timeRemaining[league.id] || "Calculando..."}
                     </Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  
                  {/* COIN MEDAL IMAGE */}
                  <View style={styles.coinWrapper}>
                     <Image 
                        source={LEAGUE_ASSETS[league.tier] || LEAGUE_ASSETS.cobre} 
                        style={styles.coinImage} 
                        resizeMode="contain" 
                     />
                  </View>

                  <View style={styles.leagueInfoContainer}>
                    <Text style={[styles.leagueName, isLocked && { color: Colors.textSecondary }]}>{league.name}</Text>
                    <Text style={styles.leagueLevel}>🏅 Requisito mínimo: nivel {league.minLevel}</Text>
                  </View>

                  {!isMember && (
                    <TouchableOpacity 
                       style={[styles.joinButton, isLocked && styles.joinButtonLocked]} 
                       onPress={() => handleJoin(league.id)}
                       disabled={isLocked}
                    >
                      <Text style={[styles.joinButtonText, isLocked && styles.joinTextLocked]}>
                        {isLocked ? '🔒 Bloqueado' : 'Unirse Ahora'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.leagueDesc}>{league.description}</Text>
                
                {/* Mis Estadísticas */}
                {isMember && myStats && (
                  <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Posición</Text>
                      <Text style={styles.statValue}>#{myStats.position}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Puntos</Text>
                      <Text style={styles.statValue}>{myStats.points}</Text>
                    </View>
                  </View>
                )}

                {/* Quests Internos */}
                {isMember && (
                  <View style={styles.questsContainer}>
                    <Text style={styles.questsTitle}>Misiones activas de la liga</Text>
                    {QUESTS.map(q => (
                      <TouchableOpacity 
                        key={q.id} 
                        style={styles.questRow}
                        onPress={() => handleCompleteQuest(league.id, q.id, q.points)}
                      >
                         <Text style={styles.questName}>{q.name}</Text>
                         <View style={styles.questBadge}>
                           <Text style={styles.questPts}>+{q.points} pt</Text>
                         </View>
                      </TouchableOpacity>
                    ))}
                    
                    <TouchableOpacity 
                      style={styles.toggleRankingButton} 
                      onPress={() => setExpandedLeague(isExpanded ? null : league.id)}
                    >
                      <Text style={styles.toggleRankingText}>
                        {isExpanded ? 'Ocultar Ranking' : 'Ver Tabla de Clasificación'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Tabla de Clasificación RPG */}
                {isExpanded && (
                  <LeagueRanking
                    ranking={league.ranking}
                    currentUserId={USER_ID}
                    tier={league.tier}
                    leagueId={league.id}
                    onResolve={handleResolveTournament}
                  />
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
    flexGrow: 1,
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 600,
    height: 600,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  xpCard: {
    width: '100%',
    backgroundColor: 'rgba(77,97,252,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(77,97,252,0.3)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24
  },
  xpTitle: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16
  },
  xpAmount: {
    color: Colors.accent,
    fontWeight: '900',
    fontSize: 16
  },
  progressBarBg: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 8
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 6
  },
  xpThresholdCaption: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    marginBottom: 16
  },
  transactionHub: {
    gap: 10,
    marginTop: 8
  },
  txnButton: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  txnBtnText: {
    color: '#4ADE80',
    fontWeight: '700',
    fontSize: 13
  },
  noLeagues: {
    color: Colors.textMuted,
    marginTop: 32,
    fontSize: 16,
  },
  leagueCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 26,
    width: '100%',
    shadowColor: Colors.glowPrimary,
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    position: 'relative'
  },
  leagueLocked: {
    opacity: 0.6,
    backgroundColor: '#1E1E24' // Color más gris/opaco
  },
  timerRibbon: {
     position: 'absolute',
     top: 0,
     right: 0,
     backgroundColor: 'rgba(249,115,22, 0.2)',
     paddingHorizontal: 16,
     paddingVertical: 4,
     borderBottomLeftRadius: 12,
     zIndex: 5
  },
  timerRibbonText: {
     color: Colors.accent,
     fontSize: 12,
     fontWeight: '800',
     letterSpacing: 0.5
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8
  },
  coinWrapper: {
    width: 50,
    height: 50,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinImage: {
    width: 55,
    height: 55,
  },
  leagueInfoContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  leagueName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  leagueLevel: {
    fontSize: 12,
    color: Colors.tertiary,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  joinButtonLocked: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  joinButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
  },
  joinTextLocked: {
    color: 'rgba(255,255,255,0.5)'
  },
  leagueDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    marginTop: 8
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  questsContainer: {
    gap: 12,
  },
  questsTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4
  },
  questRow: {
    backgroundColor: Colors.surfacePill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  questName: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14
  },
  questBadge: {
    backgroundColor: 'rgba(168,85,247,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16
  },
  questPts: {
    color: Colors.secondary,
    fontWeight: '800',
    fontSize: 12
  },
  toggleRankingButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    marginTop: 4
  },
  toggleRankingText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  rankingList: {
    marginTop: 4,
    paddingTop: 8,
  },
  rankingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  rankingRowActive: {
    backgroundColor: 'rgba(77,97,252,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderBottomWidth: 0,
  },
  rankingPos: {
    width: 35,
    fontWeight: '900',
    color: Colors.tertiary,
    fontSize: 16,
  },
  rankingUser: {
    flex: 1,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  rankingPoints: {
    fontWeight: '800',
    color: Colors.textPrimary,
    fontSize: 15,
  },
  adminButton: {
    marginTop: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  adminButtonText: {
    color: '#FCA5A5',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase'
  },
  rewardsSection: {
    marginTop: 16,
    backgroundColor: 'rgba(249,115,22,0.1)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
  },
  rewardsTitle: {
    fontWeight: '800',
    color: Colors.accent,
    marginBottom: 8,
    fontSize: 14,
  },
  rewardItem: {
    color: '#FFEED2',
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  }
});
