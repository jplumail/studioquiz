"use client";

import React, { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import { type StudioQuizEvent, type PlayerMessage } from '@/shared/types';


export default function Chat() {
    const [pseudo, setPseudo] = useState<string>('');
    const [messages, setMessages] = useState<PlayerMessage[]>([]);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const isProduction = process.env.NODE_ENV === 'production';
        const wsUrl = isProduction 
            ? 'ws://studioquiz-server-577380683277.europe-west9.run.app' 
            : 'ws://localhost:8080';

        ws.current = new WebSocket(wsUrl);

        const randomPseudo = Math.random().toString(36).substring(7);
        setPseudo(randomPseudo);

        ws.current.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        ws.current.onmessage = (event) => {
            const message: StudioQuizEvent = JSON.parse(event.data);
            if (message.type === 'playerMessage') {
                setMessages(prevMessages => [...prevMessages, message.payload]);
            }
        };

        ws.current.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    const sendMessage = (content: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const event: StudioQuizEvent = { type: 'playerMessage', payload: {pseudo: pseudo, content: content} };
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
            <span style={{ color: pseudoColor }}>{message.pseudo}</span><span style={{ color: pseudoColor }}>{" > "}</span><span>{message.content}</span>
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