'use client';

import Chat from './chat';
import styles from './page.module.css';
import Scoreboard from './scoreboard';
import Clock from './clock';
import DialogBox from './dialogueBox';
import { useEffect, useRef, useState } from 'react';
import { State } from '@/shared/types';
import { Question, DateMilliseconds, Answer, Player, Score } from '@/shared/types';
import { ServerToClientEvents, ClientToServerEvents } from '@/shared/types';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from './types';


export default function Game({ room }: {room: string}) {
    const [pseudo, setPseudo] = useState<Player | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [scores, setScores] = useState<Map<Player, Score>>(new Map());
    const [hasAnswered, setHasAnswered] = useState<Map<Player, boolean>>(new Map());
    const socket = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [question, setQuestion] = useState<Question | null>(null);
    const [answer, setAnswer] = useState<Answer | null>(null);
    const [questionStartDate, setQuestionStartDate] = useState<DateMilliseconds | null>(null);
    const [questionEndDate, setQuestionEndDate] = useState<DateMilliseconds | null>(null);
    const correctAnswerAudio = useRef<HTMLAudioElement | null>(null);

    const [state, setState] = useState<State>(State.LOBBY);

    const [sentence, setSentence] = useState<string | null>(null);

    useEffect(() => {
        console.log(`Connecting to socket.io server...`);
        socket.current = io({
            transports: ['websocket'],
        });
        console.log(`Connected to socket.io server`);

        const randomPseudo = Math.random().toString(36).substring(7) as Player;
        setPseudo(randomPseudo);

        socket.current.emit('registerPlayer', randomPseudo);

        socket.current.on('playerMessage', (player, message) => {
            setMessages(prevMessages => [...prevMessages, {type: "player", message: message, player: player}]);
        });

        socket.current.on('scores', (scores) => {
            setScores(new Map(Object.entries(scores)) as Map<Player, Score>);
        });

        socket.current.on('startGame', () => {
            setState(State.LOBBY);
        });

        socket.current.on('startQuestion', (question, index, end) => {
            setHasAnswered(new Map());
            setQuestion(question);
            setQuestionStartDate(Date.now() as DateMilliseconds);
            setQuestionEndDate(end);
            setState(State.QUESTION);
            setMessages(prevMessages => [...prevMessages, {type: "startQuestion", question: question, index: index}]);
        });

        socket.current.on('correctAnswer', (player, points) => {
            setMessages(prevMessages => [...prevMessages, {type: "correctAnswer", player: player, gainedPoints: points}]);
            setHasAnswered(prevHasAnswered => new Map([...prevHasAnswered, [player, true]]));
            if (correctAnswerAudio.current) {
                correctAnswerAudio.current.play();
            }
        });

        socket.current.on('endQuestion', (answer) => {
            setMessages(prevMessages => [...prevMessages, {type: "endQuestion", answer: answer}]);
            setState(State.WAITING);
            setAnswer(answer);
        });

        socket.current.on('endGame', () => {
            setState(State.FINISHED);
        });

        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        switch (state) {
            case State.LOBBY:
                setSentence('On attend encore quelques joueurs...');
                break;
            case State.QUESTION:
                setSentence(question);
                break;
            case State.WAITING:
                if (answer) {
                    setSentence(`Terminé ! La bonne réponse était ${answer}`);
                }
                break;
            case State.FINISHED:
                setSentence('La partie est terminée ! Merci d\'avoir joué');
                break;
            default:
                setSentence(null);
                break;
        }
    }, [state]);

    const sendMessage = (content: string) => {
        if (socket.current && socket.current.connected) {
            if (content.startsWith('/')) {
                if (content === '/start') {
                    socket.current.emit('askStartGame');
                }
            } else {
                if (pseudo) {
                    socket.current.emit('playerMessage', pseudo, content);
                }
            }
        }
    };

    return (
        <>
            <div className={styles.container}>
                <audio ref={correctAnswerAudio} src="/correct-answer.mp3" />
                {(state == State.QUESTION) && (questionStartDate && questionEndDate) && <div style={{ position: "absolute", margin: "0.5rem", zIndex: 1 }}><Clock startDate={questionStartDate} endDate={questionEndDate} /></div>}
                {sentence && <div style={{ position: "absolute", right: "1rem", top: "2rem", zIndex: 3 }}><DialogBox sentence={sentence} /></div>}
                <div className={styles.column} style={{ backgroundColor: "hsl(285.77deg 96.04% 19.8%)", display: 'grid', justifyItems: "center" }}>
                    <div style={{ position: "relative", left: "40px", zIndex: 0 }}><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWlHhJXvhgtIYxbJRcBM2u9fpe5X1M9ZCDBg&s"></img></div>
                    <Scoreboard scores={scores} hasAnswered={hasAnswered} />
                </div>
                <div className={styles.column}>
                    <Chat sendMessage={sendMessage} messages={messages}/>
                </div>
            </div>
        </>
    )
}