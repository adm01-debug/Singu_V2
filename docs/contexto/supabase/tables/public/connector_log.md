# public.connector_log

> Log de integrações WhatsApp/Bitrix (auditoria)

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
| usada por views | zapp_history.v_dashboard_atendimento |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `bigint` | não | `nextval('connector_log_id_seq'::regclass)` |  |  |
| 2 | `direction` | `text` | não |  |  |  |
| 3 | `whatsapp_number` | `text` | sim |  |  |  |
| 4 | `push_name` | `text` | sim |  |  |  |
| 5 | `message_text` | `text` | sim |  |  |  |
| 6 | `bitrix_response` | `jsonb` | sim |  |  |  |
| 7 | `evolution_response` | `jsonb` | sim |  |  |  |
| 8 | `raw_payload` | `jsonb` | sim |  |  |  |
| 9 | `processed` | `boolean` | não | `false` |  |  |
| 10 | `zapp_message_id` | `uuid` | sim |  |  |  |
| 11 | `parse_error` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `effective_payload` | `jsonb` | sim | `COALESCE(raw_payload, bitrix_response, evolution_response, '{}'::jsonb)` | s | GENERATED column: usa raw_payload se presente, senão fallback para bitrix_response/evolution_response. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| connector_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| connector_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX connector_log_pkey ON public.connector_log USING btree (id)` |
| idx_cl_created | btree | created_at | não | sim |  | `CREATE INDEX idx_cl_created ON public.connector_log USING btree (created_at DESC)` |
| idx_cl_phone | btree | whatsapp_number, created_at | não | sim |  | `CREATE INDEX idx_cl_phone ON public.connector_log USING btree (whatsapp_number, created_at DESC)` |


## Policies (RLS)

### `cl_admin_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_dedup_connector_log | BEFORE | INSERT | ROW | enabled | zapp_history.trg_connector_log_dedup |
| trg_parse_connector_log | AFTER | INSERT OR UPDATE | ROW | enabled | zapp_history.parse_connector_log_to_messages |
| trg_rate_limit_connector_log | BEFORE | INSERT | ROW | enabled | zapp_history.trg_connector_log_rate_limit |
| trg_validate_secret_connector_log | BEFORE | INSERT | ROW | enabled | zapp_history.trg_connector_log_validate_secret |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
