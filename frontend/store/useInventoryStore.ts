// store/useInventoryStore.ts
// TokaVerse — Zustand store para inventario de ítems RPG

import { create } from 'zustand';
import { Element } from '../types/elements';
import { PassiveBonus } from '../types/fusion';
import { usePlayerStore } from './usePlayerStore';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type ItemType   = 'card' | 'weapon' | 'protection' | 'consumable';
export type WeaponStyle = 'sword' | 'bow' | 'staff' | 'dagger' | 'card' | 'physical';

export interface ItemStats {
  atk?: number;
  def?: number;
  hp?:  number;
  mana?: number;
}

export interface InventoryItem {
  id:           string;
  icon:         string;         // emoji como fallback
  pixelArt?:    string;         // key para el asset .png
  name:         string;
  rarity:       ItemRarity;
  type:         ItemType;
  description:  string;
  obtainedFrom: string;
  obtainedAt:   Date;
  
  // Card specific (for fusion)
  templateId?:  string;         // ID de la receta (c001, r001, etc.)
  product?:     string;
  element?:     Element;
  passiveBonus?: PassiveBonus;
  
  // RPG Stats & Equipment
  stats?:       ItemStats;
  isEquipped?:  boolean;
  durability?:  number;         // Usos o puntos de vida del objeto
  maxDurability?: number;
  weaponStyle?: WeaponStyle;
}

// ─── Colores por rareza ────────────────────────────────────────────────────────
export const RARITY_COLORS: Record<ItemRarity, string> = {
  common:    '#4a4a7a',
  uncommon:  '#22c55e',
  rare:      '#7b5ea7',
  legendary: '#fbbf24',
};

export const RARITY_LABELS: Record<ItemRarity, string> = {
  common:    'Común',
  uncommon:  'Poco Común',
  rare:      'Raro',
  legendary: '⭐ Legendario',
};

// ─── Drops de jefes ────────────────────────────────────────────────────────────
export interface BossDropItem {
  icon:         string;
  pixelArt?:    string;
  name:         string;
  rarity:       ItemRarity;
  type:         ItemType;
  description?: string;
  weight?:      number;
  stats?:       ItemStats;
  durability?:  number;

  // Card specific
  templateId?:  string;
  product?:     string;
  element?:     Element;
  passiveBonus?: PassiveBonus;
  weaponStyle?: WeaponStyle;
}

export interface BossDrop {
  guaranteed: BossDropItem;
  random:     BossDropItem[];
}

export const BOSS_DROPS: Record<string, BossDrop> = {
  dragon_del_gasto: {
    guaranteed: {
      icon: '🎴', pixelArt: 'item_card', name: 'Carta: Dragón del Gasto', rarity: 'legendary', type: 'card',
      description: 'La carta del derroche. Inflige fuego de deuda al enemigo.',
      templateId: 'l001', product: 'total', element: 'fire',
      passiveBonus: { type: 'damage', value: 0.25, element: 'fire' }
    },
    random: [
      { 
        icon: '🗡️', pixelArt: 'item_sword', name: 'Espada del Derroche', rarity: 'rare', type: 'weapon', weight: 0.3, 
        description: 'Forjada en deudas pasadas. +15 ATK.', 
        stats: { atk: 15 }, durability: 20, weaponStyle: 'sword'
      },
      { icon: '🏹', name: 'Arco de Recibo', rarity: 'uncommon', type: 'weapon', weight: 0.2, description: 'Veloz y preciso. +10 ATK.', stats: { atk: 10 }, durability: 25, weaponStyle: 'bow' },
      { icon: '🧪', pixelArt: 'item_potion', name: 'Poción de XP', rarity: 'uncommon', type: 'consumable', weight: 0.5, description: '+50 XP instantáneos.' },
    ],
  },
  jefe_de_mora: {
    guaranteed: {
      icon: '🛡️', pixelArt: 'item_shield', name: 'Escudo Anti-Mora', rarity: 'rare', type: 'protection',
      description: 'Bloquea el 20% del daño de intereses. +10 DEF.',
      stats: { def: 10 }, durability: 15
    },
    random: [
      { icon: '🧪', pixelArt: 'item_potion_HP', name: 'Poción de HP', rarity: 'uncommon', type: 'consumable', weight: 0.6, description: 'Restaura +40 HP.', stats: { hp: 40 } },
      { 
        icon: '🎴', pixelArt: 'item_card_mana', name: 'Carta: Maná Extra', rarity: 'uncommon', type: 'card', weight: 0.4, 
        description: 'Restaura +25 MP al inicio del turno.',
        templateId: 'r002', product: 'connect', element: 'dark',
        passiveBonus: { type: 'mana_regen', value: 25 }
      },
      { icon: '💍', pixelArt: 'item_ring_shield', name: 'Anillo de Protección', rarity: 'rare', type: 'protection', weight: 0.3, stats: { def: 18 }, durability: 30 },
    ],
  },
  deuda_sombria: {
    guaranteed: {
      icon: '🎴', pixelArt: 'item_card', name: 'Carta: Deuda Vencida', rarity: 'legendary', type: 'card',
      description: 'La carta más oscura del mazo. Daño masivo garantizado.',
      templateId: 'l001', product: 'total', element: 'dark',
      passiveBonus: { type: 'element_boost', value: 0.30, element: 'dark' }
    },
    random: [
      { 
        icon: '🗡️', pixelArt: 'item_sword', name: 'Daga Oscura', rarity: 'rare', type: 'weapon', weight: 0.35, 
        description: '+25% daño crítico y +18 ATK.', 
        stats: { atk: 18 }, durability: 12, weaponStyle: 'dagger'
      },
      { icon: '💍', pixelArt: 'item_ring_mana', name: 'Anillo de Maná', rarity: 'rare', type: 'protection', weight: 0.25, stats: { mana: 30 } },
      { icon: '🧪', pixelArt: 'item_potion_strong', name: 'Poción Mayor', rarity: 'rare', type: 'consumable', weight: 0.2, description: 'Cura +85 HP de forma crítica.', stats: { hp: 85 } },
    ],
  },
  toka_despensa: {
    guaranteed: {
      icon: '🛒', pixelArt: 'item_card', name: 'Carta: Compra Inteligente', rarity: 'uncommon', type: 'card',
      description: '+10% XP en compras de despensa.',
      templateId: 'c001', product: 'despensa', element: 'ice'
    },
    random: [
      { icon: '🧪', pixelArt: 'item_potion', name: 'Poción de XP', rarity: 'common', type: 'consumable', weight: 0.5, description: '+50 XP instantáneos.' },
      { icon: '🍎', name: 'Manzana de Ahorro', rarity: 'common', type: 'consumable', weight: 0.3, description: 'Restaura 15 HP.' },
      { icon: '🥖', name: 'Baguette del Día', rarity: 'uncommon', type: 'weapon', weight: 0.2, stats: { atk: 6 }, durability: 40, weaponStyle: 'physical' },
    ],
  },
  toka_fuel: {
    guaranteed: {
      icon: '⛽', pixelArt: 'item_card', name: 'Carta: Combustión', rarity: 'uncommon', type: 'card',
      description: 'Activa ataque de fuego por 2 turnos.',
      templateId: 'r001', product: 'fuel', element: 'fire'
    },
    random: [
      { icon: '🧪', pixelArt: 'item_potion', name: 'Poción de HP', rarity: 'common', type: 'consumable', weight: 0.5, description: 'Restaura 30 HP.' },
      { icon: '🔥', name: 'Fuego Fatuo', rarity: 'rare', type: 'weapon', weight: 0.2, stats: { atk: 22 }, durability: 10, weaponStyle: 'staff' },
      { icon: '🛢️', name: 'Barril de Reserva', rarity: 'uncommon', type: 'protection', weight: 0.3, stats: { def: 8 }, durability: 20 },
    ],
  },
  toka_connect: {
    guaranteed: {
      icon: '📑', pixelArt: 'item_card', name: 'Carta: Comprobante', rarity: 'rare', type: 'card',
      description: 'Aplica efecto "Congelado" al jefe por 1 turno.',
      templateId: 'e001', product: 'connect', element: 'thunder'
    },
    random: [
      { icon: '🗡️', pixelArt: 'item_sword', name: 'Espada del Orden', rarity: 'rare', type: 'weapon', weight: 0.3, description: '+15 ATK al atacar.', stats: { atk: 15 }, durability: 20, weaponStyle: 'sword' },
      { icon: '📡', name: 'Antena Parabólica', rarity: 'rare', type: 'weapon', weight: 0.2, stats: { atk: 30 }, durability: 8, weaponStyle: 'staff' },
      { icon: '🧪', pixelArt: 'item_potion', name: 'Poción de XP', rarity: 'common', type: 'consumable', weight: 0.5, description: '+50 XP instantáneos.' },
    ],
  },
  credit_card: {
    guaranteed: {
      icon: '🃏', pixelArt: 'item_card', name: 'Carta: Tarjeta Maldita', rarity: 'legendary', type: 'card',
      description: 'Invocación épica. El boss más poderoso es ahora tu aliado.',
      templateId: 'l001', product: 'total', element: 'dark',
      passiveBonus: { type: 'damage', value: 0.40, element: 'dark' }
    },
    random: [
      { icon: '🗡️', pixelArt: 'item_sword_diamond', name: 'Mandoble de Diamante', rarity: 'legendary', type: 'weapon', weight: 0.2, description: 'Corte puro. +40 ATK.', stats: { atk: 40 }, durability: 35 },
      { icon: '🛡️', pixelArt: 'item_shield_elemental', name: 'Escudo de Crédito', rarity: 'rare', type: 'protection', weight: 0.35, description: 'Barrera anti-intereses. +25 DEF.', stats: { def: 25 }, durability: 25 },
      { icon: '💍', pixelArt: 'item_ring_strong', name: 'Anillo de Poder', rarity: 'rare', type: 'protection', weight: 0.2, stats: { atk: 12, hp: 15 } },
      { icon: '🧪', pixelArt: 'item_potion_energy', name: 'Poción de Energía', rarity: 'rare', type: 'consumable', weight: 0.45, description: 'Restaura +50 HP y +25 MP.', stats: { hp: 50, mana: 25 } },
    ],
  },
  abyss: {
    guaranteed: { 
      icon: '🗡️', pixelArt: 'item_sword_infernal', name: 'Espada Infernal', rarity: 'legendary', type: 'weapon',
      description: 'Drena el alma y el dinero del enemigo. +55 ATK.', stats: { atk: 55 }, durability: 20, weaponStyle: 'sword'
    },
    random: [
      { icon: '💍', pixelArt: 'item_ring_strong', name: 'Anillo de Poder', rarity: 'rare', type: 'protection', weight: 0.35, stats: { atk: 12, hp: 10 } },
      { icon: '🎴', pixelArt: 'item_card_strong', name: 'Carta: Vacío Total', rarity: 'legendary', type: 'card', weight: 0.1, templateId: 'l001' },
    ],
  },
  golem: {
    guaranteed: { 
      icon: '🛡️', pixelArt: 'item_shield_elemental', name: 'Escudo Elemental', rarity: 'rare', type: 'protection',
      description: 'Protección contra intereses variables. +25 DEF.', stats: { def: 25 }, durability: 30
    },
    random: [
      { icon: '💎', pixelArt: 'item_crystal_mana', name: 'Cristal de Maná', rarity: 'rare', type: 'consumable', weight: 0.5, description: 'Restaura +60 MP.', stats: { mana: 60 } },
      { icon: '🗡️', pixelArt: 'item_sword_diamond', name: 'Espada de Diamante', rarity: 'rare', type: 'weapon', weight: 0.2, stats: { atk: 32 }, durability: 15 },
    ],
  },
  tickets: {
    guaranteed: { 
      icon: '🧭', pixelArt: 'item_compass', name: 'Brújula de Gastos', rarity: 'uncommon', type: 'protection',
      description: 'Localiza gastos hormiga. +15 DEF.', stats: { def: 15 }, durability: 40
    },
    random: [
      { icon: '🧪', pixelArt: 'item_potion_mana', name: 'Poción de Maná', rarity: 'common', type: 'consumable', weight: 0.6, description: 'Restaura 25 MP.' },
      { icon: '🎴', pixelArt: 'item_card_xp', name: 'Carta de Experiencia', rarity: 'uncommon', type: 'card', weight: 0.4, templateId: 'xp01' },
    ],
  },
  cash: {
    guaranteed: { 
      icon: '🕯️', pixelArt: 'item_ritual_incense', name: 'Incienso Ritual', rarity: 'legendary', type: 'consumable',
      description: 'Cura +100 HP y restaura todo tu MP.', stats: { hp: 100, mana: 80 }
    },
    random: [
      { icon: '🗡️', pixelArt: 'item_sword_Thunder', name: 'Espada Trueno', rarity: 'legendary', type: 'weapon', weight: 0.2, stats: { atk: 65 }, weaponStyle: 'sword' },
      { icon: '🧪', pixelArt: 'item_potion_strong', name: 'Mega Poción', rarity: 'rare', type: 'consumable', weight: 0.4, description: 'Cura +100 HP.', stats: { hp: 100 } },
    ],
  },
  generic_mob: {
    guaranteed: { icon: '🧪', pixelArt: 'item_potion', name: 'Poción Menor', rarity: 'common', type: 'consumable', description: 'Cura 15 HP.' },
    random: [
      { icon: '🧪', pixelArt: 'item_potion', name: 'Poción de HP', rarity: 'common', type: 'consumable', weight: 0.6, description: 'Cura 30 HP.' },
      { icon: '🎴', pixelArt: 'item_card', name: 'Carta Común', rarity: 'common', type: 'card', weight: 0.3, templateId: 'c001', product: 'despensa', element: 'earth' },
      { icon: '🗡️', name: 'Daga Oxidada', rarity: 'common', type: 'weapon', weight: 0.1, stats: { atk: 5 }, durability: 10 },
    ]
  }
};

/** Selecciona un drop aleatorio según pesos */
export function selectRandomDrop(bossType: string): BossDropItem | null {
  let drops = BOSS_DROPS[bossType]?.random;
  if (!drops || drops.length === 0) {
    drops = BOSS_DROPS['generic_mob'].random;
  }
  const total = drops.reduce((s, d) => s + (d.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const d of drops) {
    r -= d.weight ?? 1;
    if (r <= 0) return d;
  }
  return drops[drops.length - 1];
}

// ─── Reglas de expansión de slots ─────────────────────────────────────────────
export const SLOT_RULES = {
  leagues:  { silver: 20, gold: 25, diamond: 35 },
  purchase: { pack_small: 5, pack_medium: 10 },
};

// ─── Mapeo de Clases y Estilos ────────────────────────────────────────────────
const CLASS_WEAPON_STYLES: Record<string, WeaponStyle[]> = {
  warrior:    ['sword', 'physical'],
  archer:     ['bow', 'physical'],
  mage:       ['staff', 'card', 'physical'],
  rogue:      ['dagger', 'physical'],
  banker:     ['physical'],
  kitsune:    ['staff', 'physical'],
  thief:      ['dagger', 'physical'],
  hacker:     ['card', 'physical'],
  knight:     ['sword', 'physical'],
  magedark:   ['staff', 'card'],
  elf:        ['bow'],
  maid:       ['physical', 'dagger'],
  mermaid:    ['staff'],
  witch:      ['staff', 'card'],
  santa:      ['physical'],
  leona:      ['sword'],
  knigh_girl: ['sword'],
  knigh_red:  ['sword'],
  dog:        ['physical'],
  cat:        ['physical', 'dagger'],
  fox:        ['physical', 'staff'],
};

// ─── Mock items iniciales ───────────────────────────────────────────────────────
const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'item_001', icon: '🧪', pixelArt: 'item_potion', name: 'Poción de HP',
    rarity: 'common', type: 'consumable',
    description: 'Restaura 30 HP al usarla.',
    obtainedFrom: 'Tutorial', obtainedAt: new Date(),
  },
  {
    id: 'item_002', icon: '🎴', pixelArt: 'item_card', name: 'Carta: Dragón del Gasto',
    rarity: 'legendary', type: 'card',
    description: 'La carta del derroche. Inflige fuego de deuda al enemigo.',
    obtainedFrom: 'El Carrito Vacío', obtainedAt: new Date(),
    stats: { atk: 40 }, element: 'fire', templateId: 'l001'
  },
  {
    id: 'item_003', icon: '🗡️', pixelArt: 'item_sword', name: 'Espada del Derroche',
    rarity: 'rare', type: 'weapon',
    description: 'Forjada en deudas pasadas. +15 ATK.',
    obtainedFrom: 'El Carrito Vacío', obtainedAt: new Date(),
    stats: { atk: 15 },
    durability: 20,
    maxDurability: 20,
    weaponStyle: 'sword'
  },
  {
    id: 'item_004', icon: '🛡️', pixelArt: 'item_shield', name: 'Escudo de Cartón',
    rarity: 'common', type: 'protection',
    description: 'Mejor que nada. +5 DEF.',
    obtainedFrom: 'Tutorial', obtainedAt: new Date(),
    stats: { def: 5 }, durability: 10, maxDurability: 10
  }
];

// ─── Store ─────────────────────────────────────────────────────────────────────
interface InventoryState {
  items:       InventoryItem[];
  maxSlots:    number;
  addItem:     (drop: BossDropItem, bossName: string) => boolean;
  removeItem:  (id: string) => void;
  equipItem:   (id: string) => { success: boolean; message?: string };
  validateEquippedItems: () => void;
  reduceDurability: (id: string, amount: number) => void;
  expandSlots: (amount: number) => void;
  hasItem:     (name: string) => boolean;
  getEquippedStats: () => ItemStats;
  consumeItem:     (id: string) => ItemStats | null;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items:    INITIAL_ITEMS,
  maxSlots: 15,

  addItem(drop, bossName) {
    const { items, maxSlots } = get();
    if (items.length >= maxSlots) return false;
    const newItem: InventoryItem = {
      id:           `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      icon:         drop.icon,
      pixelArt:     drop.pixelArt,
      name:         drop.name,
      rarity:       drop.rarity,
      type:         drop.type,
      description:  drop.description ?? '',
      obtainedFrom: bossName,
      obtainedAt:   new Date(),
      stats:        drop.stats,
      durability:   drop.durability,
      maxDurability: drop.durability,
      isEquipped:   false,
      templateId:   drop.templateId,
      product:      drop.product,
      element:      drop.element,
      passiveBonus: drop.passiveBonus,
      weaponStyle:  drop.weaponStyle,
    };
    set(s => ({ items: [...s.items, newItem] }));
    return true;
  },

  removeItem(id) {
    set(s => ({ items: s.items.filter(i => i.id !== id) }));
  },

  equipItem(id) {
    let result = { success: true, message: '' };
    set(s => {
      const itemToEquip = s.items.find(i => i.id === id);
      if (!itemToEquip) {
        result = { success: false, message: 'Item no encontrado' };
        return s;
      }

      // Restricción de clase para armas
      if (itemToEquip.type === 'weapon' && itemToEquip.weaponStyle) {
        const { charClass } = usePlayerStore.getState();
        const allowedStyles = CLASS_WEAPON_STYLES[charClass] || ['physical'];
        if (!allowedStyles.includes(itemToEquip.weaponStyle)) {
          result = { success: false, message: `Tu clase actual no puede equipar objetos de estilo ${itemToEquip.weaponStyle}.` };
          return s;
        }
      }

      if (itemToEquip.type !== 'weapon' && itemToEquip.type !== 'protection' && itemToEquip.type !== 'card') {
        result = { success: false, message: 'Este item no se puede equipar.' };
        return s;
      }

      return {
        items: s.items.map(i => {
          if (i.id === id) return { ...i, isEquipped: !i.isEquipped };
          // Desequipar el anterior del mismo tipo
          if (i.type === itemToEquip.type && i.isEquipped) return { ...i, isEquipped: false };
          return i;
        })
      };
    });
    return result;
  },

  validateEquippedItems() {
    set(s => {
      const { charClass } = usePlayerStore.getState();
      const allowedStyles = CLASS_WEAPON_STYLES[charClass] || ['physical'];

      return {
        items: s.items.map(i => {
          // Si es un arma y su estilo ya no es válido para la clase
          if (i.isEquipped && i.type === 'weapon' && i.weaponStyle) {
            if (!allowedStyles.includes(i.weaponStyle)) {
              return { ...i, isEquipped: false };
            }
          }
          return i;
        })
      };
    });
  },

  reduceDurability(id, amount) {
    set(s => {
      const updatedItems = s.items.map(i => {
        if (i.id === id && i.durability !== undefined) {
          const newDur = Math.max(0, i.durability - amount);
          return { ...i, durability: newDur };
        }
        return i;
      }).filter(i => i.durability === undefined || i.durability > 0);

      return { items: updatedItems };
    });
  },

  expandSlots(amount) {
    set(s => ({ maxSlots: s.maxSlots + amount }));
  },

  hasItem(name) {
    return get().items.some(i => i.name === name);
  },

  getEquippedStats() {
    const { items } = get();
    const stats: ItemStats = { atk: 0, def: 0, hp: 0, mana: 0 };
    items.forEach(i => {
      if (i.isEquipped && i.stats) {
        if (i.stats.atk) stats.atk = (stats.atk || 0) + i.stats.atk;
        if (i.stats.def) stats.def = (stats.def || 0) + i.stats.def;
        if (i.stats.hp)  stats.hp  = (stats.hp || 0) + i.stats.hp;
        if (i.stats.mana) stats.mana = (stats.mana || 0) + i.stats.mana;
      }
    });
    return stats;
  },

  consumeItem(id) {
    const { items } = get();
    const item = items.find(i => i.id === id);
    if (!item || item.type !== 'consumable') return null;

    const stats = item.stats || null;
    set(s => ({ items: s.items.filter(i => i.id !== id) }));
    return stats;
  }
}));
