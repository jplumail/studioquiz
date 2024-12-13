'use client';

import Chat from './components/chat';
import styles from './page.module.css';
import Scoreboard from './components/scoreboard';
import Clock from './components/clock';
import Presentateur from './components/presentateur';
import Applaudissements from './components/applaudissements';
import { useEffect, useRef, useState } from 'react';
import { types, ChatMessage } from '@/types';
import { io, Socket } from 'socket.io-client';
import { gameServerUrl } from 'shared';
import Image from 'next/image';;


export default function Game({ room, pseudo }: { room: types.RoomId, pseudo: types.Player }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [scores, setScores] = useState<Map<types.Player, types.Score>>(new Map());
    const [hasAnswered, setHasAnswered] = useState<Map<types.Player, boolean>>(new Map());
    const socket = useRef<Socket<types.ServerToClientEvents, types.ClientToServerEvents> | null>(null);
    const [question, setQuestion] = useState<types.Question | null>(null);
    const [answer, setAnswer] = useState<types.Answer | null>(null);
    const [questionStartDate, setQuestionStartDate] = useState<types.DateMilliseconds | null>(null);
    const [questionEndDate, setQuestionEndDate] = useState<types.DateMilliseconds | null>(null);
    const correctAnswerAudio = useRef<HTMLAudioElement | null>(null);

    const [state, setState] = useState<types.State>(types.State.LOBBY);

    const [sentence, setSentence] = useState<string | null>(null);

    useEffect(() => {
        console.log(`Connecting to socket.io server... ${gameServerUrl}`);
        socket.current = io(gameServerUrl, {
            transports: ['websocket'],
        });
        console.log(`Connected to socket.io server`);

        console.log(`Joining room ${room}`);
        const roomStartupTimeout = 10 * 1000;  // 10 seconds
        socket.current.timeout(roomStartupTimeout).emit('joinRoom', room, (error) => { error ? console.error('Error joining room', error) : console.log('Joined room') });

        socket.current.emit('registerPlayer', pseudo);

        socket.current.on('playerMessage', (player, message) => {
            setMessages(prevMessages => [...prevMessages, { type: "player", message: message, player: player }]);
        });

        socket.current.on('scores', (scores) => {
            setScores(new Map(Object.entries(scores)) as Map<types.Player, types.Score>);
        });

        socket.current.on('startGame', () => {
            setState(types.State.LOBBY);
        });

        socket.current.on('startQuestion', (question, index, end) => {
            setHasAnswered(new Map());
            setQuestion(question);
            setQuestionStartDate(Date.now() as types.DateMilliseconds);
            setQuestionEndDate(end);
            setState(types.State.QUESTION);
            setMessages(prevMessages => [...prevMessages, { type: "startQuestion", question: question, index: index }]);
        });

        socket.current.on('correctAnswer', (player, points) => {
            setMessages(prevMessages => [...prevMessages, { type: "correctAnswer", player: player, gainedPoints: points }]);
            setHasAnswered(prevHasAnswered => new Map([...prevHasAnswered, [player, true]]));
            if (correctAnswerAudio.current) {
                correctAnswerAudio.current.play();
            }
        });

        socket.current.on('endQuestion', (answer) => {
            setMessages(prevMessages => [...prevMessages, { type: "endQuestion", answer: answer }]);
            setState(types.State.WAITING);
            setAnswer(answer);
        });

        socket.current.on('endGame', () => {
            setState(types.State.FINISHED);
        });

        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        switch (state) {
            case types.State.LOBBY:
                setSentence('On attend encore quelques joueurs...');
                break;
            case types.State.QUESTION:
                setSentence(question);
                break;
            case types.State.WAITING:
                if (answer) {
                    setSentence(`Terminé ! La bonne réponse était ${answer}`);
                }
                break;
            case types.State.FINISHED:
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
        <div id={styles.gameContainer}>
            <audio ref={correctAnswerAudio} src="/correct-answer.mp3" />
            {(state == types.State.QUESTION) && (questionStartDate && questionEndDate) && <div style={{ position: "absolute", margin: "0.5rem", zIndex: 1 }}><Clock startDate={questionStartDate} endDate={questionEndDate} /></div>}
            <div className={styles.column} id={styles.left}>
                <div id={styles.leftWrapper}>
                    <Image src='/salle.webp' width={988} height={748} alt='Salle' id={styles.salle} />
                    <Presentateur sentence={sentence}/>
                    <Applaudissements />
                    <Scoreboard scores={scores} hasAnswered={hasAnswered} />
                </div>
            </div>
            <div className={styles.column} id={styles.right}>
                <Chat sendMessage={sendMessage} messages={messages} />
            </div>
        </div>
    )
}