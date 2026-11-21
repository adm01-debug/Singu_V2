# public.contact_predictive_roadmap

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `forecast_month` | `date` | não |  |  |  |
| 5 | `predicted_need` | `text` | não |  |  |  |
| 6 | `probability` | `integer` | sim |  |  |  |
| 7 | `suggested_offering` | `text` | sim |  |  |  |
| 8 | `rationale` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_predictive_roadmap_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_predictive_roadmap_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_predictive_roadmap_probability_check | CHECK | `CHECK (probability >= 0 AND probability <= 100)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_predictive_roadmap_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_predictive_roadmap_pkey ON public.contact_predictive_roadmap USING btree (id)` |
| idx_contact_roadmap_month | btree | contact_id, forecast_month | sim | sim |  | `CREATE UNIQUE INDEX idx_contact_roadmap_month ON public.contact_predictive_roadmap USING btree (contact_id, forecast_month)` |


## Policies (RLS)

### `System can manage predictive roadmap`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)` |
| WITH CHECK |  |

### `Users can insert roadmap for their contacts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update roadmap for their contacts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view predictive roadmap for their contacts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_predictive_roadmap.contact_id) AND ((c.user_id = ( SELECT auth.uid() AS uid)) OR ((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)))))` |
| WITH CHECK |  |

### `Users can view roadmap for their contacts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
