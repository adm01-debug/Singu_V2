# ops_backup.acl_snapshot

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `captured_at` | `timestamp with time zone` | não | `now()` |  |  |
| 2 | `migration` | `text` | não |  |  |  |
| 3 | `object_kind` | `text` | não |  |  |  |
| 4 | `object_name` | `text` | não |  |  |  |
| 5 | `acl` | `aclitem[]` | sim |  |  |  |


## Constraints

_nenhum_


## Índices

_nenhum_


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
