"use client";

import Chat from './chat';
import styles from './page.module.css';
import Scores from './scores';
import Presenter from './presenter';
import Clock from './clock';
import Question from './question';
import { use, useEffect, useRef, useState } from 'react';
import { PlayerMessage, StudioQuizEvent, Score } from '@/shared/types';

export default function Play() {
    const [pseudo, setPseudo] = useState<string>('');
    const [messages, setMessages] = useState<PlayerMessage[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const isProduction = process.env.NODE_ENV === 'production';
        const wsUrl = isProduction 
            ? 'wss://studioquiz-server-577380683277.europe-west9.run.app' 
            : 'ws://localhost:8080';

        ws.current = new WebSocket(wsUrl);

        const randomPseudo = Math.random().toString(36).substring(7);
        setPseudo(randomPseudo);

        ws.current.onopen = () => {
            ws.current?.send(JSON.stringify({ type: 'registerPlayer', payload: randomPseudo }));
        };

        ws.current.onmessage = (event) => {
            const message: StudioQuizEvent = JSON.parse(event.data);
            if (message.type === 'playerMessage') {
                setMessages(prevMessages => [...prevMessages, message.payload]);
            } else if (message.type === 'scores') {
                setScores(message.payload);
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

    return (
        <div className={styles.container}>
            <div style={{position: "absolute", margin: "0.5rem", zIndex: 1}}><Clock/></div>
            <div style={{position: "absolute", right: "1rem", top: "2rem", zIndex: 3}}><Question/></div>
            <div className={styles.column} style={{backgroundColor: "hsl(285.77deg 96.04% 19.8%)", display: 'grid', justifyItems: "center"}}>
                <div style={{position: "relative", left: "40px", zIndex: 0}}>{Presenter()}</div>
                <Scores scores={scores} />
            </div>
            <div className={styles.column}>
                <Chat ws={ws} pseudo={pseudo} messages={messages}/>
            </div>
        </div>
    )
}