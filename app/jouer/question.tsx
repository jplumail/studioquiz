export default function QuestionCompoent({ question }: { question: string }) {
    return <div style={{
        backgroundColor: "hsl(31.35deg 73.55% 52.55%)",
        padding: "0.5rem",
        borderRadius: "0.5rem",
    }}>{question}</div>
}