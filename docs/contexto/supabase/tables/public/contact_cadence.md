# public.contact_cadence

> SINGU: Cadência ideal de contato por lead/cliente. Auto-remind e next_contact_due.

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
| usada por views | public.vw_singu_contact_360, public.vw_singu_readiness |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `cadence_days` | `integer` | não | `14` |  |  |
| 5 | `priority` | `character varying` | sim | `'medium'::character varying` |  |  |
| 6 | `auto_remind` | `boolean` | sim | `true` |  |  |
| 7 | `last_contact_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `next_contact_due` | `timestamp with time zone` | sim |  |  |  |
| 9 | `notes` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_cadence_days | CHECK | `CHECK (cadence_days > 0)` |  |  | sim |
| chk_cadence_priority | CHECK | `CHECK (priority IS NULL OR (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying]::text[])))` |  |  | sim |
| contact_cadence_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_cadence_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_cadence_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_cadence_pkey ON public.contact_cadence USING btree (id)` |
| contact_cadence_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_cadence_user_id_contact_id_key ON public.contact_cadence USING btree (user_id, contact_id)` |
| idx_cadence_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_cadence_contact ON public.contact_cadence USING btree (contact_id)` |


## Policies (RLS)

### `Users can create their own contact cadence`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own contact cadence`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own contact cadence`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own contact cadence`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| on_cadence_params_change | BEFORE | INSERT OR UPDATE | ROW | enabled | public.calculate_next_contact_due |
| on_contact_cadence_change | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.process_contact_cadence_audit |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| set_updated_at_contact_cadence | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
