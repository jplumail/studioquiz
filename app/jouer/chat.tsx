import styles from './page.module.css';

interface Message {
    pseudo: string;
    content: string;
}

const messages: Message[] = [
    { pseudo: "QuizMaster", content: "Welcome to the quiz! First question coming up!" },
    { pseudo: "Gamer123", content: "Ready to win this!" },
    { pseudo: "SmartyPants", content: "Let's do this! 🧠" },
    { pseudo: "TriviaQueen", content: "Paris!" },
    { pseudo: "SpeedyJoe", content: "Paris!" },
    { pseudo: "QuizMaster", content: "Correct! TriviaQueen was first!" },
    { pseudo: "HistoryBuff", content: "Oh, that was fast!" },
    { pseudo: "Gamer123", content: "1912?" }
];

export default function Chat() {
    return (
        <div className={styles.chatContainer}>
            <ChatFlow messages={messages} />
            <TextArea />
        </div>
    )
}

type ChatFlowProps = {
    messages: Message[];
};
function ChatFlow({ messages }: ChatFlowProps) {
    return (
        <div id={styles.chat}>
            {messages.map(m => { return <Message message={m} /> })}
        </div>
    )
}

function Message({ message }: { message: Message }) {
    const pseudoColor = "#0090ff    ";
    return (
        <div>
            <span style={{color: pseudoColor}}>{message.pseudo}</span><span style={{color: pseudoColor}}>{" > "}</span><span>{message.content}</span>
        </div>
    )
}

function TextArea() {
    return (
        <div id={styles.answer}>
            <textarea autoFocus rows={1}></textarea>
            <button>Répondre</button>
        </div>
    )
}