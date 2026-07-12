# syntax=docker/dockerfile:1
FROM oven/bun:1-slim AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY . .
RUN bun run build

FROM oven/bun:1-slim AS prod-deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production || bun install --production

FROM node:slim AS runtime
RUN useradd -m app
WORKDIR /app
COPY --from=build --chown=app:app /app/build ./build
COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app package.json ./
ENV NODE_ENV=production
USER app
EXPOSE 3000
CMD ["node", "build"]
