import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
    users,
    accounts,
    mccCodes,
    merchants,
    transactions,
    userStats,
    leagues,
    tokaLeague,
    tokaSpins,
    quests,
    questsProgress,
    items,
    userInventory,
    spinRewards,
    enemies
} from './schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
    console.log('Sembrando datos...');

    // 1. MCC Codes
    console.log('--> Insertando MCC Codes...');
    await db.insert(mccCodes).values([
        { code: '5812', category: 'Cafetería y Restaurantes', description: 'Lugares de comida' },
        { code: '7832', category: 'Cine y Entretenimiento', description: 'Peliculas y recreación' },
        { code: '5411', category: 'Supermercados', description: 'Abarrotes y despensa' },
    ]);

    // 2. Merchants
    console.log('--> Insertando Merchants...');
    const insertedMerchants = await db.insert(merchants).values([
        { name: 'Starbucks', mccCode: '5812' },
        { name: 'Cinépolis', mccCode: '7832' },
        { name: 'Walmart', mccCode: '5411' },
    ]).returning();

    // 3. Leagues
    console.log('--> Insertando Ligas de Toka...');
    const insertedLeagues = await db.insert(leagues).values([
        { name: 'Bronce', minLevel: 1, iconUrl: '/badges/bronce.png' },
        { name: 'Plata', minLevel: 5, iconUrl: '/badges/plata.png' },
        { name: 'Oro', minLevel: 10, iconUrl: '/badges/oro.png' },
        { name: 'Toka Diamante', minLevel: 20, iconUrl: '/badges/diamante.png' },
    ]).returning();

    // 4. Users
    console.log('--> Insertando Usuarios...');
    const insertedUsers = await db.insert(users).values([
        { ssoId: 'SSO-001-LRUX', email: 'luisruben@toka.mx', firstName: 'Luis', lastName: 'Ruben' },
        { ssoId: 'SSO-002-RBACK', email: 'ramses@toka.mx', firstName: 'Ramses', lastName: 'Backend' },
    ]).returning();
    const luis = insertedUsers[0];
    const ramses = insertedUsers[1];

    // 5. User Stats & Spins
    console.log('--> Insertando Gamification Stats...');
    await db.insert(userStats).values([
        { userId: luis.id, xp: 850, level: 6, tokaCoins: 300 },
        { userId: ramses.id, xp: 2100, level: 12, tokaCoins: 1200 },
    ]);

    await db.insert(tokaSpins).values([
        { userId: luis.id, availableSpins: 2, totalSpinsUsed: 5 },
        { userId: ramses.id, availableSpins: 5, totalSpinsUsed: 14 },
    ]);

    await db.insert(tokaLeague).values([
        { userId: luis.id, leagueId: insertedLeagues[1].id, weeklyScore: 120, seasonId: 'S-2026-04' },
        { userId: ramses.id, leagueId: insertedLeagues[2].id, weeklyScore: 450, seasonId: 'S-2026-04' },
    ]);

    // 6. Accounts
    console.log('--> Insertando Cuentas...');
    const insertedAccounts = await db.insert(accounts).values([
        { userId: luis.id, accountType: 'DEBIT', balance: '2500.50', currency: 'MXN' },
        { userId: ramses.id, accountType: 'CREDIT', balance: '10500.00', currency: 'MXN' },
    ]).returning();

    // 7. Transactions
    console.log('--> Insertando Transacciones de ejemplo...');
    await db.insert(transactions).values([
        { accountId: insertedAccounts[0].id, merchantId: insertedMerchants[0].id, amount: '120.00', type: 'PURCHASE', status: 'COMPLETED', description: 'Frappuccino' },
        { accountId: insertedAccounts[1].id, merchantId: insertedMerchants[1].id, amount: '350.00', type: 'PURCHASE', status: 'COMPLETED', description: 'Entradas VIP' },
        { accountId: insertedAccounts[1].id, merchantId: insertedMerchants[2].id, amount: '1500.00', type: 'PURCHASE', status: 'COMPLETED', description: 'Despensa de la semana' },
    ]);

    // 8. Quests & Progress
    console.log('--> Insertando Misiones (Quests)...');
    const insertedQuests = await db.insert(quests).values([
        { title: 'Ahorro Maestro', description: 'No hagas gastos en cafetería por 3 días', targetMccCode: '5812', rewardXp: 150, rewardCoins: 50 },
        { title: 'Cinéfilo Responsable', description: 'Gasta al menos $300 M.N en Cine', targetMccCode: '7832', requiredAmount: 300, rewardXp: 300, rewardCoins: 100 },
    ]).returning();

    await db.insert(questsProgress).values([
        { userId: luis.id, questId: insertedQuests[0].id, status: 'ACTIVE', currentProgress: 1 },
        { userId: ramses.id, questId: insertedQuests[1].id, status: 'COMPLETED', currentProgress: 350 },
    ]);

    // 9. Armas e Inventario
    console.log('--> Insertando Armería, Pociones y Héroes Míticos...');
    const insertedItems = await db.insert(items).values([
        { name: 'Espada de Fuego', itemType: 'WEAPON', power: 50, rarity: 'MYTHIC', iconUrl: '/items/espada_fuego.png' },
        { name: 'Escudo Toka', itemType: 'WEAPON', power: 30, rarity: 'EPIC', iconUrl: '/items/escudo_toka.png' },
        { name: 'Daga de Principiante', itemType: 'WEAPON', power: 5, rarity: 'COMMON', iconUrl: '/items/daga.png' },
        { name: 'Poción Mayor de Vida', itemType: 'POTION', power: 100, rarity: 'RARE', iconUrl: '/items/pocion_vida.png' },
        { name: 'Poción Menor de Maná (MP)', itemType: 'POTION', power: 30, rarity: 'COMMON', iconUrl: '/items/pocion_mana.png' },
        { name: 'Guerrero Toka (Héroe)', itemType: 'HERO', power: 150, rarity: 'EPIC', iconUrl: '/heroes/guerrero_toka.png' },
    ]).returning();

    console.log('--> Asignando Ítems a la mochila de los usuarios...');
    await db.insert(userInventory).values([
        { userId: luis.id, itemId: insertedItems[2].id, quantity: 1, isEquipped: true },
        { userId: ramses.id, itemId: insertedItems[0].id, quantity: 1, isEquipped: true },
        { userId: ramses.id, itemId: insertedItems[1].id, quantity: 1, isEquipped: true },
    ]);

    // 10. Spin Rewards
    console.log('--> Construyendo Configuración de Recompensas (Spinner)...');
    await db.insert(spinRewards).values([
        { name: '10 Toka Coins', rewardType: 'COINS', amount: 10, probabilityWeight: '40.00', color: '#FCD34D', isActive: true },
        { name: '50 Toka Coins', rewardType: 'COINS', amount: 50, probabilityWeight: '20.00', color: '#FDE68A', isActive: true },
        { name: '500 XP Boost', rewardType: 'XP', amount: 500, probabilityWeight: '30.00', color: '#6EE7B7', isActive: true },
        { name: 'Daga Básica', rewardType: 'ITEM', itemId: insertedItems[2].id, probabilityWeight: '9.00', color: '#9CA3AF', isActive: true },
        { name: 'Espada Mítica', rewardType: 'ITEM', itemId: insertedItems[0].id, probabilityWeight: '1.00', color: '#F87171', isActive: true },
        { name: 'Poción Mayor', rewardType: 'ITEM', itemId: insertedItems[3].id, probabilityWeight: '0.00', color: '#EF4444', isActive: false },
    ]);

    // 11. Enemigos del Mapa
    console.log('--> Despertando Enemigos Financieros (Bosses)...');
    await db.insert(enemies).values([
        { name: 'Slime de las Deudas', hp: 50, attack: 5, defense: 2, rewardXp: 20, rewardCoins: 10, iconUrl: '/enemies/slime.png' },
        { name: 'Gólem de la Inflación', hp: 300, attack: 25, defense: 15, rewardXp: 150, rewardCoins: 100, rewardItemId: insertedItems[1].id, iconUrl: '/enemies/golem.png' },
        { name: 'Dragón del Buró (Jefe Mutante)', hp: 1000, attack: 70, defense: 40, rewardXp: 1000, rewardCoins: 500, rewardItemId: insertedItems[0].id, iconUrl: '/enemies/dragon.png' },
    ]);

    console.log('Base de datos lista.');
    process.exit(0);
}

main();