import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { tokaSpins, spinRewards, userStats, userInventory } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export async function spinsRoutes(app: FastifyInstance) {

    // ─── GET /spins/:userId/rewards ─────────────────────────────────────
    // Returns active spin rewards (wheel slices) + user's available spins
    app.get<{ Params: { userId: string } }>('/spins/:userId/rewards', async (request, reply) => {
        const userId = parseInt(request.params.userId, 10);
        if (isNaN(userId)) return reply.status(400).send({ error: 'userId inválido' });

        // Fetch active rewards
        const rewards = await db
            .select()
            .from(spinRewards)
            .where(eq(spinRewards.isActive, true));

        // Fetch user spin balance
        const [userSpinData] = await db
            .select()
            .from(tokaSpins)
            .where(eq(tokaSpins.userId, userId));

        return {
            rewards,
            availableSpins: userSpinData?.availableSpins ?? 0,
            totalSpinsUsed: userSpinData?.totalSpinsUsed ?? 0,
        };
    });

    // ─── POST /spins/:userId/spin ───────────────────────────────────────
    // Performs a weighted-random spin and grants the reward
    app.post<{ Params: { userId: string } }>('/spins/:userId/spin', async (request, reply) => {
        const userId = parseInt(request.params.userId, 10);
        if (isNaN(userId)) return reply.status(400).send({ error: 'userId inválido' });

        // 1. Check available spins
        const [userSpinData] = await db
            .select()
            .from(tokaSpins)
            .where(eq(tokaSpins.userId, userId));

        if (!userSpinData || userSpinData.availableSpins <= 0) {
            return reply.status(403).send({ error: 'No tienes giros disponibles' });
        }

        // 2. Get active rewards
        const rewards = await db
            .select()
            .from(spinRewards)
            .where(eq(spinRewards.isActive, true));

        if (rewards.length === 0) {
            return reply.status(500).send({ error: 'No hay recompensas configuradas' });
        }

        // 3. Weighted random selection
        const totalWeight = rewards.reduce((sum, r) => sum + parseFloat(r.probabilityWeight), 0);
        let random = Math.random() * totalWeight;
        let winner = rewards[0];

        for (const reward of rewards) {
            random -= parseFloat(reward.probabilityWeight);
            if (random <= 0) {
                winner = reward;
                break;
            }
        }

        // 4. Decrement spins
        await db
            .update(tokaSpins)
            .set({
                availableSpins: sql`${tokaSpins.availableSpins} - 1`,
                totalSpinsUsed: sql`${tokaSpins.totalSpinsUsed} + 1`,
                lastSpinAt: new Date(),
            })
            .where(eq(tokaSpins.userId, userId));

        // 5. Grant reward based on type
        switch (winner.rewardType) {
            case 'COINS':
                await db
                    .update(userStats)
                    .set({ tokaCoins: sql`${userStats.tokaCoins} + ${winner.amount}` })
                    .where(eq(userStats.userId, userId));
                break;

            case 'XP':
                await db
                    .update(userStats)
                    .set({ xp: sql`${userStats.xp} + ${winner.amount}` })
                    .where(eq(userStats.userId, userId));
                break;

            case 'ITEM':
                if (winner.itemId) {
                    await db.insert(userInventory).values({
                        userId,
                        itemId: winner.itemId,
                        quantity: 1,
                    });
                }
                break;
        }

        // 6. Return the winning reward + remaining spins
        return {
            reward: winner,
            remainingSpins: userSpinData.availableSpins - 1,
        };
    });

    // ─── POST /spins/:userId/add ────────────────────────────────────────
    // Grants spins to a user (for quests, testing, etc.)
    app.post<{ Params: { userId: string }; Body: { amount: number } }>('/spins/:userId/add', async (request, reply) => {
        const userId = parseInt(request.params.userId, 10);
        const { amount } = request.body as { amount: number };

        if (isNaN(userId)) return reply.status(400).send({ error: 'userId inválido' });
        if (!amount || amount <= 0) return reply.status(400).send({ error: 'amount debe ser > 0' });

        // Upsert: if user has no spin record, create one
        const [existing] = await db
            .select()
            .from(tokaSpins)
            .where(eq(tokaSpins.userId, userId));

        if (existing) {
            await db
                .update(tokaSpins)
                .set({ availableSpins: sql`${tokaSpins.availableSpins} + ${amount}` })
                .where(eq(tokaSpins.userId, userId));
        } else {
            await db.insert(tokaSpins).values({
                userId,
                availableSpins: amount,
                totalSpinsUsed: 0,
            });
        }

        return { success: true, added: amount };
    });
}
