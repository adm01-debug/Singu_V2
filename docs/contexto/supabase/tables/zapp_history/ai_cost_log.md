# zapp_history.ai_cost_log

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
| usada por views | zapp_history.v_daily_cost |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `bigint` | não | `nextval('zapp_history.ai_cost_log_id_seq'::regclass)` |  |  |
| 2 | `occurred_at` | `timestamp with time zone` | não | `now()` |  |  |
| 3 | `function_name` | `text` | não |  |  |  |
| 4 | `operation` | `text` | não |  |  |  |
| 5 | `provider` | `text` | não | `'openai'::text` |  |  |
| 6 | `model` | `text` | não |  |  |  |
| 7 | `input_tokens` | `integer` | sim |  |  |  |
| 8 | `output_tokens` | `integer` | sim |  |  |  |
| 9 | `total_tokens` | `integer` | sim |  |  |  |
| 10 | `duration_seconds` | `numeric(8,2)` | sim |  |  |  |
| 11 | `cost_cents` | `numeric(10,4)` | sim |  |  | Centavos USD. Multiplicar por 0.01 para USD. |
| 12 | `contact_id` | `uuid` | sim |  |  |  |
| 13 | `reference_id` | `uuid` | sim |  |  |  |
| 14 | `reference_type` | `text` | sim |  |  | summary \| message \| audio — qual tipo de entidade gerou este custo. |
| 15 | `success` | `boolean` | não | `true` |  |  |
| 16 | `error_message` | `text` | sim |  |  |  |
| 17 | `metadata` | `jsonb` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ai_cost_log_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| ai_cost_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_cost_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ai_cost_log_pkey ON zapp_history.ai_cost_log USING btree (id)` |
| idx_acl_occurred | btree | occurred_at | não | sim |  | `CREATE INDEX idx_acl_occurred ON zapp_history.ai_cost_log USING btree (occurred_at DESC)` |
| idx_ai_cost_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_ai_cost_contact ON zapp_history.ai_cost_log USING btree (contact_id)` |


## Policies (RLS)

### `acl_admin_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
