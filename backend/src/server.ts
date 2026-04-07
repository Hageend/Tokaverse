import Fastify from 'fastify';
import cors from '@fastify/cors';
import { spinsRoutes } from './routes/spins';

const fastify = Fastify({ logger: true });

// CORS para frontend Expo
fastify.register(cors, { origin: true });

// Rutas
fastify.register(spinsRoutes);

fastify.get('/status', async () => {
    return { status: 'TokaVerse API Running', version: '1.0.0' };
});

fastify.get('/', async () => {
    return {
        message: "Bienvenido a TOKAVERSE API",
        status: "online",
        team: "Migalovers"
    };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Backend de TokaVerse listo en el puerto 3000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();