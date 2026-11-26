# public.customer_events

> Todos os eventos do ciclo de vida do cliente

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
| usada por views | public.vw_empresa_timeline_completa, public.vw_primeiro_ativador, public.vw_quem_ativou, public.vw_quem_inativou, public.vw_rodizio_kpis, public.vw_timeline_cliente, public.vw_timeline_empresa, public.vw_ultimo_inativador |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `customer_id` | `uuid` | não |  |  |  |
| 4 | `data_evento` | `date` | não |  |  |  |
| 5 | `vendedor_id` | `integer` | sim |  |  |  |
| 6 | `executado_por_id` | `integer` | sim |  |  |  |
| 7 | `motivo` | `text` | sim |  |  |  |
| 8 | `observacoes` | `text` | sim |  |  |  |
| 9 | `dados_extras` | `jsonb` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `company_id` | `uuid` | sim |  |  |  |
| 12 | `vendedor_nome` | `text` | sim |  |  |  |
| 13 | `executado_por_nome` | `text` | sim |  |  |  |
| 14 | `evento_tipo` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| customer_events_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| customer_events_customer_id_fkey | FOREIGN KEY | `FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| customer_events_executado_por_id_fkey | FOREIGN KEY | `FOREIGN KEY (executado_por_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| customer_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| customer_events_vendedor_id_fkey | FOREIGN KEY | `FOREIGN KEY (vendedor_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| customer_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX customer_events_pkey ON public.customer_events USING btree (id)` |
| idx_customer_events_executado_por_id | btree | executado_por_id | não | sim |  | `CREATE INDEX idx_customer_events_executado_por_id ON public.customer_events USING btree (executado_por_id)` |
| idx_customer_events_vendedor_id | btree | vendedor_id | não | sim |  | `CREATE INDEX idx_customer_events_vendedor_id ON public.customer_events USING btree (vendedor_id)` |
| idx_events_company | btree | company_id | não | sim |  | `CREATE INDEX idx_events_company ON public.customer_events USING btree (company_id)` |
| idx_events_customer | btree | customer_id | não | sim |  | `CREATE INDEX idx_events_customer ON public.customer_events USING btree (customer_id)` |


## Policies (RLS)

### `customer_events_admin_mfa_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |

### `customer_events_owner_or_admin_mfa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((((customer_id IS NOT NULL) OR (company_id IS NOT NULL)) AND ((customer_id IS NULL) OR (EXISTS ( SELECT 1    FROM (customers cu      JOIN companies co ON ((co.id = cu.company_id)))   WHERE ((cu.id = customer_events.customer_id) AND (co.deleted_at IS NULL) AND (co.user_id = ( SELECT auth.uid() AS uid)))))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies co   WHERE ((co.id = customer_events.company_id) AND (co.deleted_at IS NULL) AND (co.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK |  |

### `customer_events_select_admin`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
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

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
