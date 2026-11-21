# public.metaprogram_analysis

> SINGU: Análise de metaprogramas PNL (Toward/Away, Internal/External, Options/Procedures).

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
| 5 | `toward_score` | `integer` | sim |  |  |  |
| 6 | `toward_words` | `text[]` | sim |  |  |  |
| 7 | `away_from_score` | `integer` | sim |  |  |  |
| 8 | `away_from_words` | `text[]` | sim |  |  |  |
| 9 | `internal_score` | `integer` | sim |  |  |  |
| 10 | `internal_words` | `text[]` | sim |  |  |  |
| 11 | `external_score` | `integer` | sim |  |  |  |
| 12 | `external_words` | `text[]` | sim |  |  |  |
| 13 | `options_score` | `integer` | sim |  |  |  |
| 14 | `options_words` | `text[]` | sim |  |  |  |
| 15 | `procedures_score` | `integer` | sim |  |  |  |
| 16 | `procedures_words` | `text[]` | sim |  |  |  |
| 17 | `analyzed_text` | `text` | sim |  |  |  |
| 18 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `is_validated` | `boolean` | sim | `false` |  |  |
| 20 | `user_feedback` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| metaprogram_analysis_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| metaprogram_analysis_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| metaprogram_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_meta_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_meta_contact ON public.metaprogram_analysis USING btree (contact_id)` |
| idx_metaprogram_analysis_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_metaprogram_analysis_contact ON public.metaprogram_analysis USING btree (contact_id)` |
| idx_metaprogram_analysis_interaction_id | btree | interaction_id | não | sim |  | `CREATE INDEX idx_metaprogram_analysis_interaction_id ON public.metaprogram_analysis USING btree (interaction_id)` |
| idx_metaprogram_analysis_user | btree | user_id | não | sim |  | `CREATE INDEX idx_metaprogram_analysis_user ON public.metaprogram_analysis USING btree (user_id)` |
| idx_metaprogram_analysis_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_metaprogram_analysis_user_id ON public.metaprogram_analysis USING btree (user_id)` |
| metaprogram_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX metaprogram_analysis_pkey ON public.metaprogram_analysis USING btree (id)` |


## Policies (RLS)

### `Users can create their own metaprogram analysis`

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

### `Users can delete their own metaprogram analysis`

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

### `Users can update their own metaprogram_analysis`

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

### `Users can view their own metaprogram analysis`

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
| tr_sync_meta_to_contact | AFTER | INSERT OR UPDATE | ROW | enabled | public.sync_nlp_to_contact |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
