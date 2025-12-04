# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN apk update

# Production stage
FROM base AS production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy workspace files with proper ownership
COPY --chown=nodejs:nodejs pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY --chown=nodejs:nodejs packages ./packages
COPY --chown=nodejs:nodejs apps/social-media-api ./apps/social-media-api

# Install dependencies
RUN pnpm install --frozen-lockfile --filter social-media-api...

WORKDIR /app/apps/social-media-api

# Switch to non-root user
USER nodejs

# Set environment variables
ENV PORT=8000
ENV NODE_ENV=production

# Start the application
CMD ["node", "index.js"]
