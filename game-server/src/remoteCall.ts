import { Answer, GenerateQuestion, mainServerUrl, Question } from "shared";


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

export function validateAnswer(question: Question, correctAnswer: Answer, playerAnswer: Answer): Promise<{ correct: boolean }> {
    return fetch(`${mainServerUrl}/api/validate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, correctAnswer, playerAnswer }),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`Failed to validate question: ${response.statusText}`);
        }
        return response.json();
    })
    .then((data) => data);
}