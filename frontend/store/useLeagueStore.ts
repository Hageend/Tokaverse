// store/useLeagueStore.ts
// TokaVerse — Zustand store para el ranking de liga

import { create } from 'zustand';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface RankEntry {
  rank:          number;
  userId:        string;
  username:      string;
  avatar:        string;    // emoji del personaje
  points:        number;
  transactions:  number;
  streak:        number;
  delta:         number;    // cambio vs ayer (+sube, -baja, 0 neutral)
  isCurrentUser: boolean;
}

export interface LeagueInfo {
  tier:       LeagueTier;
  name:       string;
  icon:       string;
  division:   string;      // e.g. "División I"
  minPoints:  number;
  maxPoints:  number;
}

export interface SeasonInfo {
  name:          string;
  daysRemaining: number;
}

// ─── Liga info por tier ───────────────────────────────────────────────────────
export const LEAGUE_INFO: Record<LeagueTier, LeagueInfo> = {
  bronze:  { tier: 'bronze',  name: 'Liga Bronce',   icon: '🥉', division: 'División III', minPoints: 0,    maxPoints: 999  },
  silver:  { tier: 'silver',  name: 'Liga Plata',    icon: '🥈', division: 'División II',  minPoints: 1000, maxPoints: 2499 },
  gold:    { tier: 'gold',    name: 'Liga Oro',      icon: '🥇', division: 'División I',   minPoints: 2500, maxPoints: 4999 },
  diamond: { tier: 'diamond', name: 'Liga Diamante', icon: '💎', division: 'División I',   minPoints: 5000, maxPoints: 99999 },
};

export const TIER_COLORS: Record<LeagueTier, string> = {
  bronze:  '#cd7f32',
  silver:  '#c0c0c0',
  gold:    '#fbbf24',
  diamond: '#67e8f9',
};

// ─── Mock rankings ────────────────────────────────────────────────────────────
export const MOCK_RANKINGS: RankEntry[] = [
  { rank: 1, userId: 'u1', username: 'AhorroMaster99',  avatar: '🧙', points: 2840, transactions: 14, streak: 7,  delta: 12,  isCurrentUser: false },
  { rank: 2, userId: 'u2', username: 'TokaDragon_GDL',  avatar: '🐉', points: 2510, transactions: 12, streak: 5,  delta: 3,   isCurrentUser: false },
  { rank: 3, userId: 'u3', username: 'FinanceMage_MX',  avatar: '🔮', points: 2200, transactions: 11, streak: 4,  delta: -2,  isCurrentUser: false },
  { rank: 4, userId: 'u4', username: 'ShinobiSaver',    avatar: '🥷', points: 1980, transactions: 9,  streak: 3,  delta: 0,   isCurrentUser: false },
  { rank: 5, userId: 'me', username: 'TukaLord_MX',     avatar: '⚔️', points: 1740, transactions: 8,  streak: 2,  delta: 5,   isCurrentUser: true  },
  { rank: 6, userId: 'u6', username: 'ArqueroFinance',  avatar: '🏹', points: 1520, transactions: 7,  streak: 1,  delta: -1,  isCurrentUser: false },
  { rank: 7, userId: 'u7', username: 'MercaderTokaX',   avatar: '💰', points: 1300, transactions: 6,  streak: 0,  delta: 2,   isCurrentUser: false },
  { rank: 8, userId: 'u8', username: 'KitsuneHogger',   avatar: '🦊', points: 1100, transactions: 5,  streak: 0,  delta: -3,  isCurrentUser: false },
];

// ─── Store ────────────────────────────────────────────────────────────────────
interface LeagueState {
  currentLeague:  LeagueTier;
  rankings:       RankEntry[];
  season:         SeasonInfo;
  userRank:       number;

  setLeague:      (tier: LeagueTier) => void;
  setRankings:    (entries: RankEntry[]) => void;
  updateUserPoints: (delta: number) => void;
}

export const useLeagueStore = create<LeagueState>((set, get) => ({
  currentLeague: 'silver',
  rankings:      MOCK_RANKINGS,
  season:        { name: 'Temporada Sakura', daysRemaining: 12 },
  userRank:      5,

  setLeague(tier) {
    set({ currentLeague: tier });
  },

  setRankings(entries) {
    const me = entries.find(e => e.isCurrentUser);
    set({ rankings: entries, userRank: me?.rank ?? 0 });
  },

  updateUserPoints(delta) {
    const { rankings } = get();
    const updated = rankings.map(r =>
      r.isCurrentUser ? { ...r, points: Math.max(0, r.points + delta) } : r
    ).sort((a, b) => b.points - a.points).map((r, i) => ({ ...r, rank: i + 1 }));
    const me = updated.find(r => r.isCurrentUser);
    set({ rankings: updated, userRank: me?.rank ?? 0 });
  },
}));
