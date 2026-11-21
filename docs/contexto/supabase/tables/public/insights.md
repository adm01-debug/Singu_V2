# public.insights

> Insights de IA sobre contatos/empresas

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 8 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_singu_contact_360, public.vw_singu_readiness, public.vw_singu_usage_kpis |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `category` | `text` | não |  |  |  |
| 7 | `confidence` | `integer` | sim | `50` |  |  |
| 8 | `actionable` | `boolean` | sim | `false` |  |  |
| 9 | `action_suggestion` | `text` | sim |  |  |  |
| 10 | `source` | `text` | sim |  |  |  |
| 11 | `dismissed` | `boolean` | sim | `false` |  |  |
| 12 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_insight_category | CHECK | `CHECK (category = ANY (ARRAY['opportunity'::text, 'risk'::text, 'pattern'::text, 'suggestion'::text]))` |  |  | sim |
| chk_insight_confidence | CHECK | `CHECK (confidence IS NULL OR confidence >= 0 AND confidence <= 100)` |  |  | sim |
| insights_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| insights_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_insights_active | btree | contact_id, user_id | não | sim | `(dismissed = false)` | `CREATE INDEX idx_insights_active ON public.insights USING btree (contact_id, user_id) WHERE (dismissed = false)` |
| idx_insights_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_insights_contact ON public.insights USING btree (contact_id)` |
| idx_insights_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_insights_contact_id ON public.insights USING btree (contact_id)` |
| idx_insights_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_insights_user_id ON public.insights USING btree (user_id)` |
| insights_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX insights_pkey ON public.insights USING btree (id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own insights`

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

### `Users can insert their own insights`

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

### `Users can update their own insights`

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

### `Users can view their own insights`

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
