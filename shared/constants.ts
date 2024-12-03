export const production = process.env.NODE_ENV === 'production';
export const port = parseInt(process.env.PORT || "3000", 10);
export const gameServerPort = parseInt(process.env.PORT || "8080", 10);
export const hostname = process.env.HOST || "localhost";
export const gameServerHostname = production ? `studioquiz-gameserver-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF}-577380683277.europe-west9.run.app` : "localhost";
export const gameServerUrl = production ? `https://${gameServerHostname}` : `http://${gameServerHostname}:${gameServerPort}`;
export const mainServerUrl = production ? process.env.VERCEL_URL : `http://${hostname}:${port}`;