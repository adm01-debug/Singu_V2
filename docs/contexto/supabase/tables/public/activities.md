# public.activities

> SINGU: Log de atividades dos usuários no sistema

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 9 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_singu_readiness |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `interaction_id` | `uuid` | sim |  |  |  |
| 6 | `type` | `text` | não |  |  |  |
| 7 | `description` | `text` | sim |  |  |  |
| 8 | `data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `ip_address` | `inet` | sim |  |  |  |
| 10 | `user_agent` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `entity_type` | `text` | sim |  |  |  |
| 13 | `entity_id` | `uuid` | sim |  |  |  |
| 14 | `entity_name` | `text` | sim |  |  |  |
| 15 | `metadata` | `jsonb` | sim |  |  |  |
| 16 | `reason` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| activities_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| activities_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| activities_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| activities_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| activities_type_check | CHECK | `CHECK (type = ANY (ARRAY['contact_created'::text, 'contact_updated'::text, 'contact_deleted'::text, 'contact_viewed'::text, 'contact_merged'::text, 'company_created'::text, 'company_updated'::text, 'company_deleted'::text, 'company_viewed'::text, 'interaction_created'::text, 'interaction_updated'::text, 'interaction_deleted'::text, 'call_made'::text, 'message_sent'::text, 'email_sent'::text, 'meeting_scheduled'::text, 'note_added'::text, 'disc_analyzed'::text, 'sentiment_analyzed'::text, 'emotion_analyzed'::text, 'alert_created'::text, 'alert_actioned'::text, 'alert_dismissed'::text, 'login'::text, 'logout'::text, 'settings_changed'::text, 'export_data'::text, 'import_data'::text]))` |  |  | sim |
| activities_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| activities_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX activities_pkey ON public.activities USING btree (id)` |
| idx_activities_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_activities_company_id ON public.activities USING btree (company_id)` |
| idx_activities_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_activities_contact_id ON public.activities USING btree (contact_id)` |
| idx_activities_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_activities_created_at ON public.activities USING btree (created_at DESC)` |
| idx_activities_interaction_id | btree | interaction_id | não | sim |  | `CREATE INDEX idx_activities_interaction_id ON public.activities USING btree (interaction_id)` |
| idx_activities_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_activities_user_id ON public.activities USING btree (user_id)` |


## Policies (RLS)

### `Users can delete their own activities`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert their own activities`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own activities`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own activities`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `service_role_full_activities`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `singu_activities_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `singu_activities_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `singu_activities_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `singu_activities_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
