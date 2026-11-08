# _dormant.rfm_history

> SINGU: Histórico de mudanças nos scores RFM

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
| 4 | `recency_score` | `integer` | sim |  |  |  |
| 5 | `frequency_score` | `integer` | sim |  |  |  |
| 6 | `monetary_score` | `integer` | sim |  |  |  |
| 7 | `combined_score` | `numeric(3,1)` | sim |  |  |  |
| 8 | `segment_code` | `text` | sim |  |  |  |
| 9 | `previous_segment_code` | `text` | sim |  |  |  |
| 10 | `segment_changed` | `boolean` | sim | `false` |  |  |
| 11 | `period_start` | `date` | não |  |  |  |
| 12 | `period_end` | `date` | não |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rfm_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| rfm_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rfm_history_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rfm_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rfm_history_pkey ON _dormant.rfm_history USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_rfm_history`

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

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
