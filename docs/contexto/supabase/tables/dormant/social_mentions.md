# _dormant.social_mentions

> SINGU: Registro de quando um contato menciona outro

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `mentioner_contact_id` | `uuid` | não |  |  |  |
| 4 | `mentioned_contact_id` | `uuid` | sim |  |  |  |
| 5 | `mentioned_name` | `text` | sim |  |  |  |
| 6 | `mentioned_role` | `text` | sim |  |  |  |
| 7 | `interaction_id` | `uuid` | sim |  |  |  |
| 8 | `mention_context` | `text` | sim |  |  |  |
| 9 | `sentiment` | `text` | sim |  |  |  |
| 10 | `mention_type` | `text` | sim |  |  |  |
| 11 | `led_to_contact` | `boolean` | sim | `false` |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| social_mentions_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| social_mentions_mention_type_check | CHECK | `CHECK (mention_type = ANY (ARRAY['recommendation'::text, 'reference'::text, 'complaint'::text, 'question'::text, 'information'::text, 'decision_reference'::text, 'other'::text]))` |  |  | sim |
| social_mentions_mentioned_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (mentioned_contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| social_mentions_mentioner_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (mentioner_contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| social_mentions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| social_mentions_sentiment_check | CHECK | `CHECK (sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text]))` |  |  | sim |
| social_mentions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| social_mentions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX social_mentions_pkey ON _dormant.social_mentions USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_social_mentions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
