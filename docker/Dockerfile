# ============================================
# TranscreveZAP v3 — Multi-stage Docker build
# ============================================

FROM node:22-slim AS base
ENV TZ=America/Sao_Paulo
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update && apt-get install -y tzdata redis-tools && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .

# Generate Prisma client
RUN pnpm --filter @transcrevezap/shared prisma generate

# Build NestJS
RUN pnpm --filter @transcrevezap/api build

# Build Next.js (standalone)
RUN pnpm --filter @transcrevezap/web build

# ---- Runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Prisma client + schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/packages/shared/prisma ./prisma

# NestJS dist
COPY --from=builder /app/apps/api/dist ./api
COPY --from=builder /app/apps/api/node_modules ./api/node_modules

# Next.js standalone
COPY --from=builder /app/apps/web/.next/standalone ./web
COPY --from=builder /app/apps/web/.next/static ./web/.next/static
COPY --from=builder /app/apps/web/public ./web/public

# Static assets
COPY static ./static

# Startup script
COPY docker/start.sh ./start.sh
RUN chmod +x ./start.sh

# Data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000 8005

CMD ["./start.sh"]
