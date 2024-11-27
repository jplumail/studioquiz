import { Server as SocketIOServer, Socket as SocketIOSocket } from 'socket.io';
import { createServer, Server } from "node:http";
import { PubSub } from "@google-cloud/pubsub";
import { createAdapter } from "@socket.io/gcp-pubsub-adapter";
import next from "next";
import { Player, GameState, Question, Answer, DateMilliseconds, Score, SocketId, ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from './shared/types';

const production = process.env.NODE_ENV === 'production';

const pubsub = new PubSub({
  projectId: "studioquiz",
  emulatorMode: !production,
});

const topic = pubsub.topic("chat");

// test if the topic doesnt exist, create it
topic.exists().then(([exists]) => {
  if (!exists) {
    topic.create().then(() => {
      console.log("Topic created");
    });
  }
});

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || '3000');
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

await app.prepare();

// Create an HTTP server
const httpServer: Server = createServer(handler);

console.log('Starting HTTP server...');
httpServer.listen(port, () => {
  console.log(`HTTP server is running on port ${port}`);
});

const placeholderQuestions = ["What is the capital of France?", "What is the capital of Germany?", "What is the capital of Italy?"] as Question[];
const placeholderAnswers = ["Paris", "Berlin", "Rome"] as Answer[];

const pointsArray: number[] = [4, 3, 3, 2, 1, 1, 1, 1];
const countdown = 10 * 1000 as DateMilliseconds;  // 10 seconds

function getCurrentTime() {
  return Date.now() as DateMilliseconds;
}

class GameServer {
  namespace;
  game: GameState;

  constructor(httpServer: Server) {
    const origin = production ? "https://studioquiz.web.app" : "http://localhost:3000";
    console.log("Creating Socket.IO server...");
    const io = new SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(httpServer, {
      adapter: createAdapter(topic, { subscriptionOptions: { messageRetentionDuration: { seconds: 600 } } }),
      cors: {
        origin: origin,
        methods: ["GET", "POST"]
      }
    });

    this.namespace = io.of("/");

    this.game = {
      scores: {},
      currentIndex: 0,
      questions: placeholderQuestions,
      answers: placeholderAnswers,
      hasAnswered: {},
      status: "LOBBY",
      registeredPlayers: {},
    }
  }

  async init() {
    await this.namespace.adapter.init();

    console.log('Listening for events...');
    console.log('Listening for game state');
    this.namespace.on('gameState', (newState: GameState) => {
      console.log('Received game state');
      this.game = newState;
    });

    console.log('Listening for connection');
    this.namespace.on('connection', (socket: SocketIOSocket) => {
      console.log('Client connected');
      socket.emit('scores', this.game.scores);
      socket.on('registerPlayer', (player: Player) => {
        this.game.scores[player] = 0 as Score;
        this.game.registeredPlayers[socket.id as SocketId] = player;
        this.updateGame();
        this.sendScores();
      });

      socket.on('playerMessage', (player: Player, message: string) => this.handlePlayerMessage(player, message));
      socket.on('askStartGame', () => this.startGame());
      socket.on('disconnect', () => this.unregisterClient(socket));
    });
  }

  updateGame() {
    this.namespace.serverSideEmit('gameState', this.game);
  }

  unregisterClient(socket: SocketIOSocket) {
    const player = this.game.registeredPlayers[socket.id as SocketId];
    if (player) {
      delete this.game.registeredPlayers[socket.id as SocketId];
      delete this.game.scores[player];
      this.sendScores();
      this.updateGame();
    }
    console.log('Client disconnected');
  }

  startGame() {
    this.namespace.emit('startGame');
    this.game.currentIndex = -1;
    this.game.status = 'WAITING';
    this.nextQuestion();
    this.updateGame();
  }

  nextQuestion() {
    if (this.game.currentIndex !== null) {
      this.game.currentIndex++;
      if (this.game.currentIndex >= this.game.questions.length) {
        this.endGame();
        this.updateGame();
        return;
      }
      this.game.hasAnswered = Object.keys(this.game.registeredPlayers).reduce((acc, player) => {
        acc[player] = false;
        return acc;
      }, {} as Record<string, boolean>);
      
      const endTime = getCurrentTime() + countdown as DateMilliseconds;
      this.namespace.emit('startQuestion', this.game.questions[this.game.currentIndex], this.game.currentIndex + 1, endTime);
      this.game.status = 'QUESTION';
      this.updateGame();
      setTimeout(() => this.endQuestion(), countdown);
    }
  }

  endQuestion() {
    if (this.game.currentIndex !== null) {
      this.game.status = 'WAITING';
      
      this.namespace.emit('endQuestion', this.game.answers[this.game.currentIndex]);
      this.updateGame();
      setTimeout(() => this.nextQuestion(), 5000);
    }
  }

  endGame() {
    this.namespace.emit('endGame');
    this.game.status = 'FINISHED';
    this.updateGame();
  }

  handlePlayerMessage(player: Player, message: string) {
    if (this.game.status == 'QUESTION') {
      if (!this.game.hasAnswered[player]) {
        if ((this.game.currentIndex >= 0) && (this.game.currentIndex < this.game.answers.length) && this.checkAnswer(message, this.game.answers[this.game.currentIndex])) {
          const score = this.game.scores[player];
          if (score !== undefined) {
            const numCorrect = Object.values(this.game.hasAnswered).filter(value => value).length;
            const newScore = score + pointsArray[numCorrect] as Score;
            this.game.scores[player] = newScore;
            this.sendScores();
            this.namespace.emit('correctAnswer', player, pointsArray[numCorrect]);
            this.game.hasAnswered[player] = true;
          }
        }
      }
      if (!this.game.hasAnswered[player]) {
        this.namespace.emit('playerMessage', player, message);
      }
    } else {
      this.namespace.emit('playerMessage', player, message);
    }
    this.updateGame();
  }

  checkAnswer(attempt: string, answer: string): boolean {
    return attempt.toLowerCase() === answer.toLowerCase();
  }

  sendScores() {
    this.namespace.emit('scores', this.game.scores);
  }
}

const server = new GameServer(httpServer);
console.log("Starting server...");
await server.init();
console.log("Server started");