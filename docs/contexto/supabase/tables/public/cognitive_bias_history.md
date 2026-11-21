# public.cognitive_bias_history

> SINGU: Vieses cognitivos detectados em contatos para estratégias de vendas.

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
| usada por views | public.vw_singu_readiness |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `detected_biases` | `jsonb` | não |  |  |  |
| 6 | `dominant_biases` | `text[]` | sim |  |  |  |
| 7 | `vulnerabilities` | `text[]` | sim |  |  |  |
| 8 | `resistances` | `text[]` | sim |  |  |  |
| 9 | `category_distribution` | `jsonb` | sim |  |  |  |
| 10 | `sales_strategies` | `jsonb` | sim |  |  |  |
| 11 | `profile_summary` | `text` | sim |  |  |  |
| 12 | `analyzed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cognitive_bias_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cognitive_bias_history_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| cognitive_bias_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cognitive_bias_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cognitive_bias_history_pkey ON public.cognitive_bias_history USING btree (id)` |
| idx_cog_bias_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_cog_bias_contact ON public.cognitive_bias_history USING btree (contact_id)` |
| idx_cognitive_bias_history_analyzed_at | btree | analyzed_at | não | sim |  | `CREATE INDEX idx_cognitive_bias_history_analyzed_at ON public.cognitive_bias_history USING btree (analyzed_at DESC)` |
| idx_cognitive_bias_history_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_cognitive_bias_history_contact_id ON public.cognitive_bias_history USING btree (contact_id)` |
| idx_cognitive_bias_history_interaction_id | btree | interaction_id | não | sim |  | `CREATE INDEX idx_cognitive_bias_history_interaction_id ON public.cognitive_bias_history USING btree (interaction_id)` |
| idx_cognitive_bias_history_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_cognitive_bias_history_user_id ON public.cognitive_bias_history USING btree (user_id)` |


## Policies (RLS)

### `Users can create their own cognitive bias history`

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

### `Users can delete their own cognitive bias history`

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

### `Users can update their own cognitive_bias_history`

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

### `Users can view their own cognitive bias history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
