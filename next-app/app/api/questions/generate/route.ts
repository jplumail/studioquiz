import 'dotenv/config';
import OpenAI from 'openai';

const system_prompt = `Générer des questions de quiz similaires à celles du jeu “Questions pour un Champion”, différenciées par trois niveaux de difficulté. Les questions doivent être stimulantes et chaque entrée doit inclure à la fois la question et la réponse attendue, formatées en JSON.

# Étapes

1. Choisir un sujet : Sélectionnez une variété de sujets adaptés pour des questions de quiz, tels que l’histoire, les sciences, la littérature, etc.
2. Définir la difficulté : Déterminez des niveaux de difficulté allant de 1 (facile) à 3 (difficile). Assurez-vous que le niveau 1 est suffisamment stimulant tout en restant accessible, tandis que les niveaux 2 et 3 augmentent en complexité et nécessitent des connaissances plus approfondies ou spécialisées.
3. Formuler la question : Rédigez une question claire et engageante pour chaque niveau de difficulté.
4. Fournir la réponse : Assurez-vous que chaque question ait une réponse correcte et concise.
5. Format en JSON : Présentez chaque question et sa réponse dans une structure JSON.

# Format de sortie

Fournissez le résultat au format JSON suivant :

{
  "question": "[Question formulée]",
  "answer": "[Réponse correcte]"
}

# Exemples

## Exemple 1 :

Entrée:
\`\`\`json
{
  "subject": "géographie",
  "difficulty": 1
}
\`\`\`

- Sortie:
\`\`\`json
{
  "question": "Suite à la réforme territoriale, combien la France métropolitaine compte-t-elle de régions ?",
  "answer": "13"
}
\`\`\`

Exemple 2 :
- Entrée:
\`\`\`json
{
  "subject": "arts",
  "difficulty": 2
}
\`\`\`

- Sortie:
\`\`\`json
{
  "question": "Quels objets du quotidien le graphiste Robert Kalina a-t-il été chargé de décliner en 7 motifs différents ?",
  "answer": "Billets en euros"
}
\`\`\`
Exemple 3:
- Entrée:
\`\`\`json
{
  "subject": "histoire",
  "difficulty": 3
}
\`\`\`

- Sortie:
\`\`\`json
{
  "question": "En 1794, quel baron, mort à la bataille de la Moskova, est à l’origine de l’arrestation de Robespierre ?",
  "answer": "Merda (Charles Andre), dit Meda"
}
\`\`\`

Notes
 - Veillez à ce que les questions soient conçues pour correspondre au niveau de connaissance approprié pour chaque degré de difficulté.
 - Assurez clarté et précision dans les questions et les réponses."`

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  console.log('POST /api/questions/generate');
  const data: {
    subject: string,
    difficulty: number,
  } = await request.json()
  const completions = await openai.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: system_prompt,
      },
      {
        role: 'user',
        content: '\{ "subject": "' + data.subject + '", "difficulty": ' + data.difficulty + ' \}',
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'question',
        schema: {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "question": {
              "type": "string"
            },
            "answer": {
              "type": "string"
            }
          },
          "required": ["question", "answer"],
          "additionalProperties": false
        }
      }
    },
  });
  const question = completions.choices[0]?.message;
  if (question?.parsed) {
    return new Response(JSON.stringify(question.parsed), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    return new Response(JSON.stringify(question), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

}