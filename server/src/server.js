// @ts-check
/**
 * @import { StudioQuizEvent, Score, Player, PlayerMessageEvent } from '../../shared/types';
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

const placeholderQuestions = [
  "What is the capital of France?",
  "What is the capital of Germany?",
  "What is the capital of Italy?",
]

const placeholderAnswers = [
  "Paris",
  "Berlin",
  "Rome",
]


class Server {
  /**
   * @param {http.Server} httpServer
   */
  constructor(httpServer) {
    this.server = new WebSocketServer({ server: httpServer });
    /** @type {Score[]} */
    this.scores = [];
    /** @type {Map<WebSocket, Player>} */
    this.registeredPlayers = new Map();
    this.countdown = 10;  // 10 seconds

    /** 
     * @type {{
     *  scores: Score[],
     *  currentIndex: number | null,
     *  questions: string[],
     *  answers: string[],
     *  hasAnswered: Map<Player, boolean>
     * }}
    */
    this.game = {
      scores: this.scores,
      currentIndex: null,
      questions: placeholderQuestions,
      answers: placeholderAnswers,
      hasAnswered: new Map()
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
    const player = this.registeredPlayers.get(ws);
    if (player) {
      this.registeredPlayers.delete(ws);
      this.scores = this.scores.filter(score => score.player !== player);
      this.sendToAll({ type: 'scores', payload: this.scores });
    }
    console.log('Client disconnected');
  }

  startGame() {
    this.sendToAll({ type: 'startGame' });
    this.game.currentIndex = -1;
    this.nextQuestion();
  }

  nextQuestion() {
    if (this.game.currentIndex) {
      this.game.currentIndex++;
      if (this.game.currentIndex >= this.game.questions.length) {
        this.endGame();
        return;
      }
      this.sendToAll({ type: 'startQuestion', payload: {question: this.game.questions[this.game.currentIndex], end: Date.now()+this.countdown*1000} });
      setTimeout(() => this.endQuestion(), this.countdown * 1000);

    }
  }

  endQuestion() {
    if (this.game.currentIndex) {
      this.sendToAll({ type: 'endQuestion', payload: this.game.answers[this.game.currentIndex] });
      setTimeout(() => this.nextQuestion(), 5000);
    }
  }

  endGame() {
    this.sendToAll({ type: 'endGame' });
  }

  /**
   * Handles incoming messages from players.
   * @param {WebSocket} ws
   * @param {PlayerMessageEvent} message
   */
  handlePlayerMessage(ws, message) {
    const player = this.registeredPlayers.get(ws);
    if (player) {
      if (this.game.currentIndex !== null) {
        if (this.checkAnswer(message.payload.content.message, this.game.answers[this.game.currentIndex])) {
          if (!this.game.hasAnswered.get(player)) {
            const score = this.scores.find(score => score.player === player);
            if (score) {
              score.score++;
              this.sendToAll({ type: 'scores', payload: this.scores });
            }
            this.sendToAll({ type: 'correctAnswer', payload: player });
            this.game.hasAnswered.set(player, true);
          }
        }
        if (!this.game.hasAnswered.get(player)) {
          this.sendToAll(message);
        }
      } else {
        this.sendToAll(message);
      }
    }
  }

  /**
   * Checks if attempt is correct
   * @param {string} attempt
   * @param {string} answer
   */
  checkAnswer(attempt, answer) {
    return attempt.toLowerCase() === answer.toLowerCase()
  }

  /**
   * Handles incoming messages from clients.
   * @param {WebSocket} ws
   * @param {import('ws').RawData} data
   */
  handleMessage(ws, data) {
    /** @type {StudioQuizEvent} */
    const message = JSON.parse(data.toString());
    console.log("message received: ", message)

    if (message.type === 'registerPlayer') {
      const player = message.payload;
      this.scores.push({ player: player, score: 0 });
      this.registeredPlayers.set(ws, player);
      this.sendToAll({ type: 'scores', payload: this.scores });
    } else if (message.type === 'playerMessage') {
      this.handlePlayerMessage(ws, message);
    } else if (message.type === 'askStartGame') {
      this.startGame();
    }
  }

  /**
   * Sends a message to all connected clients.
   * @param {StudioQuizEvent} message
   */
  sendToAll(message) {
    console.log('Sending to all:', message);
    this.registeredPlayers.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

const server = new Server(httpServer);