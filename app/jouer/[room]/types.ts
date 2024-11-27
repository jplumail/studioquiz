import { Question, Answer, Player } from '@/shared/declarations';


type ChatMessage = {
    type: "player";
    player: Player;
    message: string;
} | {
    type: "startGame";
} | {
    type: "startQuestion";
    question: Question;
    index: number;
} | {
    type: "endQuestion";
    answer: Answer;
} | {
    type: "correctAnswer";
    player: Player;
    gainedPoints: number;
}

export type { ChatMessage };
