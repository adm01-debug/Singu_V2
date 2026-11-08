# public.data_quality_audits

> Registro permanente de auditorias de qualidade de dados por sistema cooperativo

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
| 2 | `sistema` | `character varying` | não |  |  |  |
| 3 | `nivel` | `character varying` | não |  |  |  |
| 4 | `total_entidades` | `integer` | não |  |  |  |
| 5 | `campos_auditados` | `jsonb` | não |  |  | JSON com status de cada campo: {"nome_crm": "58/58", "cnpj": "58/58", ...} |
| 6 | `cobertura_percentual` | `numeric(5,2)` | sim |  |  |  |
| 7 | `fonte_dados` | `jsonb` | sim |  |  |  |
| 8 | `observacoes` | `text` | sim |  |  |  |
| 9 | `pendencias` | `text` | sim |  |  |  |
| 10 | `auditado_por` | `character varying` | sim | `'Claude AI'::character varying` |  |  |
| 11 | `data_auditoria` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `proxima_auditoria` | `date` | sim |  |  |  |
| 13 | `status` | `character varying` | sim | `'CONCLUIDO'::character varying` |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| data_quality_audits_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| data_quality_audits_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX data_quality_audits_pkey ON public.data_quality_audits USING btree (id)` |


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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
