# public.stakeholder_alerts

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 8 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `alert_type` | `text` | não |  |  |  |
| 6 | `severity` | `text` | não | `'medium'::text` |  |  |
| 7 | `title` | `text` | não |  |  |  |
| 8 | `description` | `text` | sim |  |  |  |
| 9 | `previous_value` | `jsonb` | sim |  |  |  |
| 10 | `current_value` | `jsonb` | sim |  |  |  |
| 11 | `recommended_action` | `text` | sim |  |  |  |
| 12 | `dismissed` | `boolean` | sim | `false` |  |  |
| 13 | `dismissed_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| stakeholder_alerts_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| stakeholder_alerts_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| stakeholder_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_stakeholder_alerts_dismissed | btree | user_id, dismissed | não | sim |  | `CREATE INDEX idx_stakeholder_alerts_dismissed ON public.stakeholder_alerts USING btree (user_id, dismissed)` |
| idx_stakeholder_alerts_user_contact | btree | user_id, contact_id | não | sim |  | `CREATE INDEX idx_stakeholder_alerts_user_contact ON public.stakeholder_alerts USING btree (user_id, contact_id)` |
| idx_stakeholder_alerts_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_stakeholder_alerts_user_id ON public.stakeholder_alerts USING btree (user_id)` |
| stakeholder_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX stakeholder_alerts_pkey ON public.stakeholder_alerts USING btree (id)` |


## Policies (RLS)

### `Users can create their own stakeholder alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can delete their own stakeholder alerts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can update their own stakeholder alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own stakeholder alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `stakeholder_alerts_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `stakeholder_alerts_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `stakeholder_alerts_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `stakeholder_alerts_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
