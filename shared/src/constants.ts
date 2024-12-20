export const production = process.env.NODE_ENV === 'production';

export const mainServerPort = parseInt(process.env.PORT || "3000", 10);
export const gameServerPort = parseInt(process.env.PORT || "8080", 10);

const devMachineHostname = "mbp-de-jean.home";
export const mainServerHostname = production ? process.env.NEXT_PUBLIC_VERCEL_URL : devMachineHostname;
export const gameServerHostname = production ? `studioquiz-gameserver-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF}-577380683277.europe-west9.run.app` : devMachineHostname;

export const openAIBaseURL = production ? null : `http://${devMachineHostname}:1235/v1`; // you must launch LMStudio on devMachine to use this

export const mainServerUrl = production ? `https://${mainServerHostname}` : `http://${mainServerHostname}:${mainServerPort}`;
export const gameServerUrl = production ? `https://${gameServerHostname}` : `http://${gameServerHostname}:${gameServerPort}`;