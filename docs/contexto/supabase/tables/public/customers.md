# public.customers

> Extensão comercial de public.companies para empresas qualificadas como clientes. Armazena carteira, responsável comercial, ativação, histórico agregado de compras e métricas de valor. company_id é UNIQUE e referencia public.companies.id; id é a PK. O soft delete é representado por deleted_at.

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID do registro de cliente; PK, gerado por gen_random_uuid(). |
| 2 | `company_id` | `uuid` | não |  |  | Empresa que este cadastro comercial complementa; FK para public.companies.id e UNIQUE, portanto no máximo um registro customers por empresa. |
| 3 | `ramo_atividade` | `text` | sim |  |  | Ramo de atividade atribuído ao cliente, em texto livre. |
| 4 | `grupo_clientes` | `text` | sim |  |  | Grupo/segmento interno de clientes, em texto livre; valores permitidos não documentados. |
| 5 | `tipo_cooperativa` | `text` | sim |  |  | Tipo de cooperativa atribuído ao cliente; texto sem CHECK local. Para valores e hierarquia da empresa, comparar com companies.tipo_cooperativa. |
| 6 | `perfil_preco` | `text` | sim |  |  | Perfil de preço do cliente em texto; escala/categorias não definidas no schema. |
| 7 | `perfil_qualidade` | `text` | sim |  |  | Perfil de qualidade do cliente em texto; escala/categorias não definidas. |
| 8 | `perfil_prazo` | `text` | sim |  |  | Perfil de prazo do cliente em texto; escala/categorias não definidas. |
| 9 | `poder_compra` | `text` | sim |  |  | Classificação textual do poder de compra; valores e escala não definidos. |
| 10 | `cliente_ativado` | `boolean` | sim | `false` |  | Indica se o cliente foi marcado como ativado; TRUE/FALSE, DEFAULT false. Critério operacional de ativação não está descrito na coluna. |
| 11 | `ja_comprou` | `boolean` | sim | `false` |  | Indica se há registro de compra anterior; TRUE/FALSE, DEFAULT false. |
| 12 | `vendedor_id` | `integer` | sim |  |  | ID integer do vendedor CLOSER atual e proprietário da carteira; FK para public.users.id. |
| 13 | `data_entrada_carteira` | `date` | sim |  |  | Data em que o cliente entrou na carteira comercial. |
| 14 | `observacoes` | `text` | sim |  |  | Observações comerciais em texto livre. |
| 15 | `sobre` | `text` | sim |  |  | Resumo textual sobre o cliente; conteúdo e formato não restringidos pelo schema. |
| 16 | `spa_data` | `jsonb` | sim |  |  | Dados provenientes de SPA armazenados em JSONB; estrutura variável não formalizada. |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do cadastro de cliente no banco; DEFAULT now(). |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada; DEFAULT now(). Atualização automática depende de trigger/aplicação. |
| 19 | `data_primeira_compra` | `date` | sim |  |  | Data da primeira compra fechada; definição indicada no comentário existente. |
| 20 | `data_ultima_compra` | `date` | sim |  |  | Data da compra fechada mais recente; definição indicada no comentário existente. |
| 21 | `total_pedidos` | `integer` | sim | `0` |  | Quantidade total de pedidos, DEFAULT 0; unidade: pedidos. |
| 22 | `valor_total_compras` | `numeric(14,2)` | sim | `0` |  | Valor agregado das compras/LTV, com CHECK para valor não negativo. Moeda e unidade não estão especificadas; não assumir BRL ou centavos sem validar a fonte. |
| 23 | `sdr_id` | `integer` | sim |  |  | ID integer do SDR responsável pela prospecção do cliente, conforme comentário existente; FK para public.users.id. |
| 24 | `data_atribuicao_sdr` | `date` | sim |  |  | Data em que o SDR recebeu o cliente para prospecção. |
| 25 | `vendedor_nome` | `text` | sim |  |  | Nome textual do vendedor armazenado como snapshot; vendedor_id é a chave relacional preferencial. |
| 26 | `sdr_nome` | `text` | sim |  |  | Nome textual do SDR armazenado como snapshot; sdr_id é a chave relacional preferencial. |
| 27 | `data_ativacao` | `date` | sim |  |  | Data de ativação do cliente. |
| 28 | `ativado_por` | `text` | sim |  |  | Identificação textual de quem ou qual processo ativou o cliente; formato não normalizado. |
| 29 | `primeiro_ativador_id` | `integer` | sim |  |  | ID integer do primeiro ativador; a inspeção não apresentou FK para esta coluna. |
| 30 | `primeiro_ativador_nome` | `text` | sim |  |  | Nome textual do primeiro ativador, armazenado como snapshot. |
| 31 | `data_primeira_ativacao` | `date` | sim |  |  | Data da primeira ativação registrada. |
| 32 | `data_inativacao` | `date` | sim |  |  | Data da inativação do cliente. |
| 33 | `inativado_por_id` | `integer` | sim |  |  | ID integer de quem inativou o cliente; FK não declarada na inspeção. |
| 34 | `inativado_por_nome` | `text` | sim |  |  | Nome textual de quem inativou o cliente, armazenado como snapshot. |
| 35 | `motivo_inativacao` | `text` | sim |  |  | Motivo de inativação em texto livre; valores não enumerados. |
| 36 | `ticket_medio` | `numeric(15,2)` | sim | `0` |  | Ticket médio numérico, com CHECK para valor não negativo. Moeda, período de cálculo e método de agregação não estão definidos no schema. |
| 37 | `deleted_at` | `timestamp with time zone` | sim |  |  | Data e hora da exclusão lógica do cadastro de cliente; NULL indica ausência de marca temporal de exclusão. |


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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
