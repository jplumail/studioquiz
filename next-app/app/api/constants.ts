import { production } from "shared";

export const model = production ? 'gpt-4o' : 'llama-3.2-1b-instruct';