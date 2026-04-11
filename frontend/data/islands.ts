// data/islands.ts
// TokaVerse RPG — Arquitectura de Mapas Unificados (1 Isla por Liga)

export interface TinySwordsNPC {
  faction: 'red' | 'blue' | 'yellow' | 'purple';
  type: 'warrior' | 'archer' | 'mage';
}

export interface NPCInstance {
  x: string; // "40%"
  y: string; // "25%"
  npc: TinySwordsNPC;
}

export type NodeType = 'start' | 'puzzle' | 'boss' | 'lore' | 'reward' | 'end';
export type NodeState = 'done' | 'active' | 'locked';

export interface MapNode {
  id: number;
  label: string;
  x: string | number; // Soporta "%" o números legacy
  y: string | number;
  state: NodeState;
  type: NodeType;
  icon?: string;
  puzzle?: any;
  lore?: any;
  boss?: any;
  reward?: any;
  bossType?: string;
  puzzleType?: string; // Re-añadido para compatibilidad
  pathOrder?: number; // Opcional para soportar generación procedural
}

export interface WorldZone {
  id: string;
  name: string;
  themeColor: string;
  nodes: MapNode[];
  tileType?: 'grass' | 'neon' | 'dark' | 'sky';
}

export interface Island {
  id: string;
  name: string;
  tier: 'cobre' | 'plata' | 'oro' | 'estrella';
  miniImage: any;
  fullMapImage: any;
  totalMissions: number;
  completedMissions: number;
  nodes: MapNode[];
  npcs: NPCInstance[];
  battles?: Array<{
    id: string;
    x: string | number;
    y: string | number;
    factionA: 'red' | 'blue' | 'yellow' | 'purple';
    factionB: 'red' | 'blue' | 'yellow' | 'purple';
  }>;
}

// ─── BASE DE DATOS MAESTRA ───────────────────────────────────────────────────
export const ISLANDS_DATA: Island[] = [
  {
    id: 'isla_ahorro',
    name: 'Isla del Ahorro',
    tier: 'cobre',
    miniImage: require('../assets/images/Isla del ahorro.png'),
    fullMapImage: require('../assets/images/Isla del ahorro_map.png'),
    totalMissions: 10,
    completedMissions: 3,
    nodes: [
      { id: 1, label: 'Inicio', x: '15%', y: '80%', state: 'done', type: 'start', icon: '🏠', pathOrder: 1 },
      { id: 2, label: 'Gasto Impulsivo', x: '35%', y: '70%', state: 'done', type: 'boss', icon: '⚔️', pathOrder: 2, bossType: 'toka_despensa' },
      { id: 3, label: 'Orden Ágil', x: '55%', y: '75%', state: 'active', type: 'puzzle', icon: '🧩', pathOrder: 3, puzzleType: 'debt_sorter' },
      { id: 4, label: 'Etiquetado', x: '75%', y: '60%', state: 'locked', type: 'puzzle', icon: '🏷️', pathOrder: 4, puzzleType: 'transaction_tagger' },
      { id: 5, label: 'Mora Acumulada', x: '60%', y: '40%', state: 'locked', type: 'boss', icon: '💀', pathOrder: 5, bossType: 'loan' },
      { id: 6, label: 'Escaneo Fiscal', x: '40%', y: '30%', state: 'locked', type: 'puzzle', icon: '🔍', pathOrder: 6, puzzleType: 'invoice_scanner' },
      { id: 7, label: 'Cajero Veloz', x: '25%', y: '20%', state: 'locked', type: 'puzzle', icon: '💰', pathOrder: 7, puzzleType: 'change_counter' },
      { id: 8, label: 'Pago a Tiempo', x: '50%', y: '15%', state: 'locked', type: 'puzzle', icon: '⏱️', pathOrder: 8, puzzleType: 'payment_timing' },
    ],
    npcs: [
      { x: '20%', y: '85%', npc: { faction: 'blue', type: 'warrior' } },
      { x: '80%', y: '20%', npc: { faction: 'red', type: 'archer' } },
    ],
    battles: [
      { id: 'b1', x: '45%', y: '50%', factionA: 'blue', factionB: 'red' },
      { id: 'b2', x: '10%', y: '40%', factionA: 'blue', factionB: 'red' },
    ]
  },
  {
    id: 'isla_neon',
    name: 'Isla de Neón',
    tier: 'plata',
    miniImage: require('../assets/images/Isla Cumbres de Inversión.png'),
    fullMapImage: require('../assets/images/Isla del ahorro_map.png'),
    totalMissions: 15,
    completedMissions: 0,
    nodes: [
      { id: 20, label: 'Entrada Neón', x: '20%', y: '85%', state: 'active', type: 'start', icon: '🌆', pathOrder: 1 },
      { id: 21, label: 'Cálculo de Interés', x: '40%', y: '70%', state: 'locked', type: 'puzzle', icon: '🧮', pathOrder: 2, puzzleType: 'interest_calculator' },
      { id: 22, label: 'Meta de Ahorro', x: '60%', y: '75%', state: 'locked', type: 'puzzle', icon: '🎯', pathOrder: 3, puzzleType: 'savings_goal' },
      { id: 23, label: 'Hacker de Deuda', x: '50%', y: '50%', state: 'locked', type: 'boss', icon: '👾', pathOrder: 4, bossType: 'hacker' },
      { id: 24, label: 'Parejas Lógicas', x: '35%', y: '35%', state: 'locked', type: 'puzzle', icon: '🎴', pathOrder: 5, puzzleType: 'card_match' },
      { id: 25, label: 'Fotomemoria', x: '65%', y: '25%', state: 'locked', type: 'puzzle', icon: '📸', pathOrder: 6, puzzleType: 'transaction_memory' },
      { id: 26, label: 'Explota Gastos', x: '85%', y: '40%', state: 'locked', type: 'puzzle', icon: '🫧', pathOrder: 7, puzzleType: 'bubble_burst' },
    ],
    npcs: [
      { x: '30%', y: '70%', npc: { faction: 'purple', type: 'mage' } },
    ],
    battles: [
      { id: 'bn1', x: '50%', y: '30%', factionA: 'purple', factionB: 'yellow' },
    ]
  },
  {
    id: 'isla_inversion',
    name: 'Cumbres de Inversión',
    tier: 'estrella',
    miniImage: require('../assets/images/Isla Cumbres de Inversión.png'),
    fullMapImage: require('../assets/images/Isla Cumbres de Inversión _map.png'),
    totalMissions: 20,
    completedMissions: 0,
    nodes: [
      { id: 100, label: 'Base de Inversión', x: '20%', y: '80%', state: 'active', type: 'start', icon: '🏔️', pathOrder: 1 },
      { id: 101, label: 'Bola de Nieve', x: '40%', y: '65%', state: 'locked', type: 'puzzle', icon: '❄️', pathOrder: 2, puzzleType: 'debt_snowball' },
      { id: 102, label: 'Gestor Portafolio', x: '60%', y: '55%', state: 'locked', type: 'puzzle', icon: '📊', pathOrder: 3, puzzleType: 'portfolio_builder' },
      { id: 103, label: 'Golem Facturas', x: '50%', y: '35%', state: 'locked', type: 'boss', icon: '🧱', pathOrder: 4, bossType: 'golem' },
      { id: 104, label: 'Gestor de Crisis', x: '75%', y: '25%', state: 'locked', type: 'puzzle', icon: '🚨', pathOrder: 5, puzzleType: 'crisis_manager' },
      { id: 105, label: 'Cadena Combo', x: '40%', y: '15%', state: 'locked', type: 'puzzle', icon: '⛓️', pathOrder: 6, puzzleType: 'combo_chain' },
    ],
    npcs: [
      { x: '40%', y: '60%', npc: { faction: 'yellow', type: 'mage' } },
    ],
    battles: [
      { id: 'bi1', x: '30%', y: '40%', factionA: 'yellow', factionB: 'red' },
      { id: 'bi2', x: '70%', y: '70%', factionA: 'blue', factionB: 'purple' },
    ]
  }
];

// Mapeos legacy
export const ISLANDS_DB: WorldZone[] = [];
