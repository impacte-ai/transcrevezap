#!/bin/bash

# Função para inicializar configurações no Redis se não existirem
initialize_redis_config() {
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" \
        --user "$REDIS_USERNAME" \
        -a "$REDIS_PASSWORD" \
        -n "$REDIS_DB" \
        SET GROQ_API_KEY "$GROQ_API_KEY" NX

    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" \
        --user "$REDIS_USERNAME" \
        -a "$REDIS_PASSWORD" \
        -n "$REDIS_DB" \
        SET BUSINESS_MESSAGE "$BUSINESS_MESSAGE" NX

    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" \
        --user "$REDIS_USERNAME" \
        -a "$REDIS_PASSWORD" \
        -n "$REDIS_DB" \
        SET PROCESS_GROUP_MESSAGES "$PROCESS_GROUP_MESSAGES" NX

    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" \
        --user "$REDIS_USERNAME" \
        -a "$REDIS_PASSWORD" \
        -n "$REDIS_DB" \
        SET PROCESS_SELF_MESSAGES "$PROCESS_SELF_MESSAGES" NX

    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" \
        --user "$REDIS_USERNAME" \
        -a "$REDIS_PASSWORD" \
        -n "$REDIS_DB" \
        SET API_DOMAIN "$API_DOMAIN" NX
}

# Aguardar o Redis estar pronto
echo "Aguardando o Redis ficar disponível..."
until redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" \
    --user "$REDIS_USERNAME" \
    -a "$REDIS_PASSWORD" \
    -n "$REDIS_DB" \
    PING | grep -q PONG; do
  echo "Redis não está pronto - aguardando..."
  sleep 5
done

echo "Redis está disponível."

# Inicializar configurações no Redis (apenas se não existirem)
initialize_redis_config

# Iniciar o FastAPI em background
echo "Iniciando o FastAPI..."
uvicorn main:app --host 0.0.0.0 --port 8005 &

# Iniciar o Streamlit
echo "Iniciando o Streamlit..."
streamlit run manager.py --server.address 0.0.0.0 --server.port 8501 &

# Manter o script rodando
wait