# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"
RUN apk add --no-cache bash curl ca-certificates \
  && curl -fsSL https://bun.sh/install | bash

WORKDIR /app
COPY bun.lock package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/backend-assist-api ./apps/backend-assist-api
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app/apps/backend-assist-api
RUN bun run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app

COPY --from=base /app/apps/backend-assist-api/package.json ./package.json
COPY --from=base /app/apps/backend-assist-api/tsconfig.json ./tsconfig.json
COPY --from=base /app/apps/backend-assist-api/.env.example ./.env.example
COPY --from=base /app/apps/backend-assist-api/src ./src
COPY --from=base /app/apps/backend-assist-api/node_modules ./node_modules
COPY --from=builder /app/apps/backend-assist-api/dist ./dist

EXPOSE 4000
CMD ["node", "dist/server.js"]
