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
ARG VITE_BACKEND_API_URL
ENV VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}
ARG VITE_WIDGET_BASE_PATH
ENV VITE_WIDGET_BASE_PATH=${VITE_WIDGET_BASE_PATH}

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/widget-ui ./apps/widget-ui

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
WORKDIR /app/apps/widget-ui
ENV NODE_ENV=production
RUN pnpm run build

# Production stage - Nginx
FROM nginx:alpine AS production

# Copy built assets with proper ownership
COPY --from=builder /app/apps/widget-ui/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/widget-ui/nginx.conf /etc/nginx/conf.d/default.conf

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
