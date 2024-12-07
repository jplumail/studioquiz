import styles from './page.module.css'

export default function Box({ sentence }: { sentence: string }) {
    return <div id={styles.dialogueBox}>{sentence}</div>
}