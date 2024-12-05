import { GenerateQuestion, mainServerUrl } from "shared";


export function generateQuestion(subject: string, difficulty: number): Promise<GenerateQuestion> {
    return fetch(`${mainServerUrl}/api/questions/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ subject, difficulty }),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`Failed to generate question: ${response.statusText}`);
        }
        return response.json();
    })
    .then((data: GenerateQuestion) => data);
}