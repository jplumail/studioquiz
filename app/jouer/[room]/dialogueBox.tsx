export default function Box({ sentence }: { sentence: string }) {
    return <div style={{
        backgroundColor: "hsl(31.35deg 73.55% 52.55%)",
        padding: "0.5rem",
        borderRadius: "0.5rem",
    }}>{sentence}</div>
}