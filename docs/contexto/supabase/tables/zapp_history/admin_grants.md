# zapp_history.admin_grants

> Usuários com acesso total ao histórico (override do ownership). Popular manualmente pelo service_role.

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
| 1 | `user_id` | `uuid` | não |  |  |  |
| 2 | `granted_by` | `uuid` | sim |  |  |  |
| 3 | `granted_at` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `note` | `text` | sim |  |  |  |
| 5 | `source` | `text` | sim | `'manual'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| admin_grants_pkey | PRIMARY KEY | `PRIMARY KEY (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| admin_grants_pkey | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX admin_grants_pkey ON zapp_history.admin_grants USING btree (user_id)` |


## Policies (RLS)

### `ag_admin_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
