# public.alerts

> Sistema de alertas e notificações

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 9 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_carrier_alerts, public.vw_singu_readiness, public.vw_supplier_alerts |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `interaction_id` | `uuid` | sim |  |  |  |
| 6 | `type` | `text` | não |  |  |  |
| 7 | `priority` | `text` | sim | `'medium'::text` |  |  |
| 8 | `title` | `text` | não |  |  |  |
| 9 | `message` | `text` | não |  |  |  |
| 10 | `action_type` | `text` | sim |  |  |  |
| 11 | `action_url` | `text` | sim |  |  |  |
| 12 | `action_data` | `jsonb` | sim |  |  |  |
| 13 | `status` | `text` | sim | `'pending'::text` |  |  |
| 14 | `snoozed_until` | `timestamp with time zone` | sim |  |  |  |
| 15 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `read_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `actioned_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 19 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 21 | `description` | `text` | sim |  |  |  |
| 22 | `dismissed` | `boolean` | sim | `false` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| alerts_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| alerts_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| alerts_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| alerts_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |
| alerts_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'read'::text, 'actioned'::text, 'dismissed'::text, 'snoozed'::text]))` |  |  | sim |
| alerts_type_check | CHECK | `CHECK (type = ANY (ARRAY['relationship_risk'::text, 'follow_up_due'::text, 'birthday_reminder'::text, 'inactivity_warning'::text, 'sentiment_drop'::text, 'opportunity'::text, 'disc_insight'::text, 'life_event'::text, 'engagement_spike'::text, 'churn_risk'::text, 'upsell_opportunity'::text, 'referral_opportunity'::text, 'system'::text, 'custom'::text, 'supplier_score_baixo'::text, 'supplier_destaque'::text, 'supplier_homologacao_vencendo'::text, 'supplier_homologacao_vencida'::text, 'supplier_nao_homologado'::text, 'carrier_score_baixo'::text, 'carrier_destaque'::text, 'carrier_homologacao_vencendo'::text, 'carrier_homologacao_vencida'::text, 'carrier_nao_homologado'::text]))` |  |  | sim |
| alerts_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX alerts_pkey ON public.alerts USING btree (id)` |
| idx_alerts_active | btree | contact_id, user_id | não | sim | `(dismissed = false)` | `CREATE INDEX idx_alerts_active ON public.alerts USING btree (contact_id, user_id) WHERE (dismissed = false)` |
| idx_alerts_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_alerts_company_id ON public.alerts USING btree (company_id)` |
| idx_alerts_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_alerts_contact_id ON public.alerts USING btree (contact_id)` |
| idx_alerts_dismissed | btree | dismissed | não | sim | `(dismissed = false)` | `CREATE INDEX idx_alerts_dismissed ON public.alerts USING btree (dismissed) WHERE (dismissed = false)` |
| idx_alerts_interaction_id | btree | interaction_id | não | sim |  | `CREATE INDEX idx_alerts_interaction_id ON public.alerts USING btree (interaction_id)` |
| idx_alerts_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_alerts_user_id ON public.alerts USING btree (user_id)` |


## Policies (RLS)

### `Users can delete their own alerts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `service_role_full_alerts`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `singu_alerts_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `singu_alerts_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `singu_alerts_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `singu_alerts_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
