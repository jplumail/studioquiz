import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
    const data: {
        question: string,
        correctAnswer: string,
        playerAnswer: string,
    } = await request.json()
    const completions = await openai.beta.chat.completions.parse({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `Valide la réponse du jouer en fonction de la question et de la réponse attendue.
Tu acceptes:
- les fautes de frappe
- les réponses partielles. "Paris" pour "Paris, France"
- les fautes d'orthographe
- le nom de famille seul. Mitterrand pour François Mitterrand
- les fautes aux noms propres. "François Mitterrand" pour "François Miterrand"`,
            },
            {
                role: 'user',
                content: '\{ "question": "' + data.question + '", "correctAnswer": "' + data.correctAnswer + '", "playerAnswer": "' + data.playerAnswer + '" \}',
            }
        ],
        response_format: {
            type: 'json_schema',
            json_schema: {
                name: 'validation',
                schema: {
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": {
                        "correct": {
                            "type": "boolean"
                        }
                    },
                    "required": ["correct"],
                    "additionalProperties": false
                }
            }
        }

    })
    const valid = completions.choices[0]?.message;
    if (valid?.parsed) {
        return new Response(JSON.stringify(valid.parsed), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } else {
        return new Response(JSON.stringify(valid), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}