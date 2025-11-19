# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"
RUN apk add --no-cache bash curl ca-certificates \
  && curl -fsSL https://bun.sh/install | bash

WORKDIR /app
COPY bun.lock package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/auth ./apps/auth
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app/apps/auth
ENV NEXT_TELEMETRY_DISABLED=1
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ENV DATABASE_URL=${DATABASE_URL}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV DEFAULT_FROM_EMAIL=${DEFAULT_FROM_EMAIL}
ENV SMTP_HOST=${SMTP_HOST}
ENV SMTP_PORT=${SMTP_PORT}
ENV SMTP_SECURE=${SMTP_SECURE}
ENV SMTP_USER=${SMTP_USER}
ENV SMTP_PASS=${SMTP_PASS}
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}

RUN bun run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/auth ./apps/auth
COPY --from=builder /app/apps/auth/.next ./apps/auth/.next

WORKDIR /app/apps/auth
EXPOSE 3000
CMD ["npm", "run", "start"]
