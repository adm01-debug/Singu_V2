# public.sales

> Registro simplificado de venda/atividade comercial legado, com nome de cliente e produto como snapshots textuais, valor e estado do ciclo comercial. Não confundir com public.deals, que é a entidade de oportunidade vinculada a company/contact. PK: id; salesperson_id → public.salespeople.id; deleted_by → auth.users.id.

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID da venda e chave primária; gerado por gen_random_uuid(). |
| 2 | `client_name` | `text` | não |  |  | Nome textual do cliente armazenado no registro da venda; não é chave estrangeira nem prova de correspondência com public.clients. |
| 3 | `product_name` | `text` | não |  |  | Nome textual do produto associado à venda; não possui FK para public.products. |
| 4 | `amount` | `numeric(12,2)` | não |  |  | Valor numérico da venda. A moeda e a unidade (reais ou centavos) não estão declaradas no schema; validar a origem antes de somar ou converter. |
| 5 | `status` | `text` | não | `'pending'::text` |  | Estado da oportunidade/venda: completed, pending, cancelled, negotiation, proposal, qualification, discovery ou lead. DEFAULT pending. Esses estados não equivalem necessariamente aos de public.deals.status. |
| 6 | `category` | `text` | não | `'subscription'::text` |  | Categoria da venda: subscription, service, project ou other. DEFAULT subscription. |
| 7 | `salesperson_id` | `uuid` | sim |  |  | Vendedor associado à venda; FK para public.salespeople.id. |
| 8 | `source` | `text` | sim | `'other'::text` |  | Origem textual da venda; DEFAULT other. Valores além do default não estão enumerados no schema. |
| 9 | `deleted_at` | `timestamp with time zone` | sim |  |  | Data e hora da exclusão lógica do registro; NULL indica ausência de marca temporal de exclusão. |
| 10 | `deleted_by` | `uuid` | sim |  |  | UUID do usuário que registrou a exclusão lógica; FK para auth.users.id. |
| 11 | `delete_reason` | `text` | sim |  |  | Motivo textual da exclusão lógica. |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Data e hora de criação do registro; timestamptz, DEFAULT now(). |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Data e hora da última atualização registrada; timestamptz, DEFAULT now(). |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_category_check | CHECK | `CHECK (category = ANY (ARRAY['subscription'::text, 'service'::text, 'project'::text, 'other'::text]))` |  |  | sim |
| sales_deleted_by_fkey | FOREIGN KEY | `FOREIGN KEY (deleted_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| sales_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |
| sales_status_check | CHECK | `CHECK (status = ANY (ARRAY['completed'::text, 'pending'::text, 'cancelled'::text, 'negotiation'::text, 'proposal'::text, 'qualification'::text, 'discovery'::text, 'lead'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.deal_chat_history | deal_chat_history_deal_id_fkey | deal_id | CASCADE |
| _dormant.deal_outcomes | deal_outcomes_sale_id_fkey | sale_id | CASCADE |
| _dormant.deal_stage_history | deal_stage_history_sale_id_fkey | sale_id | CASCADE |
| _dormant.lead_scores | lead_scores_sale_id_fkey | sale_id | CASCADE |
| _dormant.playbook_progress | playbook_progress_sale_id_fkey | sale_id | CASCADE |
| _dormant.prospect_cadences | prospect_cadences_sale_id_fkey | sale_id | CASCADE |
| public.sales_activities | sales_activities_sale_id_fkey | sale_id | CASCADE |
| public.sales_tasks | sales_tasks_sale_id_fkey | sale_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sales_created | btree | created_at | não | sim |  | `CREATE INDEX idx_sales_created ON public.sales USING btree (created_at DESC)` |
| idx_sales_deleted_by | btree | deleted_by | não | sim |  | `CREATE INDEX idx_sales_deleted_by ON public.sales USING btree (deleted_by)` |
| idx_sales_salesperson_id | btree | salesperson_id | não | sim |  | `CREATE INDEX idx_sales_salesperson_id ON public.sales USING btree (salesperson_id)` |
| sales_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (id)` |


## Policies (RLS)

### `legacy_sales_owner`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM salespeople sp   WHERE ((sp.id = sales.salesperson_id) AND (sp.auth_user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |

### `legacy_sales_service`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| update_sales_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
