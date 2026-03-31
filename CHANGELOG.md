# Changelog

Todas as mudancas notaveis do TranscreveZAP sao documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento segue X.Y.Z.W:
- **X**: Mudanca estrutural grande (rewrite, migracao de stack)
- **Y**: Feature core nova (modulo, portal)
- **Z**: Melhoria significativa (refactor, UX)
- **W**: Fix ou ajuste menor

---

## [3.0.0.0] - 2026-03-31

### Refatoracao completa: Python para TypeScript

Reescrita total do TranscreveZAP. Saimos de Python (FastAPI + Streamlit) para TypeScript (Next.js + NestJS) com arquitetura hexagonal, multi-provedor de WhatsApp e IA, e painel administrativo moderno.

### Corrigido (pos-auditoria)

- Evolution API: formato sendText corrigido conforme v2 (campos na raiz, sem wrapper options)
- Evolution API: formato quoted reply simplificado (apenas key.id)
- Evolution API: disconnectInstance com fallback DELETE/POST
- UAZAPI: mapeamento de payload corrigido (campos nested em message/chat, nao na raiz)
- UAZAPI: campo messageid corrigido (era wa_message_id que nao existe)
- UAZAPI: replyid com strip de prefixo owner:
- ZPRO: mapper com fallback para phone/number/from
- ZPRO: connectInstance corrigido para POST /qrCodeSession
- ZPRO: status e disconnect com fallbacks resilientes
- Pipeline de transcricao: sendText agora e chamado apos transcricao (resposta no WhatsApp)
- API keys: prefixo padronizado apikeys.{provider} (frontend e backend alinhados)
- Rate limiting migrado de in-memory para Redis (sobrevive restart)
- Passwords migrados de SHA256 para bcrypt (12 salt rounds)
- Sumarizacao Gemini: prompts de 3 para 16 idiomas

### Adicionado

**Arquitetura:**
- Arquitetura hexagonal completa (domain/ports/adapters) no backend NestJS
- Monorepo com pnpm workspaces + Turborepo (apps/web, apps/api, packages/shared)
- Prisma ORM com suporte a SQLite (padrao, zero config) e PostgreSQL (opcional)
- BullMQ para filas de webhook (persistente, sobrevive restart)
- Docker multi-stage com Node.js 22 LTS (imagem ~50% menor que Python)

**Multi-provedor WhatsApp:**
- Evolution API — endpoint `/webhook/evolution/:connectionId`
- UAZAPI — endpoint `/webhook/uazapi/:connectionId`
- ZPRO — endpoint `/webhook/zpro/:connectionId`
- Cada provedor tem: controller, mapper (normaliza payload), adapter (sendText, downloadMedia, fetchGroups, connect, disconnect)
- Gestao de conexoes no painel com campos dinamicos por provedor

**Multi-provedor IA (STT - Speech-to-Text):**
- Groq (whisper-large-v3-turbo) — gratuito, recomendado
- OpenAI (gpt-4o-transcribe, gpt-4o-mini-transcribe) — melhor accuracy
- Google Gemini (gemini-2.5-flash) — multimodal, transcricao + resumo em 1 chamada
- Deepgram (nova-3) — ultra-rapido, $200 creditos gratuitos
- OpenRouter — acesso a 300+ modelos via API unica
- Factory pattern: trocar provider = trocar no dropdown, zero codigo

**Multi-provedor LLM (Sumarizacao):**
- Groq (llama-3.3-70b, gpt-oss-120b)
- OpenAI (gpt-5.4-mini, gpt-5.4-nano)
- Google Gemini (gemini-2.5-flash, gemini-3.1-pro)
- OpenRouter (qualquer modelo do mercado)
- Prompts de sumarizacao em 16 idiomas

**Gestao dinamica de modelos:**
- Dropdown de modelos busca direto da API do provider (GET /models)
- Cache no banco via tabela ProviderModel
- Botao "Atualizar Modelos" no painel para refresh manual
- Classifica automaticamente modelos em STT ou LLM

**Rotacao de chaves API:**
- Suporte a multiplas chaves por provider (JSON array)
- Round-robin automatico entre chaves
- Penalizacao automatica de chaves com falha (5 min TTL via Redis)
- Fallback: se todas penalizadas, usa a primeira

**Traducao automatica:**
- Detecta idioma do audio via provider STT
- Traduz automaticamente para o idioma do sistema quando diferente
- Configuravel por toggle no painel

**Webhook Hub com BullMQ:**
- Distribui webhooks para multiplos destinos simultaneamente
- Retry automatico com backoff exponencial (5s, 25s, 125s)
- Dead Letter Queue apos 3 falhas
- Monitoramento de saude por webhook (taxa sucesso/erro)
- Retry manual de entregas falhas
- Stats da fila (waiting, active, completed, failed, delayed)
- Persiste em Redis — sobrevive restart do container

**Frontend (Next.js 15):**
- Painel administrativo moderno com Tailwind CSS + shadcn/ui
- Dark/Light mode com toggle (persiste no localStorage)
- Login com Better Auth (cookies httpOnly, sessions server-side)
- RBAC customizavel — crie roles com permissoes granulares por entidade
- Sidebar filtra menus por permissao do usuario logado
- 10 paginas: Dashboard, Conexoes, Webhooks, Grupos, Bloqueios, Idiomas, Configuracoes, Usuarios, Logs, Perfil
- Formularios editaveis com labels em portugues
- Settings com selects, toggles, inputs tipados por secao
- CRUD completo em todas as paginas (criar, editar, excluir)
- Stats cards no dashboard
- Branding TranscreveZAP + "Powered by Impacte AI"
- Metadados OG completos + manifest PWA
- Favicon e logo integrados

**Seguranca:**
- Better Auth com cookies httpOnly e SameSite
- Rate limiting via Redis (5 tentativas / 15 min no login)
- Senhas com bcrypt (12 salt rounds)
- API interna protegida por InternalApiGuard (apenas localhost)
- RBAC granular server-side e client-side
- Validacao de sessao em API routes criticas (requireAuth)
- Security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy
- API keys mascaradas no painel

**Deploy e CI/CD:**
- Docker multi-stage com Node.js 22 slim (~50% menor)
- docker-compose pronto com Redis healthcheck
- Suporte a Traefik com labels para 2 dominios (manager + api)
- GitHub Actions: tag v* -> build Docker -> push Docker Hub + GitHub Release
- Migrations automaticas no startup (prisma migrate deploy)
- Seed condicional (so roda se banco vazio)
- Script de migracao v2 -> v3 (`pnpm migrate:v2`)

**Validacoes de paridade:**
- Validacao de conteudo da transcricao (minimo 10 chars)
- Validacao de qualidade do resumo (nao maior que 1.5x do original)
- Business message configuravel no footer da resposta
- 4 modos de saida: both, summary_only, transcription_only, smart

### Removido

- **Streamlit** — substituido por Next.js 15 (SSR, melhor performance, seguranca)
- **FastAPI** — substituido por NestJS (arquitetura hexagonal, DI nativa)
- **Python runtime** — substituido por Node.js 22 (stack unificada TypeScript)
- **Dependencia exclusiva de GROQ/OpenAI** — agora 5 providers de STT + 4 de LLM
- **Redis como banco principal** — dados estruturais agora em SQLite/PostgreSQL via Prisma
- **Sessao por URL param** — substituida por cookies httpOnly seguros
- **Credenciais em texto plano** — substituidas por bcrypt + secrets em env vars

### Migracao da v2.x

Usuarios da v2.x (Python) podem migrar seus dados Redis:
```bash
docker exec -it transcrevezap pnpm migrate:v2
```
Migra: settings, grupos, bloqueios, idiomas, webhook redirects, API keys.

---

## Versoes anteriores (Python)

### [2.3.3] - 2025

- Ajuste audio source download
- Ajuste readme

### [2.3.2] - 2025

- Sistema de selecao de provedor LLM (GROQ ou OpenAI)
- Correcao do sistema de validacao de chaves Groq
- Ajuste para verificar formdata e json na chamada Groq

### [2.3.1] - 2025

- Hub de Redirecionamento de Webhooks
- Monitoramento de saude dos webhooks
- Retry automatico para reenvio de mensagens falhas
- Headers de rastreamento (X-TranscreveZAP-Forward)

### [2.3.0] - 2025

- Suporte multilingue (16 idiomas)
- Deteccao automatica de idioma
- Traducao automatica
- Cache de idiomas (24h)
- Configuracao de idioma por contato
- Timestamps em transcricoes
- Sistema de rodizio de chaves GROQ
