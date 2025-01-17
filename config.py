import logging
import redis
import os

# Configuração de logging com cores e formatação melhorada
class ColoredFormatter(logging.Formatter):
    """Formatter personalizado que adiciona cores aos logs."""
    COLORS = {
        logging.DEBUG: "\x1b[38;5;39m",      # Azul
        logging.INFO: "\x1b[38;21m",        # Cinza
        logging.WARNING: "\x1b[38;5;226m",  # Amarelo
        logging.ERROR: "\x1b[38;5;196m",    # Vermelho
        logging.CRITICAL: "\x1b[31;1m",     # Vermelho forte
    }
    RESET = "\x1b[0m"

    def format(self, record):
        color = self.COLORS.get(record.levelno, self.RESET)
        log_fmt = f"{color}%(asctime)s - %(name)s - %(levelname)s - %(message)s{self.RESET}"
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

# Configuração inicial do logging
logger = logging.getLogger("TranscreveZAP")
handler = logging.StreamHandler()
handler.setFormatter(ColoredFormatter())
logger.addHandler(handler)

# Nível de log inicial (pode ser ajustado após o carregamento de configurações)
logger.setLevel(logging.INFO)

# Conexão com o Redis usando username e password
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    username=os.getenv('REDIS_USERNAME', 'default'),  # Nome de usuário padrão
    password=os.getenv('REDIS_PASSWORD', ''),         # Senha padrão
    db=int(os.getenv('REDIS_DB', 0)),                 # Banco de dados padrão
    decode_responses=True
)

# Testar conexão com Redis
try:
    redis_client.ping()
    logger.info("Conexão com Redis estabelecida com sucesso!")
except redis.exceptions.AuthenticationError:
    logger.critical("Falha de autenticação no Redis. Verifique as credenciais.")
    raise
except Exception as e:
    logger.critical(f"Erro ao conectar ao Redis: {e}")
    raise

# Classe Settings para gerenciar configurações
class Settings:
    """Classe para gerenciar configurações do sistema."""
    def __init__(self):
        """Inicializa as configurações."""
        logger.debug("Carregando configurações do Redis...")

        self.GROQ_API_KEY = self.get_redis_value("GROQ_API_KEY", "gsk_default_key")
        self.BUSINESS_MESSAGE = self.get_redis_value("BUSINESS_MESSAGE", "*Impacte AI* Premium Services")
        self.PROCESS_GROUP_MESSAGES = self.get_redis_value("PROCESS_GROUP_MESSAGES", "false").lower() == "true"
        self.PROCESS_SELF_MESSAGES = self.get_redis_value("PROCESS_SELF_MESSAGES", "true").lower() == "true"
        self.DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
        self.TRANSCRIPTION_LANGUAGE = self.get_redis_value("TRANSCRIPTION_LANGUAGE", "pt")
        
        # Mascarar chave ao logar
        if self.GROQ_API_KEY:
            masked_key = f"{self.GROQ_API_KEY[:10]}...{self.GROQ_API_KEY[-4:]}"
            logger.debug(f"GROQ_API_KEY carregada: {masked_key}")
        else:
            logger.error("GROQ_API_KEY não encontrada!")

        logger.debug(
            f"Configurações carregadas: LOG_LEVEL={self.LOG_LEVEL}, "
            f"PROCESS_GROUP_MESSAGES={self.PROCESS_GROUP_MESSAGES}, "
            f"PROCESS_SELF_MESSAGES={self.PROCESS_SELF_MESSAGES}"
        )

    def get_redis_value(self, key, default):
        """Obtém um valor do Redis com fallback para o valor padrão."""
        value = redis_client.get(key)
        if value is None:
            logger.warning(f"Configuração '{key}' não encontrada no Redis. Usando padrão: {default}")
            return default
        return value

    def set_redis_value(self, key, value):
        """Define um valor no Redis."""
        redis_client.set(key, value)
        logger.debug(f"Configuração '{key}' atualizada no Redis")

    def validate(self):
        """Validação detalhada das configurações críticas."""
        logger.debug("Validando configurações...")
        errors = []

        if not self.GROQ_API_KEY:
            errors.append("GROQ_API_KEY não está definida.")
        elif not self.GROQ_API_KEY.startswith("gsk_"):
            errors.append("GROQ_API_KEY inválida: deve começar com 'gsk_'.")

        if errors:
            for error in errors:
                logger.error(error)
            return False

        logger.info("Todas as configurações foram validadas com sucesso!")
        return True

# Instância única de configurações
settings = Settings()
if not settings.validate():
    logger.critical("Configurações inválidas detectadas durante a inicialização.")
    settings = None  # Evita que seja referenciado como 'NoneType'

def load_settings():
    """
    Recarrega as configurações do Redis.
    """
    global settings
    settings = Settings()
    # Ajustar nível de log
    log_level = getattr(logging, settings.LOG_LEVEL, logging.INFO)
    logger.setLevel(log_level)
    logger.info(f"Nível de log ajustado para: {logging.getLevelName(log_level)}")
