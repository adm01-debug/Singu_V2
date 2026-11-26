# public.carrier_evaluations

> Avaliações de transportadoras (append-only). 5 critérios: pontualidade, conservação, preço_frete, rastreamento, cobertura. Notas 1-5.

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
| usada por views | public.vw_carrier_evaluations_history, public.vw_carrier_qualification_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `carrier_id` | `uuid` | não |  |  |  |
| 3 | `avaliador_id` | `integer` | não |  |  |  |
| 4 | `data_avaliacao` | `date` | não | `CURRENT_DATE` |  |  |
| 5 | `referencia` | `text` | sim |  |  |  |
| 6 | `nota_pontualidade` | `integer` | não |  |  | Entrega no prazo prometido. 1=sempre atrasa, 5=sempre pontual. Peso: 30% |
| 7 | `nota_conservacao` | `integer` | não |  |  | Mercadoria sem avarias/danos. 1=sempre danifica, 5=perfeito. Peso: 25% |
| 8 | `nota_preco_frete` | `integer` | não |  |  | Competitividade do preço. 1=muito caro, 5=melhor custo-benefício. Peso: 20% |
| 9 | `nota_rastreamento` | `integer` | não |  |  | Qualidade do rastreamento. 1=sem rastreio, 5=tempo real completo. Peso: 10% |
| 10 | `nota_cobertura` | `integer` | não |  |  | Abrangência geográfica. 1=muito restrita, 5=cobertura nacional. Peso: 15% |
| 11 | `nota_geral` | `numeric(4,2)` | sim | `((((((nota_pontualidade + nota_conservacao) + nota_preco_frete) + nota_rastreamento) + nota_cobertura))::numeric / 5.0)` | s |  |
| 12 | `comentario` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| carrier_evaluations_avaliador_id_fkey | FOREIGN KEY | `FOREIGN KEY (avaliador_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| carrier_evaluations_carrier_id_fkey | FOREIGN KEY | `FOREIGN KEY (carrier_id) REFERENCES carriers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| carrier_evaluations_nota_cobertura_check | CHECK | `CHECK (nota_cobertura >= 1 AND nota_cobertura <= 5)` |  |  | sim |
| carrier_evaluations_nota_conservacao_check | CHECK | `CHECK (nota_conservacao >= 1 AND nota_conservacao <= 5)` |  |  | sim |
| carrier_evaluations_nota_pontualidade_check | CHECK | `CHECK (nota_pontualidade >= 1 AND nota_pontualidade <= 5)` |  |  | sim |
| carrier_evaluations_nota_preco_frete_check | CHECK | `CHECK (nota_preco_frete >= 1 AND nota_preco_frete <= 5)` |  |  | sim |
| carrier_evaluations_nota_rastreamento_check | CHECK | `CHECK (nota_rastreamento >= 1 AND nota_rastreamento <= 5)` |  |  | sim |
| carrier_evaluations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| carrier_evaluations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX carrier_evaluations_pkey ON public.carrier_evaluations USING btree (id)` |
| idx_carrier_evaluations_avaliador_id | btree | avaliador_id | não | sim |  | `CREATE INDEX idx_carrier_evaluations_avaliador_id ON public.carrier_evaluations USING btree (avaliador_id)` |
| idx_carrier_evaluations_carrier_data | btree | carrier_id, data_avaliacao | não | sim |  | `CREATE INDEX idx_carrier_evaluations_carrier_data ON public.carrier_evaluations USING btree (carrier_id, data_avaliacao DESC)` |
| idx_carrier_evaluations_carrier_id | btree | carrier_id | não | sim |  | `CREATE INDEX idx_carrier_evaluations_carrier_id ON public.carrier_evaluations USING btree (carrier_id)` |
| idx_carrier_evaluations_data | btree | data_avaliacao | não | sim |  | `CREATE INDEX idx_carrier_evaluations_data ON public.carrier_evaluations USING btree (data_avaliacao DESC)` |


## Policies (RLS)

### `carrier_evaluations_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_evaluations.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_evaluations.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |

### `carrier_evaluations_select_admin`

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
| trg_carrier_evaluation_recalc_score | AFTER | INSERT | ROW | enabled | public.trg_fn_carrier_recalc_score_after_evaluation |
| trg_prevent_carrier_evaluation_update | BEFORE | UPDATE | ROW | enabled | public.trg_fn_prevent_carrier_evaluation_update |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
