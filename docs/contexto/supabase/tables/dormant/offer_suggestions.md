# _dormant.offer_suggestions

> SINGU: Sugestões de ofertas personalizadas

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `offer_type` | `text` | não |  |  |  |
| 5 | `title` | `text` | não |  |  |  |
| 6 | `description` | `text` | sim |  |  |  |
| 7 | `product_name` | `text` | sim |  |  |  |
| 8 | `product_id` | `text` | sim |  |  |  |
| 9 | `suggested_value` | `numeric(15,2)` | sim |  |  |  |
| 10 | `suggested_discount` | `numeric(5,2)` | sim |  |  |  |
| 11 | `reason` | `text` | não |  |  |  |
| 12 | `confidence` | `numeric(3,2)` | sim |  |  |  |
| 13 | `based_on` | `text[]` | sim | `'{}'::text[]` |  |  |
| 14 | `suggested_triggers` | `text[]` | sim | `'{}'::text[]` |  |  |
| 15 | `suggested_message` | `text` | sim |  |  |  |
| 16 | `status` | `text` | sim | `'pending'::text` |  |  |
| 17 | `presented_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `outcome` | `text` | sim |  |  |  |
| 19 | `outcome_value` | `numeric(15,2)` | sim |  |  |  |
| 20 | `valid_until` | `date` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| offer_suggestions_confidence_check | CHECK | `CHECK (confidence >= 0::numeric AND confidence <= 1::numeric)` |  |  | sim |
| offer_suggestions_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| offer_suggestions_offer_type_check | CHECK | `CHECK (offer_type = ANY (ARRAY['product'::text, 'service'::text, 'bundle'::text, 'upgrade'::text, 'cross_sell'::text, 'renewal'::text, 'promotion'::text, 'exclusive'::text, 'loyalty'::text]))` |  |  | sim |
| offer_suggestions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| offer_suggestions_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'presented'::text, 'accepted'::text, 'rejected'::text, 'expired'::text]))` |  |  | sim |
| offer_suggestions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| offer_suggestions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX offer_suggestions_pkey ON _dormant.offer_suggestions USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_offer_suggestions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
