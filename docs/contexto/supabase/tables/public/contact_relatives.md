# public.contact_relatives

> SINGU: Familiares e relacionados do contato para estratégias de rapport.

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
| usada por views | public.vw_singu_rapport_intel, public.vw_singu_readiness |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `name` | `text` | não |  |  |  |
| 5 | `relationship_type` | `text` | não |  |  |  |
| 6 | `age` | `integer` | sim |  |  |  |
| 7 | `birthday` | `date` | sim |  |  |  |
| 8 | `occupation` | `text` | sim |  |  |  |
| 9 | `company` | `text` | sim |  |  |  |
| 10 | `email` | `text` | sim |  |  |  |
| 11 | `phone` | `text` | sim |  |  |  |
| 12 | `is_decision_influencer` | `boolean` | sim | `false` |  |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_relatives_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_relatives_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_relatives_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_relatives_pkey ON public.contact_relatives USING btree (id)` |
| idx_contact_relatives_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_contact_relatives_contact_id ON public.contact_relatives USING btree (contact_id)` |
| idx_contact_relatives_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_contact_relatives_user_id ON public.contact_relatives USING btree (user_id)` |
| idx_relatives_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_relatives_contact ON public.contact_relatives USING btree (contact_id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own contact_relatives`

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

### `Users can insert their own contact_relatives`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own contact_relatives`

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

### `Users can view their own contact_relatives`

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
| on_contact_relatives_change | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.process_contact_relatives_audit |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| set_updated_at_contact_relatives | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| tr_contact_relatives_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.process_contact_relatives_audit |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
