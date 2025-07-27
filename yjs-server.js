import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/lib/utils.js';

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws, req) => {
	console.log('New WebSocket connection');
	setupWSConnection(ws, req);
});

console.log('Yjs WebSocket server running on ws://localhost:1234');
