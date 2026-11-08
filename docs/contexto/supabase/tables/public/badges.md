# public.badges

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
| 2 | `code` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `icon` | `text` | sim |  |  |  |
| 6 | `category` | `text` | sim |  |  |  |
| 7 | `points` | `integer` | sim | `0` |  |  |
| 8 | `criteria` | `jsonb` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| badges_category_check | CHECK | `CHECK (category = ANY (ARRAY['sales'::text, 'engagement'::text, 'productivity'::text, 'milestone'::text, 'special'::text]))` |  |  | sim |
| badges_code_key | UNIQUE | `UNIQUE (code)` |  |  | sim |
| badges_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.user_badges | user_badges_badge_id_fkey | badge_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| badges_code_key | btree | code | sim | sim |  | `CREATE UNIQUE INDEX badges_code_key ON public.badges USING btree (code)` |
| badges_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX badges_pkey ON public.badges USING btree (id)` |


## Policies (RLS)

### `badges_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

_nenhum_


## Grants

_nenhum_
