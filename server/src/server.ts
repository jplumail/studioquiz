import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { type StudioQuizEvent } from './shared/types';

interface Message {
  pseudo: string;
  content: any;
}

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

server.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', (data, isBinary) => {
    const message: StudioQuizEvent = JSON.parse(data.toString());
    console.log('Received:', message);

    server.clients.forEach(client => {
      console.log("client.readyState", client.readyState);
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message), { binary: isBinary });
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log(`WebSocket server is running on port ${port}`);