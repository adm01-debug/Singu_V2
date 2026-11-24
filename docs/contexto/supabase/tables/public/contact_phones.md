# public.contact_phones

> Telefones associados a contatos, com tipo, normalização, sinalizadores de principal/WhatsApp/verificação e metadados de origem. Cada registro referencia public.contacts.id.

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
| usada por views | public.v_contact_summary, public.vw_contacts_completo, public.vw_contacts_contato, public.vw_contacts_full, public.vw_contacts_sem_apelido, public.vw_interaction_timeline, public.vw_search_contacts |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  | Identificador UUID do telefone e chave primária; gerado por uuid_generate_v4(). |
| 2 | `contact_id` | `uuid` | não |  |  | Contato proprietário do telefone; FK para public.contacts.id. |
| 3 | `phone_type` | `phone_type` | sim | `'fixo_comercial'::phone_type` |  | Tipo do telefone: celular_corporativo, fixo_comercial, celular_pessoal ou invalido. DEFAULT fixo_comercial. |
| 5 | `numero_normalizado` | `character varying(20)` | não |  |  | Telefone em representação normalizada, conforme convenção da aplicação; algoritmo e formato não são validados por CHECK. |
| 6 | `is_primary` | `boolean` | sim | `false` |  | Indica se este é o telefone principal do contato; DEFAULT false. |
| 7 | `is_whatsapp` | `boolean` | sim | `false` |  | Indica se o número pode ser usado como WhatsApp; DEFAULT false. |
| 8 | `is_verified` | `boolean` | sim | `false` |  | Indica se o telefone foi verificado; DEFAULT false. |
| 9 | `observacao` | `character varying(100)` | sim |  |  | Observação livre sobre o telefone. |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do registro; timestamptz, DEFAULT now(). |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada; timestamptz, DEFAULT now(). |
| 12 | `numero_e164` | `character varying(20)` | sim |  |  | Telefone em formato internacional E.164, quando disponível; o formato não é validado por CHECK. |
| 13 | `fonte` | `character varying(100)` | sim |  |  | Origem textual do número; valores não enumerados no schema. |
| 14 | `contexto` | `character varying(200)` | sim |  |  | Contexto textual de uso do telefone; valores não enumerados. |
| 15 | `confiabilidade` | `smallint` | sim |  |  | Score smallint de confiabilidade do telefone; escala e interpretação não estão definidas no schema. |
| 16 | `numero` | `character varying(50)` | não |  |  | Número de telefone conforme armazenado/informado; texto obrigatório, preserva caracteres e formatação. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_phones_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_phones_contact_id_numero_norm_unique | UNIQUE | `UNIQUE (contact_id, numero_normalizado)` |  |  | sim |
| contact_phones_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_phones_contact_id_numero_norm_unique | btree | contact_id, numero_normalizado | sim | sim |  | `CREATE UNIQUE INDEX contact_phones_contact_id_numero_norm_unique ON public.contact_phones USING btree (contact_id, numero_normalizado)` |
| contact_phones_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_phones_pkey ON public.contact_phones USING btree (id)` |
| idx_contact_phones_normalizado | btree | numero_normalizado | não | sim |  | `CREATE INDEX idx_contact_phones_normalizado ON public.contact_phones USING btree (numero_normalizado)` |
| idx_contact_phones_primary | btree | contact_id | não | sim | `(is_primary = true)` | `CREATE INDEX idx_contact_phones_primary ON public.contact_phones USING btree (contact_id) WHERE (is_primary = true)` |
| idx_contact_phones_whatsapp | btree | contact_id | não | sim | `(is_whatsapp = true)` | `CREATE INDEX idx_contact_phones_whatsapp ON public.contact_phones USING btree (contact_id) WHERE (is_whatsapp = true)` |


## Policies (RLS)

### `contact_phones_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |

### `contact_phones_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |

### `contact_phones_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_phones.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)) AND (c.deleted_at IS NULL))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_phones.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)) AND (c.deleted_at IS NULL))))` |

### `contact_phones_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |

### `contact_phones_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |

### `contact_relation_active_owner_or_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_phones.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_phones.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| serialize_contact_relation_write | BEFORE | INSERT OR DELETE OR UPDATE | ROW | enabled | public.guard_contact_relation_write |
| trg_contact_phones_normalizar | BEFORE | INSERT OR UPDATE | ROW | enabled | public.trg_normalizar_telefone_contact |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_singu_sync_contact_phone | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.singu_sync_contact_phone |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
