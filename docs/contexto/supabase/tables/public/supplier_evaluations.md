# public.supplier_evaluations

> Avaliações de fornecedores por entrega ou período. Notas de 1-5 em 4 critérios. Trigger recalcula score automaticamente.

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
| usada por views | public.vw_supplier_evaluations_history, public.vw_supplier_qualification_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `supplier_id` | `uuid` | não |  |  |  |
| 3 | `avaliador_id` | `integer` | não |  |  |  |
| 4 | `data_avaliacao` | `date` | não | `CURRENT_DATE` |  |  |
| 5 | `referencia` | `text` | sim |  |  |  |
| 6 | `nota_preco` | `integer` | não |  |  |  |
| 7 | `nota_prazo` | `integer` | não |  |  |  |
| 8 | `nota_qualidade` | `integer` | não |  |  |  |
| 9 | `nota_entrega` | `integer` | não |  |  |  |
| 10 | `nota_geral` | `numeric(4,2)` | sim | `(((((nota_preco + nota_prazo) + nota_qualidade) + nota_entrega))::numeric / 4.0)` | s | Média simples das 4 notas. Campo GENERATED (calculado automaticamente). |
| 11 | `comentario` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| supplier_evaluations_avaliador_id_fkey | FOREIGN KEY | `FOREIGN KEY (avaliador_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| supplier_evaluations_nota_entrega_check | CHECK | `CHECK (nota_entrega >= 1 AND nota_entrega <= 5)` |  |  | sim |
| supplier_evaluations_nota_prazo_check | CHECK | `CHECK (nota_prazo >= 1 AND nota_prazo <= 5)` |  |  | sim |
| supplier_evaluations_nota_preco_check | CHECK | `CHECK (nota_preco >= 1 AND nota_preco <= 5)` |  |  | sim |
| supplier_evaluations_nota_qualidade_check | CHECK | `CHECK (nota_qualidade >= 1 AND nota_qualidade <= 5)` |  |  | sim |
| supplier_evaluations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| supplier_evaluations_supplier_id_fkey | FOREIGN KEY | `FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_supplier_evaluations_avaliador_id | btree | avaliador_id | não | sim |  | `CREATE INDEX idx_supplier_evaluations_avaliador_id ON public.supplier_evaluations USING btree (avaliador_id)` |
| idx_supplier_evaluations_data | btree | data_avaliacao | não | sim |  | `CREATE INDEX idx_supplier_evaluations_data ON public.supplier_evaluations USING btree (data_avaliacao DESC)` |
| idx_supplier_evaluations_supplier_data | btree | supplier_id, data_avaliacao | não | sim |  | `CREATE INDEX idx_supplier_evaluations_supplier_data ON public.supplier_evaluations USING btree (supplier_id, data_avaliacao DESC)` |
| idx_supplier_evaluations_supplier_id | btree | supplier_id | não | sim |  | `CREATE INDEX idx_supplier_evaluations_supplier_id ON public.supplier_evaluations USING btree (supplier_id)` |
| supplier_evaluations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX supplier_evaluations_pkey ON public.supplier_evaluations USING btree (id)` |


## Policies (RLS)

### `supplier_evaluations_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_evaluations.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_evaluations.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |

### `supplier_evaluations_select_admin`

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
| trg_prevent_evaluation_update | BEFORE | UPDATE | ROW | enabled | public.trg_fn_prevent_evaluation_update |
| trg_supplier_evaluation_recalc_score | AFTER | INSERT | ROW | enabled | public.trg_fn_recalc_score_after_evaluation |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
