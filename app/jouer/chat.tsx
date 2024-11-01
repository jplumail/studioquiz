"use client";

import React, { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';

interface Message {
    pseudo: string;
    content: string;
}

const initialMessages: Message[] = [
    { pseudo: "QuizMaster", content: "Welcome to the quiz! First question coming up!" },
    { pseudo: "Gamer123", content: "Ready to win this!" },
    { pseudo: "SmartyPants", content: "Let's do this! 🧠" },
    { pseudo: "TriviaQueen", content: "Paris!" },
    { pseudo: "SpeedyJoe", content: "Paris!" },
    { pseudo: "QuizMaster", content: "Correct! TriviaQueen was first!" },
    { pseudo: "HistoryBuff", content: "Oh, that was fast!" },
    { pseudo: "Gamer123", content: "1912?" }
];

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:8080');

        ws.current.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        ws.current.onmessage = (event) => {
            const message: Message = JSON.parse(event.data);
            setMessages(prevMessages => [...prevMessages, message]);
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

    const sendMessage = (message: Message) => {
        console.log("sending message", message);
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
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
            {messages.map((m, index) => <Message key={index} message={m} />)}
        </div>
    );
}

function Message({ message }: { message: Message }) {
    const pseudoColor = "#0090ff";
    return (
        <div>
            <span style={{color: pseudoColor}}>{message.pseudo}</span><span style={{color: pseudoColor}}>{" > "}</span><span>{message.content}</span>
        </div>
    );
}

type TextAreaProps = {
    sendMessage: (message: Message) => void;
};

function TextArea({ sendMessage }: TextAreaProps) {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        console.log("handleSubmit")
        e.preventDefault();
        const message: Message = { pseudo: "You", content };
        sendMessage(message);
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
                ></textarea>
                <button type="submit">Répondre</button>
            </form>
        </div>
    );
}