# _dormant.metaprogram_analysis

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
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `toward_score` | `integer` | sim | `0` |  |  |
| 6 | `away_from_score` | `integer` | sim | `0` |  |  |
| 7 | `toward_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 8 | `away_from_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 9 | `internal_score` | `integer` | sim | `0` |  |  |
| 10 | `external_score` | `integer` | sim | `0` |  |  |
| 11 | `internal_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 12 | `external_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 13 | `options_score` | `integer` | sim | `0` |  |  |
| 14 | `procedures_score` | `integer` | sim | `0` |  |  |
| 15 | `options_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 16 | `procedures_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 17 | `analyzed_text` | `text` | sim |  |  |  |
| 18 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| metaprogram_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| metaprogram_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX metaprogram_analysis_pkey ON _dormant.metaprogram_analysis USING btree (id)` |


## Policies (RLS)

### `Users can create their own metaprogram analysis`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own metaprogram analysis`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own metaprogram_analysis`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own metaprogram analysis`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
