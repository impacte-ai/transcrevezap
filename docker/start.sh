#!/bin/bash
set -e
export TZ=America/Sao_Paulo

echo "============================================"
echo "  TranscreveZAP v3.0 — Iniciando..."
echo "  Timezone: $TZ"
echo "============================================"

# Aguardar Redis
echo "Aguardando Redis em $REDIS_HOST:$REDIS_PORT..."
until redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6380}" ping 2>/dev/null | grep -q PONG; do
  echo "Redis não disponível, tentando novamente em 2s..."
  sleep 2
done
echo "Redis conectado."

# Rodar migrations do Prisma
echo "Executando migrations..."
DATABASE_URL="${DATABASE_URL:-file:/app/data/transcrevezap.db}" npx prisma migrate deploy --schema=./prisma/schema.prisma
echo "Migrations aplicadas."

# Seed (apenas se banco vazio)
USER_COUNT=$(DATABASE_URL="${DATABASE_URL:-file:/app/data/transcrevezap.db}" npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "SELECT COUNT(*) as c FROM User;" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")
if [ "$USER_COUNT" = "0" ]; then
  echo "Banco vazio, executando seed..."
  DATABASE_URL="${DATABASE_URL:-file:/app/data/transcrevezap.db}" npx prisma db seed --schema=./prisma/schema.prisma
  echo "Seed completo."
fi

# Iniciar NestJS API (background)
echo "Iniciando NestJS API na porta ${API_PORT:-8005}..."
DATABASE_URL="${DATABASE_URL:-file:/app/data/transcrevezap.db}" node api/main.js &

# Iniciar Next.js (background)
echo "Iniciando Next.js na porta 3000..."
DATABASE_URL="${DATABASE_URL:-file:/app/data/transcrevezap.db}" node web/server.js &

echo "============================================"
echo "  TranscreveZAP v3.0 — Pronto!"
echo "  API:     http://localhost:${API_PORT:-8005}"
echo "  Manager: http://localhost:3000"
echo "============================================"

# Manter container vivo
wait
