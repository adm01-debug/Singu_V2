# public.emotional_anchors

> SINGU: Palavras/temas gatilho que desencadeiam reações emocionais específicas.

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
| 4 | `trigger_word` | `text` | não |  |  |  |
| 5 | `emotional_state` | `text` | não |  |  |  |
| 6 | `anchor_type` | `text` | não |  |  |  |
| 7 | `strength` | `integer` | sim | `5` |  |  |
| 8 | `context` | `text` | sim |  |  |  |
| 9 | `detected_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_anchor_strength | CHECK | `CHECK (strength IS NULL OR strength >= 1 AND strength <= 10)` |  |  | sim |
| chk_anchor_type | CHECK | `CHECK (anchor_type = ANY (ARRAY['positive'::text, 'negative'::text, 'neutral'::text]))` |  |  | sim |
| emotional_anchors_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| emotional_anchors_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| emotional_anchors_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX emotional_anchors_pkey ON public.emotional_anchors USING btree (id)` |
| idx_emotional_anchors_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_emotional_anchors_contact ON public.emotional_anchors USING btree (contact_id)` |
| idx_emotional_anchors_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_emotional_anchors_user_id ON public.emotional_anchors USING btree (user_id)` |


## Policies (RLS)

### `Users can create their own emotional anchors`

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

### `Users can delete their own emotional anchors`

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

### `Users can update their own emotional anchors`

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

### `Users can view their own emotional anchors`

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
