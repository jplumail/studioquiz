import styles from './../page.module.css'
import Image from 'next/image'

export default function Presentateur() {
    return <>
        <Image id={styles.presentateur} src='/presentateur.webp' alt='Marc Mazotti' width={131} height={120} />
    </>
}