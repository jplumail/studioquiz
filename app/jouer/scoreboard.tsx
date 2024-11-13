import { Scores, Player } from '@/shared/types';
import styles from './page.module.css';

export default function Scoreboard({ scores, hasAnswered }: {scores: Scores, hasAnswered: Map<Player, boolean>}) {
    return (
        <div style={{
            width: '100%',
            height: 'fit-content',
            marginTop: 'auto',
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gridTemplateRows: "repeat(4, auto)",
            gridAutoFlow: "column",
            padding: "1rem",
            gap: "0.2rem"
        }}>
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