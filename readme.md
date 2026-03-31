![TranscreveZAP](static/fluxo.png)

# TranscreveZAP 3.0 — Transcrição Inteligente de Áudios do WhatsApp

Plataforma open source para transcrição automática, sumarização e tradução de áudios do WhatsApp com inteligência artificial. Multi-provedor de WhatsApp e IA, com painel administrativo moderno e deploy simplificado via Docker.

**Desenvolvido com Next.js, NestJS, Prisma e TypeScript**

[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-impacteai%2Ftranscrevezap-blue)](https://hub.docker.com/r/impacteai/transcrevezap)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

**Site:** [impacte.ai](https://impacte.ai) | **Email:** contato@impacte.ai | **WhatsApp:** [Grupo da Comunidade](https://chat.whatsapp.com/L9jB1SlcmQFIVxzN71Y6KG)

---

## O que o TranscreveZAP faz

1. Recebe webhooks de áudios do WhatsApp (via Evolution API, UAZAPI ou ZPRO)
2. Transcreve o áudio usando IA (Groq, OpenAI, Google Gemini, Deepgram ou OpenRouter)
3. Resume o texto com LLM (opcional, configurável)
4. Traduz automaticamente entre idiomas (opcional)
5. Responde no WhatsApp com a transcrição/resumo como reply do áudio original
6. Distribui o webhook para outros destinos (Webhook Hub)

---

## Funcionalidades

- **Multi-provedor WhatsApp**: Evolution API, UAZAPI, ZPRO — cada um com endpoint dedicado
- **Multi-provedor IA (STT)**: Groq (Whisper), OpenAI (GPT-4o Transcribe), Google Gemini (multimodal), Deepgram (Nova-3), OpenRouter
- **Multi-provedor LLM**: Groq, OpenAI, Google Gemini, OpenRouter — para sumarização
- **Dropdown dinâmico de modelos**: Busca modelos direto da API do provider com cache no banco
- **Rotação de chaves API**: Round-robin com penalização automática de chaves com falha (5 min)
- **Fallback chain**: Se o provider principal falhar, tenta o fallback configurado
- **16 idiomas**: Transcrição, resumo e tradução em pt, en, es, fr, de, it, ja, ko, zh, ru, ar, hi, nl, pl, tr, ro
- **Detecção automática de idioma**: Identifica o idioma do áudio automaticamente
- **Tradução automática**: Traduz para o idioma do sistema quando o contato fala em outro idioma
- **Idioma por contato**: Configure idioma específico para cada contato
- **Timestamps**: Marcadores de tempo [MM:SS] opcionais na transcrição
- **4 modos de saída**: Ambos, apenas resumo, apenas transcrição, inteligente (resume se longo)
- **Webhook Hub**: Distribui webhooks para múltiplos destinos com retry automático (BullMQ)
- **RBAC customizável**: Crie roles e permissões granulares para cada usuário
- **Dark/Light mode**: Toggle de tema no painel
- **Painel moderno**: Next.js 15 com Tailwind CSS, responsivo, light/dark mode
- **SQLite ou PostgreSQL**: Banco relacional via Prisma — SQLite por padrão (zero config)
- **Redis**: Cache, filas de webhook, rate limiting, rotação de chaves
- **Docker Hub**: Imagens prontas para deploy

---

## Instalacao Rapida (Docker Compose)

### Pré-requisitos

- Docker e Docker Compose instalados ([Instruções](https://docs.docker.com/get-docker/))
- Uma conta em pelo menos um provedor WhatsApp (Evolution API, UAZAPI ou ZPRO)
- Pelo menos uma API key de IA (Groq recomendado — gratuito)

### 1. Crie o docker-compose.yaml

```yaml
services:
  transcrevezap:
    image: impacteai/transcrevezap:latest
    container_name: transcrevezap
    restart: unless-stopped
    ports:
      - "8005:8005"  # API (webhooks)
      - "3000:3000"  # Painel administrativo
    environment:
      - TZ=America/Sao_Paulo
      - DATABASE_URL=file:/app/data/transcrevezap.db
      - REDIS_HOST=redis-transcrevezap
      - REDIS_PORT=6380
      - BETTER_AUTH_SECRET=GERE_UMA_CHAVE_ALEATORIA_AQUI
      - ADMIN_EMAIL=admin@seu.email.com
      - ADMIN_PASSWORD=sua_senha_segura
    volumes:
      - transcrevezap_data:/app/data
    depends_on:
      redis-transcrevezap:
        condition: service_healthy

  redis-transcrevezap:
    image: redis:7-alpine
    container_name: redis-transcrevezap
    restart: unless-stopped
    command: redis-server --port 6380 --appendonly yes
    volumes:
      - redis_transcrevezap_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-p", "6380", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  transcrevezap_data:
  redis_transcrevezap_data:
```

### 2. Inicie

```bash
docker compose up -d
```

### 3. Acesse o painel

Abra **http://seu-ip:3000** no navegador.

Login com as credenciais definidas em `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

### 4. Configure no painel

1. **Configuracoes > API Keys**: Adicione a chave do seu provider de IA (Groq, OpenAI, etc.)
2. **Conexoes**: Crie uma conexao com seu provider WhatsApp (Evolution API, UAZAPI ou ZPRO)
3. **Configure o webhook** no seu provider WhatsApp apontando para:
   - Evolution API: `http://seu-ip:8005/webhook/evolution/SEU_CONNECTION_ID`
   - UAZAPI: `http://seu-ip:8005/webhook/uazapi/SEU_CONNECTION_ID`
   - ZPRO: `http://seu-ip:8005/webhook/zpro/SEU_CONNECTION_ID`

O `CONNECTION_ID` e gerado automaticamente ao criar a conexao no painel.

---

## Deploy com Traefik (SSL/HTTPS)

Para deploy em producao com SSL automatico via Traefik:

```yaml
services:
  transcrevezap:
    image: impacteai/transcrevezap:latest
    restart: unless-stopped
    environment:
      - TZ=America/Sao_Paulo
      - DATABASE_URL=file:/app/data/transcrevezap.db
      - REDIS_HOST=redis-transcrevezap
      - REDIS_PORT=6380
      - BETTER_AUTH_SECRET=GERE_UMA_CHAVE_ALEATORIA_AQUI
      - ADMIN_EMAIL=admin@seu.email.com
      - ADMIN_PASSWORD=sua_senha_segura
      - NEXT_PUBLIC_APP_URL=https://manager.seudominio.com
    volumes:
      - transcrevezap_data:/app/data
    depends_on:
      redis-transcrevezap:
        condition: service_healthy
    labels:
      # Painel (Next.js)
      - "traefik.enable=true"
      - "traefik.http.routers.tz-web.rule=Host(`manager.seudominio.com`)"
      - "traefik.http.routers.tz-web.entrypoints=websecure"
      - "traefik.http.routers.tz-web.tls.certresolver=letsencryptresolver"
      - "traefik.http.services.tz-web.loadbalancer.server.port=3000"
      # API (NestJS)
      - "traefik.http.routers.tz-api.rule=Host(`api.seudominio.com`)"
      - "traefik.http.routers.tz-api.entrypoints=websecure"
      - "traefik.http.routers.tz-api.tls.certresolver=letsencryptresolver"
      - "traefik.http.services.tz-api.loadbalancer.server.port=8005"
    networks:
      - sua_rede_externa

  redis-transcrevezap:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --port 6380 --appendonly yes
    volumes:
      - redis_transcrevezap_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-p", "6380", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - sua_rede_externa

volumes:
  transcrevezap_data:
  redis_transcrevezap_data:

networks:
  sua_rede_externa:
    external: true
```

**Endpoints com Traefik:**
- Painel: `https://manager.seudominio.com`
- Webhook Evolution: `https://api.seudominio.com/webhook/evolution/SEU_CONNECTION_ID`
- Webhook UAZAPI: `https://api.seudominio.com/webhook/uazapi/SEU_CONNECTION_ID`
- Webhook ZPRO: `https://api.seudominio.com/webhook/zpro/SEU_CONNECTION_ID`

---

## Variaveis de Ambiente

| Variavel | Descricao | Obrigatoria | Padrao |
|----------|-----------|-------------|--------|
| `DATABASE_URL` | URL do banco (SQLite ou PostgreSQL) | Sim | `file:/app/data/transcrevezap.db` |
| `REDIS_HOST` | Host do Redis | Sim | `redis-transcrevezap` |
| `REDIS_PORT` | Porta do Redis | Sim | `6380` |
| `BETTER_AUTH_SECRET` | Chave secreta para autenticacao (gere uma aleatoria) | Sim | — |
| `ADMIN_EMAIL` | Email do admin inicial | Sim | `admin@transcrevezap.local` |
| `ADMIN_PASSWORD` | Senha do admin inicial | Sim | `admin123` |
| `NEXT_PUBLIC_APP_URL` | URL publica do painel (para Traefik) | Nao | `http://localhost:3000` |
| `REDIS_PASSWORD` | Senha do Redis (se autenticado) | Nao | — |
| `TZ` | Timezone | Nao | `America/Sao_Paulo` |
| `INTERNAL_API_SECRET` | Secret para proteger API interna (producao) | Nao | — |

### Usando PostgreSQL em vez de SQLite

Descomente o servico `postgres` no docker-compose e altere:

```yaml
- DATABASE_URL=postgresql://transcrevezap:sua_senha@postgres:5432/transcrevezap
```

---

## Usando o Painel

### Dashboard
Visao geral com estatisticas de transcrições, conexoes ativas e graficos.

### Conexoes
Gerencie suas instancias WhatsApp:
- Crie conexoes com Evolution API, UAZAPI ou ZPRO
- Cada conexao tem campos especificos por provedor
- O `CONNECTION_ID` na URL do webhook e gerado automaticamente

### Configuracoes
- **Transcricao**: Escolha provider STT, modelo, idioma padrao, timestamps
- **Sumarizacao**: Escolha provider LLM, modelo, modo de saida, limite de caracteres
- **Mensagens**: Personalize headers e mensagem de negocio
- **Processamento**: Modo (todos/apenas grupos), processar proprias mensagens
- **API Keys**: Gerencie chaves por provider (com mascaramento)
- **Modelos**: Clique "Atualizar Modelos" para buscar modelos atualizados direto da API do provider

### Webhook Hub
Distribua webhooks para multiplos destinos:
- Adicione URLs de destino
- Monitoramento de saude (taxa de sucesso/erro)
- Retry automatico com backoff exponencial (5s, 25s, 125s)
- Dead Letter Queue para falhas persistentes
- Retry manual de entregas falhas

### Grupos e Bloqueios
- Permita ou bloqueie grupos especificos
- Bloqueie usuarios por numero de telefone

### Idiomas
- Defina idioma padrao do sistema
- Configure idioma por contato
- Ative deteccao automatica de idioma
- Ative traducao automatica

### Usuarios
- CRUD completo de usuarios com roles customizaveis
- Cada role tem permissoes granulares por funcionalidade (read/write/delete)
- Sidebar respeita as permissoes do usuario logado

### Perfil
- Altere seu nome, email e senha

---

## Providers de IA Suportados

### STT (Speech-to-Text)

| Provider | Modelos | Free Tier | Recomendacao |
|----------|---------|-----------|--------------|
| **Groq** | whisper-large-v3-turbo | Sim (30 RPM) | Melhor custo-beneficio |
| **Google Gemini** | gemini-2.5-flash (multimodal) | Sim (10 RPM) | Transcricao + resumo em 1 chamada |
| **OpenAI** | gpt-4o-transcribe, gpt-4o-mini-transcribe | Nao | Melhor accuracy |
| **Deepgram** | nova-3 | Sim ($200 creditos) | Ultra-rapido |
| **OpenRouter** | Via sub-providers | Alguns modelos | Acesso universal |

### LLM (Sumarizacao)

| Provider | Modelos | Recomendacao |
|----------|---------|--------------|
| **Groq** | llama-3.3-70b, gpt-oss-120b | Rapido e gratuito |
| **Google Gemini** | gemini-2.5-flash, gemini-3.1-pro | Multimodal |
| **OpenAI** | gpt-5.4-mini, gpt-5.4-nano | Alta qualidade |
| **OpenRouter** | 300+ modelos | Flexibilidade total |

---

## Providers de WhatsApp Suportados

| Provider | Endpoint Webhook | Documentacao |
|----------|-----------------|--------------|
| **Evolution API** | `/webhook/evolution/:connectionId` | [doc.evolution-api.com](https://doc.evolution-api.com) |
| **UAZAPI** | `/webhook/uazapi/:connectionId` | Documentacao interna |
| **ZPRO** | `/webhook/zpro/:connectionId` | Documentacao interna |

---

## Idiomas Suportados

Portugues, Ingles, Espanhol, Frances, Alemao, Italiano, Japones, Coreano, Chines, Romeno, Russo, Arabe, Hindi, Holandes, Polones, Turco.

---

## Arquitetura

```
Container: transcrevezap
+-- Next.js :3000 (Painel administrativo)
+-- NestJS  :8005 (API de webhooks + transcricao)

Container: redis
+-- Redis :6380 (Cache, filas, rate limiting)

Opcional: postgres
+-- PostgreSQL :5432 (alternativa ao SQLite)
```

**Stack:**
- **Frontend**: Next.js 15, Tailwind CSS, shadcn/ui
- **Backend**: NestJS com arquitetura hexagonal
- **ORM**: Prisma (SQLite padrao / PostgreSQL opcional)
- **Filas**: BullMQ (Redis)
- **Auth**: Better Auth com RBAC

---

## Migracao da v2.x para v3.0

Se voce ja usa o TranscreveZAP v2.x (Python), seus dados no Redis podem ser migrados:

```bash
# Com o Redis v2 rodando, execute:
docker exec -it transcrevezap pnpm migrate:v2
```

O script migra: settings, grupos permitidos, usuarios bloqueados, idiomas por contato, webhook redirects e API keys.

---

## Desenvolvimento Local

```bash
# Pre-requisitos: Node.js 22, pnpm, Docker (para Redis)

# 1. Clone o repositorio
git clone https://github.com/impacte/transcrevezap.git
cd transcrevezap

# 2. Instale dependencias
pnpm install

# 3. Suba o Redis
docker compose -f docker/docker-compose.dev.yaml up -d

# 4. Configure o banco
pnpm db:generate
DATABASE_URL="file:$(pwd)/packages/shared/prisma/dev.db" pnpm db:migrate -- --name init

# 5. Configure variaveis de ambiente
export DATABASE_URL="file:$(pwd)/packages/shared/prisma/dev.db"
export REDIS_HOST=localhost
export REDIS_PORT=6380
export BETTER_AUTH_SECRET=dev-secret-key-qualquer
export BETTER_AUTH_URL=http://localhost:3000
export NEXT_PUBLIC_APP_URL=http://localhost:3000
export NESTJS_INTERNAL_URL=http://localhost:8005

# 6. Build e inicie
pnpm --filter @transcrevezap/api build
node apps/api/dist/main.js &
pnpm --filter @transcrevezap/web dev
```

Acesse http://localhost:3000. Credenciais do seed: email do `ADMIN_EMAIL` e senha do `ADMIN_PASSWORD`.

---

## Seguranca

- Autenticacao com Better Auth (cookies httpOnly, sessions server-side)
- Rate limiting via Redis (5 tentativas / 15 min no login)
- Senhas com bcrypt (12 salt rounds)
- API interna protegida por guard (apenas localhost acessa)
- RBAC granular com permissoes por entidade
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- API keys mascaradas no painel
- Validacao de sessao server-side nas API routes

---

## Contribuicao

1. Fork o repositorio
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commits em portugues: `git commit -m "feat(escopo): descricao"`
4. Push e abra um PR

---

## Licenca

MIT — veja [LICENSE](LICENSE).

---

**Desenvolvido por [Impacte AI](https://impacte.ai)** | contato@impacte.ai

![PIX](legacy/pix.jpeg)
