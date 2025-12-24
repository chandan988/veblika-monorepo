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
RUN turbo prune social-media-api --docker

# ---
# Production stage (no build needed - plain JS)
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy pruned files and install prod dependencies
COPY --from=prepare --chown=expressjs:nodejs /app/out/json/ .
COPY --from=prepare --chown=expressjs:nodejs /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prepare --chown=expressjs:nodejs /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile --prod

# Copy source code
COPY --from=prepare --chown=expressjs:nodejs /app/out/full/ .

USER expressjs

ENV PORT=8000
ENV NODE_ENV=production

CMD ["node", "apps/social-media-api/index.js"]
