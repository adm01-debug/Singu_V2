
 ## 📄 Documentação Estratégica
 - [Estratégia de UX e Navegação](docs/ux_improvement_strategy.md) - Guia completo de melhorias de interface e fluxos.
# SINGU CRM

> **Sistema de Inteligência Relacional** — CRM enterprise com módulos avançados de análise comportamental, PNL, neuromarketing e automação de relacionamento.

---

## 📌 Sobre

SINGU é um CRM construído para equipes que tratam relacionamento como ativo estratégico. Vai além do CRM tradicional ao combinar gestão de contatos com análise comportamental profunda, frameworks de inteligência emocional e automações de comunicação.

## 🧩 Módulos principais

| Módulo | O que faz |
|---|---|
| **Empresas & Contatos** | Cadastro completo com saúde financeira, score de relacionamento, sentimento, eventos de vida, parentes, preferências e cadência de contato |
| **Interações** | Registro multimídia (texto, áudio, anexos) com análise automática de emoção e sugestão de follow-up |
| **DISC Enterprise** | Análise DISC automática, evolução temporal, geração de scripts de venda, alertas de compatibilidade, métricas de conversão |
| **PNL/NLP Enterprise** | Rapport em tempo real, detecção de incongruência, calibração Miltoniana, posições perceptuais, modelo TOTE, hierarquia de critérios, âncoras emocionais, padrão Swish |
| **Neuromarketing** | NeuroScore, mapas de gatilhos, decision path, A/B testing comportamental, heatmap de calendário, handler de objeções |
| **Carnegie Enterprise** | 11 componentes baseados nos princípios de Dale Carnegie |
| **Stakeholder Analysis** | Mapeamento de coalizões, simulador de stakeholders, alertas |
| **Lux Intelligence** | Scan automatizado via webhook n8n com polling em tempo real |
| **RFM Analysis** | Segmentação clássica de clientes |
| **Sistema de Alertas** | Health alerts, compatibility alerts, behavior alerts, stakeholder alerts |
| **Network Graph** | Visualização de rede de relacionamentos |
| **Mapa de Empresas** | Geolocalização via Leaflet |
| **Dashboard & Insights** | Estatísticas, gráficos, relatórios semanais, portfolio health |

## 🛠️ Stack

- **Frontend**: Vite 5 + React 18 + TypeScript 5.8 + Tailwind 3 + shadcn/ui (Radix)
- **State**: TanStack Query 5 + Zustand 5
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **PWA**: Workbox via vite-plugin-pwa
- **Testes**: Vitest + Testing Library
- **Charts**: Recharts
- **Mapas**: Leaflet + react-leaflet
- **Animação**: Framer Motion
- **Voz**: ElevenLabs
- **Integrações**: Bitrix24, Evolution API (WhatsApp), Firecrawl, EnrichLayer (LinkedIn)

## 🚀 Como rodar localmente

```bash
# 1. Clone o repo
git clone https://github.com/adm01-debug/singu.git
cd singu

# 2. Instale dependências (escolha um — npm OU bun, não os dois)
npm install
# ou
bun install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# edite .env com os valores do seu projeto Supabase

# 4. Rode em modo dev
npm run dev
# abre em http://localhost:8080
```

## 📜 Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) na porta 8080 |
| `npm run build` | Build de produção |
| `npm run build:dev` | Build em modo development (mais rápido, menos otimizado) |
| `npm run lint` | Roda ESLint |
| `npm run preview` | Preview do build de produção |

 ## 📋 Auditoria Enterprise

 O sistema mantém auditorias técnicas versionadas. Selos históricos de “10/10” não
 representam certificação contínua: o estado atual deve ser comprovado pelos gates
 de CI e pelo relatório de auditoria mais recente.

 - **Relatório Completo (Markdown)**: [audit_report.md](./audit_report.md)
 - **Relatório Completo (PDF)**: [audit_report.pdf](./audit_report.pdf)
 - **Arquivo de Backup**: Disponível na pasta `docs/`

 ## 🗂️ Estrutura do projeto

```
singu/
├── src/
│   ├── App.tsx                  # Roteamento principal + providers
│   ├── main.tsx                 # Bootstrap React
│   ├── pages/                   # Páginas (lazy loaded)
│   ├── components/              # Componentes reutilizáveis
│   ├── hooks/                   # Hooks customizados (1 hook por feature)
│   ├── integrations/
│   │   └── supabase/            # Client + tipos gerados
│   ├── lib/                     # Utilities, externalData, helpers
│   ├── stores/                  # Zustand stores
│   ├── contexts/                # React contexts
│   └── types/                   # TypeScript types compartilhados
├── supabase/
│   ├── config.toml              # Configuração das edge functions
│   ├── functions/               # 31 Edge Functions (Deno)
│   │   ├── _shared/             # Helpers compartilhados (auth, CORS)
│   │   └── health/              # Health check endpoint (SRE)
│   └── migrations/              # ~50 migrations SQL versionadas
├── docs/
│   └── adr/                     # Architecture Decision Records
└── public/                      # Assets estáticos + PWA icons
```

## 🏗️ Arquitetura

Decisões técnicas fundamentais estão documentadas em [ADRs](docs/adr/README.md):

| ADR | Decisão |
|-----|---------|
| 001 | Feature-Sliced Design |
| 002 | Proxy de banco externo via Edge Functions |
| 003 | Circuit Breaker para APIs externas |
| 004 | Estratégia de Autenticação/Autorização |
| 005 | AI via Lovable Gateway (sem API key do usuário) |
| 006 | Políticas de Realtime escopadas |

## 🔐 Segurança

- **RLS** versionado nas migrations; cobertura e políticas do banco remoto devem ser validadas pelo gate `bash tests/rls/run.sh`
- **RBAC** via tabela `user_roles` + função `has_role()` SECURITY DEFINER
- **MFA/HIBP** dependem da configuração do projeto Supabase e não são inferidos pelo código
- **Realtime** com políticas de canal escopadas por user ID
- **CORS** validado por allowlist e pelo checker automatizado de Edge Functions
- **Headers de segurança**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Edge Functions**: JWT nativo por padrão; funções públicas usam autenticação própria explícita
- **Validação**: Zod schemas em Edge Functions e formulários frontend
- **Sanitização**: DOMPurify + `encodeURIComponent` em inputs dinâmicos
- **Circuit Breaker**: Proteção contra cascading failures em integrações externas

## 🩺 Operações & Monitoramento

- **Health Check**: `GET /functions/v1/health` — verifica DB local, externo e runtime
- **Web Vitals**: LCP, INP, CLS monitorados via `useWebVitals.ts`
- **Logger estruturado**: Timestamps, correlation IDs, log levels (suprimido em prod)
- **Error Boundaries**: Global no App + granular por seção do dashboard
- **Circuit Breaker**: Fail-fast automático (3 falhas → 30s cooldown → probe)

## 🧪 Testes

```bash
npm run test           # 4.470 testes automatizados
npm run test -- --coverage  # Com relatório de cobertura
```

Cobertura inclui: lógica de negócio, validação de formulários, auditoria de filtros, integridade de dados, segurança, RLS, design system e voice AI.

### Gate RLS com rollback

`bash tests/rls/run.sh` usa as variáveis `PG*`, aplica apenas migrations posteriores
ao ledger remoto e executa cada fixture dentro de uma transação revertida.
Um advisory lock serializa os gates concorrentes. O preparo lexical mantém
strings, comentários e blocos PL/pgSQL; remove apenas um wrapper transacional
pareado. Migrations com outros controles de transação ou metacomandos psql
são rejeitadas antes da execução.

As fixtures aceitam `\echo`, `\set ON_ERROR_STOP on`, literais `test_*`,
`\gset` com alias `rls_*`/`fixture_*` e condicionais `\if`/`\else`/`\endif`.
Resultados de `\gset` recebem prefixo isolado para não alterar configurações
do psql. `SKIP:` é reportado separadamente; qualquer falha retorna código não zero.
Sem banco, valide o preparo com `node --test tests/rls/prepare-sql.node-test.mjs`.

### Credencial dos scripts administrativos

Os scripts `apply-*.js`, `chunk-apply.js`, `fix-enums.js` e `retry-failed.js`
exigem `SUPABASE_ACCESS_TOKEN` pelo ambiente e encerram antes de qualquer requisição
se a variável estiver ausente. Não inclua tokens em arquivos versionados.
Tokens expostos em versões anteriores permanecem no histórico e precisam ser
revogados em https://supabase.com/dashboard/account/tokens; remover do código
atual não invalida uma credencial antiga.

## 🤝 Contribuindo

Este projeto é mantido com auxílio de IA via [Lovable](https://lovable.dev). Mudanças podem vir tanto via Lovable quanto via PR direto no GitHub — ambos sincronizam automaticamente.

## 📄 Licença

Proprietário — todos os direitos reservados.
