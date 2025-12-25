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
RUN turbo prune auth --docker

# ---
# Build stage
FROM base AS builder

# ✅ Only NEXT_PUBLIC_ variables at build time
ARG NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}

# ❌ Remove these lines - they'll be runtime env vars:
# ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
# ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
# ENV DATABASE_URL=${DATABASE_URL}
# etc...

# Install dependencies first (better caching)
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prepare /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY --from=prepare /app/out/full/ .
RUN pnpm turbo build --filter=auth

# ---
# Production stage
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/auth/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/auth/.next/static ./apps/auth/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/auth/public ./apps/auth/public

# ✅ Basic Next.js configs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime env vars will come from docker-compose environment section
CMD ["node", "apps/auth/server.js"]