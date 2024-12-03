import { WebsocketServer } from "./server.js";
import { generateQuestion} from "./generate-questions.js";

import dotenv from "dotenv";

dotenv.config();
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const server = new WebsocketServer();
await server.init();