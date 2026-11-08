# zapp_history.message_embeddings

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `message_id` | `uuid` | não |  |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `content_text` | `text` | não |  |  |  |
| 4 | `content_type` | `text` | não | `'message'::text` |  | message = texto da mensagem \| audio_transcription = transcrição de áudio \| caption = legenda de mídia \| ocr = texto extraído de imagem |
| 5 | `embedding` | `vector(1536)` | sim |  |  |  |
| 6 | `model` | `text` | não | `'text-embedding-3-small'::text` |  |  |
| 7 | `dimensions` | `integer` | não | `1536` |  | Sempre 1536 para text-embedding-3-small. Mudar de modelo requer recriar coluna. |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `embedding_1024` | `vector(1024)` | sim |  |  |  |
| 10 | `provider` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| message_embeddings_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| message_embeddings_content_type_check | CHECK | `CHECK (content_type = ANY (ARRAY['message'::text, 'audio_transcription'::text, 'caption'::text, 'ocr'::text]))` |  |  | sim |
| message_embeddings_message_id_fkey | FOREIGN KEY | `FOREIGN KEY (message_id) REFERENCES zapp_history.messages(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| message_embeddings_pkey | PRIMARY KEY | `PRIMARY KEY (message_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_me_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_me_contact ON zapp_history.message_embeddings USING btree (contact_id)` |
| idx_me_vector | ivfflat | embedding | não | sim |  | `CREATE INDEX idx_me_vector ON zapp_history.message_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists='100')` |
| idx_me_vector_1024 | ivfflat | embedding_1024 | não | sim | `(embedding_1024 IS NOT NULL)` | `CREATE INDEX idx_me_vector_1024 ON zapp_history.message_embeddings USING ivfflat (embedding_1024 vector_cosine_ops) WITH (lists='100') WHERE (embedding_1024 IS NOT NULL)` |
| message_embeddings_pkey | btree | message_id | sim | sim |  | `CREATE UNIQUE INDEX message_embeddings_pkey ON zapp_history.message_embeddings USING btree (message_id)` |


## Policies (RLS)

### `me_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `zapp_history.user_can_access_contact(contact_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
