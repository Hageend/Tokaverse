import Fastify from 'fastify';
import { Server } from 'socket.io';
import { leagueRoutes } from './leagueRoutes';

import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });

// Registrar CORS globalmente para habilitar la web
fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
});

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
        // Initialize WebSockets using the raw fastify.server
        const io = new Server(fastify.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            fastify.log.info(`Client connected to WebSockets: ${socket.id}`);
        });

        // Pass fastify & io to routes BEFORE listen
        await leagueRoutes(fastify, io);

        // Start listening
        await fastify.listen({ port: 3000, host: '0.0.0.0' });

        console.log('Backend de TokaVerse listo en el puerto 3000 (HTTP + WebSockets)');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();