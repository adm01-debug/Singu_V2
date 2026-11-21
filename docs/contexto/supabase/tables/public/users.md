# public.users

> Usuários/colaboradores sincronizados do Bitrix24

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.users_public, public.vw_carrier_evaluations_history, public.vw_carrier_homologation_control, public.vw_carriers_completo, public.vw_carteira_vendedores, public.vw_customers_completo, public.vw_dashboard_sdr, public.vw_dashboard_vendedor, public.vw_dashboard_vendedor_v2, public.vw_historico_prospects, public.vw_historico_sdr_closer, public.vw_historico_sdr_empresa, public.vw_resumo_diario_vendedor, public.vw_risco_inativacao, public.vw_rodizio_bloqueios, public.vw_rodizio_carga_closers, public.vw_rodizio_carga_sdrs, public.vw_rodizio_execucoes, public.vw_rodizio_kpis, public.vw_sdr_closer_atual, public.vw_sdr_qtd_closers, public.vw_status_clientes, public.vw_supplier_evaluations_history, public.vw_supplier_homologation_control |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `integer` | não |  |  | ID original do Bitrix24 (mantido como PK) |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `email` | `text` | sim |  |  |  |
| 4 | `cargo` | `text` | sim |  |  |  |
| 5 | `departamento` | `text` | sim |  |  |  |
| 6 | `is_active` | `boolean` | sim | `true` |  |  |
| 7 | `is_vendedor` | `boolean` | sim | `false` |  | TRUE se é vendedor/closer (carteira de clientes) |
| 8 | `is_sdr` | `boolean` | sim | `false` |  |  |
| 9 | `bitrix_data` | `jsonb` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `participa_rodizio_closer` | `boolean` | não | `false` |  |  |
| 13 | `participa_rodizio_sdr` | `boolean` | não | `false` |  |  |
| 14 | `ordem_rodizio` | `integer` | sim |  |  |  |
| 15 | `capacidade_max` | `integer` | sim |  |  |  |
| 16 | `afastado_ate` | `date` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| users_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.carrier_evaluations | carrier_evaluations_avaliador_id_fkey | avaliador_id | NO ACTION |
| public.carrier_homologations | carrier_homologations_avaliador_id_fkey | avaliador_id | NO ACTION |
| public.companies | companies_created_by_id_fkey | created_by_id | NO ACTION |
| public.contact_addresses | contact_addresses_created_by_fkey | created_by | NO ACTION |
| public.contact_addresses | contact_addresses_updated_by_fkey | updated_by | NO ACTION |
| public.contacts | contacts_assigned_by_id_fkey | assigned_by_id | NO ACTION |
| public.customer_events | customer_events_executado_por_id_fkey | executado_por_id | NO ACTION |
| public.customer_events | customer_events_vendedor_id_fkey | vendedor_id | NO ACTION |
| public.customer_ownership_history | customer_ownership_history_registrado_por_id_fkey | registrado_por_id | NO ACTION |
| public.customer_ownership_history | customer_ownership_history_vendedor_id_fkey | vendedor_id | NO ACTION |
| public.customer_purchases | customer_purchases_sdr_credito_id_fkey | sdr_credito_id | NO ACTION |
| public.customer_purchases | customer_purchases_vendedor_credito_id_fkey | vendedor_credito_id | NO ACTION |
| public.customer_purchases | customer_purchases_vendedor_id_fkey | vendedor_id | NO ACTION |
| public.customer_rotation_state | customer_rotation_state_bloqueado_por_id_fkey | bloqueado_por_id | NO ACTION |
| public.customer_rotation_state | customer_rotation_state_bloqueio_aprovado_por_id_fkey | bloqueio_aprovado_por_id | NO ACTION |
| public.customer_sdr_history | customer_sdr_history_closer_destino_id_fkey | closer_destino_id | NO ACTION |
| public.customer_sdr_history | customer_sdr_history_sdr_id_fkey | sdr_id | NO ACTION |
| public.customers | customers_sdr_id_fkey | sdr_id | NO ACTION |
| public.customers | customers_vendedor_id_fkey | vendedor_id | NO ACTION |
| public.interactions | interactions_usuario_responsavel_id_fkey | usuario_responsavel_id | NO ACTION |
| public.profiles | profiles_bitrix_user_id_fkey | bitrix_user_id | NO ACTION |
| public.rodizio_distribuicao_staging | rodizio_distribuicao_staging_aprovado_por_id_fkey | aprovado_por_id | NO ACTION |
| public.rodizio_distribuicao_staging | rodizio_distribuicao_staging_closer_destino_id_fkey | closer_destino_id | NO ACTION |
| public.rodizio_distribuicao_staging | rodizio_distribuicao_staging_criado_por_id_fkey | criado_por_id | NO ACTION |
| public.rodizio_distribuicao_staging | rodizio_distribuicao_staging_sdr_destino_id_fkey | sdr_destino_id | NO ACTION |
| public.rodizio_execucoes | rodizio_execucoes_executado_por_id_fkey | executado_por_id | NO ACTION |
| public.sdr_closer_assignments | sdr_closer_assignments_closer_id_fkey | closer_id | NO ACTION |
| public.sdr_closer_assignments | sdr_closer_assignments_criado_por_id_fkey | criado_por_id | NO ACTION |
| public.sdr_closer_assignments | sdr_closer_assignments_sdr_id_fkey | sdr_id | NO ACTION |
| public.supplier_evaluations | supplier_evaluations_avaliador_id_fkey | avaliador_id | NO ACTION |
| public.supplier_homologations | supplier_homologations_avaliador_id_fkey | avaliador_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| users_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)` |


## Policies (RLS)

### `admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |

### `admin_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |

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
