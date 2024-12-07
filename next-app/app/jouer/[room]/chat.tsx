import React, { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import { Player, Answer } from 'shared';
import { ChatMessage } from '../../../types';


const player: Player = "haha" as Player;

interface ChatProps {
    sendMessage: (content: string) => void;
    messages: ChatMessage[];
}
export default function Chat({ sendMessage, messages }: ChatProps) {
    return (
        <div className={styles.chatContainer}>
            <ChatFlow messages={messages} />
            <TextArea sendMessage={sendMessage} />
        </div>
    );
}

interface ChatFlowProps {
    messages: ChatMessage[];
};
function ChatFlow({ messages }: ChatFlowProps) {
    return (
        <div id={styles.chat}>
            {messages.slice().reverse().map(
                (m, index) => {
                    switch (m.type) {
                        case "player":
                            return <PlayerMessageComponent key={index} player={m.player} message={m.message} />;
                        case "startGame":
                            return <StartGameMessageComponent key={index} />;
                        case "correctAnswer":
                            return <CorrectAnswerComponent key={index} player={m.player} points={m.gainedPoints} />;
                        case "startQuestion":
                            return <StartQuestionComponent key={index} questionIndex={m.index} />;
                        case "endQuestion":
                            return <EndQuestionComponent key={index} answer={m.answer} />
                    }
                }
            )}
        </div>
    );
}

function PlayerMessageComponent({ player, message }: { player: Player, message: string }) {
    const pseudoColor = "#0090ff";
    return (
        <div>
            <span style={{ color: pseudoColor }}>{player}</span><span style={{ color: pseudoColor }}>{" > "}</span><span>{message}</span>
        </div>
    );
}

function StartGameMessageComponent() {
    return (
        <div>
            <span style={{ color: "yellow" }}>La partie commence !</span>
        </div>
    );
}

function CorrectAnswerComponent({ player, points }: { player: Player, points: number }) {
    return (
        <div>
            <span style={{ color: "yellow" }}>{player} trouve la bonne réponse ! +{points} points</span>
        </div>
    );
}

function EndQuestionComponent({ answer }: { answer: Answer }) {
    return (
        <div>
            <span style={{ color: "yellow" }}>Question terminée !</span>
        </div>
    );
}

function StartQuestionComponent({ questionIndex }: { questionIndex: number }) {
    return (
        <div>
            <span style={{ color: "yellow" }}>--- Question n°{questionIndex} ---</span>
        </div>
    );
}

type TextAreaProps = {
    sendMessage: (content: string) => void;
};

function TextArea({ sendMessage }: TextAreaProps) {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        console.log("handleSubmit")
        e.preventDefault();
        sendMessage(content);
        setContent('');
    };

    return (
        <form id={styles.answer} onSubmit={handleSubmit}>
            <textarea
                autoFocus
                rows={1}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit(e as React.FormEvent);
                    }
                }}
            ></textarea>
            <button type="submit">Répondre</button>
        </form>
    );
}