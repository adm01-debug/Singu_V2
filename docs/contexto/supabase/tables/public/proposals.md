# public.proposals

> Propostas comerciais/orçamentos

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
| usada por views | reporting.mv_daily_stats |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `company_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `deal_id` | `uuid` | sim |  |  |  |
| 5 | `user_id` | `uuid` | não |  |  |  |
| 6 | `numero` | `text` | sim |  |  |  |
| 7 | `titulo` | `text` | não |  |  |  |
| 8 | `descricao` | `text` | sim |  |  |  |
| 9 | `valor_total` | `numeric(15,2)` | sim | `0` |  |  |
| 10 | `desconto_percentual` | `numeric(5,2)` | sim | `0` |  |  |
| 11 | `valor_final` | `numeric(15,2)` | sim | `0` |  |  |
| 12 | `status` | `text` | sim | `'rascunho'::text` |  |  |
| 13 | `validade_dias` | `integer` | sim | `30` |  |  |
| 14 | `data_envio` | `timestamp with time zone` | sim |  |  |  |
| 15 | `data_resposta` | `timestamp with time zone` | sim |  |  |  |
| 16 | `motivo_rejeicao` | `text` | sim |  |  |  |
| 17 | `termos_condicoes` | `text` | sim |  |  |  |
| 18 | `itens` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 19 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 20 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 22 | `discount_type` | `text` | sim | `'percentage'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| proposals_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| proposals_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| proposals_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| proposals_discount_type_check | CHECK | `CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text]))` |  |  | sim |
| proposals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| proposals_status_check | CHECK | `CHECK (status = ANY (ARRAY['rascunho'::text, 'enviada'::text, 'visualizada'::text, 'aceita'::text, 'rejeitada'::text, 'expirada'::text]))` |  |  | sim |
| proposals_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_proposals_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_proposals_company_id ON public.proposals USING btree (company_id)` |
| idx_proposals_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_proposals_contact_id ON public.proposals USING btree (contact_id)` |
| idx_proposals_deal | btree | deal_id | não | sim |  | `CREATE INDEX idx_proposals_deal ON public.proposals USING btree (deal_id)` |
| idx_proposals_status | btree | status | não | sim |  | `CREATE INDEX idx_proposals_status ON public.proposals USING btree (status)` |
| idx_proposals_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_proposals_user_id ON public.proposals USING btree (user_id)` |
| proposals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX proposals_pkey ON public.proposals USING btree (id)` |


## Policies (RLS)

### `proposals_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `proposals_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `proposals_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `proposals_update`

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
| trg_audit_proposals | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.track_changes |
| trg_proposals_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_update_deal_on_proposal | AFTER | UPDATE | ROW | enabled | public.trigger_update_deal_on_proposal |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
