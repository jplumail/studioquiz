export const production = process.env.NODE_ENV === 'production';
export const port = parseInt(process.env.PORT || "3000", 10);
export const gameServerPort = parseInt(process.env.PORT || "8080", 10);
export const hostname = process.env.HOST || "localhost";
export const gameServerHostname = production ? "studioquiz-gameserver-577380683277.europe-west9.run.app" : "localhost";
export const gameServerUrl = production ? `https://${gameServerHostname}` : `http://${gameServerHostname}:${gameServerPort}`;