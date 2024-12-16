'use client';
import { useState } from "react";
import Image from 'next/image';

import layoutStyles from '../layout.module.css';
import styles from './nav.module.css';
import RoomInfo from '../jouer/[room]/components/roomInfo';


export default function Nav() {
    const [showNav, setshowNav] = useState(false);

    function toggleMainMenu() {
        setshowNav(!showNav);
    }

    return (
        <header
            id={styles.header} className={`${layoutStyles.roundedContainer} ${styles.headerBorder} ${showNav ? styles.showNav : ""}`}
        >
            <a id={styles.logo} href="/">
                <Image src="/media/logo.png" alt="StudioQuiz" width={137} height={106} />
            </a>
            <div id={styles.infos}>
                <RoomInfo />
            </div>
            <button id={styles.mainMenuToggle} onClick={toggleMainMenu}>
                <span></span>
            </button>
            <nav className={`${layoutStyles.roundedContainer} ${styles.headerBorder}`}>
                <a href="/jouer"><span>Jouer</span></a>
                <a href="/creer"><span>Créer une partie</span></a>
            </nav>
        </header>
    );
}
