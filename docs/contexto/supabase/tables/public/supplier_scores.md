# public.supplier_scores

> Score consolidado do fornecedor (0-100). Atualizado automaticamente a cada avaliação. 1 registro por fornecedor.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_supplier_by_state, public.vw_supplier_qualification_dashboard, public.vw_supplier_ranking |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `supplier_id` | `uuid` | não |  |  |  |
| 3 | `score_preco` | `numeric(5,2)` | sim |  |  |  |
| 4 | `score_prazo` | `numeric(5,2)` | sim |  |  |  |
| 5 | `score_qualidade` | `numeric(5,2)` | sim |  |  |  |
| 6 | `score_entrega` | `numeric(5,2)` | sim |  |  |  |
| 7 | `score_geral` | `numeric(5,2)` | sim |  |  |  |
| 8 | `previous_score` | `numeric(5,2)` | sim |  |  |  |
| 9 | `score_change` | `numeric(5,2)` | sim |  |  |  |
| 10 | `segment_code` | `text` | sim |  |  | FK para supplier_qualification_config. Define classificação. |
| 11 | `classificacao` | `text` | sim |  |  |  |
| 12 | `total_avaliacoes` | `integer` | não | `0` |  |  |
| 13 | `ultima_avaliacao` | `date` | sim |  |  |  |
| 14 | `trend` | `text` | sim |  |  | Tendência: melhorando (subiu >2pts), estavel, piorando (caiu >2pts). |
| 15 | `calculated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_score_entrega_range | CHECK | `CHECK (score_entrega >= 0::numeric AND score_entrega <= 100::numeric)` |  |  | sim |
| chk_score_geral_range | CHECK | `CHECK (score_geral >= 0::numeric AND score_geral <= 100::numeric)` |  |  | sim |
| chk_score_prazo_range | CHECK | `CHECK (score_prazo >= 0::numeric AND score_prazo <= 100::numeric)` |  |  | sim |
| chk_score_preco_range | CHECK | `CHECK (score_preco >= 0::numeric AND score_preco <= 100::numeric)` |  |  | sim |
| chk_score_qualidade_range | CHECK | `CHECK (score_qualidade >= 0::numeric AND score_qualidade <= 100::numeric)` |  |  | sim |
| supplier_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| supplier_scores_segment_code_fkey | FOREIGN KEY | `FOREIGN KEY (segment_code) REFERENCES supplier_qualification_config(segment_code)` | NO ACTION | NO ACTION | sim |
| supplier_scores_supplier_id_fkey | FOREIGN KEY | `FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| supplier_scores_supplier_id_key | UNIQUE | `UNIQUE (supplier_id)` |  |  | sim |
| supplier_scores_trend_check | CHECK | `CHECK (trend = ANY (ARRAY['melhorando'::text, 'estavel'::text, 'piorando'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_supplier_scores_score_geral | btree | score_geral | não | sim |  | `CREATE INDEX idx_supplier_scores_score_geral ON public.supplier_scores USING btree (score_geral DESC)` |
| idx_supplier_scores_segment_code | btree | segment_code | não | sim |  | `CREATE INDEX idx_supplier_scores_segment_code ON public.supplier_scores USING btree (segment_code)` |
| supplier_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX supplier_scores_pkey ON public.supplier_scores USING btree (id)` |
| supplier_scores_supplier_id_key | btree | supplier_id | sim | sim |  | `CREATE UNIQUE INDEX supplier_scores_supplier_id_key ON public.supplier_scores USING btree (supplier_id)` |


## Policies (RLS)

### `supplier_scores_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_scores.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_scores.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_supplier_scores_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
