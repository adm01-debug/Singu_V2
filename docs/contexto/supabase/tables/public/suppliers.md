# public.suppliers

> Fornecedores vinculados a companies (1:1 via company_id UNIQUE). Campos de qualificação: homologado, data_homologacao, score_geral (caches atualizados por triggers). Homologação: Compras (Thaina id=30, Elen id=31, Stephanie id=32). 4 critérios: preço(25%), prazo(25%), qualidade(30%), entrega(20%).

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
| usada por views | public.vw_supplier_alerts, public.vw_supplier_by_state, public.vw_supplier_data_quality, public.vw_supplier_evaluations_history, public.vw_supplier_homologation_control, public.vw_supplier_homologation_queue, public.vw_supplier_qualification_dashboard, public.vw_supplier_ranking |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `company_id` | `uuid` | não |  |  |  |
| 3 | `categoria` | `text` | sim |  |  |  |
| 4 | `tipo_fornecedor` | `text` | sim |  |  |  |
| 5 | `ramo_atividade` | `text` | sim |  |  |  |
| 6 | `grupo_economico` | `text` | sim |  |  |  |
| 7 | `produtos` | `text[]` | sim |  |  |  |
| 8 | `servicos` | `text[]` | sim |  |  |  |
| 9 | `api_url` | `text` | sim |  |  |  |
| 10 | `tem_integracao` | `boolean` | sim | `false` |  |  |
| 11 | `perfil_preco` | `text` | sim |  |  |  |
| 12 | `perfil_qualidade` | `text` | sim |  |  |  |
| 13 | `perfil_prazo` | `text` | sim |  |  |  |
| 14 | `prazo_entrega_medio` | `integer` | sim |  |  |  |
| 15 | `pedido_minimo` | `numeric(12,2)` | sim |  |  |  |
| 16 | `forma_pagamento` | `text` | sim |  |  |  |
| 17 | `prazo_pagamento` | `text` | sim |  |  |  |
| 18 | `spa_data` | `jsonb` | sim |  |  |  |
| 19 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 21 | `homologado` | `boolean` | não | `false` |  | Cache: true se última homologação está vigente. Atualizado por trigger. |
| 22 | `data_homologacao` | `date` | sim |  |  | Data da última homologação aprovada. |
| 23 | `score_geral` | `numeric(5,2)` | sim |  |  | Cache: score consolidado 0-100. Atualizado por trigger após avaliação. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_suppliers_score_range | CHECK | `CHECK (score_geral IS NULL OR score_geral >= 0::numeric AND score_geral <= 100::numeric)` |  |  | sim |
| suppliers_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| suppliers_company_id_key | UNIQUE | `UNIQUE (company_id)` |  |  | sim |
| suppliers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.price_alerts | price_alerts_supplier_id_fkey | supplier_id | CASCADE |
| _dormant.price_history | price_history_supplier_id_fkey | supplier_id | CASCADE |
| _dormant.supplier_orders | supplier_orders_supplier_id_fkey | supplier_id | CASCADE |
| _dormant.supplier_products | supplier_products_supplier_id_fkey | supplier_id | CASCADE |
| _dormant.supplier_risk_assessments | supplier_risk_assessments_supplier_id_fkey | supplier_id | CASCADE |
| public.product_novelties | product_novelties_supplier_id_fkey | supplier_id | SET NULL |
| public.supplier_evaluations | supplier_evaluations_supplier_id_fkey | supplier_id | CASCADE |
| public.supplier_homologations | supplier_homologations_supplier_id_fkey | supplier_id | CASCADE |
| public.supplier_score_history | supplier_score_history_supplier_id_fkey | supplier_id | CASCADE |
| public.supplier_scores | supplier_scores_supplier_id_fkey | supplier_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_suppliers_homologado | btree | homologado | não | sim |  | `CREATE INDEX idx_suppliers_homologado ON public.suppliers USING btree (homologado)` |
| idx_suppliers_homologado_score | btree | homologado, score_geral | não | sim |  | `CREATE INDEX idx_suppliers_homologado_score ON public.suppliers USING btree (homologado, score_geral DESC NULLS LAST)` |
| idx_suppliers_score_geral | btree | score_geral | não | sim |  | `CREATE INDEX idx_suppliers_score_geral ON public.suppliers USING btree (score_geral DESC NULLS LAST)` |
| suppliers_company_id_key | btree | company_id | sim | sim |  | `CREATE UNIQUE INDEX suppliers_company_id_key ON public.suppliers USING btree (company_id)` |
| suppliers_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX suppliers_pkey ON public.suppliers USING btree (id)` |


## Policies (RLS)

### `suppliers_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = suppliers.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = suppliers.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_suppliers_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
