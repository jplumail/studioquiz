import { WebSocketServer, WebSocket } from 'ws';

interface Message {
  pseudo: string;
  content: any;
}

const server = new WebSocketServer({ port: 8080 });

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

console.log('WebSocket server is running on ws://localhost:8080');