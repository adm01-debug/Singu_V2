# public.contact_influence

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `decision_role` | `text` | sim |  |  |  |
| 4 | `decision_power` | `integer` | sim |  |  |  |
| 5 | `support_level` | `integer` | sim |  |  |  |
| 6 | `influencer_ids` | `uuid[]` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_influence_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_influence_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| contact_influence_decision_power_check | CHECK | `CHECK (decision_power >= 1 AND decision_power <= 10)` |  |  | sim |
| contact_influence_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_influence_support_level_check | CHECK | `CHECK (support_level >= 1 AND support_level <= 10)` |  |  | sim |
| decision_power_range | CHECK | `CHECK (decision_power >= 1 AND decision_power <= 10)` |  |  | sim |
| support_level_range | CHECK | `CHECK (support_level >= 1 AND support_level <= 10)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_influence_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_influence_contact_id_key ON public.contact_influence USING btree (contact_id)` |
| contact_influence_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_influence_pkey ON public.contact_influence USING btree (id)` |


## Policies (RLS)

### `Owner or admin can delete contact_influence`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can insert contact_influence`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `Owner or admin can select contact_influence`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can update contact_influence`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| log_contact_influence_change | AFTER | UPDATE | ROW | enabled | public.log_behavioral_change |
| update_contact_influence_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
