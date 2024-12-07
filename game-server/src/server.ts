import { GameState, ServerToClientEvents, State, Player, Score, SocketId, DateMilliseconds, RoomId, ClientToServerEvents, InterServerEvents, SocketData, Answer, Question, Socket } from "shared";
import { gameServerPort, production, mainServerUrl } from "shared";
import { generateQuestion, validateAnswer } from "./remoteCall.js";

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

const themes = ["histoire", "géographie", "sciences", "sport", "arts", "littérature", "cinéma", "musique", "cuisine", "informatique", "mathématiques"];

const pointsArray: number[] = [4, 3, 3, 2, 1, 1, 1, 1];
const countdown = 20 * 1000 as DateMilliseconds;  // 10 seconds


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
            questions: [],
            answers: [],
            hasAnswered: {},
            status: State.LOBBY,
            registeredPlayers: {},
            nbQuestions: 1,
        };
        this.roomEmit = roomEmit;
        this.serverSideRoomEmit = serverSideRoomEmit;
    }

    resetGame() {
        const scores = {} as Record<Player, Score>;
        Object.keys(this.game.scores).forEach((player) => {
            scores[player as Player] = 0 as Score;
        });
        this.game = {
            scores: scores,
            currentIndex: null,
            questions: [],
            answers: [],
            hasAnswered: {},
            status: State.LOBBY,
            registeredPlayers: this.game.registeredPlayers,
            nbQuestions: this.game.nbQuestions,
        }
        this.game.questions = [];
        this.game.answers = [];
        const firstQuestion = this.getQuestions();
        this.sendScores();
        return firstQuestion;
    }

    getQuestions() {
        const generateQuestionsPromises: Promise<any>[] = [];
        for (let i = 0; i < this.game.nbQuestions - this.game.questions.length; i++) {
            const theme = themes[Math.floor(Math.random() * themes.length)];
            const difficulty = Math.floor(Math.random() * 3) + 1;
            generateQuestionsPromises.push(generateQuestion(theme, difficulty).then((data) => {
                this.game.questions.push(data.question);
                this.game.answers.push(data.answer);
            }));
        }
        return generateQuestionsPromises[0];
    }

    onConnection(socket: Socket) {
        console.log('Client connected');
        this.sendScores();
        socket.on('registerPlayer', (player) => {
            this.game.scores[player] = 0 as Score;
            this.game.registeredPlayers[socket.id as SocketId] = player;
            this.updateGame();
            this.sendScores();
        });

        socket.on('playerMessage', (player, message) => this.handlePlayerMessage(player, message));
        socket.on('askStartGame', () => this.startGame());
        socket.on('disconnect', () => this.unregisterClient(socket));
    }

    updateGame() {
        this.serverSideRoomEmit(this.game);
    }

    unregisterClient(socket: Socket) {
        const player = this.game.registeredPlayers[socket.id as SocketId];
        if (player) {
            delete this.game.registeredPlayers[socket.id as SocketId];
            delete this.game.scores[player];
            this.sendScores();
            this.updateGame();
        }
        console.log('Client disconnected');
    }

    async startGame() {
        await this.resetGame();
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
        this.game.status = State.WAITING;
        this.updateGame();
    }

    async handlePlayerMessage(player: Player, message: string) {
        if (this.game.status == State.QUESTION && this.game.currentIndex !== null) {
            if (!this.game.hasAnswered[player]) {
                if ((this.game.currentIndex >= 0) && (this.game.currentIndex < this.game.answers.length)) {
                    const validate = await this.checkAnswer(message as Answer);
                    if (validate) {
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
            }
            if (!this.game.hasAnswered[player]) {
                this.roomEmit('playerMessage', player, message);
            }
        } else {
            this.roomEmit('playerMessage', player, message);
        }
        this.updateGame();
    }

    checkAnswer(attempt: Answer) {
        let prom: Promise<boolean>;
        if (this.game.currentIndex !== null) {
            const question = this.game.questions[this.game.currentIndex];
            const answer = this.game.answers[this.game.currentIndex];
            if (attempt.toLowerCase() === answer.toLowerCase()) {
                prom = new Promise((resolution, reject) => resolution(true));
            } else {
                prom = validateAnswer(question, answer, attempt).then((data) => {
                    return data.correct === true;
                });
            };
        } else {
            prom = new Promise((resolution, reject) => resolution(false));
        }
        return prom;

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
            res.status(200).json({ message: `Hello, world! Main server URL: ${mainServerUrl}` });
        })

        api.post("/api/room/create", (req, res) => {
            const room = Math.random().toString(36).substring(7) as RoomId;
            this.createRoom(room);
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

    async joinRoom(room: RoomId, socket: Socket) {
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

        this.io.of("/").on('connection', (socket) => {
            socket.on('joinRoom', async (room, callback) => {
                if (this.roomExists(room)) {
                    await this.joinRoom(room, socket);
                    callback();
                } else {
                    console.log("Room does not exist:", room);
                }
            });
        })
        this.io.of("/").on('gameState', (room, newState) => {
            if (!this.roomExists(room)) {
                this.createRoom(room);
            }
            this.gameServers[room].game = newState;
        });
    }
}