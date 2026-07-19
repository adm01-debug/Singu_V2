# 🗄️ Achados — Banco de Dados & Migrations

> Escopo: `supabase/migrations/` (262 `.sql`), `supabase/functions/*`, `src/integrations/supabase/types.ts`. Foco em correção de dados/schema. RLS avaliado só quanto a *cobertura* (profundidade em `01_ACHADOS_SEGURANCA.md`).
> Nota metodológica: auditoria por grep/leitura sobre os `.sql` + `types.ts`; schema **não** foi executado num banco. Contagens de FK-sem-ON-DELETE e índices redundantes são heurísticas (regex) — confirmar os achados BD-3/5/8 com `get_advisors`.

## Números concretos (verificados)

| Métrica | Valor |
|---|---|
| Migrations | **262** (doc: "~50" → discrepância 5×) |
| Timestamps duplicados/fora de ordem | **0** ✅ |
| Tabelas base (`public.`) | **258** distintas (294 `CREATE TABLE` com recriações) |
| Tabelas com `ENABLE ROW LEVEL SECURITY` | **257 / 258** |
| Tabelas RLS-on com **zero** policies | **0** ✅ (sem deny-all acidental) |
| `CREATE POLICY` | **769** |
| `CREATE INDEX` | **391** |
| FK `REFERENCES` | **310** (com `ON DELETE` explícito ~258) |
| `SECURITY DEFINER` funcs | **82**; sem `SET search_path` → **10** |
| `CREATE TRIGGER` | **185** |
| `timestamptz` vs `timestamp` sem tz | **596 vs 0** ✅ |
| Colunas JSONB (~360) com CHECK de validação | **0** |
| `CREATE TABLE IF NOT EXISTS` | 85 / 294 |

---

## Achados

### [ALTA] BD-1. `DROP TABLE public.deals CASCADE` sem recriação na mesma migration
`20260317213904_b7db91ad...sql:1` — conteúdo integral: `DROP TABLE IF EXISTS public.deals CASCADE;`. `deals` foi criada em `20260317213221` e **dropada 13 min depois** em migration separada, sem recriação; só recriada ~2 meses depois em `20260512184042`. `CASCADE` derruba FKs/triggers/views dependentes. Em qualquer replay há janela sem `deals`, e migrations intermediárias (`20260416180426`, `20260417105530`) a referenciam → risco de falha de ordenação. Histórico contraditório (create→drop→recreate).

### [MÉDIA] BD-2. Drift schema↔código: `social_insights` NÃO existe mas é consultada → fallback com dados falsos
`src/hooks/useSocialInsights.ts:44` faz `.from('social_insights')`; a tabela não existe em nenhuma migration nem em `types.ts`. O código admite (linha 5: "Escape hatch: social_insights may not exist") e usa cast `supabase as unknown as ...`. No `catch` (51-52) retorna **dados mockados hardcoded** ("Recém promovida a Diretora de Operações"...). Feature sempre falha em silêncio e exibe dados fictícios como reais. (Foi a **única** divergência entre os 222 nomes em `.from()` e o schema.)

### [MÉDIA] BD-3. 10 funções `SECURITY DEFINER` sem `SET search_path`
`move_deal_atomic` (`20260513164309`, `20260513165148`), `record_family_history` (`20260509152256`, `20260509154007`), `calculate_next_contact_due`/`sync_contact_last_interaction` (`20260511185111`), `calculate_interaction_response_time` (`20260511185450`), `search_contacts_by_nlp` (`20260511190940`), `trigger_aggregate_nlp_to_company` (`20260511191129`), `update_deal_amount` (`20260513143442`). Sem `search_path` fixo, um schema malicioso no `search_path` do caller pode sequestrar chamadas não-qualificadas ("Function Search Path Mutable" do linter Supabase). Os outros 72 fazem certo (`SET search_path = public, pg_temp`).

### [MÉDIA] BD-4. Migrations não-idempotentes — replay quebra
Só **85/294** `CREATE TABLE` usam `IF NOT EXISTS`; **141 arquivos** têm `CREATE POLICY` sem `DROP POLICY IF EXISTS`; **65 arquivos** têm `CREATE TRIGGER` sem `DROP TRIGGER` prévio. Como policy/trigger não suportam `IF NOT EXISTS`, re-executar a chain (`supabase db reset`, ambiente novo, CI) aborta com "already exists". Frágil para reprovisionamento.

### [MÉDIA] BD-5. Sem índice em `contacts.email` — coluna de busca/dedup com seq scan
Nenhuma migration cria índice em `contacts(email)` ou `companies(email)`. Há em `contacts(phone)`/`contacts(whatsapp)` (`20260509174024`), mas não em `email`. `contacts` é a tabela mais consultada (73 usos de `.from('contacts')`); busca/dedup por e-mail faz varredura sequencial.

### [MÉDIA] BD-6. Ausência total de unicidade de e-mail — contatos/empresas duplicáveis
0 constraints `UNIQUE(email)` ou `UNIQUE(user_id,email)` em qualquer migration. Nada impede o mesmo contato/empresa ser inserido N vezes; dedup depende inteiramente da aplicação.

### [BAIXA-MÉDIA] BD-7. FKs sem `ON DELETE` → deleção bloqueada (NO ACTION)
~17 FKs inline sem `ON DELETE` (default NO ACTION): 12 → `auth.users(id)`, 3 → `contacts(id)`, 2 → `interactions(id)`. Ex.: `20260511200945:19-20`, `20260509182655:36`. Inconsistente com as tabelas core (que usam CASCADE/SET NULL corretamente); bloqueia deleção do pai. Tabelas core (`contacts`/`companies`/`interactions`) estão **corretas**.

### [BAIXA] BD-8. Índices redundantes candidatos
`system_health_snapshots(timestamp desc)` ×2; `neuro_behavioral_history(contact_id)` ×2; `system_alerts(alert_type,created_at desc)` ×3; `behavioral_profile_regen_queue(updated_at desc)` ×2; `idx_interactions_contact_id` redundante com `idx_interactions_contact_id_created`. Overhead de escrita/armazenamento. (Confirmar predicados `WHERE` parciais antes de dropar.)

### [BAIXA] BD-9. JSONB sem validação estrutural
~360 colunas JSONB (`contacts.behavior`, `life_events`, `emotion_analysis`, `vak_profile`...), **0** com `CHECK (jsonb_typeof/json_matches_schema)`. Sem garantia de shape; leitores que assumem campos podem quebrar.

### [BAIXA] BD-10. Inconsistência de precisão monetária
23 colunas monetárias como `NUMERIC` sem precisão (`value`, `price`, `target_revenue`, `arr`, `forecasted_amount`...), enquanto `deals` recriada usa `NUMERIC(15,2)`. Sem perda de dados, mas inconsistente; correção da `deals` não propagada.

### [INFORMATIVO] BD-11. `audit_log` recriada com DROP CASCADE (particionamento)
`20260711152812:6` — `DROP TABLE IF EXISTS public.audit_log CASCADE` para reconstruir particionada por RANGE. Comentário afirma "estava vazia; sem dataloss" — correto **se** realmente vazia em prod, mas é suposição não verificável (destrói trilha pré-existente).

---

## O que está BOM

1. **Timestamps 100% timezone-aware** (596 `timestamptz`, 0 sem tz). ✅
2. **Cobertura de RLS ~100%** (257/258; nenhuma tabela RLS-on sem policy). A alegação "RLS 100%" **se confirma em cobertura** (profundidade das `USING` é do outro agente — notado ≥1 `USING (true)` público em `pipeline_stage_transitions`).
3. **Tabelas core bem modeladas** (`20260109144944`): PKs UUID, FKs com CASCADE/SET NULL, CHECK em enums-texto, ranges validados (`relationship_score 0..100`), índices em `user_id`/`company_id`/`contact_id`/`created_at`.
4. **Sem timestamps duplicados**; ordem cronológica consistente.
5. **Módulos "proibidos" (ERP) respeitados**: nenhuma tabela `produtos`/`propostas`/`products`/`proposals`. `useContactProposals`/`useErpData`/`ErpViewer` acessam via `external-data`. Única local é `search_products_cache` — legitimamente cache.
6. **types.ts sincronizado** (0 tabelas de migration ausentes; 19 "divergências" são views/partições).
7. **Trigger de auditoria consistente** (`audit_trigger_fn` SECURITY DEFINER **com** search_path) em 15 tabelas, todas com `user_id`; sem `EXCEPTION WHEN OTHERS` (não falha em silêncio).
8. **116 triggers `BEFORE UPDATE`** para `updated_at`.
