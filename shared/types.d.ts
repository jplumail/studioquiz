type Player = string;
type Question = string;
type Answer = string;
type DateMilliseconds = number; // in milliseconds

type State = "WAITING" | "PLAYING" | "FINISHED";

type GameStatus = "QUESTION" | "WAIT";

interface Score {
    player: Player;
    score: number;
}

interface PlayerMessage {
    type: "player";
    content: {
        player: Player;
        message: string;
    }
}

type Message = StartGameEvent | PlayerMessage | CorrectAnswerEvent | EndQuestionEvent | StartQuestionEvent;

interface RegisterPlayerEvent {
    type: "registerPlayer";
    payload: Player;
}

interface PlayerMessageEvent {
    type: "playerMessage";
    payload: PlayerMessage;
}

interface ScoresEvent {
    type: "scores";
    payload: Score[];
}

interface AskStartGameEvent {
    type: "askStartGame";
}

interface StartGameEvent {
    type: "startGame";
}

interface EndGameEvent {
    type: "endGame";
}

interface StartQuestionEvent {
    type: "startQuestion";
    payload: {
        question: Question,
        index: number,
        end: DateMilliseconds
    };
}

interface EndQuestionEvent {
    type: "endQuestion";
    payload: Answer;
}

interface CorrectAnswerEvent {
    type: "correctAnswer";
    payload: Player;
}

type StudioQuizEvent =
    | RegisterPlayerEvent
    | PlayerMessageEvent
    | ScoresEvent
    | AskStartGameEvent
    | StartGameEvent
    | EndGameEvent
    | StartQuestionEvent
    | EndQuestionEvent
    | CorrectAnswerEvent;


export type {
    Player,
    Question,
    Answer,
    Score,
    DateMilliseconds,
    Message,
    PlayerMessage,
    PlayerMessageEvent,
    ScoresEvent,
    StudioQuizEvent,
    GameStatus
};

export {
    State
};