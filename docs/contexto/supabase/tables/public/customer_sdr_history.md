# public.customer_sdr_history

> Histórico de prospecção SDR ↔ Cliente

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_dashboard_sdr, public.vw_historico_sdr_empresa |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `customer_id` | `uuid` | não |  |  |  |
| 3 | `sdr_id` | `integer` | não |  |  |  |
| 4 | `data_inicio` | `date` | não |  |  |  |
| 5 | `data_fim` | `date` | sim |  |  |  |
| 6 | `resultado` | `text` | sim |  |  |  |
| 7 | `closer_destino_id` | `integer` | sim |  |  |  |
| 8 | `data_passagem_closer` | `date` | sim |  |  |  |
| 9 | `qtd_tentativas_contato` | `integer` | sim | `0` |  |  |
| 10 | `qtd_conversas` | `integer` | sim | `0` |  |  |
| 11 | `observacoes` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `company_id` | `uuid` | sim |  |  |  |
| 15 | `sdr_nome` | `text` | sim |  |  |  |
| 16 | `passed_to_closer_nome` | `text` | sim |  |  |  |
| 17 | `passed_to_closer_id` | `integer` | sim |  |  |  |
| 18 | `data_atribuicao` | `date` | sim |  |  |  |
| 19 | `ciclo` | `integer` | sim |  |  |  |
| 20 | `posicao_no_ciclo` | `integer` | sim |  |  |  |
| 21 | `execucao_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| customer_sdr_history_closer_destino_id_fkey | FOREIGN KEY | `FOREIGN KEY (closer_destino_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| customer_sdr_history_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| customer_sdr_history_customer_id_fkey | FOREIGN KEY | `FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| customer_sdr_history_execucao_id_fkey | FOREIGN KEY | `FOREIGN KEY (execucao_id) REFERENCES rodizio_execucoes(id)` | NO ACTION | NO ACTION | sim |
| customer_sdr_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| customer_sdr_history_resultado_check | CHECK | `CHECK (resultado = ANY (ARRAY['EM_ANDAMENTO'::text, 'QUALIFICADO'::text, 'REATIVADO'::text, 'SEM_INTERESSE'::text, 'SEM_CONTATO'::text, 'TRANSFERIDO'::text]))` |  |  | sim |
| customer_sdr_history_sdr_id_fkey | FOREIGN KEY | `FOREIGN KEY (sdr_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| customer_sdr_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX customer_sdr_history_pkey ON public.customer_sdr_history USING btree (id)` |
| idx_customer_sdr_history_closer_destino_id | btree | closer_destino_id | não | sim |  | `CREATE INDEX idx_customer_sdr_history_closer_destino_id ON public.customer_sdr_history USING btree (closer_destino_id)` |
| idx_customer_sdr_history_customer_id | btree | customer_id | não | sim |  | `CREATE INDEX idx_customer_sdr_history_customer_id ON public.customer_sdr_history USING btree (customer_id)` |
| idx_customer_sdr_history_sdr_id | btree | sdr_id | não | sim |  | `CREATE INDEX idx_customer_sdr_history_sdr_id ON public.customer_sdr_history USING btree (sdr_id)` |
| idx_sdr_history_company | btree | company_id | não | sim |  | `CREATE INDEX idx_sdr_history_company ON public.customer_sdr_history USING btree (company_id)` |


## Policies (RLS)

### `admin_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |

### `admin_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |

### `admin_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |

### `read_only_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
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
