// @ts-check
/**
 * @import { StudioQuizEvent, Score, Player } from '../../shared/types';
 */

import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const port = process.env.PORT || 8080;

// Create an HTTP server
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

httpServer.listen(port, () => {
  console.log(`HTTP server is running on port ${port}`);
});


class Server {
  /**
   * @param {http.Server} httpServer
   */
  constructor(httpServer) {
    this.server = new WebSocketServer({ server: httpServer });
    /** @type {Score[]} */
    this.scores = [];
    /** @type {Map<WebSocket, Player>} */
    this.websocketToPlayer = new Map();
    this.game = {
      scores: this.scores,
      currentQuestion: null,
      currentAnswer: null,
    };

    this.server.on('connection', (ws) => this.registerClient(ws));
  }

  /**
   * Registers a new client.
   * @param {WebSocket} ws
   */
  registerClient(ws) {
    console.log('Client connected');

    ws.send(JSON.stringify({ type: 'welcome', payload: 'Welcome to the server!' }));
    ws.send(JSON.stringify({ type: 'scores', payload: this.scores }));

    ws.on('message', (data) => this.handleMessage(ws, data));
    ws.on('close', () => this.unregisterClient(ws));
  }

  /**
   * Unregisters a client.
   * @param {WebSocket} ws
   */
  unregisterClient(ws) {
    const player = this.websocketToPlayer.get(ws);
    if (player) {
      this.websocketToPlayer.delete(ws);
      this.scores = this.scores.filter(score => score.player !== player);
      this.sendToAll({ type: 'scores', payload: this.scores });
    }
    console.log('Client disconnected');
  }

  /**
   * Handles incoming messages from clients.
   * @param {WebSocket} ws
   * @param {import('ws').RawData} data
   */
  handleMessage(ws, data) {
    /** @type {StudioQuizEvent} */
    const message = JSON.parse(data.toString());

    if (message.type === 'registerPlayer') {
      const player = message.payload;
      this.scores.push({ player: player, score: 0 });
      this.websocketToPlayer.set(ws, player);
      this.sendToAll({ type: 'scores', payload: this.scores });
    } else if (message.type === 'playerMessage') {
      this.sendToAll(message);
    }
  }

  /**
   * Sends a message to all connected clients.
   * @param {StudioQuizEvent} message
   */
  sendToAll(message) {
    this.websocketToPlayer.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

const server = new Server(httpServer);