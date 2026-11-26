# public.trigger_templates

> Templates prontos utilizando gatilhos mentais de Cialdini

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
| 2 | `trigger_type_id` | `uuid` | sim |  |  |  |
| 3 | `template_type` | `character varying(50)` | não |  |  |  |
| 4 | `title` | `character varying(200)` | não |  |  |  |
| 5 | `content` | `text` | não |  |  |  |
| 6 | `trigger_application` | `text` | sim |  |  |  |
| 7 | `best_for` | `text[]` | sim |  |  |  |
| 8 | `combine_with` | `uuid[]` | sim |  |  |  |
| 9 | `is_active` | `boolean` | sim | `true` |  |  |
| 10 | `success_rate` | `numeric(5,2)` | sim | `0` |  |  |
| 11 | `usage_count` | `integer` | sim | `0` |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_templates_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| trigger_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trigger_templates_trigger_type_id_fkey | FOREIGN KEY | `FOREIGN KEY (trigger_type_id) REFERENCES trigger_types(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| trigger_templates_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_templates_pkey ON public.trigger_templates USING btree (id)` |


## Policies (RLS)

### `service_role_full_trigger_templates`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `trigger_templates_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_trigger_templates_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
