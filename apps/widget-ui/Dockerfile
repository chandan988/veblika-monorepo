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
RUN turbo prune widget-ui --docker

# ---
# Build stage
FROM base AS builder

# Accept build arguments
ARG VITE_BACKEND_API_URL
ENV VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}
ARG VITE_WIDGET_BASE_PATH
ENV VITE_WIDGET_BASE_PATH=${VITE_WIDGET_BASE_PATH}

# Install dependencies first (better caching)
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prepare /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY --from=prepare /app/out/full/ .
RUN pnpm turbo build --filter=widget-ui

# ---
# Production stage - Nginx
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/apps/widget-ui/dist /usr/share/nginx/html
COPY --from=prepare /app/out/full/apps/widget-ui/nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
