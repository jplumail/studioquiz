'use client';

import { usePathname } from "next/navigation";
import styles from '../../layout.module.css';


export default function RoomInfo() {
    const pathName = usePathname().split('/');
    console.log(pathName);
    if (pathName[1] === 'jouer' && pathName.length == 3) {
        const room = pathName.pop();
        return (
            <div>
                <div className={styles.infoName}>
                    <span>Salle</span>
                </div>
                <div className={styles.infoValue}>
                    <span>{room}</span>
                </div>
            </div>
        )
    }
}