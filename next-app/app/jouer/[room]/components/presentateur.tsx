import styles from './../page.module.css'
import Image from 'next/image'

export default function Presentateur({ sentence }: { sentence: string | null }) {
    return <>
        <Image id={styles.presentateur} src='/presentateur.webp' alt='Marc Mazotti' width={131} height={120} />
        <div id={styles.dialogueBox}>{sentence}</div>
    </>
}