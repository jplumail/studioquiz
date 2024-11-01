

import Chat from './chat';
import styles from './page.module.css';
import Scores from './scores';
import Presenter from './presenter';
import Clock from './clock';
import Question from './question';

export default function Play() {
    return (
        <div className={styles.container}>
            <div style={{position: "absolute", margin: "0.5rem", zIndex: 1}}><Clock/></div>
            <div style={{position: "absolute", right: "1rem", top: "2rem", zIndex: 3}}><Question/></div>
            <div className={styles.column} style={{backgroundColor: "hsl(285.77deg 96.04% 19.8%)", display: 'grid', justifyItems: "center"}}>
                <div style={{position: "relative", left: "40px", zIndex: 0}}>{Presenter()}</div>
                {Scores()}
            </div>
            <div className={styles.column}>
                <Chat/>
            </div>
        </div>
    )
}