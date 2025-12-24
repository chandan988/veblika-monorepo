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
RUN turbo prune social-media-web --docker

# ---
# Build stage
FROM base AS builder

# Accept build arguments
ARG NEXT_PUBLIC_CLIENT_URL
ARG NEXT_PUBLIC_AUTH_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CLIENT_URL=${NEXT_PUBLIC_CLIENT_URL}
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Install dependencies first (better caching)
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prepare /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY --from=prepare /app/out/full/ .
RUN pnpm turbo build --filter=social-media-web

# ---
# Production stage
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/social-media-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/social-media-web/.next/static ./apps/social-media-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/social-media-web/public ./apps/social-media-web/public

ENV NODE_ENV=production

CMD ["node", "apps/social-media-web/server.js"]
