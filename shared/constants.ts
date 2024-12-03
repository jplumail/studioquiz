export const production = process.env.NODE_ENV === 'production';

export const mainServerPort = parseInt(process.env.PORT || "3000", 10);
export const gameServerPort = parseInt(process.env.PORT || "8080", 10);

export const mainServerHostname = production ? (process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL) : "localhost";
export const gameServerHostname = production ? `studioquiz-gameserver-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF}-577380683277.europe-west9.run.app` : "localhost";

export const mainServerUrl = production ? `https://${mainServerHostname}` : `http://${mainServerHostname}:${mainServerPort}`;
export const gameServerUrl = production ? `https://${gameServerHostname}` : `http://${gameServerHostname}:${gameServerPort}`;