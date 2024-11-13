import React, { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import { type StudioQuizEvent, type Message, type PlayerMessage, type Player } from '@/shared/types';


interface ChatProps {
    ws: { current: WebSocket | null };
    pseudo: string;
    messages: Message[];
}
export default function Chat({ ws, pseudo, messages }: ChatProps) {

    const sendMessage = (content: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            let event: StudioQuizEvent | null = null;
            if (content.startsWith('/')) {
                if (content === '/start') {
                    event = { type: 'askStartGame' };
                }
            } else {
                event = { type: 'playerMessage', payload: { type: "player", content: { player: pseudo, message: content } } };
            }
            if (event) {
                console.log("send", event);
                ws.current.send(JSON.stringify(event));
            }
        }
    };

    return (
        <div className={styles.chatContainer}>
            <ChatFlow messages={messages} />
            <TextArea sendMessage={sendMessage} />
        </div>
    );
}

type ChatFlowProps = {
    messages: Message[];
};
function ChatFlow({ messages }: ChatFlowProps) {
    return (
        <div id={styles.chat}>
            {messages.slice().reverse().map(
                (m, index) => {
                    switch (m.type) {
                        case "player":
                            return <PlayerMessageComponent key={index} message={m} />;
                        case "startGame":
                            return <StartGameMessageComponent key={index} />;
                        case "correctAnswer":
                            return <CorrectAnswerComponent key={index} player={m.payload} />;
                    }
                }
            )}
        </div>
    );
}

function PlayerMessageComponent({ message }: { message: PlayerMessage }) {
    const pseudoColor = "#0090ff";
    return (
        <div>
            <span style={{ color: pseudoColor }}>{message.content.player}</span><span style={{ color: pseudoColor }}>{" > "}</span><span>{message.content.message}</span>
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

function CorrectAnswerComponent({ player }: { player: Player }) {
    return (
        <div>
            <span style={{ color: "yellow" }}>{player}</span><span style={{ color: "yellow" }}> a trouvé la bonne réponse !</span>
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
        <div id={styles.answer}>
            <form onSubmit={handleSubmit}>
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
        </div>
    );
}