# SINGU CRM — Handoff Document

> Última atualização: 2026-04-15
> Total de módulos: 25+ | Edge Functions: 30 | Tabelas: 40+

---

## 📋 Resumo Executivo

SINGU é um CRM de relacionamento inteligente focado em vendas B2B, com análise comportamental (DISC, IE, Vieses Cognitivos), enriquecimento de dados via IA e integração com WhatsApp, Email e VoIP.

O sistema é projetado para vendedores que precisam gerenciar relacionamentos de longo prazo com alta personalização.

---

## 🛠 Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + TypeScript 5 + Vite 5 |
| **Estilização** | Tailwind CSS v3 + shadcn/ui + Design System "Nexus Blue" |
| **Estado** | TanStack React Query (server state), URL params (filtros) |
| **Backend** | Lovable Cloud (Supabase) — Auth, DB, Edge Functions, Storage |
| **Banco Externo** | Supabase externo (pgxfvjmuubtbowutlide) via proxy Edge Function |
| **IA** | Lovable AI Gateway (Gemini/GPT) — sem API key necessária |
| **Voz** | ElevenLabs (STT Scribe + TTS) + Gemini NLU |
| **WhatsApp** | Evolution API v2 |
| **Enriquecimento** | EnrichLayer (LinkedIn), Firecrawl (web), Lux Intelligence (n8n) |
| **Email** | Google Workspace → Cloud Pub/Sub → Webhook |

---

## 📂 Módulos Principais

### Core CRM
| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/` | Visão executiva com KPIs, alertas e atividade recente |
| Contatos | `/contatos` | Gestão completa, score de relacionamento, perfil 360° |
| Empresas | `/empresas` | Hub de dados corporativos, mapa geográfico, hierarquia |
| Interações | `/interacoes` | Timeline de comunicações, análise de sentimento |
| Pipeline | `/pipeline` | Kanban de oportunidades com estágios customizáveis |

### Inteligência
| Módulo | Descrição |
|--------|-----------|
| DISC Analyzer | Análise comportamental automática via texto/interações |
| Inteligência Emocional | Análise de EQ, âncoras emocionais, estados |
| Vieses Cognitivos | Detecção de vieses em negociação |
| RFM Analyzer | Segmentação por Recência, Frequência, Monetário |
| Lux Intelligence | Enriquecimento profundo via n8n webhooks |

### Produtividade
| Módulo | Descrição |
|--------|-----------|
| Tarefas & Lembretes | Kanban de tarefas com lembretes inteligentes |
| AI Writing Assistant | Geração de texto adaptada ao perfil DISC |
| Voice AI Agent | Comandos por voz (buscar, navegar, criar) |
| Metas & Gamificação | OKRs, ranking, conquistas |

### Administração
| Rota | Descrição |
|------|-----------|
| `/admin/field-mapping` | Documentação do mapeamento campo-a-campo |
| `/admin/schema-drift` | Monitoramento de inconsistências de schema |
| `/admin/email-diagnostics` | Saúde da pipeline de email |
| `/admin/voice-diagnostics` | Diagnóstico do Voice AI |
| `/admin/lux-config` | Configuração de webhooks Lux Intelligence |
| `/admin/secrets-management` | Rotação e gestão de secrets |
| `/admin/knowledge-export` | Exportação de conhecimento para handoff |

---

## 🏗 Arquitetura

### Provider Hierarchy (ordem obrigatória)
```
HelmetProvider → ErrorBoundary → QueryClientProvider → CelebrationProvider
→ AriaLiveProvider → TooltipProvider → BrowserRouter → AuthProvider
→ NavigationStackProvider → EasterEggsProvider → Routes
```

### Proxy de Dados Externos
```
Frontend → supabase.functions.invoke('external-data')
         → Edge Function (auth + rate limit + validation)
         → Banco Externo Supabase (select/insert/update/delete/rpc)
```

### Pipeline de Email
```
Google Workspace → Cloud Pub/Sub → Evolution Webhook → email_logs (externo)
                                                     → interactions (local)
```

### Voice AI
```
Microfone → ElevenLabs Scribe (STT) → Gemini NLU → Ação no CRM
                                                  → ElevenLabs TTS → Resposta
```

---

## 📐 Padrões de Código Obrigatórios

1. **Idioma**: Todo texto de UI em português brasileiro
2. **State Management**: TanStack React Query exclusivamente para server state
3. **Cores**: Usar tokens semânticos do design system, nunca cores diretas
4. **Componentes**: shadcn/ui com variantes customizadas
5. **RLS**: Toda tabela com Row Level Security habilitada
6. **Roles**: Tabela separada `user_roles`, nunca no profile
7. **Admin**: Protegido via `RequireAdmin` + `has_role()` RPC
8. **Edge Functions**: Deno.serve(), CORS headers, validação Zod
9. **Resiliência**: ExternalDataCard para estados de loading/erro/vazio
10. **Logs**: Logger centralizado, sem console.log em produção

---

## 🔌 Integrações Externas

| Serviço | Secret | Uso |
|---------|--------|-----|
| ElevenLabs | `ELEVENLABS_API_KEY` | STT (Scribe) + TTS |
| Evolution API | `EVOLUTION_API_KEY` + `_URL` | WhatsApp |
| EnrichLayer | `ENRICHLAYER_API_KEY` | LinkedIn enrichment |
| Firecrawl | `FIRECRAWL_API_KEY` | Web scraping (conector) |
| Proxycurl | `PROXYCURL_API_KEY` | Social profile scraping |
| Lux/n8n | Webhook URL configurável | Enriquecimento profundo |

---

## 🔧 Troubleshooting

### Tela branca ao abrir o app
- **Causa**: Ordem de providers incorreta no App.tsx
- **Solução**: Verificar hierarquia documentada, rodar `node scripts/lint-providers.cjs`

### Dados não aparecem no Dashboard
- **Causa 1**: RLS bloqueando — verificar se usuário está autenticado
- **Causa 2**: Limite de 1000 rows do Supabase — implementar paginação
- **Causa 3**: Banco externo offline — verificar edge function `health`

### Edge Function retorna 401
- **Causa**: JWT expirado ou ausente
- **Solução**: Verificar se `supabase.functions.invoke()` está sendo usado (envia token automaticamente)

### Voice AI não funciona
- **Causa 1**: `ELEVENLABS_API_KEY` não configurada
- **Causa 2**: Navegador sem permissão de microfone
- **Solução**: Verificar em `/admin/voice-diagnostics`

### WhatsApp não envia mensagens
- **Causa**: Instância Evolution API desconectada
- **Solução**: Reconectar via QR Code na página de WhatsApp

### Pipeline de email offline
- **Causa**: Pub/Sub subscription expirada ou webhook URL alterada
- **Solução**: Verificar em `/admin/email-diagnostics`, reconfigurar Pub/Sub

### Secret expirado / rotação necessária
- **Solução**: Acessar `/admin/secrets-management`, gerar novo valor, atualizar no Lovable Cloud

---

## 📊 Banco de Dados Local (Principais Tabelas)

| Tabela | Descrição |
|--------|-----------|
| `contacts` | Contatos com score, estágio, DISC, tags |
| `companies` | Empresas com dados fiscais, geolocalização |
| `interactions` | Timeline de comunicações |
| `insights` | Insights gerados por IA |
| `deals` | Oportunidades no pipeline |
| `tasks` | Tarefas e lembretes |
| `user_roles` | RBAC (admin/moderator/user) |
| `audit_log` | Trilha de auditoria imutável |
| `lux_intelligence` | Resultados de enriquecimento Lux |
| `secret_rotation_log` | Auditoria de rotação de secrets |

---

## 🚀 Setup para Desenvolvimento

1. Clone o repositório via GitHub
2. `npm install` (ou `bun install`)
3. Configure as variáveis de ambiente (`.env` é auto-gerenciado pelo Lovable Cloud)
4. `npm run dev` para iniciar o servidor de desenvolvimento
5. Acesse `/admin/*` rotas requerem role `admin` na tabela `user_roles`

---

*Documento gerado pelo sistema de exportação de conhecimento do SINGU CRM.*
