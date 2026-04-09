// data/items.ts
// TokaVerse — Starter Items, Loot Tables & Item Definitions

type Weapon = any; type TokaCard = any; type Coupon = any; type Potion = any;

// ─── WEAPONS ─────────────────────────────────────────────────────────────────

export const ALL_WEAPONS: Weapon[] = [
  // Mage weapons
  { id: 'w_ice_staff_c', name: 'Bastón de Hielo', description: 'Un bastón con cristal de hielo en la punta. Ataque básico de frío.', type: 'weapon', rarity: 'common', icon: '🪄', attack: 5, element: 'ice', classReq: 'mage', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Soplo Glacial', skillDesc: 'Congela al enemigo por 1 turno con 25% de prob.' },
  { id: 'w_savings_rod_r', name: 'Vara del Ahorro', description: 'Canaliza el poder del ahorro. Congela garantizado por 1 turno.', type: 'weapon', rarity: 'rare', icon: '🔮', attack: 12, element: 'ice', classReq: 'mage', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Congelación', skillDesc: 'Congela garantizado 1 turno.' },
  { id: 'w_eternal_crystal_e', name: 'Cristal Eterno', description: 'Daño en área con fragmentos de hielo que golpean a todos los enemigos.', type: 'weapon', rarity: 'epic', icon: '💎', attack: 25, element: 'ice', classReq: 'mage', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Tormenta de Hielo', skillDesc: 'Daño en área 50% al jefe y 25% a minions.' },
  { id: 'w_treasure_scepter_l', name: 'Cetro del Tesoro', description: 'El arma definitiva del Mago Ahorrador. Revive con 50% HP al morir.', type: 'weapon', rarity: 'legendary', icon: '👑', attack: 45, element: 'ice', classReq: 'mage', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Revivir', skillDesc: 'Al caer a 0 HP, revive automáticamente con 50% HP. Una vez por batalla.' },

  // Warrior weapons
  { id: 'w_debit_sword_c', name: 'Espada de Débito', description: 'Un corte recto y honesto. Sin intereses.', type: 'weapon', rarity: 'common', icon: '⚔️', attack: 8, element: 'lightning', classReq: 'warrior', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Corte Recto', skillDesc: 'Daño base seguro sin fallo.' },
  { id: 'w_punctual_blade_r', name: 'Mandoble Puntual', description: 'Paga a tiempo y golpea dos veces. El poder de la puntualidad.', type: 'weapon', rarity: 'rare', icon: '🗡️', attack: 18, element: 'lightning', classReq: 'warrior', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Doble Golpe', skillDesc: 'Ataca 2 veces seguidas.' },
  { id: 'w_lightning_lance_e', name: 'Lanza del Relámpago', description: 'Penetra la defensa del enemigo con electricidad pura.', type: 'weapon', rarity: 'epic', icon: '⚡', attack: 30, element: 'lightning', classReq: 'warrior', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Rompescudos', skillDesc: 'Ignora el 50% de defensa del enemigo este turno.' },
  { id: 'w_excalibur_credit_l', name: 'Excalibur del Crédito', description: 'La espada legendaria. Golpe crítico garantizado.', type: 'weapon', rarity: 'legendary', icon: '🌟', attack: 55, element: 'lightning', classReq: 'warrior', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Crítico Garantizado', skillDesc: 'El siguiente ataque es siempre crítico (×2.5 daño).' },

  // Rogue weapons
  { id: 'w_smoke_daggers_c', name: 'Dagas de Humo', description: 'Dos dagas con efecto de humo verde. Veneno básico.', type: 'weapon', rarity: 'common', icon: '🗡️', attack: 6, element: 'water', classReq: 'rogue', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Envenenar', skillDesc: 'Aplica veneno que daña 5 HP por turno por 3 turnos.' },
  { id: 'w_cashback_blades_r', name: 'Hojas Cashback', description: 'Cada golpe regresa daño como monedas de cashback.', type: 'weapon', rarity: 'rare', icon: '💚', attack: 16, element: 'water', classReq: 'rogue', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Cashback', skillDesc: 'Gana 5% del daño como coins.' },
  { id: 'w_shadow_edge_e', name: 'Filo de Sombra', description: 'Golpea desde las sombras con daño masivo.', type: 'weapon', rarity: 'epic', icon: '🌑', attack: 28, element: 'water', classReq: 'rogue', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Emboscada', skillDesc: 'Daño ×2 si el rogue fue el último en atacar.' },

  // Archer weapons
  { id: 'w_copper_bow_c', name: 'Arco de Cobre', description: 'Arco básico con cuerda de cobre. Preciso y confiable.', type: 'weapon', rarity: 'common', icon: '🏹', attack: 7, element: 'earth', classReq: 'archer', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Flecha Precisa', skillDesc: 'Nunca falla el objetivo. Daño base seguro.' },
  { id: 'w_growth_bow_r', name: 'Arco Alcista', description: 'La gráfica de rendimiento aumenta tu daño con cada turno.', type: 'weapon', rarity: 'rare', icon: '📈', attack: 15, element: 'earth', classReq: 'archer', upgradeLevel: 0, upgradeBonus: 0, skillName: 'Interés Compuesto', skillDesc: '+3 ataque por cada turno que pase.' },
];

// ─── TOKA CARDS ───────────────────────────────────────────────────────────────

export const ALL_CARDS: TokaCard[] = [
  {
    id: 'card_despensa',
    name: 'Carta Despensa',
    description: 'La tarjeta Despensa de Toka. Bonificación de ataque en comercios de alimentos.',
    type: 'card',
    rarity: 'common',
    icon: '🛒',
    cardType: 'despensa',
    buffDesc: '+10% ataque al combatir bosses de tipo consumo',
    attackBonus: 10,
  },
  {
    id: 'card_combustible',
    name: 'Carta Combustible',
    description: 'La tarjeta de gasolina. Enciende tu daño de fuego.',
    type: 'card',
    rarity: 'rare',
    icon: '⛽',
    cardType: 'combustible',
    buffDesc: '+15% daño elemental fuego. Llamas animadas.',
    attackBonus: 15,
    passiveEffect: 'fire_aura',
  },
  {
    id: 'card_connect',
    name: 'Carta Connect',
    description: 'La tarjeta corporativa. Multiplica XP en pagos de viáticos.',
    type: 'card',
    rarity: 'epic',
    icon: '💳',
    cardType: 'connect',
    buffDesc: '+25% XP en pagos con tarjeta. Circuitos digitales.',
    xpMultiplier: 1.25,
    passiveEffect: 'circuit_glow',
  },
  {
    id: 'card_total_dorada',
    name: 'Carta Total Dorada',
    description: 'La carta legendaria. Aumenta todos los stats.',
    type: 'card',
    rarity: 'legendary',
    icon: '👑',
    cardType: 'total_dorada',
    buffDesc: '+20% ataque, +20% defensa, +10% XP. Todo brilla.',
    attackBonus: 20,
    defenseBonus: 20,
    xpMultiplier: 1.1,
    passiveEffect: 'golden_shimmer',
  },
  {
    id: 'card_fundador',
    name: 'Carta Fundador',
    description: 'Solo para los fundadores de TokaVerse. Poderes máximos.',
    type: 'card',
    rarity: 'unique',
    icon: '🌌',
    cardType: 'fundador',
    buffDesc: '+50% a todo. Galaxia en movimiento. Partículas eternas.',
    attackBonus: 50,
    defenseBonus: 50,
    xpMultiplier: 1.5,
    passiveEffect: 'galaxy_aura',
  },
];

// ─── STARTER POTIONS ──────────────────────────────────────────────────────────

export const STARTER_POTIONS: Potion[] = [
  { id: 'potion_hp_sm_1', name: 'Poción de Vida', description: 'Restaura 30 HP en combate.', type: 'potion', rarity: 'common', icon: '🧪', effect: 'hp', amount: 30, quantity: 2 },
  { id: 'potion_mana_sm_1', name: 'Poción de Maná', description: 'Restaura 20 MP en combate.', type: 'potion', rarity: 'common', icon: '🔵', effect: 'mana', amount: 20, quantity: 1 },
];

// ─── LOOT TABLES ─────────────────────────────────────────────────────────────

export type BossType = 'common' | 'epic' | 'legendary';

interface LootEntry {
  itemId: string;
  weight: number;            // relative probability weight
  type: 'weapon' | 'card' | 'potion' | 'spin_chance';
}

export const LOOT_TABLE: Record<BossType, LootEntry[]> = {
  common: [
    { itemId: 'w_debit_sword_c',   weight: 30, type: 'weapon' },
    { itemId: 'w_ice_staff_c',     weight: 25, type: 'weapon' },
    { itemId: 'w_smoke_daggers_c', weight: 20, type: 'weapon' },
    { itemId: 'w_copper_bow_c',    weight: 15, type: 'weapon' },
    { itemId: 'card_despensa',     weight: 8,  type: 'card'   },
    { itemId: 'potion_hp_sm_1',    weight: 2,  type: 'potion' },
  ],
  epic: [
    { itemId: 'w_savings_rod_r',    weight: 25, type: 'weapon' },
    { itemId: 'w_punctual_blade_r', weight: 20, type: 'weapon' },
    { itemId: 'w_cashback_blades_r',weight: 15, type: 'weapon' },
    { itemId: 'card_combustible',   weight: 15, type: 'card'   },
    { itemId: 'card_connect',       weight: 14, type: 'card'   },
    { itemId: 'w_lightning_lance_e',weight: 5,  type: 'weapon' },
    { itemId: 'w_shadow_edge_e',    weight: 5,  type: 'weapon' },
    { itemId: 'spin_chance',        weight: 1,  type: 'spin_chance' },
  ],
  legendary: [
    { itemId: 'w_lightning_lance_e', weight: 15, type: 'weapon' },
    { itemId: 'w_shadow_edge_e',     weight: 15, type: 'weapon' },
    { itemId: 'w_eternal_crystal_e', weight: 12, type: 'weapon' },
    { itemId: 'card_connect',        weight: 20, type: 'card'   },
    { itemId: 'card_total_dorada',   weight: 15, type: 'card'   },
    { itemId: 'w_excalibur_credit_l',weight: 8,  type: 'weapon' },
    { itemId: 'w_treasure_scepter_l',weight: 7,  type: 'weapon' },
    { itemId: 'card_fundador',       weight: 3,  type: 'card'   },
    { itemId: 'spin_chance',         weight: 5,  type: 'spin_chance' },
  ],
};

/** Roll loot from a boss type. Returns item IDs (or 'spin') */
export function rollLoot(bossType: BossType): string {
  const table = LOOT_TABLE[bossType];
  const total = table.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return entry.itemId;
  }
  return table[0].itemId;
}

/** Get item definition by ID */
export function getItemById(id: string): Weapon | TokaCard | Potion | null {
  return (
    ALL_WEAPONS.find((w) => w.id === id) ??
    ALL_CARDS.find((c) => c.id === id) ??
    STARTER_POTIONS.find((p) => p.id === id) ??
    null
  );
}

/** Get starter inventory for a given class */
export function getStarterInventory(classKey: string): Array<Weapon | TokaCard | Potion> {
  const starterWeaponId: Record<string, string> = {
    mage: 'w_ice_staff_c',
    warrior: 'w_debit_sword_c',
    rogue: 'w_smoke_daggers_c',
    archer: 'w_copper_bow_c',
    banker: 'w_debit_sword_c',
    kitsune: 'w_ice_staff_c',
  };
  const weapon = getItemById(starterWeaponId[classKey] ?? 'w_debit_sword_c');
  const items: Array<Weapon | TokaCard | Potion> = STARTER_POTIONS.map((p) => ({ ...p, id: `${p.id}_${Date.now()}` }));
  if (weapon) items.unshift({ ...weapon, id: `${weapon.id}_starter` } as Weapon);
  items.push({ ...ALL_CARDS[0], id: `card_despensa_starter` } as TokaCard);
  return items;
}