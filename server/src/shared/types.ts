type Player = string;

interface Score {
    player: Player;
    score: number;
}

interface PlayerMessage {
    player: Player;
    content: string;
}

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

type StudioQuizEvent = PlayerMessageEvent | ScoresEvent | RegisterPlayerEvent;

export type {
    Player,
    Score,
    PlayerMessage,
    PlayerMessageEvent,
    ScoresEvent,
    StudioQuizEvent
};