# public.revops_benchmarks

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
| 3 | `metric_key` | `text` | não |  |  |  |
| 4 | `target_value` | `numeric(14,2)` | não |  |  |  |
| 5 | `warning_threshold` | `numeric(5,2)` | não | `90` |  |  |
| 6 | `critical_threshold` | `numeric(5,2)` | não | `75` |  |  |
| 7 | `description` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| revops_benchmarks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| revops_benchmarks_user_id_metric_key_key | UNIQUE | `UNIQUE (user_id, metric_key)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_revops_benchmarks_user_metric | btree | user_id, metric_key | não | sim |  | `CREATE INDEX idx_revops_benchmarks_user_metric ON public.revops_benchmarks USING btree (user_id, metric_key)` |
| revops_benchmarks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX revops_benchmarks_pkey ON public.revops_benchmarks USING btree (id)` |
| revops_benchmarks_user_id_metric_key_key | btree | user_id, metric_key | sim | sim |  | `CREATE UNIQUE INDEX revops_benchmarks_user_id_metric_key_key ON public.revops_benchmarks USING btree (user_id, metric_key)` |


## Policies (RLS)

### `Users delete own benchmarks`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own benchmarks`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users update own benchmarks`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users view own benchmarks`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_revops_benchmarks_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
