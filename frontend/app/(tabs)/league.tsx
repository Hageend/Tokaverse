import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Alert, Platform, Animated, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../../constants/Colors';
import { io, Socket } from 'socket.io-client';
import LottieView from '../../components/LottieWrapper';
import Constants from 'expo-constants';
import { LeagueRanking } from '../../components/league/LeagueRanking';
import { ProgressMap, MapNode, MapMission } from '../../components/league/ProgressMap';
import { LeagueJoinModal } from '../../components/league/LeagueJoinModal';

// ─── ESTILOS CONSOLIDADOS ────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 60,
    flexGrow: 1,
  },
  // -- Desktop Layout --
  webLayout: {
    flexDirection: 'row',
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
  },
  sidebar: {
    width: 380,
    padding: 24,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(15,23,42,0.3)',
  },
  mainPane: {
    flex: 1,
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // ── Hero Banner ──────────────────────────────────────────────
  heroBanner: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 1)', // Fondo slate oscuro
    borderWidth: 1.5,
    borderColor: 'rgba(77, 97, 252, 0.4)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4d61fc',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  heroBannerGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroBannerGrid2px: {
    width: 4, height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
    marginRight: 16,
    minHeight: 64,
  },
  heroBannerLeft: { flex: 1 },
  heroBannerRight: { marginLeft: 16 },
  heroBannerEyebrow: {
    fontSize: 10, fontWeight: '900',
    color: Colors.accent, letterSpacing: 2.5,
    textTransform: 'uppercase', marginBottom: 6,
  },
  heroBannerTitle: {
    fontSize: 28, fontWeight: '900',
    color: '#FFFFFF', letterSpacing: 1.2,
  },
  heroBannerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    lineHeight: 18,
  },
  levelBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 2.5, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOpacity: 0.3, shadowRadius: 10,
  },
  levelBadgeNum: {
    fontSize: 26, fontWeight: '900', color: '#FFFFFF',
  },
  levelBadgeLbl: {
    fontSize: 8, fontWeight: '800', color: Colors.accent, letterSpacing: 1.5,
  },
  // ── Hero Banner Image Mode (member) ─────────────────────────
  heroBannerImageRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20,
  },
  heroCoinWrap: {
    width: 90, height: 90,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  heroCoinLarge: { width: 88, height: 88 },
  heroCoinGlow: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(249,115,22,0.15)',
    shadowColor: '#f97316', shadowOpacity: 0.5, shadowRadius: 20,
  },
  levelBadgeInline: {
    marginTop: 8,
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(249,115,22,0.4)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  levelBadgeInlineTxt: {
    color: Colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1,
  },
  // ── Hero Banner CTA mode (non-member) ─────────────────────────
  heroBannerCTA: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 1)',
    borderWidth: 1.5, borderColor: 'rgba(77,97,252,0.4)',
    borderRadius: 24, padding: 24, marginBottom: 28,
    alignItems: 'center',
    shadowColor: '#4d61fc', shadowOpacity: 0.2, shadowRadius: 15, elevation: 8,
  },
  ctaTitle: {
    fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1, marginBottom: 8,
  },
  ctaSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20, marginBottom: 20,
  },
  ctaTierRow: {
    flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16,
  },
  ctaTierCoin: { width: 56, height: 56 },
  ctaHint: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '700',
  },
  xpRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  xpLabel: {
    fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.8)',
  },
  // ── Section Title ────────────────────────────────────────────
  sectionTitle: {
    fontSize: 14, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: 1, marginBottom: 16, marginTop: 12,
    textTransform: 'uppercase',
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    paddingLeft: 12,
  },
  // ── Txn Chips ────────────────────────────────────────────────
  txnGrid: {
    flexDirection: 'row', gap: 12, marginBottom: 28,
  },
  txnGridDesktop: {
    flexDirection: 'column',
  },
  txnChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5, borderRadius: 18,
    paddingVertical: 18, paddingHorizontal: 10,
    alignItems: 'center', gap: 8,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  txnChipDesktop: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  },
  txnChipEmoji: { fontSize: 26 },
  txnChipTxt: {
    fontSize: 11, fontWeight: '800', textAlign: 'center', lineHeight: 15,
  },
  txnChipTxtDesktop: {
    textAlign: 'left',
  },
  // ── Member badge ─────────────────────────────────────────────
  memberBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)',
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10,
  },
  memberBadgeTxt: {
    color: '#4ADE80', fontSize: 10, fontWeight: '900', letterSpacing: 1,
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
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    position: 'relative'
  },
  leagueLocked: {
    opacity: 0.7,
    backgroundColor: '#0f172a'
  },
  timerRibbon: {
     position: 'absolute',
     top: 0,
     right: 0,
     backgroundColor: 'rgba(245, 158, 11, 0.15)',
     paddingHorizontal: 18,
     paddingVertical: 6,
     borderBottomLeftRadius: 16,
     zIndex: 5,
     borderLeftWidth: 1, borderBottomWidth: 1,
     borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  timerRibbonText: {
     color: Colors.accent,
     fontSize: 13,
     fontWeight: '900',
     letterSpacing: 0.6
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10
  },
  coinWrapper: {
    width: 60,
    height: 60,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 30,
  },
  coinImage: {
    width: 64,
    height: 64,
  },
  leagueInfoContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  leagueName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  leagueLevel: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 12,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 8,
  },
  joinButtonLocked: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  joinButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  joinTextLocked: {
    color: 'rgba(255,255,255,0.4)'
  },
  leagueDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    marginTop: 10
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    justifyContent: 'space-around',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.04)',
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
  // 1. Prioridad: Variable de entorno explícita
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  
  // 2. Detección automática de Expo
  const debuggerHost = Constants.expoConfig?.hostUri;
  const address = debuggerHost?.split(':')[0];
  if (address && address !== 'localhost' && address !== '127.0.0.1') {
    return `http://${address}:3000`;
  }
  
  // 3. Fallbacks robustos por IP local (detectados en tu PC)
  if (Platform.OS !== 'web') {
    return 'http://192.168.1.78:3000'; // IP Local Principal
  }
  
  return 'http://localhost:3000';
};

const API_URL = getApiUrl();

const QUESTS = [
  { id: 'q_despensa', name: '🛒 Compra TokaDespensa', points: 100 },
  { id: 'q_digital',   name: '📺 Pago Suscripción',    points: 150 },
  { id: 'q_connect',   name: '📋 Validar Ticket Fiscal', points: 200 },
  { id: 'q_total',     name: '💰 Abono de Nómina',     points: 300 }
];

const MAP_NODES: MapNode[] = [
  { id: 1, label: 'Inicio',      icon: '🏠', x: 170, y: 390, state: 'done'   },
  { id: 2, label: 'Primer pago', icon: '💳', x: 255, y: 330, state: 'done'   },
  { id: 3, label: 'Despensa',    icon: '🛒', x: 130, y: 275, state: 'done'   },
  { id: 4, label: 'Streaming',   icon: '📺', x: 230, y: 215, state: 'active' },
  { id: 5, label: 'Boss',        icon: '⚔️', x: 120, y: 160, state: 'locked' },
  { id: 6, label: 'Nómina',      icon: '💰', x: 240, y: 100, state: 'locked' },
  { id: 7, label: 'Leyenda',     icon: '👑', x: 170, y: 44,  state: 'locked' },
];

const LEAGUE_MISSIONS: MapMission[] = [
  { id: 'm1', icon: '💳', name: 'Ingresa $100 MXN',              xp: 50,  done: true  },
  { id: 'm2', icon: '🛒', name: 'Realiza 3 compras con TokaPay', xp: 150, done: false },
  { id: 'm3', icon: '📺', name: 'Paga una suscripción digital',  xp: 120, done: false },
  { id: 'm4', icon: '⚔️', name: 'Derrota a un boss',             xp: 500, done: false },
  { id: 'm5', icon: '💰', name: 'Recibe tu nómina en TokaPay',   xp: 300, done: false },
];

export default function LeagueScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [leagues, setLeagues] = useState<League[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
  
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});
  const confettiRef = useRef<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [joinedLeague, setJoinedLeague] = useState<League | null>(null);
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
      } else {
        // Mostrar animación de bienvenida
        const league = leagues.find(l => l.id === leagueId);
        if (league) setJoinedLeague(league);
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
      <View style={[S.container, { justifyContent: 'center', alignItems: 'center' }]}>
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
  const isMemberOfAny = leagues.some(l => l.users.includes(USER_ID));

  const renderHeroBanner = () => (
    isMemberOfAny ? (
      <View style={S.heroBanner}>
        <View style={S.heroBannerImageRow}>
          <View style={S.heroCoinWrap}>
            <Image
              source={LEAGUE_ASSETS[leagues.find(l => l.users.includes(USER_ID))?.tier ?? 'cobre']}
              style={S.heroCoinLarge}
              contentFit="contain"
            />
            <View style={S.heroCoinGlow} />
          </View>
          <View style={S.heroBannerLeft}>
            <Text style={S.heroBannerEyebrow}>LIGA ACTIVA</Text>
            <Text style={S.heroBannerTitle} numberOfLines={1}>
              {leagues.find(l => l.users.includes(USER_ID))?.name ?? 'TOKA LIGAS'}
            </Text>
            <Text style={S.heroBannerSub}>Supera misiones · Sube de nivel</Text>
            <View style={S.levelBadgeInline}>
              <Text style={S.levelBadgeInlineTxt}>NIV. {userProfile.level}</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={S.xpLabel}>XP {userProfile.xp.toLocaleString()}</Text>
          <Text style={S.xpLabel}>{currentThreshold.toLocaleString()}</Text>
        </View>
        <View style={S.progressBarBg}>
          <Animated.View style={[S.progressBarFill, { width: `${progressPercent}%` as any }]} />
        </View>
        <Text style={S.xpThresholdCaption}>
          Faltan {Math.max(0, currentThreshold - userProfile.xp).toLocaleString()} XP para el próximo rango
        </Text>
      </View>
    ) : (
      <View style={S.heroBannerCTA}>
        <Text style={S.ctaTitle}>🏆 TOKA LIGAS</Text>
        <Text style={S.ctaSub}>¡Únete a una liga, completa misiones y sube de rango!</Text>
        <View style={S.ctaTierRow}>
          {(['cobre', 'plata', 'oro', 'estrella'] as const).map(tier => (
            <Image key={tier} source={LEAGUE_ASSETS[tier]} style={S.ctaTierCoin} contentFit="contain" />
          ))}
        </View>
        <Text style={S.ctaHint}>👇 Selecciona una liga abajo para comenzar</Text>
      </View>
    )
  );

  const renderQuickMissions = () => isMemberOfAny && (
    <>
      <Text style={S.sectionTitle}>⚡ Misiones Rápidas</Text>
      <View style={[S.txnGrid, isDesktop && S.txnGridDesktop]}>
        <TouchableOpacity style={[S.txnChip, isDesktop && S.txnChipDesktop, { borderColor: 'rgba(34,197,94,0.4)' }]} onPress={() => handleSimulateTransaction(100, 'Toka Despensa')}>
          <Text style={S.txnChipEmoji}>🛍</Text>
          <Text style={[S.txnChipTxt, isDesktop && S.txnChipTxtDesktop, { color: '#4ADE80' }]}>Despensa{'\n'}+100 XP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.txnChip, isDesktop && S.txnChipDesktop, { borderColor: 'rgba(59,130,246,0.4)' }]} onPress={() => handleSimulateTransaction(150, 'Suscripción Digital')}>
          <Text style={S.txnChipEmoji}>📺</Text>
          <Text style={[S.txnChipTxt, isDesktop && S.txnChipTxtDesktop, { color: '#60A5FA' }]}>Streaming{'\n'}+150 XP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.txnChip, isDesktop && S.txnChipDesktop, { borderColor: 'rgba(168,85,247,0.4)' }]} onPress={() => handleSimulateTransaction(200, 'Toka Connect')}>
          <Text style={S.txnChipEmoji}>📋</Text>
          <Text style={[S.txnChipTxt, isDesktop && S.txnChipTxtDesktop, { color: '#C084FC' }]}>Validación{'\n'}+200 XP</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderProgressMap = () => isMemberOfAny && (
    <>
      <Text style={S.sectionTitle}>🗺️ Mapa de Progreso</Text>
      <ProgressMap
        nodes={MAP_NODES}
        missions={LEAGUE_MISSIONS}
        xpPercent={progressPercent}
        leagueName={leagues.find(l => l.users.includes(USER_ID))?.name ?? 'BRONCE MÍTICO'}
        xpLabel={`${userProfile.xp} / ${currentThreshold} XP`}
        onMissionComplete={(id) => console.log('Mission done:', id)}
      />
    </>
  );

  const renderLeagues = () => (
    <>
      <Text style={S.sectionTitle}>🏆 Ligas Activas</Text>
      {leagues.length === 0 ? (
        <Text style={S.noLeagues}>No hay torneos disponibles.</Text>
      ) : (
        leagues.map((league) => {
          const isMember   = league.users.includes(USER_ID);
          const myStats    = league.ranking.find(r => r.userId === USER_ID);
          const isExpanded = expandedLeague === league.id;
          const isLocked   = userProfile.level < league.minLevel;

          return (
            <View key={league.id} style={[S.leagueCard, isLocked && S.leagueLocked]}>
              {league.endDate && !isLocked && (
                <View style={S.timerRibbon}>
                  <Text style={S.timerRibbonText}>⏳ {timeRemaining[league.id] || 'Calculando...'}</Text>
                </View>
              )}
              <View style={S.cardHeader}>
                <View style={S.coinWrapper}>
                  <Image source={LEAGUE_ASSETS[league.tier] || LEAGUE_ASSETS.cobre} style={S.coinImage} contentFit="contain" />
                </View>
                <View style={S.leagueInfoContainer}>
                  <Text style={[S.leagueName, isLocked && { color: Colors.textSecondary }]}>{league.name}</Text>
                  <Text style={S.leagueLevel}>🏅 Req. nivel {league.minLevel}</Text>
                </View>
                {!isMember && (
                  <TouchableOpacity
                    style={[S.joinButton, isLocked && S.joinButtonLocked]}
                    onPress={() => handleJoin(league.id)}
                    disabled={isLocked}
                  >
                    <Text style={[S.joinButtonText, isLocked && S.joinTextLocked]}>
                      {isLocked ? '🔒' : 'Unirse'}
                    </Text>
                  </TouchableOpacity>
                )}
                {isMember && (
                  <View style={S.memberBadge}>
                    <Text style={S.memberBadgeTxt}>✓ MIEMBRO</Text>
                  </View>
                )}
              </View>

              <Text style={S.leagueDesc}>{league.description}</Text>

              {isMember && myStats && (
                <View style={S.statsContainer}>
                  <View style={S.statBox}>
                    <Text style={S.statLabel}>POSICIÓN</Text>
                    <Text style={S.statValue}>#{myStats.position}</Text>
                  </View>
                  <View style={[S.statBox, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.06)', paddingLeft: 20 }]}>
                    <Text style={S.statLabel}>PUNTOS</Text>
                    <Text style={S.statValue}>{myStats.points}</Text>
                  </View>
                </View>
              )}

              {isMember && (
                <View style={S.questsContainer}>
                  <Text style={S.questsTitle}>Misiones de liga</Text>
                  {QUESTS.map(q => (
                    <TouchableOpacity
                      key={q.id}
                      style={S.questRow}
                      onPress={() => handleCompleteQuest(league.id, q.id, q.points)}
                    >
                      <Text style={S.questName}>{q.name}</Text>
                      <View style={S.questBadge}>
                        <Text style={S.questPts}>+{q.points}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={S.toggleRankingButton}
                    onPress={() => setExpandedLeague(isExpanded ? null : league.id)}
                  >
                    <Text style={S.toggleRankingText}>
                      {isExpanded ? '▲ Ocultar Ranking' : '▼ Ver Tabla de Clasificación'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

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
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <LeagueJoinModal
        visible={joinedLeague !== null}
        leagueName={joinedLeague?.name ?? ''}
        tier={(joinedLeague?.tier ?? 'cobre') as any}
        onClose={() => setJoinedLeague(null)}
      />
      {showConfetti && Platform.OS !== 'web' && LottieView && (
        <View style={S.confettiOverlay} pointerEvents="none">
          <LottieView
            ref={confettiRef}
            source={require('../../assets/confetti.json')}
            autoPlay loop={false} style={S.lottie}
          />
        </View>
      )}

      {isDesktop ? (
        <View style={S.webLayout}>
          {/* SIDEBAR */}
          <View style={S.sidebar}>
            <ScrollView showsVerticalScrollIndicator={Platform.OS === 'web'}>
              {renderHeroBanner()}
              {renderQuickMissions()}
            </ScrollView>
          </View>
          {/* MAIN PANE */}
          <View style={S.mainPane}>
            <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={Platform.OS === 'web'}>
              {renderProgressMap()}
              <View style={{ marginTop: 24 }}>
                {renderLeagues()}
              </View>
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView style={S.container} contentContainerStyle={S.content} showsVerticalScrollIndicator={Platform.OS === 'web'}>
          {renderHeroBanner()}
          {renderQuickMissions()}
          {renderProgressMap()}
          {renderLeagues()}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}
