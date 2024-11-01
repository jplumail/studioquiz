import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

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

  ws.on('message', (data: string) => {
    const message: Message = JSON.parse(data);
    console.log(`Mon engin: ${message.pseudo} ${message.content}`);

    // Example of sending a type-safe message back
    const response = { type: 'response', payload: 'Server received your message' };
    ws.send(JSON.stringify(response));
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log(`WebSocket server is running on port ${port}`);