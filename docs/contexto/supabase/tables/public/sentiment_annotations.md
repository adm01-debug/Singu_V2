# public.sentiment_annotations

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
| 2 | `created_by` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `week_start` | `date` | não |  |  |  |
| 5 | `category` | `text` | não |  |  |  |
| 6 | `title` | `text` | não |  |  |  |
| 7 | `description` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sentiment_annotations_category_check | CHECK | `CHECK (category = ANY (ARRAY['campanha'::text, 'abordagem'::text, 'release'::text, 'reuniao'::text, 'outro'::text]))` |  |  | sim |
| sentiment_annotations_description_check | CHECK | `CHECK (description IS NULL OR char_length(description) <= 500)` |  |  | sim |
| sentiment_annotations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sentiment_annotations_title_check | CHECK | `CHECK (char_length(title) >= 1 AND char_length(title) <= 80)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sentiment_annotations_contact_week | btree | contact_id, week_start | não | sim |  | `CREATE INDEX idx_sentiment_annotations_contact_week ON public.sentiment_annotations USING btree (contact_id, week_start DESC)` |
| sentiment_annotations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sentiment_annotations_pkey ON public.sentiment_annotations USING btree (id)` |


## Policies (RLS)

### `Owner or admin can delete sentiment annotations`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = created_by) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can update sentiment annotations`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = created_by) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can view sentiment annotations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = created_by) OR (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = sentiment_annotations.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can create their own sentiment annotations`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = created_by)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sentiment_annotations_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
