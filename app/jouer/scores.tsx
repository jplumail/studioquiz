import { Player, Score } from '@/shared/types';
import styles from './page.module.css';

interface ScoresProps {
    scores: Score[];
}

export default function Scores({ scores }: ScoresProps) {
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
            {scores.sort((a, b) => b.score - a.score).map((x, index) => (
                <PlayerCard key={index} player={x.player} score={x.score} />
            ))}
            {Array.from({ length: 8 - scores.length }, (_, index) => (
                <PlayerCard key={`empty-${index}`} player={null} score={null}/>
            ))}
        </div>
    )
}

interface PlayerCardProps {
    score: number | null;
    player: string | null;
}
const PlayerCard: React.FC<PlayerCardProps> = ({score, player}) => {
    if (score == null || player == null) {
        return (
            <div className={`${styles.card} ${styles.empty}`}>
            </div>
        )
    }
    return (
        <div className={styles.card}>
            <span>{player}</span>
            <span className={styles.cardScore}>{score}</span>
        </div>
    )
}