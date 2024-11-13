"use client";

import Chat from './chat';
import styles from './page.module.css';
import Scoreboard from './scoreboard';
import Clock from './clock';
import DialogBox from './dialogueBox';
import { useEffect, useRef, useState } from 'react';
import { Message, StudioQuizEvent, Question, DateMilliseconds, Answer, State, GameStatus, Scores, Player } from '@/shared/types';

export default function Play() {
    const [pseudo, setPseudo] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [scores, setScores] = useState<Scores>(new Map());
    const [hasAnswered, setHasAnswered] = useState<Map<Player, boolean>>(new Map());
    const ws = useRef<WebSocket | null>(null);
    const [question, setQuestion] = useState<Question | null>(null);
    const [answer, setAnswer] = useState<Answer | null>(null);
    const [questionStartDate, setQuestionStartDate] = useState<DateMilliseconds | null>(null);
    const [questionEndDate, setQuestionEndDate] = useState<DateMilliseconds | null>(null);
    const correctAnswerAudio = useRef<HTMLAudioElement | null>(null);

    const [state, setState] = useState<State>("WAITING");
    const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);

    const [sentence, setSentence] = useState<string | null>(null);

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
            switch (message.type) {
                case 'playerMessage':
                    setMessages(prevMessages => [...prevMessages, message.payload]);
                    break;
                case 'scores':
                    setScores(new Map(Object.entries(message.payload)));
                    break;
                case 'startGame':
                    setMessages(prevMessages => [...prevMessages, { type: 'startGame' }]);
                    setState("PLAYING");
                    setGameStatus("WAIT");
                    break;
                case 'startQuestion':
                    setHasAnswered(new Map());
                    setQuestion(message.payload.question);
                    setQuestionStartDate(Date.now());
                    setQuestionEndDate(message.payload.end);
                    setGameStatus("QUESTION");
                    setMessages(prevMessages => [...prevMessages, message]);
                    break;
                case 'correctAnswer':
                    setMessages(prevMessages => [...prevMessages, message]);
                    setHasAnswered(prevHasAnswered => new Map([...prevHasAnswered, [message.payload.player, true]]));
                    if (correctAnswerAudio.current) {
                        correctAnswerAudio.current.play();
                    }
                    break;
                case 'endQuestion':
                    setMessages(prevMessages => [...prevMessages, message]);
                    setGameStatus("WAIT");
                    setAnswer(message.payload);
                    break;
                case 'endGame':
                    setState("FINISHED");
                    break;
                default:
                    console.warn(`Unhandled message type: ${message.type}`);
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

    useEffect(() => {
        if (state == "WAITING") {
            setSentence('En attente de joueurs...');
        } else if (state == "PLAYING") {
            if (gameStatus == "QUESTION") {
                setSentence(question);
            }
            if (gameStatus == "WAIT" && answer) {
                setSentence(`Terminé ! La bonne réponse était ${answer}`);
            }
        } else if (state == "FINISHED") {
            setSentence('La partie est terminée ! Merci d\'avoir joué');
        }
    }, [gameStatus, state]);

    return (
        <div className={styles.container}>
            <audio ref={correctAnswerAudio} src="/correct-answer.mp3" />
            {(gameStatus == "QUESTION") && (questionStartDate && questionEndDate) && <div style={{ position: "absolute", margin: "0.5rem", zIndex: 1 }}><Clock startDate={questionStartDate} endDate={questionEndDate} /></div>}
            {sentence && <div style={{ position: "absolute", right: "1rem", top: "2rem", zIndex: 3 }}><DialogBox sentence={sentence} /></div>}
            <div className={styles.column} style={{ backgroundColor: "hsl(285.77deg 96.04% 19.8%)", display: 'grid', justifyItems: "center" }}>
                <div style={{ position: "relative", left: "40px", zIndex: 0 }}><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWlHhJXvhgtIYxbJRcBM2u9fpe5X1M9ZCDBg&s"></img></div>
                <Scoreboard scores={scores} hasAnswered={hasAnswered} />
            </div>
            <div className={styles.column}>
                <Chat ws={ws} pseudo={pseudo} messages={messages} />
            </div>
        </div>
    )
}