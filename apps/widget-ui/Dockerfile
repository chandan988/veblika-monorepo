# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Accept build arguments
ARG VITE_BACKEND_API_URL=http://localhost:8000
ENV VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/widget-ui ./apps/widget-ui

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
WORKDIR /app/apps/widget-ui
RUN pnpm run build

# Production stage - Nginx
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/apps/widget-ui/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/widget-ui/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
