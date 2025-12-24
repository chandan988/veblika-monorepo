# Configurable Node version
ARG NODE_VERSION=24.11.1
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---
# Prepare stage - Prune monorepo for this app
FROM base AS prepare

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm add -g turbo

COPY . .
RUN turbo prune backend-assist-api --docker

# ---
# Build stage
FROM base AS builder

# Install dependencies first (better caching)
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prepare /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY --from=prepare /app/out/full/ .
RUN pnpm turbo build --filter=backend-assist-api

# ---
# Production stage
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs
USER expressjs

# Copy entire built app (includes node_modules and dist)
COPY --from=builder --chown=expressjs:nodejs /app .

ENV PORT=8000
ENV NODE_ENV=production

CMD ["node", "apps/backend-assist-api/dist/server.js"]
