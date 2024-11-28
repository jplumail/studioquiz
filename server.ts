import { createServer, Server as NodeServer } from "node:http";
import next from "next";
import { WebsocketServer } from './server/index';
import { dev, hostname, port } from './constants';

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

await app.prepare();

const server = new WebsocketServer(handler);
await server.init();
