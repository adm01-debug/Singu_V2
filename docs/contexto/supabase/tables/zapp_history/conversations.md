# zapp_history.conversations

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | full |
| vem de extensão | não |
| usada por views | zapp_history.v_churn_alerts, zapp_history.v_contact_360, zapp_history.v_conversas_aguardando, zapp_history.v_dashboard_atendimento, zapp_history.v_intelligence_360, zapp_history.v_pedidos_detectados, zapp_history.v_proximas_respostas, zapp_history.v_sla_atendimento, zapp_history.v_spam_log, zapp_history.v_top_contatos_potencial |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `whatsapp_connection_id` | `uuid` | sim |  |  |  |
| 5 | `remote_jid` | `text` | não |  |  | JID do WhatsApp (ex: 5511999999999@s.whatsapp.net ou xxx@g.us para grupos). |
| 6 | `is_group` | `boolean` | não | `false` |  |  |
| 7 | `group_subject` | `text` | sim |  |  |  |
| 8 | `group_participants` | `jsonb` | sim |  |  |  |
| 9 | `status` | `text` | não | `'open'::text` |  | open \| pending \| resolved \| archived \| spam |
| 10 | `assigned_to` | `uuid` | sim |  |  |  |
| 11 | `queue` | `text` | sim |  |  |  |
| 12 | `priority` | `text` | sim | `'normal'::text` |  |  |
| 13 | `last_message_at` | `timestamp with time zone` | sim |  |  | Atualizado automaticamente pelo trigger trg_bump_conversation_on_message. |
| 14 | `last_message_preview` | `text` | sim |  |  |  |
| 15 | `last_message_type` | `text` | sim |  |  |  |
| 16 | `unread_count` | `integer` | não | `0` |  | Incrementado em mensagens inbound. Front zera quando lê. Não decrementado por trigger. |
| 17 | `total_messages` | `integer` | não | `0` |  |  |
| 18 | `opened_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `first_response_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `first_response_time_seconds` | `integer` | sim |  |  |  |
| 22 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 24 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 25 | `first_inbound_at` | `timestamp with time zone` | sim |  |  |  |
| 26 | `first_outbound_at` | `timestamp with time zone` | sim |  |  |  |
| 27 | `first_response_seconds` | `integer` | sim |  |  |  |
| 28 | `avg_response_seconds` | `integer` | sim |  |  |  |
| 29 | `sla_status` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_conv_counts_positive | CHECK | `CHECK (unread_count >= 0 AND total_messages >= 0)` |  |  | sim |
| chk_conv_status_valid | CHECK | `CHECK (status = ANY (ARRAY['open'::text, 'pending'::text, 'resolved'::text, 'archived'::text, 'closed'::text]))` |  |  | sim |
| conversations_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| conversations_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| conversations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conversations_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))` |  |  | sim |
| conversations_status_check | CHECK | `CHECK (status = ANY (ARRAY['open'::text, 'pending'::text, 'resolved'::text, 'archived'::text, 'spam'::text]))` |  |  | sim |
| conversations_whatsapp_connection_id_fkey | FOREIGN KEY | `FOREIGN KEY (whatsapp_connection_id) REFERENCES zapp_history.whatsapp_connections(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| unique_contact_connection | UNIQUE | `UNIQUE (contact_id, whatsapp_connection_id, remote_jid)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| zapp_history.ai_training_dataset | ai_training_dataset_conversation_id_fkey | conversation_id | SET NULL |
| zapp_history.conversation_daily_summaries | conversation_daily_summaries_conversation_id_fkey | conversation_id | SET NULL |
| zapp_history.message_audio | message_audio_conversation_id_fkey | conversation_id | SET NULL |
| zapp_history.message_links | message_links_conversation_id_fkey | conversation_id | SET NULL |
| zapp_history.message_media | message_media_conversation_id_fkey | conversation_id | SET NULL |
| zapp_history.messages | messages_conversation_id_fkey | conversation_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conversations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conversations_pkey ON zapp_history.conversations USING btree (id)` |
| idx_conv_wpp_conn | btree | whatsapp_connection_id | não | sim |  | `CREATE INDEX idx_conv_wpp_conn ON zapp_history.conversations USING btree (whatsapp_connection_id)` |
| idx_conversations_company | btree | company_id, last_message_at | não | sim |  | `CREATE INDEX idx_conversations_company ON zapp_history.conversations USING btree (company_id, last_message_at DESC NULLS LAST)` |
| idx_conversations_contact | btree | contact_id, last_message_at | não | sim |  | `CREATE INDEX idx_conversations_contact ON zapp_history.conversations USING btree (contact_id, last_message_at DESC NULLS LAST)` |
| idx_conversations_remote_jid | btree | remote_jid | não | sim |  | `CREATE INDEX idx_conversations_remote_jid ON zapp_history.conversations USING btree (remote_jid)` |
| idx_conversations_status | btree | status, last_message_at | não | sim |  | `CREATE INDEX idx_conversations_status ON zapp_history.conversations USING btree (status, last_message_at DESC NULLS LAST)` |
| unique_contact_connection | btree | contact_id, whatsapp_connection_id, remote_jid | sim | sim |  | `CREATE UNIQUE INDEX unique_contact_connection ON zapp_history.conversations USING btree (contact_id, whatsapp_connection_id, remote_jid)` |


## Policies (RLS)

### `conv_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `zapp_history.user_can_access_contact(contact_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_conversations_updated_at | BEFORE | UPDATE | ROW | enabled | zapp_history.update_updated_at_column |


## Grants

_nenhum_
