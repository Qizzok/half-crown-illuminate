import fastify from 'fastify';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import host from './host.js';

const PORT = 3000;

const app = fastify();
app.register(helmet);
app.register(websocket);
app.register(host);
app.listen({ port: PORT });
