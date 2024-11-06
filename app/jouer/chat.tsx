import React, { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import { type StudioQuizEvent, type PlayerMessage } from '@/shared/types';


interface ChatProps {
    ws: { current: WebSocket | null };
    pseudo: string;
    messages: PlayerMessage[];
}
export default function Chat({ ws, pseudo, messages }: ChatProps) {

    const sendMessage = (content: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const event: StudioQuizEvent = { type: 'playerMessage', payload: {player: pseudo, content: content} };
            ws.current.send(JSON.stringify(event));
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
    messages: PlayerMessage[];
};
function ChatFlow({ messages }: ChatFlowProps) {
    return (
        <div id={styles.chat}>
            {messages.slice().reverse().map((m, index) => <PlayerMessageComponent key={index} message={m} />)}
        </div>
    );
}

function PlayerMessageComponent({ message }: { message: PlayerMessage }) {
    const pseudoColor = "#0090ff";
    return (
        <div>
            <span style={{ color: pseudoColor }}>{message.player}</span><span style={{ color: pseudoColor }}>{" > "}</span><span>{message.content}</span>
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