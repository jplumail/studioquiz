import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { StudioQuizEvent, Score, type Player } from './shared/types';

const port = process.env.PORT || 8080;

// Create an HTTP server
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

httpServer.listen(port, () => {
  console.log(`HTTP server is running on port ${port}`);
});

// WebSocket server
const server = new WebSocketServer({ server: httpServer });

let scores: Score[] = [];
let websocketToPlayer: Map<WebSocket, Player> = new Map();

function sendToAll(message: StudioQuizEvent) {
  websocketToPlayer.forEach((_, client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

server.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.send(JSON.stringify({ type: 'welcome', payload: 'Welcome to the server!' }));
  ws.send(JSON.stringify({ type: 'scores', payload: scores }));

  ws.on('message', (data, isBinary) => {
    const message: StudioQuizEvent = JSON.parse(data.toString());
    
    if (message.type === 'registerPlayer') {
      const player = message.payload;
      scores.push({ player: player, score: 0 });
      websocketToPlayer.set(ws, player);
      sendToAll({ type: 'scores', payload: scores });
    } else if (message.type === 'playerMessage') {
      sendToAll(message);
    }
  });

  ws.on('close', () => {
    const player = websocketToPlayer.get(ws);
    if (player) {
      websocketToPlayer.delete(ws);
      scores = scores.filter(score => score.player !== player);
      sendToAll({ type: 'scores', payload: scores });
    }
    console.log('Client disconnected');
  });
});

console.log(`WebSocket server is running on port ${port}`);

// every 1 second, send a random score update
setInterval(() => {
  const player = scores[Math.floor(Math.random() * scores.length)];
  if (player) {
    player.score += Math.floor(Math.random() * 10);
    sendToAll({ type: 'scores', payload: scores });
  }
}, 1000);