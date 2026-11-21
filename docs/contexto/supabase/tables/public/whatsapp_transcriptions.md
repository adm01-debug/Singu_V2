# public.whatsapp_transcriptions

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `whatsapp_message_id` | `uuid` | não |  |  |  |
| 3 | `content` | `text` | não |  |  |  |
| 4 | `provider` | `text` | sim | `'openai'::text` |  |  |
| 5 | `confidence` | `double precision` | sim |  |  |  |
| 6 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| whatsapp_transcriptions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| whatsapp_transcriptions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_transcriptions_pkey ON public.whatsapp_transcriptions USING btree (id)` |


## Policies (RLS)

### `Users can view transcriptions of their messages`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM whatsapp_messages m   WHERE ((m.id = whatsapp_transcriptions.whatsapp_message_id) AND (m.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
