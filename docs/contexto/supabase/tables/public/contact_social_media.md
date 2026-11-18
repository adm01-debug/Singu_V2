# public.contact_social_media

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
| usada por views | public.vw_contact_social_media, public.vw_social_media_stats |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `plataforma` | `social_media_platform` | não |  |  |  |
| 4 | `handle` | `character varying(255)` | sim |  |  |  |
| 5 | `url` | `character varying(500)` | sim |  |  |  |
| 6 | `nome_perfil` | `character varying(255)` | sim |  |  |  |
| 7 | `is_verified` | `boolean` | sim | `false` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `observacoes` | `text` | sim |  |  |  |
| 10 | `origem` | `character varying(50)` | sim | `'manual'::character varying` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `created_by` | `uuid` | sim |  |  |  |
| 14 | `updated_by` | `uuid` | sim |  |  |  |
| 15 | `fonte` | `text` | sim |  |  |  |
| 16 | `contexto` | `text` | sim |  |  |  |
| 17 | `confiabilidade` | `smallint` | sim | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_social_media_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_social_media_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| uq_contact_social_media | UNIQUE | `UNIQUE (contact_id, plataforma)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_social_media_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_social_media_pkey ON public.contact_social_media USING btree (id)` |
| idx_contact_social_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_contact_social_contact ON public.contact_social_media USING btree (contact_id)` |
| uq_contact_social_media | btree | contact_id, plataforma | sim | sim |  | `CREATE UNIQUE INDEX uq_contact_social_media ON public.contact_social_media USING btree (contact_id, plataforma)` |


## Policies (RLS)

### `contact_social_media_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `contact_social_media_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `contact_social_media_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `contact_social_media_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| serialize_contact_relation_write | BEFORE | INSERT OR DELETE OR UPDATE | ROW | enabled | public.guard_contact_relation_write |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_contact_social_media_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
