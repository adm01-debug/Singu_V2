# public.oauth_tokens

> Tokens OAuth para integrações externas

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
| 1 | `service` | `text` | não |  |  |  |
| 2 | `access_token` | `text` | não |  |  |  |
| 3 | `refresh_token` | `text` | não |  |  |  |
| 4 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 5 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| oauth_tokens_pkey | PRIMARY KEY | `PRIMARY KEY (service)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| oauth_tokens_pkey | btree | service | sim | sim |  | `CREATE UNIQUE INDEX oauth_tokens_pkey ON public.oauth_tokens USING btree (service)` |


## Policies (RLS)

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
| audit_oauth_tokens | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_func |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
