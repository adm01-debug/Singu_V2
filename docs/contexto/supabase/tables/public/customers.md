# public.customers

> Dados comerciais de clientes (carteira, vendedor, histórico)

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
| usada por views | public.vw_apelidos_progresso, public.vw_carteira_sdr, public.vw_carteira_vendedores, public.vw_cliente_completo, public.vw_clientes_prioridade, public.vw_companies_stats, public.vw_customers, public.vw_customers_ativos, public.vw_customers_completo, public.vw_dashboard_sdr, public.vw_dashboard_vendedor, public.vw_dashboard_vendedor_v2, public.vw_empresa_historico_completo, public.vw_empresa_timeline_completa, public.vw_grupos_economicos_resumo, public.vw_historico_prospects, public.vw_resumo_diario_vendedor, public.vw_risco_inativacao, public.vw_rodizio_bloqueios, public.vw_rodizio_carga_closers, public.vw_rodizio_carga_sdrs, public.vw_rodizio_kpis, public.vw_status_clientes, public.vw_top_clientes_vendedor, reporting.mv_daily_kpis |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `company_id` | `uuid` | não |  |  |  |
| 3 | `ramo_atividade` | `text` | sim |  |  |  |
| 4 | `grupo_clientes` | `text` | sim |  |  |  |
| 5 | `tipo_cooperativa` | `text` | sim |  |  |  |
| 6 | `perfil_preco` | `text` | sim |  |  |  |
| 7 | `perfil_qualidade` | `text` | sim |  |  |  |
| 8 | `perfil_prazo` | `text` | sim |  |  |  |
| 9 | `poder_compra` | `text` | sim |  |  |  |
| 10 | `cliente_ativado` | `boolean` | sim | `false` |  |  |
| 11 | `ja_comprou` | `boolean` | sim | `false` |  |  |
| 12 | `vendedor_id` | `integer` | sim |  |  | Vendedor CLOSER atual (proprietário da carteira) |
| 13 | `data_entrada_carteira` | `date` | sim |  |  |  |
| 14 | `observacoes` | `text` | sim |  |  |  |
| 15 | `sobre` | `text` | sim |  |  |  |
| 16 | `spa_data` | `jsonb` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 19 | `data_primeira_compra` | `date` | sim |  |  | Data do primeiro pedido fechado |
| 20 | `data_ultima_compra` | `date` | sim |  |  | Data do último pedido fechado |
| 21 | `total_pedidos` | `integer` | sim | `0` |  | Quantidade total de pedidos |
| 22 | `valor_total_compras` | `numeric(14,2)` | sim | `0` |  | Valor total de todas as compras (LTV) |
| 23 | `sdr_id` | `integer` | sim |  |  | SDR responsável por prospectar este cliente (se inativo) |
| 24 | `data_atribuicao_sdr` | `date` | sim |  |  | Data que o SDR recebeu este cliente para prospecção |
| 25 | `vendedor_nome` | `text` | sim |  |  |  |
| 26 | `sdr_nome` | `text` | sim |  |  |  |
| 27 | `data_ativacao` | `date` | sim |  |  |  |
| 28 | `ativado_por` | `text` | sim |  |  |  |
| 29 | `primeiro_ativador_id` | `integer` | sim |  |  |  |
| 30 | `primeiro_ativador_nome` | `text` | sim |  |  |  |
| 31 | `data_primeira_ativacao` | `date` | sim |  |  |  |
| 32 | `data_inativacao` | `date` | sim |  |  |  |
| 33 | `inativado_por_id` | `integer` | sim |  |  |  |
| 34 | `inativado_por_nome` | `text` | sim |  |  |  |
| 35 | `motivo_inativacao` | `text` | sim |  |  |  |
| 36 | `ticket_medio` | `numeric(15,2)` | sim | `0` |  |  |
| 37 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_customers_ticket_medio | CHECK | `CHECK (ticket_medio IS NULL OR ticket_medio >= 0::numeric)` |  |  | sim |
| chk_customers_valor_total | CHECK | `CHECK (valor_total_compras IS NULL OR valor_total_compras >= 0::numeric)` |  |  | sim |
| customers_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| customers_company_id_key | UNIQUE | `UNIQUE (company_id)` |  |  | sim |
| customers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| customers_sdr_id_fkey | FOREIGN KEY | `FOREIGN KEY (sdr_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| customers_vendedor_id_fkey | FOREIGN KEY | `FOREIGN KEY (vendedor_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.alertas_inativacao | alertas_inativacao_customer_id_fkey | customer_id | CASCADE |
| public.customer_events | customer_events_customer_id_fkey | customer_id | CASCADE |
| public.customer_ownership_history | customer_ownership_history_customer_id_fkey | customer_id | CASCADE |
| public.customer_purchases | customer_purchases_customer_id_fkey | customer_id | NO ACTION |
| public.customer_rotation_state | customer_rotation_state_customer_id_fkey | customer_id | NO ACTION |
| public.customer_sdr_history | customer_sdr_history_customer_id_fkey | customer_id | CASCADE |
| public.rodizio_distribuicao_staging | rodizio_distribuicao_staging_customer_id_fkey | customer_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| customers_company_id_key | btree | company_id | sim | sim |  | `CREATE UNIQUE INDEX customers_company_id_key ON public.customers USING btree (company_id)` |
| customers_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id)` |
| idx_customers_active | btree | id | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_customers_active ON public.customers USING btree (id) WHERE (deleted_at IS NULL)` |
| idx_customers_ativado | btree | id | não | sim | `(cliente_ativado = true)` | `CREATE INDEX idx_customers_ativado ON public.customers USING btree (id) WHERE (cliente_ativado = true)` |
| idx_customers_ja_comprou | btree | id | não | sim | `(ja_comprou = true)` | `CREATE INDEX idx_customers_ja_comprou ON public.customers USING btree (id) WHERE (ja_comprou = true)` |
| idx_customers_sdr_id | btree | sdr_id | não | sim |  | `CREATE INDEX idx_customers_sdr_id ON public.customers USING btree (sdr_id)` |
| idx_customers_updated_at | btree | updated_at | não | sim |  | `CREATE INDEX idx_customers_updated_at ON public.customers USING btree (updated_at)` |
| idx_customers_vendedor | btree | vendedor_id | não | sim |  | `CREATE INDEX idx_customers_vendedor ON public.customers USING btree (vendedor_id)` |
| idx_customers_vendedor_ativo | btree | vendedor_id, cliente_ativado | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_customers_vendedor_ativo ON public.customers USING btree (vendedor_id, cliente_ativado) WHERE (deleted_at IS NULL)` |


## Policies (RLS)

### `customers_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |

### `customers_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |

### `customers_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |

### `customers_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_customers | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_func |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| sync_customers_flag | AFTER | INSERT OR DELETE | ROW | enabled | public.sync_company_type_flags |


## Grants

_nenhum_
