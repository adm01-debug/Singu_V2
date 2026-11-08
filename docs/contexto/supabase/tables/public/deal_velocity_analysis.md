# public.deal_velocity_analysis

> Análise de velocidade de fechamento de deals

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_deal_velocity_benchmark |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `user_id` | `uuid` | não |  |  |  |
| 5 | `avg_days_to_close` | `numeric(10,2)` | sim |  |  |  |
| 6 | `current_deal_age` | `integer` | sim |  |  |  |
| 7 | `stage_velocity` | `jsonb` | sim |  |  |  |
| 8 | `vs_team_avg` | `numeric(5,2)` | sim |  |  |  |
| 9 | `vs_segment_avg` | `numeric(5,2)` | sim |  |  |  |
| 10 | `velocity_rating` | `character varying(20)` | sim |  |  |  |
| 11 | `bottleneck_stage` | `character varying(100)` | sim |  |  |  |
| 12 | `recommended_actions` | `text[]` | sim |  |  |  |
| 13 | `analyzed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_velocity_analysis_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| deal_velocity_analysis_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| deal_velocity_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deal_velocity_analysis_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_velocity_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_velocity_analysis_pkey ON public.deal_velocity_analysis USING btree (id)` |
| idx_deal_velocity_analysis_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_deal_velocity_analysis_company_id ON public.deal_velocity_analysis USING btree (company_id)` |
| idx_deal_velocity_analysis_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_deal_velocity_analysis_contact_id ON public.deal_velocity_analysis USING btree (contact_id)` |
| idx_deal_velocity_analysis_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_deal_velocity_analysis_user_id ON public.deal_velocity_analysis USING btree (user_id)` |


## Policies (RLS)

### `deal_velocity_analysis_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `service_full`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| update_deal_velocity_analysis_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
