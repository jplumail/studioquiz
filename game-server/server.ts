import { GameState, ServerToClientEvents, State, Player, Score, SocketId, DateMilliseconds, RoomId, ClientToServerEvents, InterServerEvents, SocketData, Answer, Question } from "../shared/types.js";
import { gameServerPort, production } from "../shared/constants.js";
import { createAdapter } from "@socket.io/gcp-pubsub-adapter";
import { Server as SocketIOServer, Socket as SocketIOSocket } from 'socket.io';
import { createServer, Server as NodeServer } from "node:http";
import { PubSub } from "@google-cloud/pubsub";
import express from "express";
import cors from "cors";


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

export class WebsocketServer {
    gameServers: Record<RoomId, GameServer>;
    io: SocketIOServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >;

    constructor() {
        const api = express();
        api.use(cors());
        api.use(express.json());
        api.use(express.urlencoded({ extended: true }));

        api.get("/api/hello", (req, res) => {
            res.status(200).json({ message: "Hello, world!" });
        })

        api.post("/api/room/create", (req, res) => {
            const room = Math.random().toString(36).substring(7) as RoomId;
            console.log("Creating room:", room);
            this.createRoom(room);
            console.log("Room created:", room);
            res.status(200).json({ room: room });
        })

        // Create an HTTP server
        const httpServer = createServer(api);

        console.log('Starting HTTP server...');
        httpServer.listen(gameServerPort, () => {
            console.log(`HTTP server is running on port ${gameServerPort}`);
        });

        this.gameServers = {};

        console.log("Creating Socket.IO server...");
        this.io = new SocketIOServer<
            ClientToServerEvents,
            ServerToClientEvents,
            InterServerEvents,
            SocketData
        >(httpServer, {
            adapter: createAdapter(topic, { subscriptionOptions: { messageRetentionDuration: { seconds: 600 } } }),
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

    }

    async joinRoom(room: RoomId, socket: SocketIOSocket) {
        socket.join(room);
        if (!this.roomExists(room)) {
            this.createRoom(room);
        }
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
            socket.on('joinRoom', async (room: RoomId, callback) => {
                await this.joinRoom(room, socket)
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