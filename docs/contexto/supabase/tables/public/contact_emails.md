# public.contact_emails

> Endereços de e-mail associados a contatos, permitindo múltiplos e-mails tipados e sinalização de principal/verificado. Cada registro referencia public.contacts.id.

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
| usada por views | public.v_contact_summary, public.vw_best_closing_moments, public.vw_churn_risk_ranking, public.vw_closing_score_alerts, public.vw_closing_score_ranking, public.vw_contacts_completo, public.vw_contacts_contato, public.vw_contacts_full, public.vw_contacts_sem_apelido, public.vw_deal_velocity_benchmark, public.vw_disc_compatibility, public.vw_emotional_trend_by_contact, public.vw_eq_evolution, public.vw_interaction_timeline, public.vw_pending_followups, public.vw_satisfaction_trend, public.vw_search_contacts |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  | Identificador UUID do e-mail e chave primária; gerado por uuid_generate_v4(). |
| 2 | `contact_id` | `uuid` | não |  |  | Contato proprietário do e-mail; FK para public.contacts.id. |
| 3 | `email_type` | `email_type` | sim | `'corporativo'::email_type` |  | Finalidade do e-mail: corporativo, pessoal, financeiro, nfe, marketing, comercial ou compras. DEFAULT corporativo. |
| 4 | `email` | `character varying(255)` | não |  |  | Endereço de e-mail armazenado conforme informado; texto obrigatório. |
| 5 | `email_normalizado` | `character varying(255)` | sim |  |  | Versão normalizada do e-mail, quando calculada; não há expressão gerada ou CHECK declarando o algoritmo. |
| 6 | `is_primary` | `boolean` | sim | `false` |  | Indica se este é o e-mail principal do contato; DEFAULT false. |
| 7 | `is_verified` | `boolean` | sim | `false` |  | Indica se o e-mail foi verificado; DEFAULT false. |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do registro; timestamptz, DEFAULT now(). |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada; timestamptz, DEFAULT now(). |
| 10 | `fonte` | `character varying(100)` | sim |  |  | Origem textual do e-mail; valores não enumerados no schema. |
| 11 | `contexto` | `character varying(200)` | sim |  |  | Contexto textual de uso do e-mail; valores não enumerados no schema. |
| 12 | `confiabilidade` | `smallint` | sim | `0` |  | Score smallint de confiabilidade do e-mail; escala e interpretação não estão definidas por CHECK ou comentário. DEFAULT 0. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_emails_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_emails_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_emails_contact_id_email_ci_unique | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_emails_contact_id_email_ci_unique ON public.contact_emails USING btree (contact_id, lower((email)::text))` |
| contact_emails_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_emails_pkey ON public.contact_emails USING btree (id)` |
| idx_contact_emails_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_contact_emails_contact_id ON public.contact_emails USING btree (contact_id)` |
| idx_contact_emails_primary | btree | contact_id | não | sim | `(is_primary = true)` | `CREATE INDEX idx_contact_emails_primary ON public.contact_emails USING btree (contact_id) WHERE (is_primary = true)` |


## Policies (RLS)

### `contact_emails_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `contact_emails_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `contact_emails_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `contact_emails_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `contact_relation_active_owner_or_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_emails.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_emails.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| serialize_contact_relation_write | BEFORE | INSERT OR DELETE OR UPDATE | ROW | enabled | public.guard_contact_relation_write |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_contact_emails_normalizar | BEFORE | INSERT OR UPDATE | ROW | enabled | public.trg_normalizar_email |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_singu_sync_contact_email | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.singu_sync_contact_email |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
