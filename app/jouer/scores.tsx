import styles from './page.module.css';

type Player = string;
type Score = number;
type Scores = {
    player: Player;
    score: Score;
}[]

export default function Scores() {
    const scores: Scores = [
        { player: "pluplu", score: 10 },
        { player: "pseudo", score: 1 },
        { player: "grizzur", score: 0 },
        { player: "vanessa", score: 12 },
        { player: "jean claude", score: 0 }
    ]
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
                <PlayerCard key={`empty-${index}`} player={null} score={null} />
            ))}
        </div>
    )
}

interface PlayerCardProps {
    player: Player | null;
    score: Score | null;
}
const PlayerCard: React.FC<PlayerCardProps> = ({ player, score }) => {
    if (player == null && score == null) {
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