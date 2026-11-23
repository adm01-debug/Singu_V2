# public.company_social_media

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
| usada por views | public.vw_company_social_media, public.vw_social_media_stats |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `company_id` | `uuid` | não |  |  |  |
| 3 | `plataforma` | `social_media_platform` | não |  |  |  |
| 4 | `handle` | `character varying(255)` | sim |  |  |  |
| 5 | `url` | `character varying(500)` | sim |  |  |  |
| 6 | `nome_perfil` | `character varying(255)` | sim |  |  |  |
| 7 | `is_verified` | `boolean` | sim | `false` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `seguidores` | `integer` | sim |  |  |  |
| 10 | `data_ultima_verificacao` | `date` | sim |  |  |  |
| 11 | `observacoes` | `text` | sim |  |  |  |
| 12 | `origem` | `character varying(50)` | sim | `'manual'::character varying` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `created_by` | `uuid` | sim |  |  |  |
| 16 | `updated_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_social_media_platforms_only | CHECK | `CHECK (plataforma <> ALL (ARRAY['website'::social_media_platform, 'whatsapp'::social_media_platform, 'google_business'::social_media_platform]))` |  |  | sim |
| company_social_media_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| company_social_media_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| uq_company_social_media | UNIQUE | `UNIQUE (company_id, plataforma)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| company_social_media_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX company_social_media_pkey ON public.company_social_media USING btree (id)` |
| idx_company_social_active | btree | company_id, plataforma | não | sim | `(is_active = true)` | `CREATE INDEX idx_company_social_active ON public.company_social_media USING btree (company_id, plataforma) WHERE (is_active = true)` |
| idx_company_social_company | btree | company_id | não | sim |  | `CREATE INDEX idx_company_social_company ON public.company_social_media USING btree (company_id)` |
| idx_company_social_media_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_company_social_media_created_at ON public.company_social_media USING btree (created_at)` |
| idx_company_social_plataforma | btree | plataforma | não | sim |  | `CREATE INDEX idx_company_social_plataforma ON public.company_social_media USING btree (plataforma)` |
| uq_company_social_media | btree | company_id, plataforma | sim | sim |  | `CREATE UNIQUE INDEX uq_company_social_media ON public.company_social_media USING btree (company_id, plataforma)` |


## Policies (RLS)

### `company_social_media_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_social_media.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_social_media.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_company_social_media_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
