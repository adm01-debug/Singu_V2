# public.behavioral_insight_feedback

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `insight_kind` | `text` | não |  |  |  |
| 5 | `insight_label` | `text` | não |  |  |  |
| 6 | `vote` | `smallint` | não |  |  |  |
| 7 | `note` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| behavioral_insight_feedback_insight_kind_check | CHECK | `CHECK (insight_kind = ANY (ARRAY['preference'::text, 'hobby'::text, 'tone'::text]))` |  |  | sim |
| behavioral_insight_feedback_insight_label_check | CHECK | `CHECK (char_length(insight_label) >= 1 AND char_length(insight_label) <= 200)` |  |  | sim |
| behavioral_insight_feedback_note_check | CHECK | `CHECK (note IS NULL OR char_length(note) <= 1000)` |  |  | sim |
| behavioral_insight_feedback_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| behavioral_insight_feedback_unique | UNIQUE | `UNIQUE (user_id, contact_id, insight_kind, insight_label)` |  |  | sim |
| behavioral_insight_feedback_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| behavioral_insight_feedback_vote_check | CHECK | `CHECK (vote = ANY (ARRAY['-1'::integer, 1]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| behavioral_insight_feedback_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX behavioral_insight_feedback_pkey ON public.behavioral_insight_feedback USING btree (id)` |
| behavioral_insight_feedback_unique | btree | user_id, contact_id, insight_kind, insight_label | sim | sim |  | `CREATE UNIQUE INDEX behavioral_insight_feedback_unique ON public.behavioral_insight_feedback USING btree (user_id, contact_id, insight_kind, insight_label)` |


## Policies (RLS)

### `Admins read all insight feedback`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users delete own insight feedback`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own insight feedback`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users read own insight feedback`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users update own insight feedback`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_bif_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
