# public.script_sections

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
| usada por views | public.vw_recommended_scripts |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `script_id` | `uuid` | não |  |  |  |
| 3 | `section_name` | `character varying(100)` | não |  |  |  |
| 4 | `section_order` | `integer` | não |  |  |  |
| 5 | `section_type` | `character varying(50)` | sim |  |  |  |
| 6 | `content_template` | `text` | sim |  |  |  |
| 7 | `content_disc_d` | `text` | sim |  |  |  |
| 8 | `content_disc_i` | `text` | sim |  |  |  |
| 9 | `content_disc_s` | `text` | sim |  |  |  |
| 10 | `content_disc_c` | `text` | sim |  |  |  |
| 11 | `content_vak_visual` | `text` | sim |  |  |  |
| 12 | `content_vak_auditivo` | `text` | sim |  |  |  |
| 13 | `content_vak_cinestesico` | `text` | sim |  |  |  |
| 14 | `delivery_tips` | `text[]` | sim |  |  |  |
| 15 | `estimated_duration_seconds` | `integer` | sim |  |  |  |
| 16 | `is_required` | `boolean` | sim | `true` |  |  |
| 17 | `is_active` | `boolean` | sim | `true` |  |  |
| 18 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| script_sections_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| script_sections_script_id_fkey | FOREIGN KEY | `FOREIGN KEY (script_id) REFERENCES sales_scripts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_script_sections_script_id | btree | script_id | não | sim |  | `CREATE INDEX idx_script_sections_script_id ON public.script_sections USING btree (script_id)` |
| script_sections_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX script_sections_pkey ON public.script_sections USING btree (id)` |


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

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
