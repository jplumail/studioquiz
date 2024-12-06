import { production } from "shared";

export const baseURL = production ? null : 'http://localhost:1234/v1';  // you must launch LMStudio locally to use this
export const model = production ? 'gpt-4o' : 'llama-3.2-1b-instruct';