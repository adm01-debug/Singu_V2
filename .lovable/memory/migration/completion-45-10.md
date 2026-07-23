---
name: Rodada 45/10 — Global Least Privilege for anon
description: Sweep de REVOKE ALL em anon nas 250+ tabelas de public.*, mantendo grants cirúrgicos apenas em 12 tabelas com endpoints públicos legítimos. Corrige herança CRUD do template Supabase.
type: feature
---

## Contexto
Auditoria via `pg_class.relacl` mostrou que TODAS as tabelas de `public.*` concediam
`INSERT/UPDATE/DELETE/SELECT/TRUNCATE/REFERENCES/TRIGGER` a `anon`, herdado do
template Supabase (`ALTER DEFAULT PRIVILEGES` no schema public). RLS protegia
efetivamente os dados, mas a superfície era massiva — qualquer nova tabela sem
RLS explícito ou policy mal escrita ficaria imediatamente exposta.

## Ações
- Sweep programático via `DO $$ ... EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', ...) $$`.
- Re-GRANTs cirúrgicos em 12 tabelas com endpoints públicos legítimos:
  `csat_surveys`, `deal_room_activities`, `deal_room_comments`,
  `deal_room_documents`, `deal_room_milestones`, `deal_room_stakeholders`,
  `deal_rooms`, `document_signatures`, `forms`, `landing_pages`,
  `landing_page_submissions`, `lead_magnets`.
- Column-level grants para contadores de view (`buyer_view_count`,
  `last_buyer_view_at`, `view_count`, `download_count`).
- Sweep análogo em SEQUENCES de public.

## Verificação
- Query pós-migração: 12 tabelas com grants a anon (esperado).
- Novo teste automatizado: `tests/rls/anon_global_least_privilege.sql`.
- Baseline do backend linter mantém-se em **12 WARN**.

## Débito remanescente
- `ALTER DEFAULT PRIVILEGES FOR ROLE postgres|supabase_admin IN SCHEMA public REVOKE ALL ON TABLES FROM anon` requer privilégio de `supabase_admin` (indisponível ao migrator). Documentado como follow-up de runbook.
- Novas tabelas ainda nascem com grants a anon por herança — mitigado pelo teste automatizado que falhará no CI se a lista de 12 mudar sem revisão.