# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"
RUN apk add --no-cache bash curl ca-certificates \
  && curl -fsSL https://bun.sh/install | bash

WORKDIR /app
COPY bun.lock package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/social-media ./apps/social-media
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app/apps/social-media
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/social-media ./apps/social-media
COPY --from=builder /app/apps/social-media/.next ./apps/social-media/.next

WORKDIR /app/apps/social-media
EXPOSE 3002
CMD ["npm", "run", "start"]
