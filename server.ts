import { Server as SocketIOServer, Socket as SocketIOSocket } from 'socket.io';
import { createServer, Server as NodeServer } from "node:http";
import { PubSub } from "@google-cloud/pubsub";
import { createAdapter } from "@socket.io/gcp-pubsub-adapter";
import next from "next";
import { Player, GameState, Question, Answer, DateMilliseconds, Score, SocketId, ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, State, RoomId } from './shared/types';

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
const httpServer = createServer(handler);

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
  game: GameState;
  roomEmit: (event: keyof ServerToClientEvents, ...args: Parameters<ServerToClientEvents[keyof ServerToClientEvents]>) => void;
  serverSideRoomEmit: (state: GameState) => boolean;

  constructor(
    roomEmit: (event: keyof ServerToClientEvents, ...args: Parameters<ServerToClientEvents[keyof ServerToClientEvents]>) => void,
    serverSideRoomEmit: (state: GameState) => boolean
  ) {
    this.game = {
      scores: {},
      currentIndex: 0,
      questions: placeholderQuestions,
      answers: placeholderAnswers,
      hasAnswered: {},
      status: State.LOBBY,
      registeredPlayers: {},
    }
    this.roomEmit = roomEmit;
    this.serverSideRoomEmit = serverSideRoomEmit;
  }

  onConnection(socket: SocketIOSocket) {
    console.log('Client connected');
    this.roomEmit('scores', this.game.scores);
    socket.on('registerPlayer', (player: Player) => {
      this.game.scores[player] = 0 as Score;
      this.game.registeredPlayers[socket.id as SocketId] = player;
      this.updateGame();
      this.sendScores();
    });

    socket.on('playerMessage', (player: Player, message: string) => this.handlePlayerMessage(player, message));
    socket.on('askStartGame', () => this.startGame());
    socket.on('disconnect', () => this.unregisterClient(socket));
  }

  updateGame() {
    this.serverSideRoomEmit(this.game);
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
    this.roomEmit('startGame');
    this.game.currentIndex = -1;
    this.game.status = State.WAITING;
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
      this.roomEmit('startQuestion', this.game.questions[this.game.currentIndex], this.game.currentIndex + 1, endTime);
      this.game.status = State.QUESTION;
      this.updateGame();
      setTimeout(() => this.endQuestion(), countdown);
    }
  }

  endQuestion() {
    if (this.game.currentIndex !== null) {
      this.game.status = State.WAITING;

      this.roomEmit('endQuestion', this.game.answers[this.game.currentIndex]);
      this.updateGame();
      setTimeout(() => this.nextQuestion(), 5000);
    }
  }

  endGame() {
    this.roomEmit('endGame');
    this.game.status = State.FINISHED;
    this.updateGame();
  }

  handlePlayerMessage(player: Player, message: string) {
    if (this.game.status == State.QUESTION) {
      if (!this.game.hasAnswered[player]) {
        if ((this.game.currentIndex >= 0) && (this.game.currentIndex < this.game.answers.length) && this.checkAnswer(message, this.game.answers[this.game.currentIndex])) {
          const score = this.game.scores[player];
          if (score !== undefined) {
            const numCorrect = Object.values(this.game.hasAnswered).filter(value => value).length;
            const newScore = score + pointsArray[numCorrect] as Score;
            this.game.scores[player] = newScore;
            this.sendScores();
            this.roomEmit('correctAnswer', player, pointsArray[numCorrect]);
            this.game.hasAnswered[player] = true;
          }
        }
      }
      if (!this.game.hasAnswered[player]) {
        this.roomEmit('playerMessage', player, message);
      }
    } else {
      this.roomEmit('playerMessage', player, message);
    }
    this.updateGame();
  }

  checkAnswer(attempt: string, answer: string): boolean {
    return attempt.toLowerCase() === answer.toLowerCase();
  }

  sendScores() {
    this.roomEmit('scores', this.game.scores);
  }
}

class Server {
  gameServers: Record<RoomId, GameServer>;
  io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

  constructor(httpServer: NodeServer) {
    this.gameServers = {};

    console.log("Creating Socket.IO server...");
    this.io = new SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(httpServer, {
      adapter: createAdapter(topic, { subscriptionOptions: { messageRetentionDuration: { seconds: 600 } } }),
    });
  }

  joinRoom(room: RoomId, socket: SocketIOSocket) {
    socket.join(room);
    if (!this.roomExists(room)) {
      this.createRoom(room);
    }
    console.log("private adapter broadcast", this.io.of("/").to("haha").adapter.broadcast);
    this.gameServers[room].onConnection(socket)
  }

  roomExists(room: RoomId) {
    return this.gameServers[room] !== undefined;
  }

  createRoom(room: RoomId) {
    const gs = new GameServer(
      (ev, ...args) => this.io.of("/").to(room).emit(ev, ...args),
      (state: GameState) => this.io.of("/").serverSideEmit("gameState", room, state)
    );
    this.gameServers[room] = gs;
  }

  async init() {
    await this.io.of('/').adapter.init();

    this.io.of("/").on('connection', (socket: SocketIOSocket) => {
      socket.on('joinRoom', (room: RoomId, callback) => {
        this.joinRoom(room, socket)
        callback();
      });
    })
    this.io.of("/").on('gameState', (room: RoomId, newState: GameState) => {
      if (!this.gameServers[room]) {
        this.createRoom(room);
      }
      this.gameServers[room].game = newState;
    });
  }
}

const server = new Server(httpServer);
console.log("Starting server...");
await server.init();
console.log("Server started");