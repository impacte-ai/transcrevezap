# Changelog

Todas as mudanças notáveis do TranscreveZAP são documentadas aqui.

## [3.0.0.0] — 2026-03-30

### Adicionado
- Refatoração completa para TypeScript (Next.js + NestJS)
- Arquitetura hexagonal (domain/ports/adapters)
- Frontend moderno com Next.js 15, Tailwind CSS, shadcn/ui
- Autenticação com Better Auth + RBAC customizável
- Suporte a múltiplos provedores WhatsApp: Evolution API, UAZAPI, ZPRO
- Suporte a múltiplos provedores STT: Groq, Google Gemini, OpenAI, Deepgram, OpenRouter
- Suporte a múltiplos provedores LLM para sumarização
- Gestão dinâmica de modelos (dropdown atualizado direto da API do provider)
- Gestão de conexões/instâncias WhatsApp com QR code
- Webhook Hub com BullMQ: retry exponencial, Dead Letter Queue
- Prisma ORM com suporte a SQLite (padrão) e PostgreSQL
- Dashboard com stats, gráficos, gestão completa
- Docker multi-stage com Node.js 22
- GitHub Actions para release automatizado no Docker Hub

### Removido
- Streamlit (substituído por Next.js)
- FastAPI (substituído por NestJS)
- Python runtime (substituído por Node.js)
- Dependência exclusiva de GROQ/OpenAI (agora multi-provider)
