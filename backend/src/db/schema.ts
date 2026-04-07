import {
    pgTable,
    serial,
    varchar,
    text,
    integer,
    decimal,
    timestamp,
    boolean,
    index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// 1. CORE BANCARIO
// ==========================================

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    ssoId: varchar('sso_id', { length: 255 }).unique().notNull(), // Vinculación con Toka SSO
    email: varchar('email', { length: 255 }).unique().notNull(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    accountType: varchar('account_type', { length: 50 }).notNull(), // e.g. 'DEBIT', 'CREDIT'
    balance: decimal('balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
    currency: varchar('currency', { length: 3 }).default('MXN').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mccCodes = pgTable('mcc_codes', {
    code: varchar('code', { length: 4 }).primaryKey(),
    category: varchar('category', { length: 255 }).notNull(), // e.g., 'Cafetería', 'Entretenimiento'
    description: text('description'),
});

export const merchants = pgTable('merchants', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    mccCode: varchar('mcc_code', { length: 4 }).references(() => mccCodes.code).notNull(),
});

export const transactions = pgTable('transactions', {
    id: serial('id').primaryKey(),
    accountId: integer('account_id').references(() => accounts.id).notNull(),
    merchantId: integer('merchant_id').references(() => merchants.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'PURCHASE', 'DEPOSIT', 'WITHDRAWAL'
    status: varchar('status', { length: 50 }).notNull(), // 'PENDING', 'COMPLETED', 'FAILED', 'REVERSED'
    description: text('description'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => [
    index('idx_transactions_account_id').on(table.accountId),
    index('idx_transactions_timestamp').on(table.timestamp),
]);


// ==========================================
// 2. MOTOR DE GAMIFICACIÓN & RPG
// ==========================================

export const userStats = pgTable('user_stats', {
    userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    xp: integer('xp').default(0).notNull(),
    level: integer('level').default(1).notNull(),
    tokaCoins: integer('toka_coins').default(0).notNull(),
    // RPG Combat Stats
    baseHp: integer('base_hp').default(100).notNull(),
    baseMp: integer('base_mp').default(50).notNull(),
    baseAttack: integer('base_attack').default(10).notNull(),
    baseDefense: integer('base_defense').default(10).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('idx_user_stats_xp').on(table.xp),
    index('idx_user_stats_level').on(table.level),
]);

export const items = pgTable('items', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    itemType: varchar('item_type', { length: 50 }).notNull(), // 'WEAPON', 'POTION', 'HERO'
    power: integer('power').default(0).notNull(), // Puede ser ataque, defensa o recuperación
    rarity: varchar('rarity', { length: 50 }).notNull(), // 'COMMON', 'RARE', 'EPIC', 'MYTHIC'
    iconUrl: varchar('icon_url', { length: 255 }),
});

export const userInventory = pgTable('user_inventory', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    itemId: integer('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
    quantity: integer('quantity').default(1).notNull(),
    isEquipped: boolean('is_equipped').default(false).notNull(),
    acquiredAt: timestamp('acquired_at').defaultNow().notNull(),
});

export const leagues = pgTable('leagues', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(), // e.g., 'Bronce', 'Plata', 'Oro', 'Toka Diamante'
    minLevel: integer('min_level').notNull(),
    iconUrl: varchar('icon_url', { length: 255 }),
});

export const tokaLeague = pgTable('toka_league_registrations', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    leagueId: integer('league_id').references(() => leagues.id).notNull(),
    weeklyScore: integer('weekly_score').default(0).notNull(),
    seasonId: varchar('season_id', { length: 50 }).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('idx_league_season_score').on(table.leagueId, table.seasonId, table.weeklyScore),
]);

export const tokaSpins = pgTable('toka_spins', {
    userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    availableSpins: integer('available_spins').default(0).notNull(),
    totalSpinsUsed: integer('total_spins_used').default(0).notNull(),
    lastSpinAt: timestamp('last_spin_at'),
});

export const quests = pgTable('quests', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    targetMccCode: varchar('target_mcc_code', { length: 4 }).references(() => mccCodes.code),
    requiredAmount: integer('required_amount'), // Puede ser monto o conteo (e.g. 1 para compras únicas)
    rewardXp: integer('reward_xp').notNull(),
    rewardCoins: integer('reward_coins').default(0).notNull(),
    durationHours: integer('duration_hours'),
});

export const questsProgress = pgTable('quests_progress', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    questId: integer('quest_id').references(() => quests.id).notNull(),
    status: varchar('status', { length: 50 }).default('ACTIVE').notNull(), // 'ACTIVE', 'COMPLETED', 'FAILED'
    currentProgress: integer('current_progress').default(0).notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
}, (table) => [
    index('idx_quests_progress_user_status').on(table.userId, table.status),
]);

export const enemies = pgTable('enemies', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    hp: integer('hp').notNull(),
    attack: integer('attack').notNull(),
    defense: integer('defense').default(0).notNull(),
    rewardXp: integer('reward_xp').default(0).notNull(),
    rewardCoins: integer('reward_coins').default(0).notNull(),
    rewardItemId: integer('reward_item_id').references(() => items.id), // Ítem dropeado si es vencido
    iconUrl: varchar('icon_url', { length: 255 }),
});

export const spinRewards = pgTable('spin_rewards', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    rewardType: varchar('reward_type', { length: 50 }).notNull(), // 'COINS', 'XP', 'ITEM', 'CASHBACK'
    amount: integer('amount').default(0).notNull(), // 50 coins, 10 XP, etc.
    itemId: integer('item_id').references(() => items.id), // Nullable, solo si es rewardType = 'ITEM'
    probabilityWeight: decimal('probability_weight', { precision: 5, scale: 2 }).notNull(), // Porcentaje ej. 45.00
    color: varchar('color', { length: 20 }), // Para pintar el trozo de la ruleta
    isActive: boolean('is_active').default(true).notNull(), // Filtro de disponibilidad
});

export const shopItems = pgTable('shop_items', {
    id: serial('id').primaryKey(),
    itemId: integer('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
    priceCoins: integer('price_coins').notNull(), // Costo en TokaCoins
    isActive: boolean('is_active').default(true).notNull(), // Determina si está a la venta hoy
});

// ==========================================
// 3. DEFINICIÓN DE RELACIONES
// ==========================================

export const itemsRelations = relations(items, ({ many }) => ({
    userInventory: many(userInventory),
}));

export const userInventoryRelations = relations(userInventory, ({ one }) => ({
    user: one(users, {
        fields: [userInventory.userId],
        references: [users.id],
    }),
    item: one(items, {
        fields: [userInventory.itemId],
        references: [items.id],
    }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
    accounts: many(accounts),
    stats: one(userStats),
    leagueRegistration: many(tokaLeague),
    spins: one(tokaSpins),
    questsProgress: many(questsProgress),
    inventory: many(userInventory),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
    transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    account: one(accounts, {
        fields: [transactions.accountId],
        references: [accounts.id],
    }),
    merchant: one(merchants, {
        fields: [transactions.merchantId],
        references: [merchants.id],
    }),
}));

export const merchantsRelations = relations(merchants, ({ one }) => ({
    mccCode: one(mccCodes, {
        fields: [merchants.mccCode],
        references: [mccCodes.code],
    }),
}));

export const tokaLeagueRelations = relations(tokaLeague, ({ one }) => ({
    user: one(users, {
        fields: [tokaLeague.userId],
        references: [users.id],
    }),
    league: one(leagues, {
        fields: [tokaLeague.leagueId],
        references: [leagues.id],
    }),
}));

export const questsProgressRelations = relations(questsProgress, ({ one }) => ({
    user: one(users, {
        fields: [questsProgress.userId],
        references: [users.id],
    }),
    quest: one(quests, {
        fields: [questsProgress.questId],
        references: [quests.id],
    }),
}));

export const enemiesRelations = relations(enemies, ({ one }) => ({
    dropItem: one(items, {
        fields: [enemies.rewardItemId],
        references: [items.id],
    }),
}));

export const shopItemsRelations = relations(shopItems, ({ one }) => ({
    item: one(items, {
        fields: [shopItems.itemId],
        references: [items.id],
    }),
}));