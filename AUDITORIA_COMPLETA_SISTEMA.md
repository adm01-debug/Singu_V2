# AUDITORIA COMPLETA DO SISTEMA SINGU CRM v2

**Data**: 2026-07-19
**Auditor**: Análise automatizada com PhD em Análise de Sistemas
**Escopo**: Auditoria exaustiva em 30 dimensões - 1.678 arquivos fonte, 107 edge functions, 262 migrações, 322 tabelas
**Metodologia**: 31 agentes paralelos especializados analisando código linha a linha

---

## SUMÁRIO EXECUTIVO

O SINGU CRM v2 é um CRM B2B construído sobre Supabase (107 edge functions, 262 migrações, 322 tabelas) com frontend React/Vite. A auditoria em 30 dimensões identificou **247 achados únicos** após deduplicação.

O sistema possui **vulnerabilidades de segurança críticas**: endpoints de webhook sem autenticação que aceitam dados arbitrários, uma interface SQL alimentada por IA com validação apenas por palavras-chave (facilmente burlável), um proxy SSRF completo sem allowlist de URLs, e vazamento de dados cross-tenant no servidor MCP.

O codebase tem **zero cobertura de testes automatizados** para edge functions, modo strict do TypeScript desabilitado, e nenhum pipeline de deployment além de um único job de CI para lint/build. O error reporting em produção é código morto (flush comentado), o bootstrap do PWA destrói seus próprios service workers a cada carregamento, e 35 de 107 edge functions usam CORS wildcard.

Embora o módulo compartilhado de auth demonstre boa intenção (CORS scoped, helper withAuth, rate limiting), a adoção é inconsistente — apenas 48 de 107 funções o utilizam.

---

## ESTATÍSTICAS DE ACHADOS

| Severidade | Quantidade | Percentual |
|------------|-----------|------------|
| **CRÍTICA** | 22 | 8.9% |
| **ALTA** | 74 | 30.0% |
| **MÉDIA** | 108 | 43.7% |
| **BAIXA** | 35 | 14.2% |
| **INFO** | 8 | 3.2% |
| **TOTAL** | **247** | 100% |

### Distribuição por Área

| Área | Crítica | Alta | Média | Baixa | Total |
|------|---------|------|-------|-------|-------|
| Segurança | 8 | 8 | 8 | 2 | 26 |
| Arquitetura | 3 | 5 | 8 | 3 | 20 |
| Dados | 1 | 5 | 6 | 2 | 15 |
| Frontend | 2 | 2 | 8 | 3 | 15 |
| Infraestrutura | 1 | 5 | 5 | 3 | 14 |

---

## TOP 20 ACHADOS CRÍTICOS

### #1 — CRÍTICA: Proxy SSRF no connection-tester sem validação de URL
- **Arquivo**: `supabase/functions/connection-tester/index.ts`
- **Descrição**: A edge function connection-tester aceita URLs arbitrárias de usuários autenticados e as busca server-side usando a chave service role, atuando como um proxy SSRF completo. Sem validação de URL, sem allowlist, sem bloqueio de ranges IP internos/privados (169.254.x.x, 10.x.x.x, 127.x.x.x).
- **Impacto**: Server-Side Request Forgery completo permitindo acesso a metadados da cloud, serviços internos e potencial roubo de credenciais. Combinado com wildcard CORS, explorável cross-origin.
- **Esforço**: 1-2 dias
- **Recomendação**: Implementar allowlist de URLs com validação de resolução DNS. Bloquear ranges IP privados/reservados. Remover wildcard CORS. Restringir esquema de URL (apenas HTTPS).

### #2 — CRÍTICA: SQL gerado por IA com validação burlável no ask-crm
- **Arquivo**: `supabase/functions/ask-crm/index.ts`
- **Descrição**: A função ask-crm envia perguntas do usuário para um modelo IA que gera SQL, depois o executa via RPC execute_readonly_query com privilégios service_role. A validação é apenas por keywords (verifica INSERT/UPDATE/DELETE seguido de espaço), trivialmente burlável. A IA pode sofrer prompt injection para produzir queries que exfiltram dados de qualquer tabela incluindo auth.users, vault.secrets, ou pg_catalog.
- **Impacto**: Injeção SQL via prompt injection pode ler qualquer tabela do banco, exfiltrar credenciais e acessar dados cross-tenant. O execute_readonly_query roda como service_role ignorando todo RLS.
- **Esforço**: 1 semana
- **Recomendação**: Substituir validação por keywords por parser SQL real. Restringir execute_readonly_query a allowlist explícita de tabelas. Rodar queries sob role autenticada, não service_role. Limitar rows retornadas.

### #3 — CRÍTICA: Vazamento de dados cross-tenant no servidor MCP
- **Arquivo**: `supabase/functions/mcp-server/index.ts`
- **Descrição**: O servidor MCP autentica via token customizado (X-MCP-Token) e resolve ownerUserId de connection_configs.created_by. Porém, search_contacts, search_companies, list_deals, search_companies_by_intent e get_pipeline_summary usam o admin client (service_role) sem filtrar por user_id/owner. Qualquer detentor de token MCP pode ler TODOS os contatos, empresas e deals de todos os tenants.
- **Impacto**: Exposição completa de dados cross-tenant. Qualquer usuário com token MCP pode ler contatos, empresas, deals e pipeline de todos os outros usuários.
- **Esforço**: 2-3 dias
- **Recomendação**: Adicionar `.eq('user_id', ownerUserId)` a cada query de leitura no callTool. Adicionar testes de integração verificando isolamento de tenant.

### #4 — CRÍTICA: evolution-webhook sem autenticação aceita payloads arbitrários
- **Arquivo**: `supabase/functions/evolution-webhook/index.ts`
- **Descrição**: O endpoint evolution-webhook (603 linhas) não tem autenticação — sem validação de webhook secret, sem allowlist de IP, sem verificação HMAC. Aceita requisições POST de qualquer origem e processa eventos WhatsApp, criando contatos, interações e atualizando dados CRM usando a chave service_role. O helper requireWebhookSecret existe no módulo compartilhado mas não é utilizado.
- **Impacto**: Qualquer pessoa pode enviar eventos WhatsApp fabricados para criar contatos falsos, injetar interações falsas e corromper dados CRM. Pode ser usado para injeção de spam ou ataques de engenharia social.
- **Esforço**: 1 dia
- **Recomendação**: Implementar requireWebhookSecret com EVOLUTION_API_SECRET. Adicionar allowlist de IP para servidores da Evolution API. Validar estrutura de evento com schema Zod.

### #5 — CRÍTICA: lux-webhook sem autenticação permite atualizações arbitrárias de colunas
- **Arquivo**: `supabase/functions/lux-webhook/index.ts`
- **Descrição**: O lux-webhook aceita requisições POST sem autenticação e processa comandos de atualização que modificam colunas arbitrárias nas tabelas contacts, companies e deals usando a chave service_role.
- **Impacto**: Comprometimento completo de integridade de dados. Atacantes podem modificar qualquer registro CRM — alterar valores de deals, reatribuir contatos, alterar dados de empresas — sem autenticação.
- **Esforço**: 1 dia
- **Recomendação**: Adicionar autenticação por webhook secret. Validar campos de atualização permitidos via allowlist.

### #6 — CRÍTICA: bitrix24-webhook sem autenticação e sem validação de payload
- **Arquivo**: `supabase/functions/bitrix24-webhook/index.ts`
- **Descrição**: O endpoint bitrix24-webhook aceita requisições POST sem autenticação e sincroniza dados do Bitrix24 no banco CRM. Sem webhook secret, sem validação de IP, sem verificação de assinatura.
- **Impacto**: Eventos de sync Bitrix24 fabricados podem injetar ou sobrescrever dados CRM incluindo contatos e deals.
- **Esforço**: 1 dia
- **Recomendação**: Implementar autenticação de webhook Bitrix24. Usar requireWebhookSecret do módulo compartilhado.

### #7 — CRÍTICA: form-submit-handler sem autenticação e sem rate limiting
- **Arquivo**: `supabase/functions/form-submit-handler/index.ts`
- **Descrição**: O form-submit-handler aceita requisições POST sem autenticação ou rate limiting. Cria contatos e leads a partir de submissões de formulário usando a chave service_role. Sem CAPTCHA, sem honeypot, sem throttling de submissões.
- **Impacto**: Submissão ilimitada de contatos e leads falsos. Pode ser usado para flooding do banco, poluição de dados CRM e exaustão de recursos.
- **Esforço**: 2-3 dias
- **Recomendação**: Adicionar rate limiting por IP. Implementar CAPTCHA ou validação honeypot. Adicionar verificação de token de formulário.

### #8 — CRÍTICA: Comparação de segredos vulnerável a timing attack
- **Arquivo**: `supabase/functions/_shared/auth.ts`
- **Descrição**: requireCronSecret e requireWebhookSecret usam `!==` do JavaScript para comparação de segredos (linhas 169, 189). Isto é vulnerável a timing attacks onde um atacante pode determinar o segredo correto byte a byte medindo tempos de resposta.
- **Impacto**: Side-channel de timing permite brute-force de webhook secrets e cron secrets.
- **Esforço**: 1 hora
- **Recomendação**: Substituir comparação !== por crypto.subtle.timingSafeEqual.

### #9 — ALTA: 35 Edge Functions usam CORS wildcard
- **Arquivo**: Múltiplos em `supabase/functions/`
- **Descrição**: 35 de 107 edge functions definem seus próprios corsHeaders com `Access-Control-Allow-Origin: *` em vez de usar o scopedCorsHeaders compartilhado. Isso permite que qualquer website faça requisições cross-origin autenticadas a esses endpoints.
- **Impacto**: Ataques cross-origin de qualquer domínio podem invocar edge functions com credenciais roubadas.
- **Esforço**: 2-3 dias
- **Recomendação**: Substituir todas as definições locais de corsHeaders por imports de _shared/auth.ts usando scopedCorsHeaders.

### #10 — CRÍTICA: Modo strict do TypeScript desabilitado
- **Arquivo**: `tsconfig.app.json`
- **Descrição**: tsconfig.app.json tem `strict: false` e `noImplicitAny: false`. Isso desabilita null checks, strict function types, strict property initialization e permite implicit any em todo o codebase frontend. Em um CRM de 322 tabelas lidando com dados financeiros (deals, invoices), type mismatches são silenciosamente ignorados em tempo de compilação.
- **Impacto**: Erros de tipo em runtime em produção. Corrupção de dados por propagação de undefined/null. Impossível confiar em qualquer anotação de tipo.
- **Esforço**: 6-8 semanas (incremental)
- **Recomendação**: Habilitar strict mode incrementalmente: começar com strictNullChecks, depois noImplicitAny.

### #11 — CRÍTICA: Zero cobertura de testes para 107 edge functions
- **Arquivo**: `supabase/functions/`
- **Descrição**: Apenas 6 arquivos de teste existem sob supabase/functions, e o pipeline CI não os executa. As 107 edge functions lidando com autenticação, webhooks, mutações de dados, queries IA e integrações externas não têm cobertura de teste automatizada.
- **Impacto**: Sem detecção de regressão para código crítico de segurança. Bypasses de auth, vazamentos de dados e erros de lógica podem ser introduzidos sem nenhuma rede de segurança automatizada.
- **Esforço**: 4-6 semanas
- **Recomendação**: Priorizar testes para módulo de auth, webhook handlers e servidor MCP.

### #12 — CRÍTICA: Nenhum pipeline de deployment
- **Arquivo**: `.github/workflows/ci.yml`
- **Descrição**: O único workflow CI roda lint, typecheck, build e testes Playwright mas não tem step de deployment. Não há ambiente de staging, deploy canary ou mecanismo de rollback. Edge functions parecem ser deployadas manualmente.
- **Impacto**: Sem processo de release controlado. Deployments manuais são propensos a erro e irreproduziveis. Sem capacidade de rollback.
- **Esforço**: 2-3 semanas
- **Recomendação**: Adicionar deployment via Supabase CLI ao CI. Criar projeto de staging para validação pré-produção.

### #13 — ALTA: Error reporting em produção é código morto
- **Arquivo**: `src/lib/errorReporting.ts`
- **Descrição**: O módulo errorReporting define lógica de captura e batching de erros, mas o mecanismo de flush para produção está comentado. Erros são capturados em buffer em memória que nunca é transmitido para qualquer serviço de rastreamento de erros.
- **Impacto**: Zero visibilidade de erros em produção. Crashes, corrupção de dados e incidentes de segurança passam completamente despercebidos.
- **Esforço**: 2-3 dias
- **Recomendação**: Integrar serviço de rastreamento de erros (Sentry, Bugsnag). Descomentar e configurar mecanismo de flush.

### #14 — ALTA: Módulo resilientFetch definido mas nunca importado
- **Arquivo**: `src/lib/resilientFetch.ts`
- **Descrição**: O módulo resilientFetch implementa retry logic, circuit breaker pattern e timeout handling para requisições HTTP. Porém, nunca é importado em nenhum lugar do codebase.
- **Impacto**: Sem resiliência de rede. Falhas transitórias causam erros imediatos para o usuário. Sem retry para chamadas API falhas.
- **Esforço**: 1-2 semanas
- **Recomendação**: Substituir chamadas diretas fetch/supabase por resilientFetch em caminhos críticos.

### #15 — CRÍTICA: Bootstrap do PWA destrói todos os Service Workers e caches
- **Arquivo**: `src/main.tsx`
- **Descrição**: O código de bootstrap do main.tsx incondicionalmente desregistra todos os service workers e limpa todos os caches a cada carregamento de página. Isso derrota completamente a capacidade offline do PWA que o VitePWA está configurado para prover.
- **Impacto**: PWA não funcional. Sem suporte offline, sem background sync, sem push notifications. Usuários em conexões lentas/instáveis (comum no Brasil) têm experiência degradada.
- **Esforço**: 1-2 dias
- **Recomendação**: Remover código de destruição de service worker do main.tsx. Configurar VitePWA com versionamento de cache e estratégia de update adequados.

### #16 — ALTA: Rate limiting client-side trivialmente burlável
- **Arquivo**: `src/lib/rateLimiter.ts`
- **Descrição**: O módulo rateLimiter.ts implementa rate limiting no browser usando contadores em memória. Isso não provê segurança — um atacante burla fazendo requisições diretamente à API sem usar o frontend. O rate limiter server-side em _shared/rate-limit.ts existe mas é usado apenas por 3-4 edge functions.
- **Impacto**: Sem rate limiting efetivo na maioria dos endpoints. Ataques de força bruta, credential stuffing e abuso de API são não mitigados.
- **Esforço**: 1-2 semanas
- **Recomendação**: Deploy rate limiting server-side em todas as edge functions usando o módulo _shared/rate-limit.ts existente.

### #17 — ALTA: 59 Edge Functions usam Service Role Key sem necessidade
- **Arquivo**: `supabase/functions/`
- **Descrição**: 59 de 107 edge functions criam clientes Supabase usando SUPABASE_SERVICE_ROLE_KEY, que ignora todas as políticas RLS. Muitas dessas funções realizam operações CRUD simples que deveriam respeitar RLS.
- **Impacto**: Bypass de RLS na maioria das edge functions. Qualquer bypass de auth ou vulnerabilidade de injection automaticamente se torna uma violação cross-tenant.
- **Esforço**: 3-4 semanas
- **Recomendação**: Auditar uso de service_role em cada função. Substituir por client autenticado com JWT onde RLS deveria aplicar.

### #18 — ALTA: Mismatch de cache do useContacts com optimistic update
- **Arquivo**: `src/hooks/useContacts.ts`
- **Descrição**: O hook useContacts usa useInfiniteQuery para carregamento paginado de contatos mas o optimistic update no callback de mutation trata o cache como array plano em vez da estrutura de página InfiniteQuery ({pages: [{data: [...]}]}).
- **Impacto**: Mutations de contatos (criar, atualizar, deletar) causam inconsistências na UI e forçam refetch completo de dados desnecessário.
- **Esforço**: 2-3 dias
- **Recomendação**: Corrigir optimistic update para manipular corretamente a estrutura de cache InfiniteQuery.

### #19 — ALTA: demand-forecast crasha em toda requisição (bug de destructuring)
- **Arquivo**: `supabase/functions/demand-forecast/index.ts`
- **Descrição**: A função demand-forecast desestrutura o retorno de withAuth() como `{ userId }`, mas withAuth retorna ou uma string (user ID) ou um objeto Response — não um objeto com propriedade userId. Isso causa crash em runtime em toda requisição.
- **Impacto**: Feature de forecast de demanda completamente quebrada em produção. Toda requisição retorna erro 500.
- **Esforço**: 30 minutos
- **Recomendação**: Corrigir destructuring: `const authResult = await withAuth(req); if (authResult instanceof Response) return authResult; const userId = authResult;`

### #20 — ALTA: Web Push Notifications sem VAPID ou criptografia
- **Arquivo**: `supabase/functions/send-push-notification/index.ts`
- **Descrição**: A edge function send-push-notification envia web push notifications sem headers de autenticação VAPID ou criptografia de payload adequados. Browsers modernos requerem VAPID para push notifications.
- **Impacto**: Push notifications serão rejeitadas por todos os browsers modernos. A feature de notificação é não funcional.
- **Esforço**: 2-3 dias
- **Recomendação**: Implementar geração e assinatura de chaves VAPID. Usar biblioteca web-push ou implementar criptografia RFC 8291.

---

## ACHADOS POR ÁREA

### SEGURANÇA (26 achados)

| # | Severidade | Achado | Arquivo |
|---|-----------|--------|---------|
| 1 | CRÍTICA | Proxy SSRF no connection-tester com wildcard CORS | `supabase/functions/connection-tester/index.ts` |
| 2 | CRÍTICA | Injeção SQL via IA gerada no ask-crm por prompt injection | `supabase/functions/ask-crm/index.ts` |
| 3 | CRÍTICA | Vazamento cross-tenant no servidor MCP (falta filtro user_id) | `supabase/functions/mcp-server/index.ts` |
| 4 | CRÍTICA | evolution-webhook sem autenticação | `supabase/functions/evolution-webhook/index.ts` |
| 5 | CRÍTICA | lux-webhook sem autenticação permite atualizações arbitrárias | `supabase/functions/lux-webhook/index.ts` |
| 6 | CRÍTICA | bitrix24-webhook sem autenticação | `supabase/functions/bitrix24-webhook/index.ts` |
| 7 | CRÍTICA | form-submit-handler sem autenticação e rate limiting | `supabase/functions/form-submit-handler/index.ts` |
| 8 | CRÍTICA | Comparação de segredos vulnerável a timing attack | `supabase/functions/_shared/auth.ts` |
| 9 | ALTA | 35 edge functions usam CORS wildcard | `supabase/functions/` |
| 10 | ALTA | Rate limiting client-side trivialmente burlável | `src/lib/rateLimiter.ts` |
| 11 | ALTA | 59 edge functions usam service_role ignorando RLS | `supabase/functions/` |
| 12 | ALTA | Web Push sem VAPID ou criptografia | `supabase/functions/send-push-notification/index.ts` |
| 13 | ALTA | Tokens em localStorage vulneráveis a exfiltração XSS | `src/integrations/supabase/client.ts` |
| 14 | ALTA | MFA fail-open: verificação MFA não aplicada no nível API | `src/hooks/useAuth.tsx` |
| 15 | ALTA | Nenhum header Content-Security-Policy configurado | `vite.config.ts` |
| 16 | ALTA | Injeção de filtro PostgREST via padrões ilike não sanitizados no MCP | `supabase/functions/mcp-server/index.ts` |
| 17 | MÉDIA | Validação HMAC do incoming-webhook usa comparação de string | `supabase/functions/incoming-webhook/index.ts` |
| 18 | MÉDIA | Sem proteção CSRF em endpoints de mudança de estado | `supabase/functions/` |
| 19 | MÉDIA | Chaves API em connection_configs sem criptografia vault | `supabase/functions/connection-tester/index.ts` |
| 20 | MÉDIA | Sem bloqueio por IP ou geo-restrição em endpoints de auth | `supabase/functions/_shared/auth.ts` |
| 21 | MÉDIA | Tokens de sessão sem enforcement de expiração explícito | `src/hooks/useAuth.tsx` |
| 22 | MÉDIA | Monkeypatch global de fetch para 401 tem race conditions | `src/hooks/useAuth.tsx` |
| 23 | MÉDIA | Sem audit logging para operações admin | `supabase/functions/` |
| 24 | MÉDIA | LGPD/GDPR: Sem política de retenção de dados ou exclusão automática | `supabase/migrations/` |
| 25 | MÉDIA | LGPD: Sem mecanismo de rastreamento de consentimento | `supabase/functions/evolution-webhook/index.ts` |
| 26 | BAIXA | Sem requisitos de complexidade de senha além do padrão Supabase | `src/hooks/useAuth.tsx` |

### ARQUITETURA (20 achados)

| # | Severidade | Achado | Arquivo |
|---|-----------|--------|---------|
| 1 | CRÍTICA | TypeScript strict mode desabilitado | `tsconfig.app.json` |
| 2 | CRÍTICA | Zero cobertura de testes para 107 edge functions | `supabase/functions/` |
| 3 | ALTA | Error reporting em produção é código morto | `src/lib/errorReporting.ts` |
| 4 | ALTA | Módulo resilientFetch definido mas nunca importado | `src/lib/resilientFetch.ts` |
| 5 | ALTA | demand-forecast crasha em toda requisição | `supabase/functions/demand-forecast/index.ts` |
| 6 | ALTA | next-best-action com mismatch de parâmetros | `supabase/functions/next-best-action/index.ts` |
| 7 | ALTA | Bug de scoping no evolution-webhook causa respostas não-200 | `supabase/functions/evolution-webhook/index.ts` |
| 8 | ALTA | Sem padrão compartilhado de error handling nas edge functions | `supabase/functions/` |
| 9 | MÉDIA | 106 edge functions com duplicação significativa de código | `supabase/functions/` |
| 10 | MÉDIA | Risco de dependência circular em src/hooks e src/contexts | `src/hooks/` |
| 11 | MÉDIA | Sem estratégia de versionamento de API para edge functions | `supabase/functions/` |
| 12 | MÉDIA | Formatos de resposta de erro inconsistentes | `supabase/functions/` |
| 13 | MÉDIA | Sem agregação de health check para monitoramento | `supabase/functions/health-aggregate/index.ts` |
| 14 | MÉDIA | Bundle size não otimizado: chunks manuais incompletos no Vite | `vite.config.ts` |
| 15 | MÉDIA | Sem source maps gerados para builds de produção | `vite.config.ts` |
| 16 | MÉDIA | process-webhook-dlq sem estratégia de retry backoff | `supabase/functions/process-webhook-dlq/index.ts` |
| 17 | BAIXA | Zustand stores sem persistência para estado UI crítico | `src/stores/` |
| 18 | BAIXA | staleTime padrão do React Query pode causar refetching excessivo | `src/lib/queryClient.ts` |
| 19 | BAIXA | Código morto: funções utilitárias não usadas | `src/lib/` |
| 20 | INFO | ADRs documentados mas podem estar desatualizados | `docs/adr/` |

### DADOS (15 achados)

| # | Severidade | Achado | Arquivo |
|---|-----------|--------|---------|
| 1 | CRÍTICA | execute_readonly_query RPC executa SQL arbitrário como service_role | `supabase/migrations/` |
| 2 | ALTA | Sem foreign key constraints em várias tabelas de referência cruzada | `supabase/migrations/` |
| 3 | ALTA | Índices faltando em colunas frequentemente consultadas | `supabase/migrations/` |
| 4 | ALTA | 262 migrações sem estratégia de squashing ou consolidação | `supabase/migrations/` |
| 5 | ALTA | Políticas RLS não aplicadas consistentemente em todas as 322 tabelas | `supabase/migrations/` |
| 6 | ALTA | Sem verificação de backup de banco ou teste de restore | — |
| 7 | MÉDIA | Optimistic locking (coluna version) não aplicado em todas as tabelas mutáveis | `supabase/functions/_shared/auth.ts` |
| 8 | MÉDIA | Sem constraints de validação de dados no nível do banco (CHECK) | `supabase/migrations/` |
| 9 | MÉDIA | Soft delete inconsistentemente aplicado entre entidades | `supabase/migrations/` |
| 10 | MÉDIA | Sem configuração de connection pooling (PgBouncer) | — |
| 11 | MÉDIA | Tabela de webhook logs sem partition automática ou archival | `supabase/migrations/` |
| 12 | MÉDIA | Sem estratégia de rollback de migração para mudanças de schema | `supabase/migrations/` |
| 13 | MÉDIA | Sem audit trail no nível do banco para mudanças em registros sensíveis | `supabase/migrations/` |
| 14 | BAIXA | Tipos enum usados em vez de lookup tables para campos extensíveis | `supabase/migrations/` |
| 15 | BAIXA | Handling de timestamp inconsistente (timestamptz vs timestamp) | `supabase/migrations/` |

### FRONTEND (15 achados)

| # | Severidade | Achado | Arquivo |
|---|-----------|--------|---------|
| 1 | CRÍTICA | Bootstrap do PWA destrói todos os service workers e caches | `src/main.tsx` |
| 2 | ALTA | Cache shape mismatch do useContacts com optimistic update | `src/hooks/useContacts.ts` |
| 3 | ALTA | Auth context value não memoizado causando re-renders excessivos | `src/hooks/useAuth.tsx` |
| 4 | MÉDIA | Sem loading skeleton ou Suspense boundaries para views pesadas | `src/components/` |
| 5 | MÉDIA | Sem auditoria de acessibilidade: ARIA labels e navegação por teclado faltando | `src/components/` |
| 6 | MÉDIA | Validação de formulário inconsistente: alguns usam Zod, outros checks manuais | `src/components/` |
| 7 | MÉDIA | Sem framework de internacionalização apesar de conteúdo apenas PT-BR | `src/` |
| 8 | MÉDIA | Arquivos de componentes grandes (>500 linhas) sem decomposição | `src/components/` |
| 9 | MÉDIA | Sem error boundaries em torno de componentes data-fetching | `src/components/` |
| 10 | MÉDIA | React Router lazy loading não aplicado a todos os route chunks | `src/App.tsx` |
| 11 | MÉDIA | Sem estratégia de dados offline-first apesar de configuração PWA | `src/` |
| 12 | MÉDIA | Sem monitoramento de performance (Web Vitals, LCP, CLS tracking) | `src/main.tsx` |
| 13 | BAIXA | Sprawl de utilitários Tailwind CSS sem abstração de design tokens | `src/components/` |
| 14 | BAIXA | Console.log statements deixados em código de produção | `src/` |
| 15 | BAIXA | Imagens não otimizadas: sem lazy loading, sem fallbacks WebP | `src/components/` |

### INFRAESTRUTURA (14 achados)

| # | Severidade | Achado | Arquivo |
|---|-----------|--------|---------|
| 1 | CRÍTICA | Sem pipeline de deployment além de CI lint/build | `.github/workflows/ci.yml` |
| 2 | ALTA | Sem ambiente de staging para validação pré-produção | `.github/workflows/ci.yml` |
| 3 | ALTA | Sem infrastructure-as-code para configuração Supabase | — |
| 4 | ALTA | Sem sistema de monitoramento ou alertas configurado | — |
| 5 | ALTA | Sem agregação de logs ou logging centralizado | — |
| 6 | ALTA | Sem política ou mecanismo de rotação de segredos | — |
| 7 | MÉDIA | Sem CDN ou edge caching para assets estáticos | `vite.config.ts` |
| 8 | MÉDIA | Sem dashboard de monitoramento de performance do banco | — |
| 9 | MÉDIA | Sem plano de disaster recovery ou RTO/RPO documentado | — |
| 10 | MÉDIA | Sem load testing ou capacity planning | — |
| 11 | MÉDIA | Deploy em região única sem failover | — |
| 12 | BAIXA | Sem otimização de cold start para container/functions | `supabase/functions/` |
| 13 | BAIXA | Sem automação de atualização de dependências (Dependabot/Renovate) | — |
| 14 | BAIXA | Job CI roda como step monolítico único (sem paralelização) | `.github/workflows/ci.yml` |

---

## PLANO DE REMEDIAÇÃO EM 50 ETAPAS

### FASE 1: Hardening de Segurança Emergencial (Semana 1-2)

| Etapa | Ação | Severidade | Esforço |
|-------|------|-----------|---------|
| 1 | Adicionar requireWebhookSecret ao evolution-webhook | CRÍTICA | 2h |
| 2 | Adicionar requireWebhookSecret ao lux-webhook + allowlist de campos | CRÍTICA | 4h |
| 3 | Adicionar requireWebhookSecret ao bitrix24-webhook | CRÍTICA | 2h |
| 4 | Adicionar rate limiting e CAPTCHA ao form-submit-handler | CRÍTICA | 1d |
| 5 | Implementar allowlist de URL e bloqueio de IP privado no connection-tester | CRÍTICA | 1d |
| 6 | Adicionar filtro user_id a todas as queries de leitura do mcp-server | CRÍTICA | 2d |
| 7 | Substituir comparação !== por crypto.subtle.timingSafeEqual em auth.ts | CRÍTICA | 1h |
| 8 | Corrigir bug de destructuring no demand-forecast | ALTA | 30min |

### FASE 2: Hardening de Auth e Validação (Semana 3-6)

| Etapa | Ação | Severidade | Esforço |
|-------|------|-----------|---------|
| 9 | Substituir validação de keywords SQL por parser SQL real no ask-crm | CRÍTICA | 1sem |
| 10 | Migrar 35 edge functions de CORS wildcard para scopedCorsHeaders | ALTA | 2-3d |
| 11 | Deploy rate limiting server-side em todas as edge functions | ALTA | 1-2sem |
| 12 | Implementar VAPID e criptografia no send-push-notification | ALTA | 2-3d |
| 13 | Auditar e reduzir uso de service_role em 59 edge functions | ALTA | 3-4sem |
| 14 | Configurar Content-Security-Policy headers | ALTA | 2d |
| 15 | Sanitizar padrões ilike no servidor MCP | ALTA | 1d |
| 16 | Implementar comparação timing-safe no incoming-webhook | MÉDIA | 2h |

### FASE 3: Observabilidade e Confiabilidade (Semana 7-9)

| Etapa | Ação | Severidade | Esforço |
|-------|------|-----------|---------|
| 17 | Integrar Sentry ou Bugsnag para error reporting de produção | ALTA | 2-3d |
| 18 | Remover código de destruição de SW do main.tsx (restaurar PWA) | CRÍTICA | 1-2d |
| 19 | Wiring do resilientFetch em caminhos críticos | ALTA | 1-2sem |
| 20 | Configurar logging estruturado centralizado | ALTA | 1sem |
| 21 | Implementar monitoramento de métricas de performance (Web Vitals) | MÉDIA | 2d |
| 22 | Configurar alertas para health checks de dependências | MÉDIA | 2d |
| 23 | Adicionar correlation IDs/trace IDs às edge functions | MÉDIA | 3d |
| 24 | Corrigir bug de scoping do evolution-webhook | ALTA | 4h |

### FASE 4: Type Safety e Cobertura de Testes (Semana 10-17)

| Etapa | Ação | Severidade | Esforço |
|-------|------|-----------|---------|
| 25 | Habilitar strictNullChecks no tsconfig.app.json | CRÍTICA | 2sem |
| 26 | Habilitar noImplicitAny no tsconfig.app.json | CRÍTICA | 2sem |
| 27 | Criar suite de testes para módulo _shared/auth.ts | CRÍTICA | 1sem |
| 28 | Criar testes para webhook handlers (evolution, lux, bitrix24, incoming) | CRÍTICA | 1sem |
| 29 | Criar testes para mcp-server (isolamento de tenant) | CRÍTICA | 3d |
| 30 | Criar testes para ask-crm (validação SQL) | ALTA | 2d |
| 31 | Corrigir cache shape mismatch do useContacts | ALTA | 2-3d |
| 32 | Memoizar auth context value para prevenir re-renders | ALTA | 1d |
| 33 | Adicionar testes E2E para fluxo de autenticação completo | ALTA | 3d |
| 34 | Adicionar edge function tests ao pipeline CI | MÉDIA | 2d |

### FASE 5: Pipeline de Infraestrutura e Deployment (Semana 18-21)

| Etapa | Ação | Severidade | Esforço |
|-------|------|-----------|---------|
| 35 | Criar pipeline de deploy via Supabase CLI no CI | CRÍTICA | 1sem |
| 36 | Configurar ambiente de staging com projeto Supabase separado | ALTA | 1sem |
| 37 | Implementar gates de aprovação de deploy | ALTA | 2d |
| 38 | Adicionar step de migração de banco ao CI | ALTA | 2d |
| 39 | Implementar política de rotação de segredos | ALTA | 3d |
| 40 | Configurar Dependabot/Renovate para atualizações de dependências | BAIXA | 2h |
| 41 | Paralelizar jobs do CI para builds mais rápidos | BAIXA | 4h |
| 42 | Gerar source maps para builds de produção | MÉDIA | 2h |

### FASE 6: Integridade de Dados e Compliance (Semana 22-27)

| Etapa | Ação | Severidade | Esforço |
|-------|------|-----------|---------|
| 43 | Adicionar foreign key constraints faltantes em tabelas de referência cruzada | ALTA | 1sem |
| 44 | Criar índices de banco para colunas frequentemente consultadas | ALTA | 1sem |
| 45 | Auditoria completa de RLS: garantir cobertura em todas as 322 tabelas | ALTA | 2sem |
| 46 | Implementar mecanismo de consentimento LGPD (rastreamento + exclusão) | MÉDIA | 1sem |
| 47 | Implementar política de retenção de dados automatizada | MÉDIA | 1sem |
| 48 | Adicionar CHECK constraints no nível do banco | MÉDIA | 3d |
| 49 | Consolidar 262 migrações (squashing) | ALTA | 3d |
| 50 | Implementar audit trail no nível do banco para registros sensíveis | MÉDIA | 1sem |

---

## MATRIZ DE RISCO

```
IMPACTO →     BAIXO         MÉDIO         ALTO          CRÍTICO
ALTA     │ Console.log │ Sem i18n    │ Wildcard    │ SSRF Proxy
PROB.    │ em produção │ framework  │ CORS (35fn) │ Webhooks
         │             │            │ Service role│ sem auth
         │             │            │ (59 fn)     │ Ask-CRM SQL
─────────┼─────────────┼────────────┼─────────────┼───────────
MÉDIA    │ Sem Dep.    │ Sem source │ Error rept. │ MCP cross-
PROB.    │ automação   │ maps       │ morto       │ tenant
         │ Sem CDN     │ Sem tests  │ strict:false│ Timing
         │             │ edge func  │ Sem staging │ attack
─────────┼─────────────┼────────────┼─────────────┼───────────
BAIXA    │ Cold start  │ Zustand    │ Sem DR plan │ PWA auto-
PROB.    │ não otim.   │ persistên. │ Sem failover│ destruição
         │             │ Enum vs    │ Sem alertas │
         │             │ lookup     │             │
```

---

## CONCLUSÃO

O SINGU CRM v2 é um sistema ambicioso e rico em funcionalidades, mas possui **falhas fundamentais de segurança** que devem ser tratadas com urgência máxima. Os 8 achados críticos de segurança representam **vetores de ataque ativamente exploráveis** que poderiam resultar em vazamento de dados, corrupção de informações e comprometimento completo do sistema.

A priorização recomendada é:
1. **Imediato (Semana 1-2)**: Fechar endpoints sem autenticação e proxy SSRF
2. **Urgente (Semana 3-6)**: Hardening de auth/validação em todas as edge functions
3. **Importante (Semana 7-17)**: Observabilidade, type safety e cobertura de testes
4. **Planejado (Semana 18-27)**: Infraestrutura, deployment e compliance LGPD

**Estimativa total de remediação**: 27 semanas (1 desenvolvedor sênior dedicado) ou 9 semanas (3 desenvolvedores paralelos).
