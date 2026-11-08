# _dormant.influence_network

> SINGU: Métricas de influência de cada contato na rede

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
| 4 | `influence_score` | `integer` | sim | `0` |  |  |
| 5 | `influences_count` | `integer` | sim | `0` |  |  |
| 6 | `influenced_by_count` | `integer` | sim | `0` |  |  |
| 7 | `centrality_score` | `numeric(5,2)` | sim | `0` |  |  |
| 8 | `influencer_type` | `text` | sim |  |  |  |
| 9 | `company_reach` | `text` | sim |  |  |  |
| 10 | `analyzed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| influence_network_company_reach_check | CHECK | `CHECK (company_reach = ANY (ARRAY['individual'::text, 'team'::text, 'department'::text, 'division'::text, 'company_wide'::text, 'external'::text]))` |  |  | sim |
| influence_network_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| influence_network_influence_score_check | CHECK | `CHECK (influence_score >= 0 AND influence_score <= 100)` |  |  | sim |
| influence_network_influencer_type_check | CHECK | `CHECK (influencer_type = ANY (ARRAY['connector'::text, 'authority'::text, 'champion'::text, 'gatekeeper'::text, 'influencer'::text, 'follower'::text, 'isolated'::text]))` |  |  | sim |
| influence_network_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| influence_network_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_influence_unique | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX idx_influence_unique ON _dormant.influence_network USING btree (contact_id)` |
| influence_network_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX influence_network_pkey ON _dormant.influence_network USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_influence_network`

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
