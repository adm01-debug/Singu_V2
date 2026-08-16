# Estado — Administração, Segurança e Observabilidade

> **Escopo**: `/admin` e todas as `/admin/*`, `/seguranca`, `/status`, `/auth`, `/reset-password`, `/sso/callback`, `/design-system`; Edge Functions de segurança/observabilidade; `src/components/admin/`, `src/components/security/`, hooks de auth/RBAC/feature-flag/telemetria, `src/lib/` (logger, resilientFetch, circuitBreaker) e `monitoring/`.
>
> **Método**: leitura estática de código. Todo item foi verificado seguindo o fio UI → hook → EF/RPC → tabela → uso real. Só há afirmação onde existe `arquivo:linha`.
>
> **Runtime**: `NAO_VERIFICADO`. Sem acesso ao banco em execução, sem logs de produção, sem estado real de `pg_cron`, secrets ou deploy das Edge Functions.
>
> **Build/testes**: `node_modules` vazio. **Nada foi compilado, lintado ou testado.** Nenhuma afirmação deste documento implica que o projeto compila ou que testes passam.

---

## Resumo (contagem por classificação com denominador)

| Classificação | Qtde | % |
|---|---|---|
| ✅ IMPLEMENTADO_TOTAL | 29 / 68 | 42,6% |
| 🟨 IMPLEMENTADO_PARCIAL | 27 / 68 | 39,7% |
| 🟦 SUGERIDO_OU_INICIADO | 6 / 68 | 8,8% |
| ⬛ MORTO_OU_ABANDONADO | 6 / 68 | 8,8% |
| **Total avaliado** | **68 funcionalidades** | **100%** |

> O denominador é o número de linhas da *Tabela de evidências* abaixo (68). Cada linha corresponde a uma funcionalidade rastreada de ponta a ponta (UI → hook → EF/RPC → tabela → uso real).
>
> Recorte por sub-domínio (contado sobre as linhas da tabela):
> - **Autenticação, sessão e gate admin** — 8 itens (linhas 1–8 da tabela), **8 ✅**. É a parte sólida do escopo.
> - **Segurança de acesso avançada e RBAC granular** — 12 itens (MFA efetivo, banner MFA, passkeys, IP, geo, `validate-access`, dispositivos, SSO, `useRBAC`, roles, permissions, role-permissions), **0 ✅** — 7 🟨 e 5 🟦.
> - **Feature flags** — 2 itens, **0 ✅**.
> - **Observabilidade, alertas e resiliência** — 24 itens, **10 ✅**, 9 🟨, 1 🟦, 4 ⬛.
> - **Ferramentas administrativas e diagnóstico** — 22 itens, **11 ✅**.

**Leitura em uma frase**: o *chassis* de autenticação e de gate administrativo é real e sólido (`user_roles` + `has_role` + `RequireAdmin` em 100% das rotas admin), mas a camada de **observabilidade e de alertas é majoritariamente vitrine**: as tabelas existem, as telas existem, e em vários casos **não existe produtor de dados nem agendador**, de modo que os painéis leem tabelas vazias ou exibem verde por padrão.

**Três riscos de maior severidade** (detalhados em *Achados*):
1. **Lockout total de administradores com 2FA ativo** — `MFAGuard` exige `aal2`, o login não faz challenge e a tela de destino não permite elevar (`src/hooks/useMFAGuard.ts:33`, `src/components/security/TwoFactorSetup.tsx:32`).
2. **Página pública `/status` mostra "Todos os sistemas operacionais" mesmo quando a chamada falha** (`src/pages/StatusPage.tsx:68`), e a EF que ela chama exige JWT (`supabase/functions/system-health/index.ts:130`) — para visitante anônimo ela **sempre** falha.
3. **Error Budget calculado sobre amostragem inexistente/enviesada** — nenhum cron popula `system_health_snapshots`, e o único gravador periódico insere sempre `status='healthy'` (`supabase/migrations/20260717133758_622b2a1a-0506-4edf-9804-503573980eeb.sql:19`).

---

## Tabela de evidências

| Funcionalidade | Classificação | UI | Lógica/EF | Persistência | Proteção (RequireAdmin/RLS) | Evidência / o que falta |
|---|---|---|---|---|---|---|
| RBAC base: tabela `user_roles` + RPC `has_role` | ✅ IMPLEMENTADO_TOTAL | — | RPC `has_role` SECURITY DEFINER | `public.user_roles` | RLS ativa; admin gerencia tudo | Migration `supabase/migrations/20260323155106_4e591bd9-2acd-4735-a4f7-2f6008e560f8.sql:2` (enum `app_role`), `:5` (tabela), `:15` (função `has_role`), `:12` (RLS), `:30-36` (policies) |
| `RequireAdmin` aplicado a **todas** as rotas `/admin/*` | ✅ IMPLEMENTADO_TOTAL | Wrapper `Admin` | `RequireAdmin` chama `has_role` | `user_roles` | `RequireAuth` + `MFAGuard` + `RequireAdmin` | `src/app/AppRoutes.tsx:39-47` define `Admin`; as 22 rotas admin (`:157`–`:178`) usam `<Admin>`. `src/components/admin/RequireAdmin.tsx:25-27` chama `rpc('has_role', {_role:'admin'})`, `:48` redireciona não-admin. **Nenhuma rota admin desprotegida encontrada.** |
| Gate de autenticação `RequireAuth` | ✅ IMPLEMENTADO_TOTAL | Redireciona p/ `/auth` com `from` | — | sessão Supabase | — | `src/hooks/useAuth.tsx:302-330`; usado em `src/app/AppRoutes.tsx:32` |
| Login e-mail/senha | ✅ IMPLEMENTADO_TOTAL | `/auth` | `signInWithPassword` | `auth.users` | — | `src/hooks/useAuth.tsx:216-221`; tradução de erro `:224` |
| Sessão: refresh agendado + intercept global de 401 | ✅ IMPLEMENTADO_TOTAL | toasts | timer T-5min; `window.fetch` patch | — | — | `src/hooks/useAuth.tsx:36-73` (agendamento), `:152-193` (intercept 401 + refresh + signOut) |
| Reset de senha (`/reset-password`) | ✅ IMPLEMENTADO_TOTAL | Form + validação | `auth.updateUser` | `auth.users` | rota pública c/ token recovery | `src/pages/ResetPassword.tsx:42`; validação `:15` (mín. 6 caracteres — fraca) |
| Reset forçado pós-migração + EF `clear-must-reset-flag` | ✅ IMPLEMENTADO_TOTAL | Alerta "Redefinição obrigatória" | EF valida JWT e limpa metadata | `auth.users` + `migration_password_reset_log` | JWT do próprio usuário | `src/hooks/useAuth.tsx:232-256` (guard no login); `src/pages/ResetPassword.tsx:48` (chamador); `supabase/functions/clear-must-reset-flag/index.ts:40-73` |
| MFA/TOTP — enrolamento e verificação | ✅ IMPLEMENTADO_TOTAL | QR + código 6 dígitos | `auth.mfa.enroll/challenge/verify` | fatores nativos Supabase | — | `src/hooks/use2FA.ts:31-66`; UI `src/components/security/TwoFactorSetup.tsx:44-70` |
| `MFAGuard` — exigência de AAL2 para admins | 🟨 IMPLEMENTADO_PARCIAL | Bloqueia render | `getAuthenticatorAssuranceLevel()` | — | aplica-se a `Protected` e `Admin` | `src/hooks/useMFAGuard.ts:26-40`; `src/components/auth/MFAGuard.tsx:12-16`. **Falta**: não há challenge de MFA no login (`src/pages/Auth.tsx` — zero ocorrências de `mfa`/`challenge`/`aal`), e a tela de destino `/seguranca` também está sob `MFAGuard` (`src/app/AppRoutes.tsx:154`) → **tela em branco / lockout** |
| Banner "MFA não configurado" no `RequireAdmin` | 🟨 IMPLEMENTADO_PARCIAL | Alert destrutivo | `auth.mfa.listFactors` | — | admin only | `src/components/admin/RequireAdmin.tsx:52-64`. **Falta**: o link aponta para `/configuracoes/seguranca` (`:58`), rota **inexistente** em `src/app/AppRoutes.tsx` → cai no catch-all `:181`. Além disso, erro na consulta é *fail-open* (`:41`) |
| Passkeys / WebAuthn | 🟨 IMPLEMENTADO_PARCIAL | CRUD de passkeys | `navigator.credentials.create` | `webauthn_credentials` | RLS por `user_id` | `src/hooks/useWebAuthn.ts:38-60` (registro), `:79` (remoção). **Falta**: não existe `navigator.credentials.get` em lugar nenhum do `src/` — não há **autenticação** por passkey, só cadastro. Nenhuma verificação de attestation/challenge no servidor (challenge é gerado no cliente, `:40`) |
| Restrição por IP (whitelist) | 🟨 IMPLEMENTADO_PARCIAL | CRUD + toggle | — | `ip_whitelist` | RLS por `user_id` | `src/hooks/useAllowedIPs.ts:14-56`; UI `src/components/security/IPRestrictionManager.tsx:13`. **Falta**: nada consome a lista no fluxo de login — ver linha `validate-access` abaixo |
| Geo-blocking por país | 🟨 IMPLEMENTADO_PARCIAL | CRUD de países | — | `geo_allowed_countries` | RLS por `user_id` | `src/components/security/GeoBlockingManager.tsx:24`; hook `src/hooks/useGeoBlocking.ts`. **Falta**: sem enforcement (mesmo motivo) |
| EF `validate-access` (enforcement de IP + geo) | 🟦 SUGERIDO_OU_INICIADO | — | EF completa, com Zod e log de bloqueio | `access_security_settings`, `ip_whitelist`, `geo_allowed_countries`, `access_blocked_log` | `withAuth` + rate limit | `supabase/functions/validate-access/index.ts:40-88`. **Zero chamadores**: `grep -rn "invoke.*validate-access" src/` → nenhum resultado. A função existe e é boa, mas nunca é executada |
| Detecção de novos dispositivos | 🟦 SUGERIDO_OU_INICIADO | Switch em `SecuritySettings` | EF `detect-new-device` completa | `user_known_devices`, `device_login_notifications` | `withAuth` + rate limit | `supabase/functions/detect-new-device/index.ts:45-84`. **Zero chamadores** no `src/`. `src/hooks/useDeviceDetection.ts:49` também é órfão (nenhum consumidor). O badge "Detecção de dispositivos" em `src/components/security/SecurityDashboard.tsx:55` reflete apenas um booleano de configuração |
| SSO — callback `/sso/callback` | 🟦 SUGERIDO_OU_INICIADO | Loading + redirect | Apenas `getSession()` | — | rota pública | `src/pages/SSOCallbackPage.tsx:10-17` (20 linhas totais). **Falta tudo**: não há `signInWithSSO`, `signInWithOAuth`, SAML ou OIDC em nenhum lugar do `src/` — o callback nunca é atingido porque nada inicia SSO. Esqueleto puro |
| RBAC por permissão (`useRBAC`) | 🟦 SUGERIDO_OU_INICIADO | — | `hasPermission`/`hasRole`/`hasModuleAccess` | `permissions`, `role_permissions` | RLS | `src/hooks/useRBAC.tsx:13-70`. **Zero consumidores**: `grep -rn "useRBAC\|hasPermission\|canAccessModule" src/` fora do próprio arquivo → nenhum resultado. Nenhuma tela é protegida por permissão granular; a única autorização real é `has_role('admin')` |
| `/admin/roles` — gerenciar roles | 🟨 IMPLEMENTADO_PARCIAL | Lista + contagem | leitura direta | `user_roles` | `RequireAdmin` + `useIsAdmin` interno | `src/pages/RolesPage.tsx:17-19`. Título diz "Gerenciar Roles" (`:38`) mas **não há mutation**: não é possível atribuir nem revogar role pela UI |
| `/admin/permissions` | 🟨 IMPLEMENTADO_PARCIAL | Lista agrupada por módulo | leitura direta | `permissions` | `RequireAdmin` + `useIsAdmin` | `src/pages/PermissionsPage.tsx:17`. Somente leitura; sem CRUD |
| `/admin/role-permissions` | 🟨 IMPLEMENTADO_PARCIAL | Matriz role × permissão | leitura com join | `role_permissions` → `permissions` | `RequireAdmin` + `useIsAdmin` | `src/pages/RolePermissionsPage.tsx:16-19`. Somente leitura; sem editor de matriz |
| Feature flags — tabela + painel CRUD | 🟨 IMPLEMENTADO_PARCIAL | Criar/ligar/desligar | `useFeatureFlags` | `public.feature_flags` | RLS: leitura autenticada, escrita admin | Tabela `supabase/migrations/20260420163323_5af39c4d-bd55-4bd4-963f-2b48aadf5e64.sql:30-37`; policies `:41-59`. UI `src/pages/admin/FeatureFlagsPage.tsx:23-56`. **Falta**: nenhum seed de flags nas migrations (`grep "INSERT INTO public.feature_flags"` → vazio) e a coluna `roles` (`:34`) nunca é lida por ninguém |
| Consumo de feature flags (`useFeatureFlag`) | 🟦 SUGERIDO_OU_INICIADO | — | hook pronto | `feature_flags` | — | `src/hooks/useFeatureFlag.ts:16-38`. **Zero consumidores**: `grep -rn "useFeatureFlag(" src/` fora do próprio arquivo → nenhum resultado. O painel liga/desliga flags que **não protegem nada** |
| Página pública de status `/status` | 🟨 IMPLEMENTADO_PARCIAL | Cards por componente | `invoke('system-health')` | — | rota **pública** | `src/pages/StatusPage.tsx:59`, rota `src/app/AppRoutes.tsx:68`. **Dois defeitos**: (a) a EF exige JWT (`supabase/functions/system-health/index.ts:130`) → anônimo recebe 401; (b) `const overall = data?.status \|\| 'healthy'` (`src/pages/StatusPage.tsx:68`) faz a página exibir **"Todos os sistemas operacionais"** em caso de erro |
| EF `system-health` | ✅ IMPLEMENTADO_TOTAL | consumida por `/status` e widget | 5 checks paralelos reais (DB local/externo, Evolution, e-mail, ElevenLabs) | grava `system_health_snapshots` | `withAuth` + rate limit 5/min | `supabase/functions/system-health/index.ts:15-113` (checks), `:130` (auth), `:172-180` (persist snapshot). Chamadores: `src/pages/StatusPage.tsx:59`, `src/components/admin/SystemHealthWidget.tsx:77` |
| EF `health` (liveness leve) | ✅ IMPLEMENTADO_TOTAL | usada no dashboard admin e quick actions | checks de DB local/externo | — | `withAuth` + rate limit 10/min | `supabase/functions/health/index.ts:12-16`; chamadores `src/pages/AdminDashboard.tsx:110`, `src/components/admin/AdminQuickActions.tsx:21` e `:71` |
| EF `health-aggregate` (v3.1.0, inclui módulo Conexões) | ⬛ MORTO_OU_ABANDONADO | — | mais completa que `system-health` | — | `withAuth` + rate limit 3/min | `supabase/functions/health-aggregate/index.ts:120-160` (check de conexões). **Zero chamadores**: nenhuma ocorrência de `invoke('health-aggregate'` ou `invoke<…>('health-aggregate'` em `src/`. Superconjunto não utilizado de `system-health` |
| Amostragem de saúde (`system_health_snapshots`) | 🟨 IMPLEMENTADO_PARCIAL | — | inserção só quando alguém abre `/status` ou o widget | `system_health_snapshots` | RLS: SELECT admin (`…20260420204951…:15-20`) | Tabela `supabase/migrations/20260420204951_1bd46e2e-bb94-4aeb-8d7f-5fb6cab85538.sql:1-8`. **Não existe cron** que a popule (nenhum `cron.schedule` referencia `system-health`). O único gravador periódico é o heartbeat do auto-ack MTTA, que insere **sempre** `status='healthy'` (`supabase/migrations/20260717133758_622b2a1a-0506-4edf-9804-503573980eeb.sql:19-27`) |
| `/admin/error-budget` + EF `error-budget` | 🟨 IMPLEMENTADO_PARCIAL | Cards, sparkline 30d, badges de freeze | agregação real de snapshots | `system_health_snapshots` → `system_alerts` | `RequireAdmin`; EF com `withAuth` | UI `src/pages/admin/ErrorBudget.tsx:52-120`; hook `src/hooks/useErrorBudget.ts:41`; EF `supabase/functions/error-budget/index.ts:118-148`. **Falta**: a matemática assume `SAMPLE_INTERVAL_MIN = 5` (`:11`) e a UI escreve "atualizado a cada 5 min" (`src/pages/admin/ErrorBudget.tsx:100`), mas **não há cron de 5 min**. Com poucas amostras e viés de `healthy`, `uptime_pct` tende a 100% artificialmente (`:141`) |
| Alertas automáticos de Error Budget (50/75/100%) | 🟨 IMPLEMENTADO_PARCIAL | Lista de alertas ativos no topo do painel | inserção idempotente com dedupe 24h | `system_alerts` | admin-only | `supabase/functions/error-budget/index.ts:69-99`. **Falta**: só dispara quando um admin abre a página (a EF não tem cron); nenhum canal de notificação (e-mail/push/Slack) é acionado |
| `/admin/telemetria` (query telemetry) | 🟨 IMPLEMENTADO_PARCIAL | Filtros, gráficos, top offenders, cleanup 7d | leitura direta + agregação client-side | `query_telemetry` | `RequireAdmin`; RLS por `user_id` (`…20260323120657…:20-22`) | UI `src/pages/AdminTelemetria.tsx:51-75`, cleanup `:79-83`. **Falta o produtor**: `grep -rn "query_telemetry" src/` retorna apenas leituras em `AdminTelemetria.tsx:56` e `:79` e o tipo gerado; nenhuma migration faz `INSERT INTO public.query_telemetry`. **O painel lê uma tabela sem escritor** |
| Export CSV/PDF da telemetria | ✅ IMPLEMENTADO_TOTAL | Botões CSV/PDF | `useTelemetryExport` (client-side) | — | `RequireAdmin` | `src/pages/AdminTelemetria.tsx:98-100`; hook `src/hooks/useTelemetryExport.ts` |
| Indicador de query lenta (UI, tempo real) | ✅ IMPLEMENTADO_TOTAL | Badge global | assina o `QueryCache` do TanStack | em memória | — | `src/hooks/useSlowQueryDetector.ts:15-50`; consumidor `src/components/feedback/SlowQueryIndicator.tsx:11` |
| `/admin/error-logs` + persistência do `logger` | ✅ IMPLEMENTADO_TOTAL | Filtro por severidade/busca, limpar | `logger.error/critical` → insert | `error_logs` | `RequireAdmin` + `useIsAdmin` (`src/pages/admin/ErrorLogs.tsx:37`); RLS SELECT admin (`scripts/migration/ddl/07_policies.sql:424`) | Produtor real: `src/lib/logger.ts:29-51` e `:65-72`. Leitura `src/hooks/useErrorLogs.ts:12-18`. Observação: `logger.warn` **não** persiste (`src/lib/logger.ts:74-77`) |
| `/admin/audit-trail` | 🟨 IMPLEMENTADO_PARCIAL | Filtros, diff viewer | leitura direta | `audit_log` (particionada) | `RequireAdmin` + `useIsAdmin` | UI `src/pages/AdminAuditTrail.tsx:68-87`; produtores são triggers SQL (`supabase/migrations/20260411212046_c6a8c367-17de-4bf5-b40f-9c435f0288f4.sql:39-47`). **Defeito**: a RLS só permite ver as **próprias** linhas — `CREATE POLICY "Users can view their own audit logs" … USING (auth.uid() = user_id)` (`supabase/migrations/20260711152812_6c39e481-8892-4747-9d27-144b71b055e4.sql:31-33`); não existe policy de admin. A "trilha de auditoria organizacional" é, na prática, o log pessoal do admin. Há ainda um ramo morto de código para `EXTERNAL_SYNC` (`src/pages/AdminAuditTrail.tsx:88-93`) |
| EF `audit-analytics` | ⬛ MORTO_OU_ABANDONADO | — | agrega 30d de `audit_log` por entidade/ação/hora | `audit_log` | `withAuth` + rate limit | `supabase/functions/audit-analytics/index.ts:33-77`. **Zero chamadores** em `src/`; a página de audit trail consulta a tabela diretamente |
| `/admin/schema-drift` + banner global | 🟨 IMPLEMENTADO_PARCIAL | Lista, stats, resolver | leitura + update `resolved` | `schema_drift_alerts` | `RequireAdmin`; RLS admin (`supabase/migrations/20260721000085_fix_blanket_isnull_policies.sql:153-160`) | UI `src/pages/AdminSchemaDrift.tsx:85-86`; banner `src/app/AppChrome.tsx:63`; hooks `src/hooks/useSchemaDriftAlerts.ts:29`, `:57`, `:78`. **Falta o produtor**: nenhum código em `src/` ou `supabase/functions/` insere em `schema_drift_alerts` — só leituras e o update de resolução. Painel sempre vazio |
| `/admin/secrets-management` | 🟨 IMPLEMENTADO_PARCIAL | Gerador + histórico + health por idade | gera segredo no cliente, grava hash | `secret_rotation_log` | `RequireAdmin` + `useIsAdmin` (`src/pages/AdminSecretsManagement.tsx:36`) | Inventário estático `src/hooks/useSecretRotation.ts:21-28`; leitura `:41-46`; log `:50+`. **Falta**: **não rotaciona nada** — não há chamada à API de secrets da plataforma; o admin precisa colar o valor manualmente fora do sistema. É um *diário de rotação*, não um gestor |
| `/admin/seguranca` (aprovação de reset de senha) | 🟨 IMPLEMENTADO_PARCIAL | Fila de pendentes + aprovar/rejeitar | update de status | `password_reset_requests` | `RequireAdmin` | UI `src/pages/admin/AdminSegurancaPage.tsx:10`; hook `src/hooks/usePasswordResetRequests.ts:26-46`. **Dois defeitos**: (a) **nada cria** linhas em `password_reset_requests` (`grep` em `src/` e `supabase/functions/` → só o próprio hook) → fila sempre vazia; (b) "Aprovar" apenas troca `status` (`:28-31`) — não dispara e-mail nem `resetPasswordForEmail` |
| `/admin/conexoes` (integrações + webhooks) | ✅ IMPLEMENTADO_TOTAL | CRUD por tipo, teste, DLQ, quotas | `connection-tester`, `connection-introspect` | `connection_configs`, `incoming_webhooks`, `connection_test_logs` | `RequireAdmin` | UI `src/pages/AdminConexoes.tsx:24-31`; hooks `src/hooks/useConnections.ts:50`, `:125` (invoke `connection-tester`), `src/hooks/useIncomingWebhooks.ts:60`. Componentes de apoio todos referenciados |
| EF `connection-tester` | ✅ IMPLEMENTADO_TOTAL | botão "Testar" | testa provedores reais | `connection_test_logs` | `withAuth` (`supabase/functions/connection-tester/index.ts:295`) | Chamador `src/hooks/useConnections.ts:125` |
| EF `connection-introspect` | ✅ IMPLEMENTADO_TOTAL | `SchemaDiscoveryCard` | introspecção de schema externo | — | `withAuth` (`supabase/functions/connection-introspect/index.ts:43`) | Chamador em `src/hooks/` (1 ocorrência de `invoke('connection-introspect'`) |
| EF `connection-anomaly-detector` (IA) | ✅ IMPLEMENTADO_TOTAL | `AnomaliesWidget` | agrega 7d + LLM | logs de webhook | `withAuth` + rate limit 5/min (`supabase/functions/connection-anomaly-detector/index.ts:54`) | Chamador `src/hooks/useConnectionAnomalies.ts:73`. Observação: roda **sob demanda**, não há cron |
| DLQ de webhooks (`process-webhook-dlq`) | 🟨 IMPLEMENTADO_PARCIAL | `WebhookDlqPanel` com botões reprocessar | EF de reprocesso | `incoming_webhook_dlq` | **`requireCronSecret`** | EF `supabase/functions/process-webhook-dlq/index.ts:27`. **Contradição de contrato**: o front chama sem o header `x-cron-secret` (`src/hooks/useWebhookDlq.ts:44` e `:59`) e `requireCronSecret` compara `req.headers.get("x-cron-secret")` (`supabase/functions/_shared/auth.ts:276-279`) → **401 garantido**. Também não há `cron.schedule` para esta função |
| Alertas `smart-notify` | 🟨 IMPLEMENTADO_PARCIAL | enfileiramento via hook | EF de notificação | `notification_logs` | **`requireCronSecret`** (`supabase/functions/smart-notify/index.ts:10`) | **Duplo quebrado**: (a) front chama sem header (`src/hooks/useSmartNotifications.ts:167`); (b) o cron `smart-notify-automation` (`supabase/migrations/20260512105729_9e0ffd45-400f-45c7-b371-7437029a5de3.sql:6-14`) envia apenas `Authorization: Bearer <service_role>`, **sem `x-cron-secret`** → também 401. Alerta que falha em silêncio |
| Alertas de saúde de contatos (`check-health-alerts`) | 🟨 IMPLEMENTADO_PARCIAL | Botão "Verificar agora" | cálculo de health score + push | `health_alerts` | **`requireCronSecret`** (`supabase/functions/check-health-alerts/index.ts:107`) | **Três defeitos**: (a) o front chama sem header (`src/hooks/useHealthAlerts.ts:195`) → 401; (b) **nenhum cron** agenda esta EF; (c) o canal de e-mail é **simulado**: `log.info("email_simulated", …)` (`supabase/functions/check-health-alerts/index.ts:224`) e mesmo assim conta como "notificação enviada" (`:226`) |
| EF `check-notifications` | ⬛ MORTO_OU_ABANDONADO | — | 223 linhas | — | `requireCronSecret` (`supabase/functions/check-notifications/index.ts:15`) | Sem chamador em `src/` e **sem `cron.schedule`** em nenhuma migration. Nunca executa |
| EF `crm-automation-monitor` | ⬛ MORTO_OU_ABANDONADO | — | valida posse do contato + RPC de métricas | `crm_automation_logs` | `withAuth` + rate limit | `supabase/functions/crm-automation-monitor/index.ts:14-56`. **Zero chamadores** em `src/` |
| EF `dual-write-proxy` | ⬛ MORTO_OU_ABANDONADO | — | espelha writes no banco legado | banco legado | **nenhuma verificação de identidade no código** | `supabase/functions/dual-write-proxy/index.ts:16-45` — não usa `withAuth` nem `requireCronSecret`; a única barreira é a whitelist de tabelas por env (`:7`) e o fallback "legacy-disabled" (`:19`). Sem chamadores; ferramenta de bake de migração. `supabase/config.toml` só contém `project_id`, portanto o `verify_jwt` real do gateway é `NAO_VERIFICADO` |
| `/admin/observability` — página `Observability.tsx` | ⬛ MORTO_OU_ABANDONADO | Cards de uptime/latência/erro | queries a colunas inexistentes | `system_health_snapshots`, `slow_queries_audit` | — | **Órfã**: exportada em `src/app/lazyPages.tsx:3` e **nunca consumida** (`grep -rn "AdminObservability" src/` → só a própria linha 3; não há rota em `AppRoutes.tsx`). Além disso, **métricas hardcoded**: `99.9%` (`src/pages/admin/Observability.tsx:59`), `142ms` (`:70`), `0.02%` (`:81`); e consulta `captured_at, avg_latency_ms` (`:22`) — colunas que **não existem** na tabela (`supabase/migrations/20260420204951_…:1-8` define `timestamp`, `status`, `total_latency_ms`, `components`) |
| Cron jobs de observabilidade MTTA / AI-Gateway / RPC | ✅ IMPLEMENTADO_TOTAL | Cards no `/admin/error-budget` | 14 jobs `pg_cron` reais | `system_alerts`, `ai_gateway_metrics`, `rpc_perf_samples`, `rpc_plan_snapshots` | RLS admin + RPCs `SECURITY INVOKER` | Jobnames: `mtta-sla-breach-auto-ack-hourly` (`…20260715184735…:32`), `mtta-auto-ack-heartbeat-watchdog` (`…20260717142132…:70`), `ai-gateway-alerts-eval` (`…20260723152932…:94`), `auto_resolve_ai_gateway_alerts` (`…20260723153336…:179`), `ai-gateway-metrics-ensure-partition` / `ai-gateway-metrics-drop-old` (`…20260723154109…:129`,`:135`), `cleanup_rpc_perf_samples_daily` (`…20260723154748…:255`), `capture-degraded-rpc-plans` (`…20260726144422…:4`), `cleanup-simulated-alerts-weekly` (`…20260713124628…:29`), `check-contact-health-daily` (`…20260509173046…`), `apply-data-retention-daily` (`…20260723112943…`) |
| Painel de performance de RPC (`rpc_perf_samples`) | 🟨 IMPLEMENTADO_PARCIAL | `RpcPerfCard` | `get_rpc_perf_stats` | `rpc_perf_samples` | RLS admin (`…20260723154748…:19-23`) | Hook `src/hooks/useRpcPerfStats.ts:25`. **Viés estrutural**: o recorder `record_rpc_perf_sample` (`…20260723154748…:26-39`) é chamado apenas por **duas** funções, e ambas são as próprias funções de observabilidade — `get_ai_gateway_partition_stats` (`supabase/migrations/20260723155033_ac5c28e5-8ab0-42ff-b379-d3aa3fd34167.sql:53`) e `get_rpc_perf_stats` (`:94`, com o comentário literal "Auto-instrument get_rpc_perf_stats itself" em `:60`). **Nenhuma RPC de negócio é instrumentada** — o painel mede a si mesmo |
| Saúde do AI Gateway (métricas, partições, heatmap) | ✅ IMPLEMENTADO_TOTAL | 3 cards no error-budget | `get_ai_gateway_health` + crons | `ai_gateway_metrics` (particionada) | admin validado dentro da RPC | Hook `src/hooks/useAiGatewayHealth.ts:88`; produtor real `supabase/functions/_shared/aiGatewayLogger.ts` e `_shared/fetch-utils.ts`; invariante testada em `tests/rls/ai_gateway_metrics_least_privilege.sql:57-66` |
| `monitoring/` — Prometheus + Alertmanager | 🟦 SUGERIDO_OU_INICIADO | — | regras de burn-rate multi-janela | métricas do `full-audit-exporter.sh` | — | `monitoring/prometheus/rules/slo-burn-rate.yml:6-22`, `monitoring/prometheus/rules/db-guards.yml:7-15`, `monitoring/alertmanager/alertmanager.yml:6-20`. Lintado no CI (`.github/workflows/monitoring-lint.yml:16-30`). **Falta**: o exporter é um script avulso (`scripts/migration/verify/exporter/full-audit-exporter.sh`) sem agendamento no repositório; nada indica um Prometheus rodando. Configuração válida ≠ alerta ativo. Runtime `NAO_VERIFICADO` |
| Circuit breaker (`src/lib/circuitBreaker.ts`) | 🟨 IMPLEMENTADO_PARCIAL | toast via `useCircuitBreakerHandler` | máquina de estados CLOSED/OPEN/HALF_OPEN | em memória | — | `src/lib/circuitBreaker.ts:28-60`; handler global `src/app/AppRoutes.tsx:56`. **Cobertura mínima**: um único breaker instanciado, `external-db` (`src/lib/externalData.ts:53`). Nenhuma Edge Function, integração de webhook ou provedor de IA está protegido |
| `resilientFetch` (retry + backoff) | ✅ IMPLEMENTADO_TOTAL | transparente | backoff exponencial, respeita `Retry-After` | — | — | `src/lib/resilientFetch.ts:22-77`; ligado ao cliente Supabase em `src/integrations/supabase/client.ts:21` — cobre **todo** o tráfego REST/RPC/Functions |
| `/admin/field-mapping` | 🟨 IMPLEMENTADO_PARCIAL | Tabelas de mapeamento + validação de schema | dados **hardcoded** no arquivo | consulta ao schema externo via sessão | `RequireAdmin` | Mapeamentos estáticos `src/pages/AdminFieldMapping.tsx:23-49`; lista de RPCs estática `:52+`; validação contra o banco externo em `:84-90`. Documentação que **espelha** `FIELD_MAPPING.md` e pode divergir do schema real sem aviso |
| `/admin/knowledge-export` | 🟨 IMPLEMENTADO_PARCIAL | Busca, seleção, export JSON/print | conteúdo **hardcoded** | nenhuma | `RequireAdmin` + `useIsAdmin` | `src/pages/AdminKnowledgeExport.tsx:17-45` — "Knowledge data compiled from project memories". Sem fonte de verdade; envelhece silenciosamente |
| `/admin/docs` | 🟨 IMPLEMENTADO_PARCIAL | Catálogo de docs + exemplos de código | array `DOCS` **hardcoded** | uma query de exemplo real | `RequireAdmin` + `useIsAdmin` (`src/pages/DocsPage.tsx:3`) | `src/pages/DocsPage.tsx:33-45`. Mesma ressalva de conteúdo estático |
| `/admin/component-gallery` | ✅ IMPLEMENTADO_TOTAL | Playground de variantes | estado local | — | `RequireAdmin` + `useIsAdmin` (`src/pages/admin/ComponentGallery.tsx:22`) | `src/pages/admin/ComponentGallery.tsx:21-30`. Ferramenta interna coerente com o propósito |
| `/admin/email-diagnostics` | ✅ IMPLEMENTADO_TOTAL | Status, gráfico, tabela de remetentes | EF `email-pipeline-health` | pipeline externo | `RequireAdmin` | `src/hooks/useEmailPipelineHealth.ts:16`; EF existe em `supabase/functions/email-pipeline-health/` |
| `/admin/voice-diagnostics` | ✅ IMPLEMENTADO_TOTAL | Cards por serviço + painel de teste | EF `voice-ai-health` | — | `RequireAdmin` | `src/hooks/useVoiceAIHealth.ts:20`; EF existe em `supabase/functions/voice-ai-health/` |
| `/admin/lux-config` | ✅ IMPLEMENTADO_TOTAL | Config + histórico de execuções | leitura real | `lux_intelligence` | `RequireAdmin` | `src/pages/AdminLuxConfig.tsx:101-107` |
| `/admin/insight-feedback` | ✅ IMPLEMENTADO_TOTAL | Analytics + tendência | leitura + reenfileiramento | `behavioral_insight_feedback`, `behavioral_profile_regen_queue` | `RequireAdmin` | `src/pages/admin/InsightFeedbackAnalytics.tsx:46`, `:192-219`; EF `generate-behavioral-profile` invocada em `:205` |
| `/admin/behavioral-regen-audit` | ✅ IMPLEMENTADO_TOTAL | Fila, retry, cleanup, alertas, cron health | EFs + RPC | `behavioral_profile_regen_queue` | `RequireAdmin` | `src/pages/admin/BehavioralRegenAudit.tsx:124`, `:150` (EF `retry-behavioral-profile`), `:184` (RPC `cleanup_behavioral_regen_queue`), `:238` |
| `/seguranca` (página do usuário) | ✅ IMPLEMENTADO_TOTAL | Dashboard + abas (auth/acesso/geral) | composição de hooks | várias tabelas de segurança | `Protected` (não é admin-only) | `src/pages/Security.tsx:15-56`; rota `src/app/AppRoutes.tsx:154`. Ressalva: o "5/5 camadas" (`src/components/security/SecurityDashboard.tsx:44`) conta camadas **configuradas**, não **efetivas** |
| `/design-system` — rota pública | 🟨 IMPLEMENTADO_PARCIAL | Catálogo visual | — | — | **rota pública, sem `RequireAuth`** | `src/app/AppRoutes.tsx:69`. Expõe o sistema de design interno a qualquer visitante anônimo. Não há dado sensível óbvio, mas é superfície desnecessária |
| Guards de CI (RLS matrix, CORS escopado, invalid indexes) | ✅ IMPLEMENTADO_TOTAL | — | jobs de pipeline | — | — | `.github/workflows/ci.yml:31` (CORS enforcer), `:34-42` (invalid indexes), `:83-94` (matriz RLS anon/user_a/user_b/user_admin), `:96-104` (cobertura RLS). Suites em `tests/rls/` (`admin.sql`, `anon.sql`, `functions_least_privilege.sql`, …). **Execução real `NAO_VERIFICADO`** |
| Rate limiting e CORS escopado nas Edge Functions | ✅ IMPLEMENTADO_TOTAL | — | `rateLimit()` + `scopedCorsHeaders()` | — | — | `supabase/functions/_shared/auth.ts:70-80` (allowlist de origens); `rateLimit` aplicado em `system-health:5/min`, `health:10/min`, `health-aggregate:3/min`, `error-budget:10/min`, `validate-access:20/min`, `detect-new-device:20/min`. Comparação timing-safe em `_shared/auth.ts:29-67` |

---

## Inventário de feature flags

| flag | default | onde é lida (arquivo:linha) | o que ela protege |
|---|---|---|---|
| *(nenhuma flag existe no código ou nas migrations)* | `enabled BOOLEAN NOT NULL DEFAULT false` — `supabase/migrations/20260420163323_5af39c4d-bd55-4bd4-963f-2b48aadf5e64.sql:32` | — | — |

**Achado central**: o sistema de feature flags é uma casca completa e funcional **sem nenhum consumidor**.

- **Definição**: tabela `feature_flags(name, enabled, description, roles[])` — `supabase/migrations/20260420163323_5af39c4d-bd55-4bd4-963f-2b48aadf5e64.sql:30-37`.
- **Default de qualquer flag nova**: `false`, tanto no DDL (`:32`) quanto na criação pela UI (`src/pages/admin/FeatureFlagsPage.tsx:45`).
- **Seed**: **nenhum**. Não há `INSERT INTO public.feature_flags` em nenhuma das 390 migrations.
- **Hook de leitura**: `useFeatureFlag(name)` — `src/hooks/useFeatureFlag.ts:16-38`. **Consumidores: zero.** `grep -rn "useFeatureFlag(" src/ --include=*.ts --include=*.tsx | grep -v hooks/useFeatureFlag` retorna vazio.
- **Hook de listagem**: `useFeatureFlags()` — `src/hooks/useFeatureFlag.ts:41-53`. Único consumidor: o próprio painel admin (`src/pages/admin/FeatureFlagsPage.tsx:17`).
- **Coluna `roles[]`**: definida em `:34` da migration; **nunca lida** — o hook a seleciona (`src/hooks/useFeatureFlag.ts:21`) mas o valor de retorno `enabled` (`:34`) ignora completamente o array de roles. Não há gating por role.

**Consequência para a classificação**: como nenhuma funcionalidade está atrás de flag, a regra "flag desligada por padrão ⇒ feature protegida é 🟨" não rebaixa nenhum item deste escopo — mas o próprio mecanismo de flags é 🟦 no consumo e 🟨 na administração.

**Nota de contradição documental**: `docs/RUNBOOK.md:376-393` descreve "Feature Flags & Kill Switches" como sendo `UPDATE connection_configs SET is_active = false`. Isso é um mecanismo **diferente** (desligar integrações), real e funcional (`src/hooks/useConnections.ts:113`), mas o RUNBOOK **não menciona** a tabela `feature_flags` nem a rota `/admin/feature-flags`, que é o que o código realmente oferece como feature flag.

---

## Achados

### A1 — 🔴 Lockout total de administradores com 2FA ativo (dead-end de MFA)
- `src/hooks/useMFAGuard.ts:33` — `const isVerified = data.currentLevel === 'aal2'`.
- `src/hooks/useMFAGuard.ts:36-42` — se não verificado, navega para `/seguranca`.
- `src/components/auth/MFAGuard.tsx:12-14` — se `isMfaRequired`, retorna `null` (nada renderiza).
- `src/app/AppRoutes.tsx:154` — `/seguranca` está dentro de `<Protected>`, que envolve `MFAGuard` (`:31-37`). O destino do redirecionamento **também está bloqueado** → tela em branco.
- `src/pages/Auth.tsx` — nenhuma ocorrência de `mfa`, `challenge` ou `aal`: o login não faz o desafio TOTP, então a sessão nasce em `aal1`.
- `src/components/security/TwoFactorSetup.tsx:32-44` — quando `isEnabled` é verdadeiro, a UI mostra apenas "2FA ativo / Desativar"; **não existe campo de código** para elevar de `aal1` para `aal2`. O input só aparece no ramo `qrUri` (`:45-70`), ou seja, apenas durante o enrolamento inicial.

**Efeito combinado**: um admin que ativou 2FA e faz login por senha fica em `aal1`, é redirecionado para `/seguranca`, e ali encontra uma página em branco sem meio de se autenticar no segundo fator. Perda de acesso administrativo.

### A2 — 🔴 Página pública `/status` exibe verde por padrão quando falha
- `src/app/AppRoutes.tsx:68` — `/status` é rota pública (fora de `Protected`).
- `src/pages/StatusPage.tsx:59` — chama `invoke('system-health')`.
- `supabase/functions/system-health/index.ts:130` — `withAuth(req)`; `supabase/functions/_shared/auth.ts:120-132` — `authenticateRequest` faz `getUser()`; a chave anônima não resolve um usuário → `UNAUTHORIZED` (401).
- `src/pages/StatusPage.tsx:68` — `const overall = data?.status || 'healthy'`; com `data` indefinido a página renderiza `OVERALL_CONFIG.healthy` = **"Todos os sistemas operacionais"** (`:45`).

**Efeito**: para qualquer visitante não autenticado — o público-alvo de uma status page — a página *sempre* afirma que tudo está operacional, independentemente da realidade. Métrica falsa por construção.

### A3 — 🔴 Error Budget sobre amostragem inexistente e enviesada
- `supabase/functions/error-budget/index.ts:11` — `const SAMPLE_INTERVAL_MIN = 5; // cron snapshot a cada 5 min`.
- `supabase/migrations/20260420204951_1bd46e2e-bb94-4aeb-8d7f-5fb6cab85538.sql:30-31` — comentário da tabela: *"Populado a cada 5 min via cron"*.
- **Nenhum `cron.schedule` referencia `system-health`.** Os 14 jobs existentes estão listados na tabela de evidências; nenhum é o `system-health-snapshot-5min` prometido.
- Escritas reais na tabela: (a) `supabase/functions/system-health/index.ts:172-180`, apenas quando um humano abre `/status` ou o widget admin; (b) `supabase/migrations/20260717133758_622b2a1a-0506-4edf-9804-503573980eeb.sql:19-27`, o heartbeat horário do auto-ack MTTA, que insere **sempre** `status='healthy'`.
- `supabase/functions/error-budget/index.ts:141` — `uptimePct = totalSamples === 0 ? 100 : …`; e `:57-58` — dias sem amostra são preenchidos com `uptime_pct: 100`.

**Efeito**: o uptime tende a 100% por ausência de dado negativo, os thresholds de 50/75/100% praticamente nunca disparam, e o "freeze de deploy" documentado em `docs/RUNBOOK.md:433` nunca se ativa.

### A4 — 🟠 Três alertas com contrato de autenticação quebrado (falham em silêncio)
| EF | Guard | Chamador | Resultado esperado |
|---|---|---|---|
| `check-health-alerts` | `requireCronSecret` (`supabase/functions/check-health-alerts/index.ts:107`) | `src/hooks/useHealthAlerts.ts:195` (sem header) | 401 — botão "Verificar agora" nunca funciona. **Sem cron.** |
| `process-webhook-dlq` | `requireCronSecret` (`supabase/functions/process-webhook-dlq/index.ts:27`) | `src/hooks/useWebhookDlq.ts:44` e `:59` (sem header) | 401 — reprocesso de DLQ inoperante. **Sem cron.** |
| `smart-notify` | `requireCronSecret` (`supabase/functions/smart-notify/index.ts:10`) | `src/hooks/useSmartNotifications.ts:167` (sem header) **e** cron `smart-notify-automation` (`supabase/migrations/20260512105729_9e0ffd45-400f-45c7-b371-7437029a5de3.sql:6-14`, envia só `Authorization`) | 401 nos **dois** caminhos |

`supabase/functions/_shared/auth.ts:276` — o guard lê estritamente `req.headers.get("x-cron-secret")`. Nenhum dos chamadores o envia. Alerta sem agendador funcional = falha silenciosa.

### A5 — 🟠 Canal de e-mail dos alertas de saúde é simulado
`supabase/functions/check-health-alerts/index.ts:224` — `log.info("email_simulated", { email: …, contact: … })` e, na linha seguinte (`:226`), `notificationsSent.push('email:…')`. A resposta da EF reporta e-mails "enviados" que nunca saíram. A UI (`src/hooks/useHealthAlerts.ts:196-199`) confia nesse contador.

### A6 — 🟠 Segredo (JWT anon) hardcoded em migration versionada
`supabase/migrations/20260417120721_823eaa43-3b8a-4ea7-a046-ad763d7c5f03.sql:19` — o cron `validation-queue-drain` embute um JWT anon completo do projeto `rqodmqosrotmtrjnnjul` no corpo da migration. É a chave `anon` (pública por natureza), mas fica imutável no histórico do Git e aponta para um projeto diferente do declarado em `supabase/config.toml` (`hjhthvzwtvwgdrochcam`) — indício de migration copiada de outro ambiente.

### A7 — 🟠 `dual-write-proxy` sem verificação de identidade no código
`supabase/functions/dual-write-proxy/index.ts:16-45` — não usa `withAuth`, `withAuthOrServiceRole` nem `requireCronSecret`. Escreve no banco legado com `LEGACY_SERVICE_ROLE_KEY` (`:5`). A única barreira aplicacional é a whitelist `DUAL_WRITE_TABLES` (`:7`) e o curto-circuito quando as envs não estão setadas (`:19`). Como `supabase/config.toml` contém apenas `project_id` (sem bloco `[functions.*]`), o `verify_jwt` do gateway assume o default da plataforma — **`NAO_VERIFICADO`**. Sem chamadores; ferramenta de bake de migração que deveria ter sido removida.

### A8 — 🟠 Trilha de auditoria admin é, na prática, pessoal
`supabase/migrations/20260711152812_6c39e481-8892-4747-9d27-144b71b055e4.sql:31-33` — a única policy de `SELECT` em `audit_log` é `USING (auth.uid() = user_id)`. Não há policy de admin em nenhuma migration (`grep -rn "ON public.audit_log" supabase/migrations/*.sql` → só índices, grants e essas duas policies). A página `/admin/audit-trail` (`src/pages/AdminAuditTrail.tsx:68-87`) consulta a tabela com o JWT do admin, portanto só retorna as ações do próprio admin. Compliance ilusório.

### A9 — 🟠 Painéis sem produtor de dados (tabelas vazias por construção)
| Painel | Tabela lida | Produtor encontrado |
|---|---|---|
| `/admin/telemetria` | `query_telemetry` | **Nenhum.** `grep -rn "query_telemetry" src/` → só leituras em `src/pages/AdminTelemetria.tsx:56` e delete em `:79`; nenhum `INSERT INTO public.query_telemetry` nas migrations |
| `/admin/schema-drift` | `schema_drift_alerts` | **Nenhum.** `src/hooks/useSchemaDriftAlerts.ts:29`, `:57`, `:78` só leem/resolvem; nada em `supabase/functions/` insere |
| `/admin/seguranca` | `password_reset_requests` | **Nenhum.** Só `src/hooks/usePasswordResetRequests.ts` (lê `:14`, atualiza `:29`, `:41`) |

### A10 — 🟠 Métricas de RPC medem apenas a si mesmas
`supabase/migrations/20260723155033_ac5c28e5-8ab0-42ff-b379-d3aa3fd34167.sql:60` traz o comentário literal *"Auto-instrument get_rpc_perf_stats itself"*. As duas únicas chamadas a `record_rpc_perf_sample` estão em `:53` (`get_ai_gateway_partition_stats`) e `:94` (`get_rpc_perf_stats`) — ambas funções de observabilidade. Nenhuma RPC de negócio grava amostra. O `RpcPerfCard` (`src/components/admin/RpcPerfCard.tsx:75`) exibe p95/p99 de duas funções de leitura de painel.

### A11 — 🟡 Órfãos (código sem consumidor)
| Artefato | Evidência |
|---|---|
| `AdminObservability` / `src/pages/admin/Observability.tsx` | Exportado em `src/app/lazyPages.tsx:3`; **nenhuma rota** o consome (`grep -rn "AdminObservability" src/` → 1 resultado, a própria definição). Ainda contém métricas hardcoded (`:59`, `:70`, `:81`) e consulta colunas inexistentes `captured_at`/`avg_latency_ms` (`:22`) |
| `src/pages/AdminConexoesLogs.tsx` | Página completa (304 linhas) **fora** de `lazyPages.tsx` e de `AppRoutes.tsx`. É o destino do link "Ver logs unificados" em `src/pages/AdminConexoes.tsx:44` → **link morto**, cai no catch-all `src/app/AppRoutes.tsx:181` |
| `src/pages/admin/TelemetryTable.tsx` | Não referenciado por nenhuma rota nem por `lazyPages.tsx` |
| `src/components/admin/AccessSecurityManager.tsx` | Zero consumidores; arrasta consigo `src/components/admin/PasswordResetApproval.tsx:8` (importado apenas por ele, `AccessSecurityManager.tsx:3`) |
| `src/components/admin/EmailPipelineStatus.tsx` | Zero consumidores |
| `src/hooks/useRBAC.tsx` | Zero consumidores |
| `src/hooks/useFeatureFlag.ts` (`useFeatureFlag`) | Zero consumidores |
| `src/hooks/useDeviceDetection.ts:49` | Zero consumidores |
| EFs sem chamador e sem cron | `health-aggregate`, `audit-analytics`, `validate-access`, `detect-new-device`, `crm-automation-monitor`, `dual-write-proxy`, `check-notifications` |

### A12 — 🟡 Links de navegação quebrados
| Link | Origem | Situação |
|---|---|---|
| `/configuracoes/seguranca` | `src/components/admin/RequireAdmin.tsx:58` | Rota inexistente. As rotas reais são `/configuracoes` (`src/app/AppRoutes.tsx:92`) e `/seguranca` (`:154`) |
| `/admin/conexoes/logs` | `src/pages/AdminConexoes.tsx:44` | Rota inexistente (página órfã, ver A11) |

### A13 — 🟡 Rotas admin ausentes da navegação
`src/components/admin/AdminSidebar.tsx:8-24` lista 16 destinos. **Não aparecem** no menu: `/admin/roles`, `/admin/permissions`, `/admin/role-permissions`, `/admin/error-logs`, `/admin/component-gallery`, `/admin/seguranca`. São alcançáveis apenas por URL direta — protegidas, mas invisíveis.

### A14 — 🟡 Cobertura de circuit breaker mínima
`src/lib/circuitBreaker.ts:28` implementa a máquina de estados completa, mas há **uma única** instância no sistema: `getCircuitBreaker('external-db', …)` em `src/lib/externalData.ts:53`. Nenhuma Edge Function, webhook de entrada ou provedor de IA está protegido contra falha em cascata.

### A15 — 🟡 Superfície pública desnecessária e política de senha fraca
- `/design-system` é rota pública (`src/app/AppRoutes.tsx:69`) — catálogo interno acessível sem login.
- `src/pages/ResetPassword.tsx:15` — `z.string().min(6, 'Mínimo 6 caracteres')`: sem exigência de complexidade, comprimento ou verificação contra senhas vazadas.
- `src/components/admin/RequireAdmin.tsx:41` — a checagem de MFA é *fail-open* por design declarado (`return true; // fail-open`), suprimindo o banner em caso de erro.

---

## Contradições com a documentação existente

| # | Documento | Afirmação | Realidade no código |
|---|---|---|---|
| 1 | `docs/RUNBOOK.md:489` | "Snapshots: cron `system-health-snapshot-5min` (a cada 5min) → tabela `system_health_snapshots`" | **Esse jobname não existe.** Nenhum `cron.schedule` em `supabase/migrations/*.sql` referencia `system-health`. Ver A3 |
| 2 | `docs/RUNBOOK.md:490` | "Cleanup: cron `system-health-snapshots-cleanup` (domingos 03:00 UTC) chama `public.cleanup_old_health_snapshots()`" | A **função** existe (`supabase/migrations/20260420211439_86dd2e38-5985-4465-9f0a-bb770155a426.sql:37`), mas **não há cron com esse jobname**. Os jobs de domingo existentes são `cleanup-simulated-alerts-weekly` e `ai-gateway-metrics-drop-old` |
| 3 | `docs/RUNBOOK.md:462-468` | Consulta SQL de error budget sobre a tabela `health_check_history` | Tabela **inexistente**: `grep -rn "health_check_history" supabase/migrations/*.sql` → zero resultados. A EF real usa `system_health_snapshots` (`supabase/functions/error-budget/index.ts:120`) |
| 4 | `docs/RUNBOOK.md:376-393` | "Feature Flags & Kill Switches" = `UPDATE connection_configs SET is_active = false` | O mecanismo de feature flag real do código é a tabela `feature_flags` + `/admin/feature-flags` + `useFeatureFlag`, **não citados no RUNBOOK**. E o `useFeatureFlag` não tem consumidores |
| 5 | `docs/RUNBOOK.md:5` | "v2.2.0 — Rodada R: **observabilidade ativa** do error budget (sparkline 30d, retenção 60d, alertas automáticos 50/75/100%)" | A observabilidade **não é ativa**: não há cron nem para os snapshots nem para a EF `error-budget`; os alertas só são avaliados quando um admin abre a página (`supabase/functions/error-budget/index.ts:152`) |
| 6 | `docs/ARCHITECTURE.md:77` | "`/admin/error-logs` \| Admin \| Painel de **telemetria**" | `/admin/error-logs` é painel de **logs de erro** (`error_logs`); a telemetria fica em `/admin/telemetria` (`query_telemetry`), rota que a tabela de `ARCHITECTURE.md` não lista |
| 7 | `docs/ARCHITECTURE.md:63` | "Telemetria queries lentas \| `useSlowQueryDetector` (>3s) com badge global" | Correto quanto ao badge (`src/hooks/useSlowQueryDetector.ts:11`, `src/components/feedback/SlowQueryIndicator.tsx:11`), mas trata-se de detecção **client-side em memória** — nada é persistido em `query_telemetry`, o que reforça A9 |
| 8 | `supabase/migrations/20260420204951_…:30-31` (comentário SQL) | "Populado a cada 5 min via cron" | Comentário na própria migration contradiz o estado do repositório. Ver A3 |
| 9 | `supabase/migrations/20260420204951_…:22` | Policy nomeada "Service role can insert system health snapshots" | O corpo é `FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'))` (`:23-27`) — não é uma policy de service role (que aliás faz bypass de RLS). Nome enganoso |
| 10 | `src/pages/admin/ErrorBudget.tsx:100` | UI afirma "atualizado a cada 5 min" | Falso pelo mesmo motivo de A3 |

---

## Arquivos que inspecionei

**Roteamento e bootstrap**
`src/app/AppRoutes.tsx`, `src/app/lazyPages.tsx`, `src/app/AppChrome.tsx`

**Auth / MFA / segurança (frontend)**
`src/hooks/useAuth.tsx`, `src/hooks/useMFAGuard.ts`, `src/hooks/useIsAdmin.ts`, `src/hooks/useRBAC.tsx`, `src/hooks/use2FA.ts`, `src/hooks/useWebAuthn.ts`, `src/hooks/useAllowedIPs.ts`, `src/hooks/useAccessSecurity.ts`, `src/hooks/usePasswordResetRequests.ts`, `src/hooks/useDeviceDetection.ts`, `src/components/auth/MFAGuard.tsx`, `src/components/admin/RequireAdmin.tsx`, `src/components/security/{SecurityDashboard,TwoFactorSetup,PasskeyManager,IPRestrictionManager,GeoBlockingManager}.tsx`, `src/pages/{Auth,Security,ResetPassword,SSOCallbackPage}.tsx`

**Admin (páginas)**
`src/pages/{AdminDashboard,AdminTelemetria,AdminSchemaDrift,AdminFieldMapping,AdminEmailDiagnostics,AdminVoiceDiagnostics,AdminLuxConfig,AdminSecretsManagement,AdminConexoes,AdminConexoesLogs,AdminAuditTrail,AdminKnowledgeExport,DocsPage,RolesPage,PermissionsPage,RolePermissionsPage,StatusPage}.tsx`, `src/pages/admin/{AdminSegurancaPage,ErrorBudget,ErrorLogs,ComponentGallery,FeatureFlagsPage,InsightFeedbackAnalytics,BehavioralRegenAudit,Observability,TelemetryTable}.tsx`

**Admin (componentes)**
`src/components/admin/` — inventário completo listado; leitura detalhada de `AdminSidebar.tsx`, `AdminQuickActions.tsx`, `SystemHealthWidget.tsx`, `MttaAutoAckHeartbeatCard.tsx`, `RpcPerfCard.tsx`, `AccessSecurityManager.tsx`, `PasswordResetApproval.tsx`

**Hooks de observabilidade**
`src/hooks/{useErrorBudget,useErrorLogs,useHealthAlerts,useSchemaDriftAlerts,useSecretRotation,useSlowQueryDetector,useTelemetryExport,useAiGatewayHealth,useRpcPerfStats,useEmailPipelineHealth,useVoiceAIHealth,useConnections,useIncomingWebhooks,useConnectionAnomalies,useWebhookDlq,useSmartNotifications,useFeatureFlag,useCircuitBreakerHandler}.ts(x)`

**Infra frontend**
`src/lib/{logger,resilientFetch,circuitBreaker,externalData,supabaseInvoke}.ts`, `src/integrations/supabase/client.ts`

**Edge Functions**
`supabase/functions/_shared/auth.ts` (integral), e `system-health`, `health`, `health-aggregate`, `check-health-alerts`, `error-budget`, `audit-analytics`, `validate-access`, `clear-must-reset-flag`, `detect-new-device`, `connection-tester`, `connection-introspect`, `connection-anomaly-detector`, `crm-automation-monitor`, `process-webhook-dlq`, `dual-write-proxy`, `smart-notify`, `check-notifications`

**Banco**
`supabase/config.toml`; migrations `20260323155106` (RBAC), `20260323120657` (query_telemetry), `20260411212046` / `20260711152812` (audit_log), `20260415120833` / `20260415120848` (schema drift), `20260416180426` (permissions), `20260417120721` (crons de validação), `20260420163323` (feature_flags), `20260420204951` / `20260420211439` (health snapshots), `20260512105729` (cron smart-notify), `20260513143152` (slow_queries_audit), `20260713124628`, `20260715184735`, `20260717133758`, `20260717142132`, `20260721000031`, `20260721000085`, `20260723112943`, `20260723150429`, `20260723152932`, `20260723153336`, `20260723154109`, `20260723154748`, `20260723155033`, `20260726144422`; `scripts/migration/ddl/07_policies.sql`

**Monitoramento e CI**
`monitoring/prometheus/rules/{db-guards,slo-burn-rate}.yml`, `monitoring/alertmanager/alertmanager.yml`, `.github/workflows/{ci.yml,monitoring-lint.yml}`, `tests/rls/` (listagem), `e2e/` (listagem + grep)

**Documentação confrontada**
`docs/RUNBOOK.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`

---

## Lacunas: o que NÃO verifiquei e por quê

1. **Estado real do banco em produção** — sem acesso runtime. Não sei se `user_roles` tem algum admin, se `feature_flags` tem linhas inseridas manualmente pelo painel, se `query_telemetry`/`schema_drift_alerts`/`password_reset_requests` estão de fato vazias, ou quantos snapshots existem. Todas as conclusões sobre "tabela sem produtor" derivam de ausência de escritor **no repositório** — um processo externo (n8n, script manual, MCP) poderia estar populando. **`NAO_VERIFICADO`**.
2. **`pg_cron` efetivamente instalado e jobs ativos** — li os `cron.schedule` das migrations, mas não consultei `cron.job`. Jobs podem ter sido removidos, desabilitados ou nunca aplicados. Migrations com `IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron')` (ex.: `…20260723153336…:176`) simplesmente não fazem nada se a extensão faltar. **`NAO_VERIFICADO`**.
3. **Deploy e `verify_jwt` das Edge Functions** — `supabase/config.toml` tem uma única linha (`project_id`). Não sei quais funções estão publicadas nem qual `verify_jwt` o gateway aplica. Isso afeta diretamente a severidade de A7 (`dual-write-proxy`). **`NAO_VERIFICADO`**.
4. **Secrets configurados** — `CRON_SECRET`, `EXTERNAL_SUPABASE_*`, `EVOLUTION_*`, `ELEVENLABS_API_KEY`, `LEGACY_*`. Vários checks retornam `not_configured` quando ausentes (`supabase/functions/system-health/index.ts:34`), o que muda o status global exibido. **`NAO_VERIFICADO`**.
5. **Compilação, lint e testes** — `node_modules` vazio; por regra explícita não executei `build`, `test` nem `lint`. **Nada neste documento afirma que o projeto compila ou que qualquer teste passa.** O CI (`.github/workflows/ci.yml`) foi lido como texto, não executado.
6. **Comportamento de runtime do `MFAGuard`** — A1 é uma inferência de leitura de código (fluxo de estados de `aal1`/`aal2` do Supabase Auth). Não reproduzi o lockout em navegador. A conclusão é forte, mas a confirmação empírica exige sessão real com TOTP enrolado.
7. **RLS efetiva** — li as policies nas migrations e em `scripts/migration/ddl/07_policies.sql`, mas não executei `tests/rls/run.sh` nem inspecionei `pg_policies`. Onde migrations e DDL de migração divergem (caso de `audit_log`, A8), assumi a migration mais recente como fonte de verdade — isso pode estar errado se o ambiente real veio do dump de migração.
8. **Prometheus/Alertmanager em operação** — os YAMLs são válidos e lintados no CI, mas não há evidência no repositório de um Prometheus rodando nem de agendamento do `full-audit-exporter.sh`. Classifiquei como 🟦 por ausência de prova, não por prova de ausência.
9. **Módulos fora do escopo designado** — não avaliei CRM, pipeline, marketing, IA de conteúdo, voz ou enriquecimento, exceto quando um artefato do escopo os tocava (ex.: `behavioral-regen-audit`).
10. **Histórico Git / autoria** — não usei `git log` nem `git blame` para datar o abandono dos artefatos órfãos. "Morto" aqui significa "sem consumidor no HEAD atual", não "removido em determinada data".
