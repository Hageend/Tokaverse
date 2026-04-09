// data/islands.ts
// TokaVerse RPG — Arquitectura de Navegación de Mundos (Fase 1)

export interface TinySwordsNPC {
  faction: 'red' | 'blue' | 'yellow' | 'purple';
  type: 'warrior' | 'archer' | 'mage';
}

export interface NPCInstance {
  x: string; // Posición horizontal en % (ej: "40%")
  y: string; // Posición vertical en % (ej: "25%")
  npc: TinySwordsNPC;
}

export interface Island {
  id: string;
  name: string;
  miniImage: any;       // Ruta local (require)
  fullMapImage: any;    // Ruta local (require)
  totalMissions: number;
  completedMissions: number;
  npcs: NPCInstance[];
}

// ─── TIPOS LEGACY (Mantenidos para compatibilidad con ProgressMap anterior) ───
export type PuzzleType = 'budget_50_30_20' | 'combat_fusion' | 'logic_gates' | 'speed_typing';
export type NodeType = 'start' | 'puzzle' | 'boss' | 'lore' | 'reward' | 'end';
export type NodeState = 'done' | 'active' | 'locked';

export interface MapNode {
  id: number;
  label: string;
  x: number;
  y: number;
  state: NodeState;
  type: NodeType;
  guardian?: TinySwordsNPC;
  puzzleType?: PuzzleType;
  bossType?: string;
  icon?: string;
  puzzle?: any;
  lore?: any;
  boss?: any;
  reward?: any;
}

export interface WorldZone {
  id: string;
  name: string;
  themeColor: string;
  tileType: 'grass' | 'neon' | 'dark' | 'sky';
  nodes: MapNode[];
}

// ─── BASE DE DATOS DE ISLAS (NUEVA ESTRUCTURA) ───────────────────────────────
export const ISLANDS_DATA: Island[] = [
  {
    id: 'isla_ahorro',
    name: 'Isla del Ahorro',
    miniImage: require('../assets/images/Isla del ahorro.png'),
    fullMapImage: require('../assets/images/Isla del ahorro_map.png'),
    totalMissions: 10,
    completedMissions: 3,
    npcs: [
      { x: '25%', y: '40%', npc: { faction: 'blue', type: 'warrior' } },
      { x: '70%', y: '30%', npc: { faction: 'red', type: 'archer' } },
      { x: '50%', y: '75%', npc: { faction: 'yellow', type: 'mage' } },
    ]
  },
  {
    id: 'isla_inversion',
    name: 'Cumbres de Inversión',
    miniImage: require('../assets/images/Isla Cumbres de Inversión.png'),
    fullMapImage: require('../assets/images/Isla Cumbres de Inversión _map.png'),
    totalMissions: 15,
    completedMissions: 0,
    npcs: [
      { x: '30%', y: '20%', npc: { faction: 'purple', type: 'mage' } },
      { x: '60%', y: '65%', npc: { faction: 'blue', type: 'archer' } },
    ]
  },
  {
    id: 'isla_neon',
    name: 'Isla Neón',
    miniImage: require('../assets/images/Isla neon.png'),
    fullMapImage: require('../assets/images/Isla neon_map.png'),
    totalMissions: 8,
    completedMissions: 0,
    npcs: [
      { x: '40%', y: '35%', npc: { faction: 'purple', type: 'mage' } },
      { x: '65%', y: '55%', npc: { faction: 'red', type: 'warrior' } },
    ]
  },
  {
    id: 'isla_abismo',
    name: 'El Abismo',
    miniImage: require('../assets/images/isla abismo_map.png'),
    fullMapImage: require('../assets/images/Isla abismo map.png'),
    totalMissions: 6,
    completedMissions: 0,
    npcs: [
      { x: '50%', y: '50%', npc: { faction: 'purple', type: 'mage' } },
    ]
  },
];

// Mapeo legacy para no romper componentes existentes mientras se migran
export const ISLANDS_DB: WorldZone[] = [
  {
    id: 'zone_cobre',
    name: 'Isla del Ahorro',
    themeColor: '#CD7F32',
    tileType: 'grass',
    nodes: []
  }
];
