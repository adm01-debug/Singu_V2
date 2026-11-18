# public.hidden_objections

> SINGU: Objeções não verbalizadas detectadas por IA. Inclui sonda sugerida e templates de resolução.

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
| usada por views | public.vw_singu_contact_360, public.vw_singu_readiness, public.vw_singu_usage_kpis |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `objection_type` | `text` | não |  |  |  |
| 6 | `indicator` | `text` | não |  |  |  |
| 7 | `severity` | `text` | não |  |  |  |
| 8 | `probability` | `integer` | sim | `50` |  |  |
| 9 | `possible_real_objection` | `text` | sim |  |  |  |
| 10 | `suggested_probe` | `text` | sim |  |  |  |
| 11 | `resolution_templates` | `text[]` | sim |  |  |  |
| 12 | `resolved` | `boolean` | sim | `false` |  |  |
| 13 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_objection_probability | CHECK | `CHECK (probability IS NULL OR probability >= 0 AND probability <= 100)` |  |  | sim |
| chk_objection_severity | CHECK | `CHECK (severity = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text]))` |  |  | sim |
| hidden_objections_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| hidden_objections_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| hidden_objections_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| hidden_objections_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX hidden_objections_pkey ON public.hidden_objections USING btree (id)` |
| idx_hidden_objections_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_hidden_objections_contact ON public.hidden_objections USING btree (contact_id)` |
| idx_hidden_objections_interaction_id | btree | interaction_id | não | sim |  | `CREATE INDEX idx_hidden_objections_interaction_id ON public.hidden_objections USING btree (interaction_id)` |
| idx_hidden_objections_resolved | btree | resolved | não | sim |  | `CREATE INDEX idx_hidden_objections_resolved ON public.hidden_objections USING btree (resolved)` |
| idx_objections_user | btree | user_id | não | sim |  | `CREATE INDEX idx_objections_user ON public.hidden_objections USING btree (user_id)` |


## Policies (RLS)

### `Users can create their own hidden objections`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own hidden objections`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
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

### `Users can update their own hidden objections`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own hidden objections`

| campo | valor |
|---|---|
| comando | SELECT |
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
