# _dormant.alertas_inativacao

> Alertas de risco de inativação de clientes

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_alertas_pendentes_vendedor, public.vw_alertas_vendedor, public.vw_historico_alertas, public.vw_resumo_alertas_vendedor |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `customer_id` | `uuid` | não |  |  |  |
| 3 | `company_id` | `uuid` | não |  |  |  |
| 4 | `vendedor_id` | `integer` | sim |  |  |  |
| 5 | `vendedor_nome` | `text` | sim |  |  |  |
| 6 | `tipo_alerta` | `text` | não |  |  |  |
| 7 | `severidade` | `integer` | não |  |  |  |
| 8 | `dias_sem_compra` | `integer` | não |  |  |  |
| 9 | `dias_para_inativar` | `integer` | sim |  |  |  |
| 10 | `valor_em_risco` | `numeric(15,2)` | sim |  |  |  |
| 11 | `titulo` | `text` | não |  |  |  |
| 12 | `mensagem` | `text` | sim |  |  |  |
| 13 | `acao_sugerida` | `text` | sim |  |  |  |
| 14 | `status` | `text` | não | `'PENDENTE'::text` |  |  |
| 15 | `resolvido_em` | `timestamp with time zone` | sim |  |  |  |
| 16 | `resolvido_por_id` | `integer` | sim |  |  |  |
| 17 | `resolvido_por_nome` | `text` | sim |  |  |  |
| 18 | `observacao_resolucao` | `text` | sim |  |  |  |
| 19 | `data_referencia` | `date` | não | `CURRENT_DATE` |  |  |
| 20 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| alertas_inativacao_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| alertas_inativacao_customer_id_fkey | FOREIGN KEY | `FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| alertas_inativacao_customer_id_tipo_alerta_data_referencia_key | UNIQUE | `UNIQUE (customer_id, tipo_alerta, data_referencia)` |  |  | sim |
| alertas_inativacao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| alertas_inativacao_severidade_check | CHECK | `CHECK (severidade >= 1 AND severidade <= 3)` |  |  | sim |
| alertas_inativacao_status_check | CHECK | `CHECK (status = ANY (ARRAY['PENDENTE'::text, 'VISTO'::text, 'EM_ANDAMENTO'::text, 'RESOLVIDO'::text, 'IGNORADO'::text, 'EXPIRADO'::text]))` |  |  | sim |
| alertas_inativacao_tipo_alerta_check | CHECK | `CHECK (tipo_alerta = ANY (ARRAY['RISCO'::text, 'CRITICO'::text, 'INATIVAR'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| alertas_inativacao_customer_id_tipo_alerta_data_referencia_key | btree | customer_id, tipo_alerta, data_referencia | sim | sim |  | `CREATE UNIQUE INDEX alertas_inativacao_customer_id_tipo_alerta_data_referencia_key ON _dormant.alertas_inativacao USING btree (customer_id, tipo_alerta, data_referencia)` |
| alertas_inativacao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX alertas_inativacao_pkey ON _dormant.alertas_inativacao USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
