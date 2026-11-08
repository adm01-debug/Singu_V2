# _dormant.disc_questions

> SINGU: Perguntas do questionário DISC

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
| 2 | `question` | `text` | não |  |  |  |
| 3 | `question_pt` | `text` | sim |  |  |  |
| 4 | `options` | `jsonb` | não |  |  |  |
| 5 | `category` | `text` | sim |  |  |  |
| 6 | `weight` | `numeric(3,2)` | sim | `1.0` |  |  |
| 7 | `is_active` | `boolean` | sim | `true` |  |  |
| 8 | `sort_order` | `integer` | sim | `0` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_questions_category_check | CHECK | `CHECK (category = ANY (ARRAY['work_style'::text, 'communication'::text, 'decision_making'::text, 'conflict'::text, 'motivation'::text, 'stress'::text, 'teamwork'::text, 'leadership'::text]))` |  |  | sim |
| disc_questions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_questions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_questions_pkey ON _dormant.disc_questions USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_disc_questions`

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
