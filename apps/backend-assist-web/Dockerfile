# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN apk update

# Build stage
FROM base AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Accept build arguments
ARG BETTER_AUTH_URL
ARG CLIENT_URL
ENV NEXT_PUBLIC_AUTH_URL=${BETTER_AUTH_URL}
ENV NEXT_PUBLIC_CLIENT_URL=${CLIENT_URL}

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/backend-assist-web ./apps/backend-assist-web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
WORKDIR /app/apps/backend-assist-web
ENV NODE_ENV=production
RUN pnpm run build

# Production stage
FROM base AS production

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Next.js standalone output with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend-assist-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend-assist-web/.next/static ./apps/backend-assist-web/.next/static

WORKDIR /app/apps/backend-assist-web

# Switch to non-root user
USER nextjs

# Start the application
CMD ["node", "server.js"]
