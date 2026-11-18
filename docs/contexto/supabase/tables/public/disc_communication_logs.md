# public.disc_communication_logs

> SINGU: Logs de comunicação adaptada ao perfil DISC. Registra se vendedor seguiu as dicas.

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
| 5 | `contact_disc_profile` | `text` | não |  |  |  |
| 6 | `approach_adapted` | `boolean` | não | `false` |  |  |
| 7 | `adaptation_tips_shown` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `tips_followed` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 9 | `communication_outcome` | `text` | sim |  |  |  |
| 10 | `effectiveness_rating` | `integer` | sim |  |  |  |
| 11 | `outcome_notes` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_comm_outcome | CHECK | `CHECK (communication_outcome IS NULL OR (communication_outcome = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])))` |  |  | sim |
| chk_effectiveness | CHECK | `CHECK (effectiveness_rating IS NULL OR effectiveness_rating >= 1 AND effectiveness_rating <= 10)` |  |  | sim |
| disc_communication_logs_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| disc_communication_logs_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| disc_communication_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_communication_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_communication_logs_pkey ON public.disc_communication_logs USING btree (id)` |
| idx_disc_communication_logs_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_disc_communication_logs_contact ON public.disc_communication_logs USING btree (contact_id)` |
| idx_disc_communication_logs_interaction_id | btree | interaction_id | não | sim |  | `CREATE INDEX idx_disc_communication_logs_interaction_id ON public.disc_communication_logs USING btree (interaction_id)` |
| idx_disc_communication_logs_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_disc_communication_logs_user_id ON public.disc_communication_logs USING btree (user_id)` |


## Policies (RLS)

### `Users can create their own DISC communication logs`

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

### `Users can delete their own disc_communication_logs`

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

### `Users can update their own DISC communication logs`

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

### `Users can view their own DISC communication logs`

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
