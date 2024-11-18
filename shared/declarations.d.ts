import type { Tagged } from "type-fest";

// Custom types
type Player = Tagged<string, 'Player'>;
type Question = Tagged<string, 'Question'>;
type Answer = Tagged<string, 'Answer'>;
type DateMilliseconds = Tagged<number, 'DateMilliseconds'>; // in milliseconds
type Score = Tagged<number, 'Score'>;
type Scores = Map<Player, Score>;
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

interface InterServerEvents {}

interface SocketData {}


// Exports
export type {
    Player,
    Question,
    Answer,
    Score,
    Scores,
    DateMilliseconds,
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
};

export {
    State
};