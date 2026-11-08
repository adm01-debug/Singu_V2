# public.sales_team_members

> SINGU: Membros do time de vendas com role (sdr/closer/manager), peso para round-robin ponderado (1-10), caps diário/total e controle de férias. Usado pelo módulo Lead Routing & Portfolio Rotation.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 9 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `member_user_id` | `uuid` | não |  |  |  |
| 4 | `role` | `text` | não |  |  |  |
| 5 | `weight` | `integer` | não | `5` |  |  |
| 6 | `daily_cap` | `integer` | sim | `20` |  |  |
| 7 | `total_cap` | `integer` | sim |  |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `is_on_vacation` | `boolean` | sim | `false` |  |  |
| 10 | `vacation_start` | `date` | sim |  |  |  |
| 11 | `vacation_end` | `date` | sim |  |  |  |
| 12 | `last_assigned_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `assignments_today` | `integer` | sim | `0` |  |  |
| 14 | `assignments_total` | `integer` | sim | `0` |  |  |
| 15 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `profile_user_id` | `uuid` | sim |  |  |  |
| 19 | `name` | `text` | sim |  |  |  |
| 20 | `email` | `text` | sim |  |  |  |
| 21 | `max_leads_day` | `integer` | não | `10` |  |  |
| 22 | `max_leads_total` | `integer` | não | `50` |  |  |
| 23 | `current_lead_count` | `integer` | não | `0` |  |  |
| 24 | `leads_today` | `integer` | não | `0` |  |  |
| 25 | `leads_today_reset_at` | `date` | sim | `CURRENT_DATE` |  |  |
| 26 | `territories` | `text[]` | sim | `'{}'::text[]` |  |  |
| 27 | `specializations` | `text[]` | sim | `'{}'::text[]` |  |  |
| 28 | `manager_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_team_members_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_team_members_role_check | CHECK | `CHECK (role = ANY (ARRAY['sdr'::text, 'closer'::text, 'manager'::text, 'admin'::text]))` |  |  | sim |
| sales_team_members_weight_check | CHECK | `CHECK (weight >= 1 AND weight <= 10)` |  |  | sim |
| unique_member_per_user | UNIQUE | `UNIQUE (user_id, member_user_id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.lead_assignments | lead_assignments_previous_owner_fkey | previous_owner | SET NULL |
| public.redistribution_log | redistribution_log_from_member_id_fkey | from_member_id | SET NULL |
| public.redistribution_log | redistribution_log_to_member_id_fkey | to_member_id | SET NULL |
| public.support_tickets | support_tickets_assigned_to_fkey | assigned_to | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sales_team_user | btree | user_id | não | sim |  | `CREATE INDEX idx_sales_team_user ON public.sales_team_members USING btree (user_id)` |
| sales_team_members_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_team_members_pkey ON public.sales_team_members USING btree (id)` |
| unique_member_per_user | btree | user_id, member_user_id | sim | sim |  | `CREATE UNIQUE INDEX unique_member_per_user ON public.sales_team_members USING btree (user_id, member_user_id)` |


## Policies (RLS)

### `Admins can view all team members`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own team members`

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

### `Users can insert their own team members`

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
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own team members`

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

### `Users can view their own team members`

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
| trg_auto_reset_leads_daily | BEFORE | UPDATE | ROW | enabled | public.auto_reset_leads_on_update |
| trg_singu_sales_team_compat | BEFORE | INSERT OR UPDATE | ROW | enabled | public.singu_sales_team_members_compat |
| update_sales_team_members_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
