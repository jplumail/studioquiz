'use client';

import { usePathname } from "next/navigation";
import styles from '../layout.module.css';


export default function RoomInfo() {
    const room = usePathname().split('/').pop();
    if (room != 'jouer') {
        return (
            <div>
                <div className={styles.infoName}><span>Salle</span></div><div className={styles.infoValue}><span>{room}</span></div>
            </div>
        )
    }
}