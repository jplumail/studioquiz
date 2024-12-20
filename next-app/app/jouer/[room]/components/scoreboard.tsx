import { types } from '@/types';
import styles from './scoreboard.module.css';

export default function Scoreboard({ scores, hasAnswered }: {scores: Map<types.Player, types.Score>, hasAnswered: Map<types.Player, boolean>}) {
    return (
        <div id={styles.scoreBoard}>
            {Array.from(scores).sort(([_playerA, scoreA], [_playerB, scoreB]) => scoreB - scoreA).map(([player, score], index) => (
                <PlayerCard key={index} player={player} score={score} hasAnswered={hasAnswered.get(player) || false} />
            ))}
            {Array.from({ length: 8 - scores.size }, (_, index) => (
                <EmptyCard key={`empty-${index}`}/>
            ))}
        </div>
    )
}



interface PlayerCardProps {
    score: number;
    player: string;
    hasAnswered: boolean;
}
function PlayerCard({score, player, hasAnswered}: PlayerCardProps) {
    return (
        <div className={`${styles.card} ${hasAnswered ? styles.hasAnswered : ''}`}>
            <span>{player}</span>
            <span className={styles.cardScore}>{score}</span>
        </div>
    )
}

function EmptyCard() {
    return <div className={`${styles.card} ${styles.empty}`}></div>
}