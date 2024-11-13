type Player = string;
type Question = string;
type Answer = string;
type DateMilliseconds = number; // in milliseconds
type Score = number;

type State = "WAITING" | "PLAYING" | "FINISHED";

type GameStatus = "QUESTION" | "WAIT";

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

type Scores = Map<Player, Score>;

interface ScoresEvent {
    type: "scores";
    payload: Record<Player, Score>;
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
    payload: {
        player: Player;
        points: number;
    };
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
    Scores,
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