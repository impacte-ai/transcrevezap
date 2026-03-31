import os
import redis
import logging

logger = logging.getLogger("TranscreveZAP")

def get_redis_connection_params():
    """
    Retorna os parâmetros de conexão do Redis baseado nas variáveis de ambiente.
    Retira parâmetros de autenticação se não estiverem configurados.
    """
    params = {
        'host': os.getenv('REDIS_HOST', 'localhost'),
        'port': int(os.getenv('REDIS_PORT', 6380)),
        'db': int(os.getenv('REDIS_DB', '0')),
        'decode_responses': True
    }
    
    # Adiciona credenciais apenas se estiverem configuradas
    username = os.getenv('REDIS_USERNAME')
    password = os.getenv('REDIS_PASSWORD')
    
    if username and username.strip():
        params['username'] = username
    if password and password.strip():
        params['password'] = password
        
    return params

def create_redis_client():
    """
    Cria e testa a conexão com o Redis.
    Retorna o cliente Redis se bem sucedido.
    """
    try:
        params = get_redis_connection_params()
        client = redis.Redis(**params)
        client.ping()  # Testa a conexão
        logger.info("Conexão com Redis estabelecida com sucesso!")
        return client
    except redis.exceptions.AuthenticationError:
        logger.error("Falha de autenticação no Redis. Verifique as credenciais.")
        raise
    except redis.exceptions.ConnectionError as e:
        logger.error(f"Erro de conexão com Redis: {e}")
        raise
    except Exception as e:
        logger.error(f"Erro ao configurar Redis: {e}")
        raise