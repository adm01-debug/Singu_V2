# public.customer_ownership_history

> Histórico de qual vendedor foi dono de cada cliente

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_historico_carteira, public.vw_historico_carteira_empresa, public.vw_historico_prospects, public.vw_rodizio_kpis |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `customer_id` | `uuid` | não |  |  |  |
| 3 | `vendedor_id` | `integer` | não |  |  |  |
| 4 | `data_inicio` | `date` | não |  |  |  |
| 5 | `data_fim` | `date` | sim |  |  |  |
| 8 | `registrado_por_id` | `integer` | sim |  |  |  |
| 9 | `observacoes` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `company_id` | `uuid` | sim |  |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `registrado_por_nome` | `text` | sim |  |  |  |
| 14 | `motivo_saida` | `text` | sim |  |  |  |
| 15 | `motivo_entrada` | `text` | sim |  |  |  |
| 16 | `vendedor_nome` | `text` | sim |  |  |  |
| 17 | `ciclo` | `integer` | sim |  |  |  |
| 18 | `posicao_no_ciclo` | `integer` | sim |  |  |  |
| 19 | `execucao_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| customer_ownership_history_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| customer_ownership_history_customer_id_fkey | FOREIGN KEY | `FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| customer_ownership_history_execucao_id_fkey | FOREIGN KEY | `FOREIGN KEY (execucao_id) REFERENCES rodizio_execucoes(id)` | NO ACTION | NO ACTION | sim |
| customer_ownership_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| customer_ownership_history_registrado_por_id_fkey | FOREIGN KEY | `FOREIGN KEY (registrado_por_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| customer_ownership_history_vendedor_id_fkey | FOREIGN KEY | `FOREIGN KEY (vendedor_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| customer_ownership_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX customer_ownership_history_pkey ON public.customer_ownership_history USING btree (id)` |
| idx_customer_ownership_history_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_customer_ownership_history_company_id ON public.customer_ownership_history USING btree (company_id)` |
| idx_customer_ownership_history_customer_id | btree | customer_id | não | sim |  | `CREATE INDEX idx_customer_ownership_history_customer_id ON public.customer_ownership_history USING btree (customer_id)` |
| idx_customer_ownership_history_registrado_por_id | btree | registrado_por_id | não | sim |  | `CREATE INDEX idx_customer_ownership_history_registrado_por_id ON public.customer_ownership_history USING btree (registrado_por_id)` |
| idx_customer_ownership_history_vendedor_id | btree | vendedor_id | não | sim |  | `CREATE INDEX idx_customer_ownership_history_vendedor_id ON public.customer_ownership_history USING btree (vendedor_id)` |


## Policies (RLS)

### `customer_ownership_history_admin_mfa_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |
| WITH CHECK |  |

### `customer_ownership_history_admin_mfa_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |

### `customer_ownership_history_admin_mfa_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |
| WITH CHECK | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |

### `customer_ownership_history_owner_or_admin_mfa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((((customer_id IS NOT NULL) OR (company_id IS NOT NULL)) AND ((customer_id IS NULL) OR (EXISTS ( SELECT 1    FROM (customers cu      JOIN companies co ON ((co.id = cu.company_id)))   WHERE ((cu.id = customer_ownership_history.customer_id) AND (co.deleted_at IS NULL) AND (co.user_id = ( SELECT auth.uid() AS uid)))))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies co   WHERE ((co.id = customer_ownership_history.company_id) AND (co.deleted_at IS NULL) AND (co.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK |  |

### `customer_ownership_history_select_admin`

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

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
