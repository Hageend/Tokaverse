import Fastify from 'fastify';
import socketio from 'socket.io';

const fastify = Fastify({ logger: true });

fastify.get('/status', async () => {
    return { status: 'TokaVerse API Running', version: '1.0.0' };
});

fastify.get('/', async (request, reply) => {
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