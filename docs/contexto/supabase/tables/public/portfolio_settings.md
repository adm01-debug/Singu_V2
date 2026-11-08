# public.portfolio_settings

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `setting_key` | `text` | não |  |  |  |
| 3 | `setting_value` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| portfolio_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| portfolio_settings_setting_key_key | UNIQUE | `UNIQUE (setting_key)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| portfolio_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX portfolio_settings_pkey ON public.portfolio_settings USING btree (id)` |
| portfolio_settings_setting_key_key | btree | setting_key | sim | sim |  | `CREATE UNIQUE INDEX portfolio_settings_setting_key_key ON public.portfolio_settings USING btree (setting_key)` |


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


## Grants

_nenhum_
