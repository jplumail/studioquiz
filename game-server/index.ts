import { WebsocketServer } from "./server.js";

const server = new WebsocketServer();
await server.init();