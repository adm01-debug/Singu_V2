# public.contact_metaprograms

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
| 3 | `toward_score` | `integer` | sim |  |  |  |
| 4 | `away_from_score` | `integer` | sim |  |  |  |
| 5 | `internal_score` | `integer` | sim |  |  |  |
| 6 | `external_score` | `integer` | sim |  |  |  |
| 7 | `options_score` | `integer` | sim |  |  |  |
| 8 | `procedures_score` | `integer` | sim |  |  |  |
| 9 | `proactive_score` | `integer` | sim |  |  |  |
| 10 | `reactive_score` | `integer` | sim |  |  |  |
| 11 | `global_score` | `integer` | sim |  |  |  |
| 12 | `detail_score` | `integer` | sim |  |  |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_metaprograms_away_from_score_check | CHECK | `CHECK (away_from_score >= 0 AND away_from_score <= 100)` |  |  | sim |
| contact_metaprograms_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_metaprograms_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| contact_metaprograms_detail_score_check | CHECK | `CHECK (detail_score >= 0 AND detail_score <= 100)` |  |  | sim |
| contact_metaprograms_external_score_check | CHECK | `CHECK (external_score >= 0 AND external_score <= 100)` |  |  | sim |
| contact_metaprograms_global_score_check | CHECK | `CHECK (global_score >= 0 AND global_score <= 100)` |  |  | sim |
| contact_metaprograms_internal_score_check | CHECK | `CHECK (internal_score >= 0 AND internal_score <= 100)` |  |  | sim |
| contact_metaprograms_options_score_check | CHECK | `CHECK (options_score >= 0 AND options_score <= 100)` |  |  | sim |
| contact_metaprograms_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_metaprograms_proactive_score_check | CHECK | `CHECK (proactive_score >= 0 AND proactive_score <= 100)` |  |  | sim |
| contact_metaprograms_procedures_score_check | CHECK | `CHECK (procedures_score >= 0 AND procedures_score <= 100)` |  |  | sim |
| contact_metaprograms_reactive_score_check | CHECK | `CHECK (reactive_score >= 0 AND reactive_score <= 100)` |  |  | sim |
| contact_metaprograms_toward_score_check | CHECK | `CHECK (toward_score >= 0 AND toward_score <= 100)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_metaprograms_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_metaprograms_contact_id_key ON public.contact_metaprograms USING btree (contact_id)` |
| contact_metaprograms_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_metaprograms_pkey ON public.contact_metaprograms USING btree (id)` |


## Policies (RLS)

### `Owner or admin can delete contact_metaprograms`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can insert contact_metaprograms`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `Owner or admin can select contact_metaprograms`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can update contact_metaprograms`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| log_contact_metaprograms_change | AFTER | UPDATE | ROW | enabled | public.log_behavioral_change |
| update_contact_metaprograms_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
