import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Text, StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Alert, Platform, Animated, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../../constants/Colors';
import { io, Socket } from 'socket.io-client';
import LottieView from '../../components/LottieWrapper';
import Constants from 'expo-constants';
import { LeagueRanking } from '../../components/league/LeagueRanking';
import { ProgressMap, MapMission } from '../../components/league/ProgressMap';
import { MapNode, WorldZone, ISLANDS_DB, ISLANDS_DATA, Island } from '../../data/islands';
import { LeagueJoinModal } from '../../components/league/LeagueJoinModal';
import { DetailedIslandMap } from '../../components/league/DetailedIslandMap';
import { ProceduralContent } from '../../utils/ProceduralContent';
import { usePlayerStore } from '../../store/usePlayerStore';
import { WeatherBanner } from '../../components/ui/WeatherBanner';
import { EnemyAlmanaque } from '../../components/quest/EnemyAlmanaque';
import { AdventurerCodex } from '../../components/quest/AdventurerCodex';
import { Ionicons } from '@expo/vector-icons';
import UnifiedCombatScreen from '../../components/UnifiedCombatScreen';
import FusionPreCombat from '../../components/FusionPreCombat';
import { BossEngine } from '../../engine/BossEngine';
import { CLASS_FIGHTERS } from '../../data/classSkills';
import type { ClassKey } from '../../data/classSkills';
import { Boss, Fighter } from '../../types/combat';
import type { PlayerCard } from '../../types/fusion';


// ─── ESTILOS CONSOLIDADOS ────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 60,
    flexGrow: 1,
  },
  
  // -- Boss Preview Section --
  bossPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  bossPreviewGridDesktop: {
    gap: 16,
  },
  gridSectionFull: { width: '100%' },
  sectionSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  bossMiniCard: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  bossMiniCardDesktop: {
    padding: 12,
  },
  bossMiniSprite: {
    width: 32, height: 32, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4
  },
  bossMiniName: {
    color: '#fff', fontSize: 12, fontWeight: 'bold'
  },
  bossMiniAmt: {
    color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800'
  },
  miniBadge: {
    paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, borderWidth: 1
  },
  allBossesBtn: {
    backgroundColor: 'rgba(249,115,22,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.4)',
  },
  allBossesBtnTxt: {
    color: '#F97316', fontSize: 11, fontWeight: '800', textTransform: 'uppercase'
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
  },
  // -- Island Navigation Grid --
  islandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  islandCard: {
    width: '48%',
    backgroundColor: '#1a2234',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  islandMiniImg: {
    width: '100%',
    height: 100,
  },
  islandCardContent: {
    padding: 10,
  },
  islandCardName: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 8,
  },
  islandProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  islandProgressTxt: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
  },
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
  const [showAlmanaque, setShowAlmanaque] = useState(false);
  const [showCodex, setShowCodex] = useState(false); // TIENDA Y CÓDICE
  const socketRef = useRef<Socket | null>(null);
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);

  // -- Combat State --
  const { charClass, level, xp } = usePlayerStore(); // FUENTE DE VERDAD
  const currentClass = CLASS_FIGHTERS[charClass as ClassKey] || CLASS_FIGHTERS['warrior'];
  const [inCombat, setInCombat]          = useState(false);

  const [inPreCombat, setInPreCombat]    = useState(false);
  const [activeBoss, setActiveBoss]      = useState<Boss | null>(null);
  const [activeFighter, setActiveFighter] = useState<Fighter | null>(null);
  const [selectedCards, setSelectedCards] = useState<PlayerCard[]>([]);
  const [worldZones, setWorldZones]      = useState<WorldZone[]>([]);

  const DEMO_BOSSES = useMemo(() => {
    const extracted: any[] = [];
    ISLANDS_DB.forEach(zone => {
        zone.nodes.forEach(node => {
            if (node.type === 'boss' && node.boss) {
                extracted.push({
                    ...node.boss,
                    id: node.id,
                    type: node.bossType || (node.boss as any).bossType,
                    label: node.boss.name,
                    amount: node.id * 2000, 
                    daysOverdue: Math.floor(Math.random() * 30),
                    difficulty: 'Rank ' + node.id,
                    diffColor: '#F97316'
                });
            }
        });
    });
    return extracted;
  }, []);

  useEffect(() => {
    if (userProfile?.level) {
      setWorldZones(ISLANDS_DB); // Uso de la BD estática maestra de Master Plan
    }
  }, [userProfile?.level]);

  const handleBossFight = (node: MapNode) => {
    if (!node.boss) return;
    const boss = BossEngine.generateFromDebt({ 
      id: `map_boss_${node.id}`, 
      type: node.boss.bossType as any,
      amount: node.id * 2000, 
      daysOverdue: 10 
    });

    const fighter = currentClass; // Ya lo tenemos calculado arriba del componente
    setActiveBoss(boss);
    setActiveFighter({ ...fighter, name: currentClass.name });
    setInPreCombat(true);
  };

  const startCombat = (cards: PlayerCard[]) => {
    setSelectedCards(cards);
    setInPreCombat(false);
    setInCombat(true);
  };


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
      const userRes = await fetch(`${API_URL}/users/${USER_ID}/profile`).catch(() => null);
      if (userRes && userRes.ok) {
         setUserProfile(await userRes.json());
      } else {
         setUserProfile({ id: USER_ID, xp: 1250, level: 1 }); // Fallback Local
      }
      
      // 2. Cargar Ligas Guardadas con AbortController para Timeout
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500); // 1.5s timeout
      const leagueRes = await fetch(`${API_URL}/leagues`, { signal: controller.signal }).catch(() => null);
      clearTimeout(id);

      if (leagueRes && leagueRes.ok) {
        setLeagues(await leagueRes.json());
      } else {
        // Fallback de red: Ligas Mock (Entrenamiento Cobre)
        setLeagues([{
          id: 'l_mock_1',
          name: 'Liga Toka Cobre (Mock)',
          description: 'Servidor no detectado. Modo de entrenamiento local activo.',
          tier: 'cobre',
          level: 1, minLevel: 1,
          users: [USER_ID],
          ranking: [{ userId: USER_ID, leagueId: 'l_mock_1', points: 1500, position: 1, rewards: [] }]
        }]);
      }

    } catch (err) {
      console.warn('Network Error Fallback:', err);
      if (!userProfile) setUserProfile({ id: USER_ID, xp, level });
      setLeagues([{
        id: 'l_mock_1',
        name: 'Liga Toka Cobre (Mock)',
        description: 'Servidor no detectado. Modo de entrenamiento local activo.',
        tier: 'cobre',
        level: 1, minLevel: 1,
        users: [USER_ID],
        ranking: [{ userId: USER_ID, leagueId: 'l_mock_1', points: 1500, position: 1, rewards: [] }]
      }]);
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

  if (loading) {
    return (
      <View style={[S.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // Fallback si por alguna razón loading terminó pero no hay profile
  const profile = userProfile || { id: USER_ID, xp: 0, level: 0 };

  // XP Progress Calculation logic for UI 
  // Formula Base desde usePlayerStore: base=100, delta=1.15^N
  const XP_BASE = 100;
  const MAX_LEVEL = 250;
  const currentThreshold = Math.floor(XP_BASE * Math.pow(1.15, level - 1));
  const prevThreshold = level > 1 ? Math.floor(XP_BASE * Math.pow(1.15, level - 2)) : 0;
  const progressPercent = level >= MAX_LEVEL ? 100 : Math.min(100, Math.max(0, Math.floor(((xp - prevThreshold) / (currentThreshold - prevThreshold)) * 100)));
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
              <Text style={S.levelBadgeInlineTxt}>NIV. {level}</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={S.xpLabel}>XP {xp.toLocaleString()}</Text>
          <Text style={S.xpLabel}>{currentThreshold.toLocaleString()}</Text>
        </View>
        <View style={S.progressBarBg}>
          <Animated.View style={[S.progressBarFill, { width: `${progressPercent}%` as any }]} />
        </View>
        <Text style={S.xpThresholdCaption}>
          Faltan {Math.max(0, currentThreshold - xp).toLocaleString()} XP para el próximo rango
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
        <TouchableOpacity 
          style={[S.txnChip, isDesktop && S.txnChipDesktop, { borderColor: Colors.accent + '33', backgroundColor: Colors.accent + '11' }]} 
          onPress={() => setShowAlmanaque(true)}
        >
          <Ionicons name="book" size={24} color={Colors.accent} />
          <Text style={[S.txnChipTxt, isDesktop && S.txnChipTxtDesktop, { color: Colors.accent }]}>Almanaque{'\n'}Bestiario</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[S.txnChip, isDesktop && S.txnChipDesktop, { borderColor: '#FFD70044', backgroundColor: '#FFD70011' }]} 
          onPress={() => setShowCodex(true)}
        >
          <Ionicons name="diamond" size={24} color="#FFD700" />
          <Text style={[S.txnChipTxt, isDesktop && S.txnChipTxtDesktop, { color: '#FFD700' }]}>Mercader{'\n'}Códice</Text>
        </TouchableOpacity>
      </View>
    </>
  );


  const renderBossPreview = () => isMemberOfAny && (
    <View style={[{ marginTop: 24, marginBottom: 12 }, isDesktop && S.gridSectionFull]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View>
          <Text style={S.sectionTitle}>📕 Bestiario de Amenazas</Text>
          <Text style={S.sectionSub}>Conoce debilidades y drops</Text>
        </View>
        <TouchableOpacity style={S.allBossesBtn} onPress={() => setShowAlmanaque(true)}>
          <Text style={S.allBossesBtnTxt}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      <View style={[S.bossPreviewGrid, isDesktop && S.bossPreviewGridDesktop]}>
        {DEMO_BOSSES.slice(0, isDesktop ? 4 : 2).map((b: any, i: number) => (
          <TouchableOpacity 
            key={i} 
            style={[S.bossMiniCard, isDesktop && S.bossMiniCardDesktop]} 
            onPress={() => {
              const boss = BossEngine.generateFromDebt({ 
                  id: `map_boss_${b.id}`, 
                  type: b.type as any,
                  amount: b.amount, 
                  daysOverdue: b.daysOverdue 
              });
              setActiveBoss(boss);
              setActiveFighter({ ...currentClass, name: currentClass.name });
              setInPreCombat(true);
            }}
          >
            {b.sprite ? (
              <Image source={b.sprite} style={S.bossMiniSprite} contentFit="contain" />
            ) : (
              <Text style={{ fontSize: 24, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>{b.icon || '👾'}</Text>
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={S.bossMiniName} numberOfLines={1}>{b.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={[S.miniBadge, { backgroundColor: b.diffColor + '22', borderColor: b.diffColor + '55', borderWidth: 1 }]}>
                  <Text style={{ color: b.diffColor, fontSize: 8, fontWeight: '700' }}>{b.difficulty}</Text>
                </View>
                <Text style={S.bossMiniAmt}>${b.amount.toLocaleString()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderIslandGrid = () => (
    <View style={{ marginTop: 24, marginBottom: 20 }}>
      <Text style={S.sectionTitle}>🗺️ Navegación de Mundos</Text>
      <Text style={S.sectionSub}>Selecciona una isla para ver el mapa detallado</Text>
      
      <View style={S.islandGrid}>
        {ISLANDS_DATA.map((island) => {
          const progress = (island.completedMissions / island.totalMissions) * 100;
          return (
            <TouchableOpacity 
              key={island.id} 
              style={S.islandCard}
              onPress={() => setSelectedIsland(island)}
              activeOpacity={0.8}
            >
              <Image source={island.miniImage} style={S.islandMiniImg} contentFit="cover" />
              <View style={S.islandCardContent}>
                <Text style={S.islandCardName}>{island.name}</Text>
                <View style={S.islandProgressRow}>
                  <View style={S.miniProgressBar}>
                    <View style={[S.miniProgressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={S.islandProgressTxt}>{island.completedMissions}/{island.totalMissions}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderProgressMap = () => isMemberOfAny && (
    <>
      <Text style={S.sectionTitle}>🗺️ Mapa de Progreso</Text>
      <ProgressMap
        zones={worldZones}
        missions={LEAGUE_MISSIONS}
        xpPercent={progressPercent}
        leagueName={leagues.find(l => l.users.includes(USER_ID))?.name ?? 'BRONCE MÍTICO'}
        xpLabel={`${xp} / ${currentThreshold} XP`}
        onMissionComplete={(id) => {
          handleSimulateTransaction(150, `Nodo ${id} explorado`);
        }}
        onBossFight={handleBossFight}
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
          const isLocked   = profile.level < league.minLevel;

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
      <EnemyAlmanaque 
        visible={showAlmanaque} 
        onClose={() => setShowAlmanaque(false)} 
        onSelectBoss={(b) => {
          setShowAlmanaque(false);
          if (b.hp) { // Arena Mob (no map node)
            const bossAdapter = BossEngine.generateFromDebt({ 
                id: `arena_bot_${b.id}`, 
                type: 'abyss', // generic
                amount: b.hp * 10, 
                daysOverdue: 15 
            });
            bossAdapter.name = b.name;
            bossAdapter.maxHp = b.maxHp || b.hp;
            bossAdapter.hp = b.hp;
            // Opcional: bossAdapter.sprite = b.sprite_path // si aplica

            setActiveBoss(bossAdapter);
            setActiveFighter({ ...currentClass, name: currentClass.name });
            setInPreCombat(true);
          } else { // Boss (from map node)
            const boss = BossEngine.generateFromDebt({ 
                id: `map_boss_${b.id}`, 
                type: b.type as any,
                amount: b.amount, 
                daysOverdue: b.daysOverdue 
            });
            setActiveBoss(boss);
            setActiveFighter({ ...currentClass, name: currentClass.name });
            setInPreCombat(true);
          }
        }}
      />
      
      {/* MODAL CÓDICE & TIENDA IAP (Fase 1) */}
      <AdventurerCodex
        visible={showCodex}
        onClose={() => setShowCodex(false)}
      />
      <DetailedIslandMap 
        island={selectedIsland}
        visible={selectedIsland !== null}
        onClose={() => setSelectedIsland(null)}
      />
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
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderHeroBanner()}
              <View style={{ marginBottom: 20 }}>
                <WeatherBanner />
              </View>
              {renderQuickMissions()}
            </ScrollView>
          </View>

          {/* MAIN PANE */}
          <View style={S.mainPane}>
            <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
              {renderProgressMap()}
              <View style={{ marginTop: 24 }}>
                {renderLeagues()}
              </View>
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView style={S.container} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>
          {renderHeroBanner()}
          <WeatherBanner />
          {renderQuickMissions()}
          {renderIslandGrid()}
          {renderBossPreview()}
          {renderProgressMap()}

          {renderLeagues()}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      {/* ━━ MOTOR DE COMBATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {inPreCombat && activeBoss && activeFighter && (
        <FusionPreCombat
          boss={activeBoss}
          onStart={startCombat}
          onCancel={() => setInPreCombat(false)}
        />
      )}


      {inCombat && activeBoss && activeFighter && (
        <UnifiedCombatScreen
          opponent={activeBoss}
          player={activeFighter}
          equippedCards={selectedCards}
          onExit={() => setInCombat(false)}
          onVictory={() => {
            setInCombat(false);
            Alert.alert('¡VICTORIA!', 'Has superado el desafío del mapa.');
            handleSimulateTransaction(500, 'Boss de Mapa Derrotado');
          }}
          onDefeat={() => setInCombat(false)}
        />
      )}

    </View>
  );
}

