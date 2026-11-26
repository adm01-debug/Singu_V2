# public.carrier_scores

> Score consolidado de transportadoras (1 registro por carrier). Recalculado via trigger após cada avaliação.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_carrier_by_state, public.vw_carrier_qualification_dashboard, public.vw_carrier_ranking, public.vw_carriers, public.vw_carriers_completo |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `carrier_id` | `uuid` | não |  |  |  |
| 3 | `score_pontualidade` | `numeric(5,2)` | sim |  |  |  |
| 4 | `score_conservacao` | `numeric(5,2)` | sim |  |  |  |
| 5 | `score_preco_frete` | `numeric(5,2)` | sim |  |  |  |
| 6 | `score_rastreamento` | `numeric(5,2)` | sim |  |  |  |
| 7 | `score_cobertura` | `numeric(5,2)` | sim |  |  |  |
| 8 | `score_geral` | `numeric(5,2)` | sim |  |  |  |
| 9 | `previous_score` | `numeric(5,2)` | sim |  |  |  |
| 10 | `score_change` | `numeric(5,2)` | sim |  |  |  |
| 11 | `segment_code` | `text` | sim |  |  |  |
| 12 | `classificacao` | `text` | sim |  |  |  |
| 13 | `total_avaliacoes` | `integer` | não | `0` |  |  |
| 14 | `ultima_avaliacao` | `date` | sim |  |  |  |
| 15 | `trend` | `text` | sim |  |  |  |
| 16 | `calculated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| carrier_scores_carrier_id_fkey | FOREIGN KEY | `FOREIGN KEY (carrier_id) REFERENCES carriers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| carrier_scores_carrier_id_key | UNIQUE | `UNIQUE (carrier_id)` |  |  | sim |
| carrier_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| carrier_scores_score_cobertura_check | CHECK | `CHECK (score_cobertura >= 0::numeric AND score_cobertura <= 100::numeric)` |  |  | sim |
| carrier_scores_score_conservacao_check | CHECK | `CHECK (score_conservacao >= 0::numeric AND score_conservacao <= 100::numeric)` |  |  | sim |
| carrier_scores_score_geral_check | CHECK | `CHECK (score_geral >= 0::numeric AND score_geral <= 100::numeric)` |  |  | sim |
| carrier_scores_score_pontualidade_check | CHECK | `CHECK (score_pontualidade >= 0::numeric AND score_pontualidade <= 100::numeric)` |  |  | sim |
| carrier_scores_score_preco_frete_check | CHECK | `CHECK (score_preco_frete >= 0::numeric AND score_preco_frete <= 100::numeric)` |  |  | sim |
| carrier_scores_score_rastreamento_check | CHECK | `CHECK (score_rastreamento >= 0::numeric AND score_rastreamento <= 100::numeric)` |  |  | sim |
| carrier_scores_segment_code_fkey | FOREIGN KEY | `FOREIGN KEY (segment_code) REFERENCES carrier_qualification_config(segment_code)` | NO ACTION | NO ACTION | sim |
| carrier_scores_trend_check | CHECK | `CHECK (trend = ANY (ARRAY['melhorando'::text, 'estavel'::text, 'piorando'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| carrier_scores_carrier_id_key | btree | carrier_id | sim | sim |  | `CREATE UNIQUE INDEX carrier_scores_carrier_id_key ON public.carrier_scores USING btree (carrier_id)` |
| carrier_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX carrier_scores_pkey ON public.carrier_scores USING btree (id)` |
| idx_carrier_scores_score_geral | btree | score_geral | não | sim |  | `CREATE INDEX idx_carrier_scores_score_geral ON public.carrier_scores USING btree (score_geral DESC)` |
| idx_carrier_scores_segment | btree | segment_code | não | sim |  | `CREATE INDEX idx_carrier_scores_segment ON public.carrier_scores USING btree (segment_code)` |


## Policies (RLS)

### `carrier_scores_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_scores.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_scores.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |

### `carrier_scores_select_admin`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_carrier_scores_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
