import type { Tagged } from "type-fest";
import type { Server as SocketIOServer, Socket as SocketIOSocket } from 'socket.io';

// Custom types
type Player = Tagged<string, 'Player'>;
type Question = Tagged<string, 'Question'>;
type Answer = Tagged<string, 'Answer'>;
type DateMilliseconds = Tagged<number, 'DateMilliseconds'>; // in milliseconds
type Score = Tagged<number, 'Score'>;
declare enum State {
    LOBBY,
    FINISHED,
    WAITING,
    QUESTION,
}

// Socket.IO events
interface ServerToClientEvents {
    playerMessage: (player: Player, message: string) => void;
    scores: (scores: Record<Player, Score>) => void;
    startGame: () => void;
    endGame: () => void;
    startQuestion: (question: Question, index: number, end: DateMilliseconds) => void;
    endQuestion: (answer: Answer) => void;
    correctAnswer: (player: Player, points: number) => void;
}

interface ClientToServerEvents {
    registerPlayer: (player: Player) => void;
    askStartGame: () => void;
    playerMessage: (player: Player, message: string) => void;
}

interface InterServerEvents {
    gameState: (state: GameState) => void;
}

interface SocketData {}

type SocketServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type Socket = SocketIOSocket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type SocketId = Tagged<string, 'SocketId'>;

interface GameState {
    scores: Record<Player, Score>,
    currentIndex: number,
    questions: Question[],
    answers: Answer[],
    hasAnswered: Record<Player, boolean>,
    status: "LOBBY" | "FINISHED" | "WAITING" | "QUESTION",
    registeredPlayers: Record<SocketId, Player>,
}

// Exports
export type {
    Player,
    Question,
    Answer,
    Score,
    GameState,
    DateMilliseconds,
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
    SocketServer,
    Socket,
};

export {
    State
};