# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN apk update

# Build stage
FROM base AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/backend-assist-api ./apps/backend-assist-api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
WORKDIR /app/apps/backend-assist-api
ENV NODE_ENV=production
RUN pnpm run build

# Production stage
FROM base AS production

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files with proper ownership
COPY --chown=nodejs:nodejs pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY --chown=nodejs:nodejs packages ./packages
COPY --chown=nodejs:nodejs apps/backend-assist-api/package.json ./apps/backend-assist-api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --filter backend-assist-api...

WORKDIR /app/apps/backend-assist-api

# Copy built application with proper ownership
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend-assist-api/dist ./dist

# Switch to non-root user
USER nodejs

# Set environment variables
ENV PORT=8000
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/server.js"]
