# Imagem base do Python 3.10-slim
FROM python:3.10-slim

# Configuração básica de timezone
ENV TZ=America/Sao_Paulo

# Instalação de dependências mínimas necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    redis-tools \
    tzdata \
    dos2unix \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

# Configuração do ambiente de trabalho
WORKDIR /app

# Instalação das dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia dos arquivos da aplicação
COPY . .

# Preparação do diretório de estáticos
RUN mkdir -p /app/static && \
    if [ -d "static" ]; then cp -r static/* /app/static/ 2>/dev/null || true; fi

# Configuração do script de inicialização
RUN chmod +x start.sh && \
    dos2unix start.sh && \
    apt-get purge -y dos2unix && \
    apt-get autoremove -y

# Portas da aplicação
EXPOSE 8005 8501

# Valores padrão para Redis
ENV REDIS_HOST=redis-transcrevezap \
    REDIS_PORT=6380 \
    REDIS_DB=0

# Comando de inicialização
CMD ["/bin/bash", "/app/start.sh"]