# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/social-media-web ./apps/social-media-web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
WORKDIR /app/apps/social-media-web
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy Next.js standalone output
COPY --from=builder /app/apps/social-media-web/.next/standalone ./
COPY --from=builder /app/apps/social-media-web/.next/static ./apps/social-media-web/.next/static
COPY --from=builder /app/apps/social-media-web/public ./apps/social-media-web/public

WORKDIR /app/apps/social-media-web

# Set environment variables
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
