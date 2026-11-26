# public.pix_accounts

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
| usada por views | public.vw_pix_accounts |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `company_id` | `uuid` | não |  |  |  |
| 3 | `pix_tipo` | `text` | não |  |  |  |
| 4 | `pix_chave` | `text` | não |  |  |  |
| 5 | `pix_favorecido` | `text` | sim |  |  |  |
| 6 | `is_active` | `boolean` | não | `true` |  |  |
| 7 | `created_by` | `uuid` | sim |  |  |  |
| 8 | `updated_by` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_pix_chave_not_empty | CHECK | `CHECK (pix_chave <> ''::text)` |  |  | sim |
| chk_pix_favorecido_not_empty | CHECK | `CHECK (pix_favorecido IS NULL OR pix_favorecido <> ''::text)` |  |  | sim |
| pix_accounts_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| pix_accounts_pix_tipo_check | CHECK | `CHECK (pix_tipo = ANY (ARRAY['cnpj'::text, 'cpf'::text, 'email'::text, 'telefone'::text, 'aleatoria'::text]))` |  |  | sim |
| pix_accounts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pix_company | btree | company_id | não | sim |  | `CREATE INDEX idx_pix_company ON public.pix_accounts USING btree (company_id)` |
| pix_accounts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pix_accounts_pkey ON public.pix_accounts USING btree (id)` |
| uq_pix_chave_ativa | btree | company_id, pix_chave | sim | sim | `(is_active = true)` | `CREATE UNIQUE INDEX uq_pix_chave_ativa ON public.pix_accounts USING btree (company_id, pix_chave) WHERE (is_active = true)` |


## Policies (RLS)

### `pix_accounts_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(company_id IN ( SELECT c.id    FROM companies c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(company_id IN ( SELECT c.id    FROM companies c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |

### `service_role_full_pix_accounts`

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
| pix_accounts_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.trg_pix_accounts_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
