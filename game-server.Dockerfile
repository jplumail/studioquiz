FROM node:22-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM builder AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
WORKDIR /usr/src/app/game-server
RUN pnpm run build
RUN pnpm deploy --filter=game-server --prod /prod/game-server

FROM europe-west9-docker.pkg.dev/serverless-runtimes/google-22/runtimes/nodejs22 AS game-server
COPY --from=build /prod/game-server /prod/game-server
WORKDIR /prod/game-server
EXPOSE 8000
CMD [ "npm", "start" ]