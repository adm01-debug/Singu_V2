# public.campaigns

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `type` | `text` | sim | `'email'::text` |  |  |
| 5 | `status` | `text` | sim | `'draft'::text` |  |  |
| 6 | `target_segment_id` | `uuid` | sim |  |  |  |
| 7 | `start_date` | `date` | sim |  |  |  |
| 8 | `end_date` | `date` | sim |  |  |  |
| 9 | `budget` | `numeric` | sim | `0` |  |  |
| 10 | `created_by` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaigns_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| campaigns_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| chk_campaigns_status | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text, 'archived'::text]))` |  |  | sim |
| chk_campaigns_type | CHECK | `CHECK (type = ANY (ARRAY['email'::text, 'sms'::text, 'whatsapp'::text, 'push'::text, 'in_app'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.campaign_members | campaign_members_campaign_id_fkey | campaign_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaigns_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX campaigns_pkey ON public.campaigns USING btree (id)` |
| idx_campaigns_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_campaigns_created_by ON public.campaigns USING btree (created_by)` |
| idx_campaigns_status | btree | status | não | sim |  | `CREATE INDEX idx_campaigns_status ON public.campaigns USING btree (status)` |


## Policies (RLS)

### `Authenticated read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_campaigns_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
