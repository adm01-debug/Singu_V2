# Prod Readiness ? Singu_V2

> Documento vivo de prontidão para produção. Linha de base de `main` (HEAD `f8312ef`, pós-merge #219). Cada item tem status **OK** (com prova) ou **BLOQUEADO** (com erro exato). Zero itens "n?o verificado".

## 1. Qualidade t?cnica (build / typecheck / lint / testes)

| Item | Status | Prova |
|---|---|---|
| Build (vite) | OK | `npm run build` exit 0 ? warnings `@__PURE__` do zod v4 s?o inofensivos |
| Typecheck (`tc`) | OK | exit 0 |
| Lint (`eslint .` `--max-warnings=0`) | OK | exit 0 |
| Testes (vitest) | OK* | 6768 testes; 1 falha exclusiva de plataforma Windows (path separator `/training/` em architecture-compliance.test.ts:68); os 3 arquivos existem; CI Linux verde no mesmo commit 6e9097a (run 1324) |
| npm audit (`--omit=dev --audit-level=high`) | OK | exit 0 |

## 2. Banco de dados

| Item | Status | Prova |
|---|---|---|
| Tabelas public | OK | 406 |
| RLS ativa | OK | 406/406 com RLS on (inclui 6 parti??es ai_gateway_metrics_YYYY_MM herdando RLS da pai ai_gateway_metrics) |
| Policies | OK | 1477 (400 tabelas com policy pr?pria; parti??es herdam da pai) |
| Tabelas sem policy | OK | 6 ? todas parti??es de ai_gateway_metrics com RLS on; policy herdada da tabela pai |
| SECURITY DEFINER sem search_path | OK | 0 |
| Fun??es public | OK | 1382 |
| Cron ativos | OK | 40 ativos; ?ltimos 3 dias todos succeeded (?nica falha isolada tratada na PR #213) |
| Advisors de seguran?a | BLOQUEADO | endpoint REST `GET /v1/projects/{ref}/advisors` responde 404 ("Cannot GET"); sem via API para consultar painel ? verificar manualmente no dashboard Supabase |
| Migration 20261027220000 (guard serialize_contact_relation_writes) | BLOQUEADO | DDL produ??o ? fun??o guard_contact_relation_write() e trigger N?O existem em prod (has_trigger=0 nas 4 tabelas contact_*); migration n?o registrada no schema_migrations; aplica??o depende de autoriza??o do dono |
| Migration 20261113154000 (fix check_mtta_auto_ack_heartbeat) | OK | aplicada em prod 13/11 21:09Z via Management API ? funcao agora insere threshold_pct=150/consumed_pct=COALESCE(age_min,150); REVOKE aplicado (grantees: service_role, postgres); execucao simulada OK |

## 3. Rotas (App) ? 114 rotas em src/app/AppRoutes.tsx

| Rota | Status | Prova |
|---|---|---|
| `/` | OK | rota home registrada em src/app/AppRoutes.tsx |
| `/abm` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/abm/:id` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/abm/campanhas` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/audit-trail` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/behavioral-regen-audit` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/component-gallery` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/conexoes` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/conexoes/logs` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/docs` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/email-diagnostics` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/error-budget` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/error-logs` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/feature-flags` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/field-mapping` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/insight-feedback` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/knowledge-export` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/lux-config` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/permissions` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/role-permissions` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/roles` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/schema-drift` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/secrets-management` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/seguranca` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/telemetria` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/admin/voice-diagnostics` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/analytics` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/assistente` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/auth` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/automacoes` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/bi` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/cadastro` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/calendario` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/campanhas` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/configuracoes` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/contatos` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/contatos/:id` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/contatos/:id/ficha-360` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/conversation-intelligence` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/conversation-intelligence/setup` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/crm/copywriting` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/customer-success` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/customer-success/account/:id` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/deal-rooms` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/deal-rooms/:id` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/deduplicacao` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/design-system` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/documentos` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/dr/:token` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/empresas` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/empresas/:companyId/analytics` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/empresas/:id` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/enrichment` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/erp` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/f/:slug` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/forecasting` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/forecasting/setup` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/historico` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/inbox` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/insights` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/intelligence` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/intelligence/auditoria` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/intelligence/relacionamento/auditoria` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/intent` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/intent/setup` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/interacoes` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/knowledge-base` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/landing-pages` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/lead-scoring` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/lead-scoring/automations` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/lead-scoring/config` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/lm/:slug` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/lp/:slug` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/mapa-empresas` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/marketing` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/marketing/forms/:id` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/marketing/lead-magnets/:id` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/metas` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/network` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/nlp-analytics` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/notificacoes` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/notificacoes/configuracoes` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/nps` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/nurturing` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/onboarding` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/perfis-comportamentais` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/performance` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/pipeline` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/playbooks` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/playbooks/:id` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/playbooks/battle-cards/:id` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/relatorio/:id` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/relatorios-customizaveis` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/report-builder` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/reset-password` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/revops` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/rodizio` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/seguranca` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/sequencias` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/signature/:token` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/sms-marketing` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/sso/callback` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/status` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/suporte` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/survey/:token` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/tarefas` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/territorios` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/territory-optimization` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/whatsapp` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/whatsapp/importar` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/win-loss` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |
| `/win-loss/setup` | OK | rota registrada em src/app/AppRoutes.tsx (114 rotas) |

## 4. Edge Functions ? 109 slugs no repo (152 deployed em prod, todas ACTIVE)

| Slug | Status | Prova |
|---|---|---|
| `abm-account-scorer` | OK | supabase/functions/abm-account-scorer/index.ts ? deployed ACTIVE (152 functions em prod) |
| `abm-whitespace-analyzer` | OK | supabase/functions/abm-whitespace-analyzer/index.ts ? deployed ACTIVE (152 functions em prod) |
| `ai-assistant` | OK | supabase/functions/ai-assistant/index.ts ? deployed ACTIVE (152 functions em prod) |
| `ai-email-refine` | OK | supabase/functions/ai-email-refine/index.ts ? deployed ACTIVE (152 functions em prod) |
| `ai-suggest-mapping` | OK | supabase/functions/ai-suggest-mapping/index.ts ? deployed ACTIVE (152 functions em prod) |
| `ai-writing-assistant` | OK | supabase/functions/ai-writing-assistant/index.ts ? deployed ACTIVE (152 functions em prod) |
| `ask-crm` | OK | supabase/functions/ask-crm/index.ts ? deployed ACTIVE (152 functions em prod) |
| `attribution-calculator` | OK | supabase/functions/attribution-calculator/index.ts ? deployed ACTIVE (152 functions em prod) |
| `audit-analytics` | OK | supabase/functions/audit-analytics/index.ts ? deployed ACTIVE (152 functions em prod) |
| `auto-rebatch-behavioral` | OK | supabase/functions/auto-rebatch-behavioral/index.ts ? deployed ACTIVE (152 functions em prod) |
| `auto-regen-behavioral-profiles` | OK | supabase/functions/auto-regen-behavioral-profiles/index.ts ? deployed ACTIVE (152 functions em prod) |
| `bitrix24-webhook` | OK | supabase/functions/bitrix24-webhook/index.ts ? deployed ACTIVE (152 functions em prod) |
| `bulk-revalidate` | OK | supabase/functions/bulk-revalidate/index.ts ? deployed ACTIVE (152 functions em prod) |
| `check-health-alerts` | OK | supabase/functions/check-health-alerts/index.ts ? deployed ACTIVE (152 functions em prod) |
| `check-notifications` | OK | supabase/functions/check-notifications/index.ts ? deployed ACTIVE (152 functions em prod) |
| `clear-must-reset-flag` | OK | supabase/functions/clear-must-reset-flag/index.ts ? deployed ACTIVE (152 functions em prod) |
| `client-notifications` | OK | supabase/functions/client-notifications/index.ts ? deployed ACTIVE (152 functions em prod) |
| `connection-anomaly-detector` | OK | supabase/functions/connection-anomaly-detector/index.ts ? deployed ACTIVE (152 functions em prod) |
| `connection-introspect` | OK | supabase/functions/connection-introspect/index.ts ? deployed ACTIVE (152 functions em prod) |
| `connection-tester` | OK | supabase/functions/connection-tester/index.ts ? deployed ACTIVE (152 functions em prod) |
| `conversation-analyzer` | OK | supabase/functions/conversation-analyzer/index.ts ? deployed ACTIVE (152 functions em prod) |
| `conversation-coaching-digest` | OK | supabase/functions/conversation-coaching-digest/index.ts ? deployed ACTIVE (152 functions em prod) |
| `conversational-search` | OK | supabase/functions/conversational-search/index.ts ? deployed ACTIVE (152 functions em prod) |
| `crm-automation-monitor` | OK | supabase/functions/crm-automation-monitor/index.ts ? deployed ACTIVE (152 functions em prod) |
| `cs-health-recalc` | OK | supabase/functions/cs-health-recalc/index.ts ? deployed ACTIVE (152 functions em prod) |
| `deal-room-buyer-view` | OK | supabase/functions/deal-room-buyer-view/index.ts ? deployed ACTIVE (152 functions em prod) |
| `deal-room-health` | OK | supabase/functions/deal-room-health/index.ts ? deployed ACTIVE (152 functions em prod) |
| `deal-room-share` | OK | supabase/functions/deal-room-share/index.ts ? deployed ACTIVE (152 functions em prod) |
| `demand-forecast` | OK | supabase/functions/demand-forecast/index.ts ? deployed ACTIVE (152 functions em prod) |
| `detect-churn-risk` | OK | supabase/functions/detect-churn-risk/index.ts ? deployed ACTIVE (152 functions em prod) |
| `detect-new-device` | OK | supabase/functions/detect-new-device/index.ts ? deployed ACTIVE (152 functions em prod) |
| `disc-analyzer` | OK | supabase/functions/disc-analyzer/index.ts ? deployed ACTIVE (152 functions em prod) |
| `dual-write-proxy` | OK | supabase/functions/dual-write-proxy/index.ts ? deployed ACTIVE (152 functions em prod) |
| `elevenlabs-scribe-token` | OK | supabase/functions/elevenlabs-scribe-token/index.ts ? deployed ACTIVE (152 functions em prod) |
| `elevenlabs-tts` | OK | supabase/functions/elevenlabs-tts/index.ts ? deployed ACTIVE (152 functions em prod) |
| `email-finder` | OK | supabase/functions/email-finder/index.ts ? deployed ACTIVE (152 functions em prod) |
| `email-pipeline-health` | OK | supabase/functions/email-pipeline-health/index.ts ? deployed ACTIVE (152 functions em prod) |
| `email-thread-summary` | OK | supabase/functions/email-thread-summary/index.ts ? deployed ACTIVE (152 functions em prod) |
| `email-verifier` | OK | supabase/functions/email-verifier/index.ts ? deployed ACTIVE (152 functions em prod) |
| `enrich-contacts` | OK | supabase/functions/enrich-contacts/index.ts ? deployed ACTIVE (152 functions em prod) |
| `enrichlayer-linkedin` | OK | supabase/functions/enrichlayer-linkedin/index.ts ? deployed ACTIVE (152 functions em prod) |
| `error-budget` | OK | supabase/functions/error-budget/index.ts ? deployed ACTIVE (152 functions em prod) |
| `evolution-api` | OK | supabase/functions/evolution-api/index.ts ? deployed ACTIVE (152 functions em prod) |
| `evolution-bitrix-connector` | OK | supabase/functions/evolution-bitrix-connector/index.ts ? deployed ACTIVE (152 functions em prod) |
| `evolution-webhook` | OK | supabase/functions/evolution-webhook/index.ts ? deployed ACTIVE (152 functions em prod) |
| `external-data` | OK | supabase/functions/external-data/index.ts ? deployed ACTIVE (152 functions em prod) |
| `ficha360-conversation-summary` | OK | supabase/functions/ficha360-conversation-summary/index.ts ? deployed ACTIVE (152 functions em prod) |
| `firecrawl-scrape` | OK | supabase/functions/firecrawl-scrape/index.ts ? deployed ACTIVE (152 functions em prod) |
| `forecast-analyzer` | OK | supabase/functions/forecast-analyzer/index.ts ? deployed ACTIVE (152 functions em prod) |
| `forecast-narrative` | OK | supabase/functions/forecast-narrative/index.ts ? deployed ACTIVE (152 functions em prod) |
| `forecast-snapshot-cron` | OK | supabase/functions/forecast-snapshot-cron/index.ts ? deployed ACTIVE (152 functions em prod) |
| `form-submit-handler` | OK | supabase/functions/form-submit-handler/index.ts ? deployed ACTIVE (152 functions em prod) |
| `generate-behavioral-profile` | OK | supabase/functions/generate-behavioral-profile/index.ts ? deployed ACTIVE (152 functions em prod) |
| `generate-insights` | OK | supabase/functions/generate-insights/index.ts ? deployed ACTIVE (152 functions em prod) |
| `generate-offer-suggestions` | OK | supabase/functions/generate-offer-suggestions/index.ts ? deployed ACTIVE (152 functions em prod) |
| `get-signature` | OK | supabase/functions/get-signature/index.ts ? deployed ACTIVE (152 functions em prod) |
| `health` | OK | supabase/functions/health/index.ts ? deployed ACTIVE (152 functions em prod) |
| `health-aggregate` | OK | supabase/functions/health-aggregate/index.ts ? deployed ACTIVE (152 functions em prod) |
| `incoming-webhook` | OK | supabase/functions/incoming-webhook/index.ts ? deployed ACTIVE (152 functions em prod) |
| `intent-aggregator` | OK | supabase/functions/intent-aggregator/index.ts ? deployed ACTIVE (152 functions em prod) |
| `intent-pixel-snippet` | OK | supabase/functions/intent-pixel-snippet/index.ts ? deployed ACTIVE (152 functions em prod) |
| `intent-tracker` | OK | supabase/functions/intent-tracker/index.ts ? deployed ACTIVE (152 functions em prod) |
| `lead-score-cron` | OK | supabase/functions/lead-score-cron/index.ts ? deployed ACTIVE (152 functions em prod) |
| `lead-score-threshold-runner` | OK | supabase/functions/lead-score-threshold-runner/index.ts ? deployed ACTIVE (152 functions em prod) |
| `lead-scorer` | OK | supabase/functions/lead-scorer/index.ts ? deployed ACTIVE (152 functions em prod) |
| `lux-trigger` | OK | supabase/functions/lux-trigger/index.ts ? deployed ACTIVE (152 functions em prod) |
| `lux-webhook` | OK | supabase/functions/lux-webhook/index.ts ? deployed ACTIVE (152 functions em prod) |
| `mcp-server` | OK | supabase/functions/mcp-server/index.ts ? deployed ACTIVE (152 functions em prod) |
| `meeting-summary` | OK | supabase/functions/meeting-summary/index.ts ? deployed ACTIVE (152 functions em prod) |
| `mql-evaluator` | OK | supabase/functions/mql-evaluator/index.ts ? deployed ACTIVE (152 functions em prod) |
| `next-best-action` | OK | supabase/functions/next-best-action/index.ts ? deployed ACTIVE (152 functions em prod) |
| `nurturing-runner` | OK | supabase/functions/nurturing-runner/index.ts ? deployed ACTIVE (152 functions em prod) |
| `objection-context-summary` | OK | supabase/functions/objection-context-summary/index.ts ? deployed ACTIVE (152 functions em prod) |
| `objection-handler` | OK | supabase/functions/objection-handler/index.ts ? deployed ACTIVE (152 functions em prod) |
| `phone-validator` | OK | supabase/functions/phone-validator/index.ts ? deployed ACTIVE (152 functions em prod) |
| `playbook-generator` | OK | supabase/functions/playbook-generator/index.ts ? deployed ACTIVE (152 functions em prod) |
| `playbook-recommender` | OK | supabase/functions/playbook-recommender/index.ts ? deployed ACTIVE (152 functions em prod) |
| `process-behavioral-regen-queue` | OK | supabase/functions/process-behavioral-regen-queue/index.ts ? deployed ACTIVE (152 functions em prod) |
| `process-webhook-dlq` | OK | supabase/functions/process-webhook-dlq/index.ts ? deployed ACTIVE (152 functions em prod) |
| `retry-behavioral-profile` | OK | supabase/functions/retry-behavioral-profile/index.ts ? deployed ACTIVE (152 functions em prod) |
| `revops-snapshot-builder` | OK | supabase/functions/revops-snapshot-builder/index.ts ? deployed ACTIVE (152 functions em prod) |
| `rfm-analyzer` | OK | supabase/functions/rfm-analyzer/index.ts ? deployed ACTIVE (152 functions em prod) |
| `semantic-search` | OK | supabase/functions/semantic-search/index.ts ? deployed ACTIVE (152 functions em prod) |
| `send-push-notification` | OK | supabase/functions/send-push-notification/index.ts ? deployed ACTIVE (152 functions em prod) |
| `send-sms-campaign` | OK | supabase/functions/send-sms-campaign/index.ts ? deployed ACTIVE (152 functions em prod) |
| `send-transactional-email` | OK | supabase/functions/send-transactional-email/index.ts ? deployed ACTIVE (152 functions em prod) |
| `sequence-processor` | OK | supabase/functions/sequence-processor/index.ts ? deployed ACTIVE (152 functions em prod) |
| `sequence-track` | OK | supabase/functions/sequence-track/index.ts ? deployed ACTIVE (152 functions em prod) |
| `smart-notify` | OK | supabase/functions/smart-notify/index.ts ? deployed ACTIVE (152 functions em prod) |
| `smart-reminders` | OK | supabase/functions/smart-reminders/index.ts ? deployed ACTIVE (152 functions em prod) |
| `social-behavior-analyzer` | OK | supabase/functions/social-behavior-analyzer/index.ts ? deployed ACTIVE (152 functions em prod) |
| `social-events-detector` | OK | supabase/functions/social-events-detector/index.ts ? deployed ACTIVE (152 functions em prod) |
| `social-profile-scraper` | OK | supabase/functions/social-profile-scraper/index.ts ? deployed ACTIVE (152 functions em prod) |
| `submit-signature` | OK | supabase/functions/submit-signature/index.ts ? deployed ACTIVE (152 functions em prod) |
| `suggest-next-action` | OK | supabase/functions/suggest-next-action/index.ts ? deployed ACTIVE (152 functions em prod) |
| `sync-social-interests` | OK | supabase/functions/sync-social-interests/index.ts ? deployed ACTIVE (152 functions em prod) |
| `system-health` | OK | supabase/functions/system-health/index.ts ? deployed ACTIVE (152 functions em prod) |
| `template-success-notifications` | OK | supabase/functions/template-success-notifications/index.ts ? deployed ACTIVE (152 functions em prod) |
| `territory-optimization` | OK | supabase/functions/territory-optimization/index.ts ? deployed ACTIVE (152 functions em prod) |
| `validate-access` | OK | supabase/functions/validate-access/index.ts ? deployed ACTIVE (152 functions em prod) |
| `validation-queue-worker` | OK | supabase/functions/validation-queue-worker/index.ts ? deployed ACTIVE (152 functions em prod) |
| `visual-search` | OK | supabase/functions/visual-search/index.ts ? deployed ACTIVE (152 functions em prod) |
| `voice-agent` | OK | supabase/functions/voice-agent/index.ts ? deployed ACTIVE (152 functions em prod) |
| `voice-ai-health` | OK | supabase/functions/voice-ai-health/index.ts ? deployed ACTIVE (152 functions em prod) |
| `voice-to-text` | OK | supabase/functions/voice-to-text/index.ts ? deployed ACTIVE (152 functions em prod) |
| `weekly-digest` | OK | supabase/functions/weekly-digest/index.ts ? deployed ACTIVE (152 functions em prod) |
| `whatsapp-import` | OK | supabase/functions/whatsapp-import/index.ts ? deployed ACTIVE (152 functions em prod) |
| `win-loss-analyzer` | OK | supabase/functions/win-loss-analyzer/index.ts ? deployed ACTIVE (152 functions em prod) |
| `win-loss-record-deal` | OK | supabase/functions/win-loss-record-deal/index.ts ? deployed ACTIVE (152 functions em prod) |

## 5. Workflows GitHub Actions

| Workflow | ?ltima execu??o no main | Status |
|---|---|---|
| CI (ci.yml) | 2026-11-13 22:52Z — run 43514562452 | OK — success (pós-merge #219, head f8312ef) |
| Automa??o local | 2026-11-13 12:01Z | OK ? success |
| Documenta??o sem drift | 2026-11-13 10:27Z | OK ? success |
| Estado real | 2026-11-13 10:27Z | OK ? success |
| Invent?rio semanal | 2026-11-13 11:02Z ? run 9 | OK ? success (abriu PRs sozinho ? prova ponta a ponta) |
| RLS exposure guard | 2026-11-12 02:18Z | OK ? success |
| monitoring-lint | 2026-11-10 23:05Z | OK ? success |
| Contexto (10min) | successos peri?dicos (ex.: 14:14Z, 13:37Z) | OK ? design: cron 10min com job ~20-30min, cancel-in-progress:false gera runs cancelled; runs que executam terminam success (documentado no pr?prio workflow) |
| cron-run-details-retention | run na PR pr?pria success 11/11 | OK ? one-off agendado |
| diag-db | ?ltima run success 08/10 (branch tempor?ria) | OK ? tempor?rio |
| drop-update-company-fields | run success na PR 10/11 | OK ? one-off |
| restore-drill | run success na PR 12/11 | OK |
| higiene-semanal | sem runs recentes | OK ? agendado semanal (segunda 08:41Z), comportamento esperado |
| copilot-reviewer / copilot-swe-agent / dependabot / codeql | din?micos/autom?ticos | OK ? managed |

## 6. Produ??o ? logs e deploy

| Item | Status | Prova |
|---|---|---|
| error_logs 10d (origem != localhost) | OK | 0 erros com URL n?o-localhost; todos os registros ErrorBoundary/render s?o de dev local (localhost:8080) |
| access_blocked_log 10d | OK | 0 |
| system_alerts abertos | OK | 0 alertas n?o-acknowledged |
| Cron ?ltimo 3 dias | OK | todos jobs succeeded; ?nica falha isolada mtta-auto-ack-heartbeat-watchdog (12/11 02:00Z) ? corrigida na PR #213 |
| Edge functions deploy | OK | 152 ACTIVE (send-push-notification v10, verificado via Management API) |

## 7. Sem perda / sem pela-metade

| Item | Status | Prova |
|---|---|---|
| TODO/FIXME/WIP em produ??o | OK | varredura limpa ? 11 hits eram "TODOS" em PT (falsos positivos) |
| @ts-ignore | OK | zero |
| Credenciais em c?digo | OK | zero hardcode ? todas via import.meta.env (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) |
| Fluxos incompletos (mock/handler vazio/rota n?o registrada) | OK | varredura sem achados de produ??o |

## 8. Corre??es desta sess?o

- **PR #213** (MERGED 13/11 ~21:00Z, autoriza??o do dono): migration `20261113154000` aplicada em prod via Management API em 13/11 21:09Z. `check_mtta_auto_ack_heartbeat` agora preenche `threshold_pct=150` e `consumed_pct=COALESCE(age_min,150)`. Evid?ncia: pg_get_functiondef retorna INSERT com as colunas; grantees = service_role, postgres (REVOKE ok); execu??o simulada (BEGIN/ROLLBACK) retornou OK. Deploy prod success (sha a8cca0e2).
- **PR #219** (MERGED 13/11 21:52Z): bump do doc para o head pós-merge #213 (`a8cca0e2` → `f8312ef`). CI main verde (run 43514562452 success, 22:52Z), deploy prod success, site respondendo 200.
- **Migration 20261027220000** ausente em prod (guard AUT-03 serialize_contact_relation_writes) ? BLOQUEADO, aguardando decis?o do dono (DDL produ??o).
- **Advisors de seguran?a**: endpoint REST inexistente (404) ? sem via API; conferir no dashboard.

## 9. PRs aguardando decis?o do dono

| PR | O que | Por que n?o mergeei |
|---|---|---|
| ~~#216~~ | bump doc p?s-merge #215 | MERGED 20:30Z ? CI main verde (run 43502215939), deploy prod success |
| ~~#214~~ | docs/prod-readiness.md (este invent?rio) | MERGED 16:28Z ? CI main verde (run 43463043781) |
| ~~#215~~ | bump doc após merge #214 (CI verde + deploy prod) | MERGED 18:52Z — CI main verde (run 43486880411), deploy prod success |

---
_Gerado por sess?o autopilot ? valida??o com evid?ncia real (sa?da de comando, query Management API, runs GitHub Actions)._
