# public.workspace_accounts

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
| usada por views | public.vw_workspace_overview |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `email` | `character varying(255)` | não |  |  |  |
| 3 | `email_normalizado` | `character varying(255)` | sim | `lower(TRIM(BOTH FROM email))` | s |  |
| 4 | `display_name` | `character varying(255)` | sim |  |  |  |
| 5 | `first_name` | `character varying(100)` | sim |  |  |  |
| 6 | `last_name` | `character varying(100)` | sim |  |  |  |
| 7 | `account_type` | `workspace_account_type` | não | `'user'::workspace_account_type` |  |  |
| 8 | `department` | `character varying(100)` | sim |  |  |  |
| 9 | `job_title` | `character varying(100)` | sim |  |  |  |
| 10 | `is_active` | `boolean` | não | `true` |  |  |
| 11 | `is_admin` | `boolean` | não | `false` |  |  |
| 12 | `is_suspended` | `boolean` | não | `false` |  |  |
| 13 | `aliases` | `text[]` | sim |  |  |  |
| 14 | `google_id` | `character varying(100)` | sim |  |  |  |
| 15 | `org_unit_path` | `character varying(500)` | sim |  |  |  |
| 16 | `photo_url` | `text` | sim |  |  |  |
| 17 | `last_login_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `creation_time` | `timestamp with time zone` | sim |  |  |  |
| 19 | `members` | `text[]` | sim |  |  |  |
| 20 | `member_count` | `integer` | sim | `0` |  |  |
| 21 | `phones` | `text[]` | sim |  |  |  |
| 22 | `recovery_email` | `character varying(255)` | sim |  |  |  |
| 23 | `recovery_phone` | `character varying(50)` | sim |  |  |  |
| 24 | `contact_id` | `uuid` | sim |  |  |  |
| 25 | `company_id` | `uuid` | sim |  |  |  |
| 26 | `user_id` | `integer` | sim |  |  |  |
| 27 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 28 | `synced_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 29 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 30 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| workspace_accounts_email_key | UNIQUE | `UNIQUE (email)` |  |  | sim |
| workspace_accounts_google_id_key | UNIQUE | `UNIQUE (google_id)` |  |  | sim |
| workspace_accounts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| workspace_accounts_email_key | btree | email | sim | sim |  | `CREATE UNIQUE INDEX workspace_accounts_email_key ON public.workspace_accounts USING btree (email)` |
| workspace_accounts_google_id_key | btree | google_id | sim | sim |  | `CREATE UNIQUE INDEX workspace_accounts_google_id_key ON public.workspace_accounts USING btree (google_id)` |
| workspace_accounts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX workspace_accounts_pkey ON public.workspace_accounts USING btree (id)` |


## Policies (RLS)

### `workspace_accounts_select_admin`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| tr_workspace_accounts_updated | BEFORE | UPDATE | ROW | enabled | public.update_workspace_accounts_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
