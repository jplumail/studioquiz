export default function Box({ sentence }: { sentence: string }) {
    return <div style={{
        backgroundColor: "white",
        padding: "0.5rem",
        borderRadius: "0.5rem",
        color: "hsl(31.35deg 73.55% 52.55%)",
        fontWeight: "700",
    }}>{sentence}</div>
}