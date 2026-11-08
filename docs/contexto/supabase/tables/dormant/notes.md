# _dormant.notes

> Notas e observações livres

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
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `titulo` | `character varying(255)` | sim |  |  |  |
| 6 | `conteudo` | `text` | não |  |  |  |
| 7 | `is_pinned` | `boolean` | sim | `false` |  |  |
| 8 | `is_private` | `boolean` | sim | `false` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_note_target | CHECK | `CHECK (contact_id IS NOT NULL OR company_id IS NOT NULL OR interaction_id IS NOT NULL)` |  |  | sim |
| notes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| notes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notes_pkey ON _dormant.notes USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_notes`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tr_notes_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
