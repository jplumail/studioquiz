export const dev = process.env.NODE_ENV !== "production";
export const port = parseInt(process.env.PORT || '3000');
export const hostname = dev ? `localhost:${port}` : "https://studioquiz.web.app";
