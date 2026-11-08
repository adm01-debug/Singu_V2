# public.disc_approach_recommendations

> Recomendações estratégicas de abordagem por perfil DISC

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
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `disc_type` | `character varying(1)` | não |  |  |  |
| 3 | `category` | `character varying(50)` | não |  |  |  |
| 4 | `recommendation` | `text` | não |  |  |  |
| 5 | `do_this` | `text[]` | sim |  |  |  |
| 6 | `dont_do_this` | `text[]` | sim |  |  |  |
| 7 | `power_words` | `text[]` | sim |  |  |  |
| 8 | `trigger_words` | `text[]` | sim |  |  |  |
| 9 | `priority` | `integer` | sim | `1` |  |  |
| 10 | `context` | `character varying(100)` | sim |  |  |  |
| 11 | `is_active` | `boolean` | sim | `true` |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_approach_recommendations_disc_type_check | CHECK | `CHECK (disc_type::text = ANY (ARRAY['D'::character varying::text, 'I'::character varying::text, 'S'::character varying::text, 'C'::character varying::text]))` |  |  | sim |
| disc_approach_recommendations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_approach_recommendations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_approach_recommendations_pkey ON public.disc_approach_recommendations USING btree (id)` |


## Policies (RLS)

### `read_only_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `service_full`

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
| update_disc_approach_recommendations_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
