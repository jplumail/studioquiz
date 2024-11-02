export interface PlayerMessage {
    pseudo: string;
    content: string;
}

export interface PlayerMessageEvent {
    type: "playerMessage";
    payload: PlayerMessage;
}

export interface StudioQuizEvent {
    type: string;
    payload: any;
}

