---
name: Marketing Automation Suite
description: Hub /marketing finalizado — Forms builder + routing, Lead Magnets, Nurturing runner (cron 5min), MQL→SQL classification (cron diário 03:00 UTC), Multi-touch Attribution (first/last/linear/U/W/time-decay) e aba Touchpoints no contato
type: feature
---
- Tabelas: `forms` + `form_submissions` (slug único, fields jsonb, routing_rules round-robin, RLS público read+insert), `lead_magnets` + `lead_magnet_downloads`, `mql_criteria` + `mql_classifications`, `attribution_touchpoints` + `attribution_models_cache`, `nurturing_executions`
- RPCs SECURITY DEFINER: `submit_public_form`, `increment_form_view`, `track_magnet_download`, `increment_magnet_view`, `compute_attribution`, `evaluate_mql`, `enroll_contact_in_workflow`
- Edge Functions: `form-submit-handler` (público, service role), `nurturing-runner` (cron `*/5 * * * *` job `marketing-nurturing-runner`), `mql-evaluator` (cron `0 3 * * *` job `marketing-mql-evaluator`), `attribution-calculator` (on-demand auth)
- Hooks: `useForms` + `useForm` + `useFormSubmissions`, `useLeadMagnets` + `useMagnetDownloads`, `useMQLCriteria` + `useMQLClassifications` + `useEvaluateMQL` + `useHandoffMQL`, `useTouchpoints` + `useAttribution` + `useRecordTouchpoint`, `useNurturingExecutions` + `useEnrollContact` + `useRunNurturing`
- Páginas: `/marketing` (hub 5 tabs), `/marketing/forms/:id`, `/marketing/lead-magnets/:id`, `/f/:slug` e `/lm/:slug` (públicas, fora do RequireAuth) — todas registradas em `App.tsx`
- Componentes: `FormBuilder`, `PublicFormRenderer`, `AttributionBreakdownChart`, `ContactTouchpointsTab` (timeline + badge MQL/SQL na aba Touchpoints de `ContatoDetalhe`)
- Sidebar: item "Marketing" (ícone Megaphone) na seção Análise
- Routing: round-robin entre members do `routing_rules.members[]` baseado em `submission_count % len`
- Attribution models: first/last/linear/u_shape/w_shape/time_decay calculados em SQL puro com cache em `attribution_models_cache`
- Touchpoints automáticos: forms e magnets gravam touchpoint via RPC; sequences usam trigger existente
