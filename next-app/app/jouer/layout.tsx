import styles from './layout.module.css';
import Image from 'next/image';
import RoomInfo from './[room]/roomInfo';


export default function Page({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div id={styles.contentContainer}>
            <header className={styles.roundedContainer}>
                <Image id={styles.logo} src="/logo.png" alt="StudioQuiz" width={137} height={106} />
                <nav>
                    <a href="/jouer"><span>Jouer</span></a>
                    <a href="/creer"><span>Créer une partie</span></a>
                </nav>
                <div id={styles.infos}>
                    <RoomInfo />
                </div>
            </header>
            <main className={styles.roundedContainer}>
                {children}
            </main>
        </div>
    );
}