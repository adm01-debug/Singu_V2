# public.conversation_topics_catalog

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `topic_key` | `text` | não |  |  |  |
| 4 | `label` | `text` | não |  |  |  |
| 5 | `category` | `text` | não |  |  |  |
| 6 | `keywords` | `text[]` | não | `'{}'::text[]` |  |  |
| 7 | `active` | `boolean` | não | `true` |  |  |
| 8 | `sort_order` | `integer` | não | `0` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conversation_topics_catalog_category_check | CHECK | `CHECK (category = ANY (ARRAY['product'::text, 'pricing'::text, 'competition'::text, 'objection'::text, 'closing'::text, 'discovery'::text, 'other'::text]))` |  |  | sim |
| conversation_topics_catalog_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conversation_topics_catalog_user_id_topic_key_key | UNIQUE | `UNIQUE (user_id, topic_key)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conversation_topics_catalog_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conversation_topics_catalog_pkey ON public.conversation_topics_catalog USING btree (id)` |
| conversation_topics_catalog_user_id_topic_key_key | btree | user_id, topic_key | sim | sim |  | `CREATE UNIQUE INDEX conversation_topics_catalog_user_id_topic_key_key ON public.conversation_topics_catalog USING btree (user_id, topic_key)` |
| idx_conv_topics_user | btree | user_id, active, category | não | sim |  | `CREATE INDEX idx_conv_topics_user ON public.conversation_topics_catalog USING btree (user_id, active, category)` |


## Policies (RLS)

### `conv_topics_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `conv_topics_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `conv_topics_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `conv_topics_update_own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_conv_topics_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
