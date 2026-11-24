# public.deals

> Registro de oportunidade de venda do CRM. Cada linha representa um negócio vinculado opcionalmente a uma empresa e a um contato, com valor, etapa, probabilidade e previsão de fechamento. O status possui domínio fechado e os itens do negócio são relacionados em public.deal_items. Chaves principais: id; company_id → public.companies.id; contact_id → public.contacts.id; user_id → public.profiles.id; loss_reason_id → public.loss_reasons.id.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 8 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.v_company_summary, public.v_daily_kpis, public.v_deal_summary, public.v_pipeline_summary, reporting.mv_daily_stats |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID interno e chave primária da oportunidade; gerado por gen_random_uuid(). |
| 2 | `company_id` | `uuid` | sim |  |  | Empresa relacionada à oportunidade; FK para public.companies.id. Nulo quando não vinculada a empresa. |
| 3 | `contact_id` | `uuid` | sim |  |  | Contato principal relacionado à oportunidade; FK para public.contacts.id. Nulo quando não há contato associado. |
| 4 | `user_id` | `uuid` | não |  |  | Usuário responsável/proprietário da oportunidade; FK para public.profiles.id. |
| 5 | `titulo` | `text` | não |  |  | Título de exibição da oportunidade; texto obrigatório. |
| 6 | `valor` | `numeric(15,2)` | sim | `0` |  | Valor nominal estimado da oportunidade; numeric, DEFAULT 0. A moeda e a unidade (reais ou centavos) não estão definidas no schema; não converter nem agregar como moeda confirmada sem validar a origem. |
| 7 | `status` | `text` | sim | `'aberto'::text` |  | Estado comercial da oportunidade: aberto, negociando, proposta, ganho, perdido ou arquivado. DEFAULT aberto. Usar este campo para distinguir negócios ganhos/perdidos de negócios ainda em andamento. |
| 8 | `pipeline_stage` | `text` | sim | `'lead'::text` |  | Nome/código textual da etapa atual do pipeline; DEFAULT lead. Não há FK nem domínio fechado nesta coluna; não confundir automaticamente com public.pipeline_stages. |
| 9 | `probabilidade` | `integer` | sim | `50` |  | Probabilidade percentual inteira de fechamento, de 0 a 100 conforme CHECK; DEFAULT 50. Representa percentual, não fração decimal. |
| 10 | `previsao_fechamento` | `date` | sim |  |  | Data prevista para fechamento, sem horário; date. |
| 11 | `motivo_perda` | `text` | sim |  |  | Descrição textual do motivo de perda; texto livre. Para referência normalizada, verificar loss_reason_id. |
| 12 | `notas` | `text` | sim |  |  | Observações livres associadas à oportunidade. |
| 13 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  | Atributos complementares da oportunidade em JSONB; DEFAULT objeto vazio. As chaves internas não são formalizadas no schema. |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação da oportunidade no banco; timestamptz, DEFAULT now(). |
| 15 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada; timestamptz, DEFAULT now(). Atualização automática depende de trigger ou da aplicação. |
| 16 | `closed_at` | `timestamp with time zone` | sim |  |  | Data e hora em que a oportunidade foi encerrada, quando disponível; não determina sozinha se foi ganha ou perdida. |
| 17 | `loss_reason_id` | `uuid` | sim |  |  | Motivo de perda normalizado; FK para public.loss_reasons.id. Aplicável principalmente quando status = perdido. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deals_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| deals_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| deals_loss_reason_id_fkey | FOREIGN KEY | `FOREIGN KEY (loss_reason_id) REFERENCES loss_reasons(id)` | NO ACTION | NO ACTION | sim |
| deals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deals_probabilidade_check | CHECK | `CHECK (probabilidade >= 0 AND probabilidade <= 100)` |  |  | sim |
| deals_status_check | CHECK | `CHECK (status = ANY (ARRAY['aberto'::text, 'negociando'::text, 'proposta'::text, 'ganho'::text, 'perdido'::text, 'arquivado'::text]))` |  |  | sim |
| deals_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.calendar_events | calendar_events_deal_id_fkey | deal_id | NO ACTION |
| public.commissions | commissions_deal_id_fkey | deal_id | SET NULL |
| public.competitive_losses | competitive_losses_deal_id_fkey | deal_id | CASCADE |
| public.deal_competitors | deal_competitors_deal_id_fkey | deal_id | CASCADE |
| public.deal_items | deal_items_deal_id_fkey | deal_id | CASCADE |
| public.meetings | meetings_deal_id_fkey | deal_id | SET NULL |
| public.proposals | proposals_deal_id_fkey | deal_id | SET NULL |
| public.tasks | tasks_deal_id_fkey | deal_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deals_pkey ON public.deals USING btree (id)` |
| idx_deals_company | btree | company_id | não | sim |  | `CREATE INDEX idx_deals_company ON public.deals USING btree (company_id)` |
| idx_deals_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_deals_contact_id ON public.deals USING btree (contact_id)` |
| idx_deals_created | btree | created_at | não | sim |  | `CREATE INDEX idx_deals_created ON public.deals USING btree (created_at)` |
| idx_deals_loss_reason_id | btree | loss_reason_id | não | sim |  | `CREATE INDEX idx_deals_loss_reason_id ON public.deals USING btree (loss_reason_id)` |
| idx_deals_status | btree | status | não | sim |  | `CREATE INDEX idx_deals_status ON public.deals USING btree (status)` |
| idx_deals_user | btree | user_id | não | sim |  | `CREATE INDEX idx_deals_user ON public.deals USING btree (user_id)` |


## Policies (RLS)

### `Users can delete their own deals`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert their own deals`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own deals`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own deals`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `deals_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `deals_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `deals_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `deals_update`

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
| trg_audit_deals | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.track_changes |
| trg_deal_status_change | AFTER | UPDATE | ROW | enabled | public.log_deal_status_change |
| trg_deals_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at |
| trg_log_deal_activity | AFTER | INSERT OR UPDATE | ROW | enabled | public.trigger_log_deal_activity |
| trg_mark_customer | AFTER | UPDATE | ROW | enabled | public.mark_customer_on_deal_won |
| trg_notify_deal_changes | AFTER | UPDATE | ROW | enabled | public.trigger_notify_deal_changes |
| update_deals_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
