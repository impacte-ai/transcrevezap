#!/bin/bash

# Função para construir o comando redis-cli com autenticação condicional
build_redis_cli_cmd() {
    cmd="redis-cli -h ${REDIS_HOST:-localhost} -p ${REDIS_PORT:-6380}"
    
    if [ ! -z "$REDIS_USERNAME" ]; then
        cmd="$cmd --user $REDIS_USERNAME"
    fi
    
    if [ ! -z "$REDIS_PASSWORD" ]; then
        cmd="$cmd -a $REDIS_PASSWORD"
    fi
    
    if [ ! -z "$REDIS_DB" ]; then
        cmd="$cmd -n $REDIS_DB"
    fi
    
    echo "$cmd"
}

# Função para inicializar configurações no Redis
initialize_redis_config() {
    redis_cmd=$(build_redis_cli_cmd)
    
    $redis_cmd SET GROQ_API_KEY "sua_api_key_aqui" NX
    $redis_cmd SET BUSINESS_MESSAGE "*Impacte AI* Premium Services" NX
    $redis_cmd SET PROCESS_GROUP_MESSAGES "false" NX
    $redis_cmd SET PROCESS_SELF_MESSAGES "true" NX
    $redis_cmd SET API_DOMAIN "$API_DOMAIN" NX
}

# Aguardar o Redis estar pronto
echo "Aguardando o Redis ficar disponível..."
redis_cmd=$(build_redis_cli_cmd)

until $redis_cmd PING 2>/dev/null; do
  echo "Redis não está pronto - aguardando..."
  sleep 5
done

echo "Redis disponível!"

# Inicializar configurações
initialize_redis_config

# Iniciar o FastAPI em background
uvicorn main:app --host 0.0.0.0 --port 8005 &

# Iniciar o Streamlit
streamlit run manager.py --server.address 0.0.0.0 --server.port 8501

# Manter o script rodando
wait