// Modelos para sistema de ligas y torneos

export interface Challenge {
  id: string;
  type: 'ahorro' | 'gasto' | 'velocidad' | 'toka_despensa' | 'toka_fuel' | 'toka_connect' | 'toka_total';
  rules: string;
  reward: string;
}

export interface Tournament {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  participants: string[]; // userIds
  challenges: Challenge[];
}


export type LeagueTier = 'cobre' | 'plata' | 'oro' | 'estrella';

export interface League {
  id: string;
  name: string;
  description: string;
  tier: LeagueTier;
  minLevel: number;
  users: string[]; // userIds
  ranking: UserLeagueStats[];
  tournaments: Tournament[];
  endDate?: number; // UNIX Timestamp for the end of the current week/iteration
}

export interface UserProfile {
  id: string;
  xp: number;
  level: number;
}


export interface UserLeagueStats {
  userId: string;
  leagueId: string;
  points: number;
  position: number;
  rewards: string[];
  xp: number;
  xpToNext: number;
}
