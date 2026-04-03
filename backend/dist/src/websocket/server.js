"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
exports.broadcast = broadcast;
exports.getConnectedClientCount = getConnectedClientCount;
const ws_1 = require("ws");
let wss = null;
function setupWebSocket(server) {
    wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws, _req) => {
        console.log('[WS] Client connected');
        ws.on('close', () => {
            console.log('[WS] Client disconnected');
        });
        ws.on('error', (err) => {
            console.error('[WS] Client error:', err.message);
        });
        // Send a ping on connect so client can verify connection
        ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() }));
    });
    console.log('[WS] WebSocket server ready on /ws');
}
function broadcast(event) {
    if (!wss)
        return;
    const data = JSON.stringify(event);
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(data);
        }
    });
}
function getConnectedClientCount() {
    return wss ? wss.clients.size : 0;
}
//# sourceMappingURL=server.js.map