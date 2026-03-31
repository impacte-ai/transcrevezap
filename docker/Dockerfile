# ============================================
# TranscreveZAP v3 — Multi-stage Docker build
# ============================================

FROM node:22-slim AS base
ENV TZ=America/Sao_Paulo
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update && apt-get install -y tzdata redis-tools && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- Build everything in one stage (simpler for pnpm workspaces) ----
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @transcrevezap/shared prisma generate
RUN pnpm --filter @transcrevezap/api build
RUN pnpm --filter @transcrevezap/web build

# ---- Runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy entire node_modules (pnpm hoists to root + workspace dirs)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

# Prisma schema + migrations (for migrate deploy at startup)
COPY --from=builder /app/packages/shared/prisma ./prisma

# NestJS dist + deps
COPY --from=builder /app/apps/api/dist ./api
COPY --from=builder /app/apps/api/node_modules ./api/node_modules

# Next.js standalone + static
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
