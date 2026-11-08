# _dormant.pre_contact_briefings

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `planned_contact_type` | `character varying(50)` | sim |  |  |  |
| 5 | `planned_contact_date` | `timestamp with time zone` | sim |  |  |  |
| 6 | `contact_summary` | `text` | sim |  |  |  |
| 7 | `company_summary` | `text` | sim |  |  |  |
| 8 | `disc_profile` | `character varying(10)` | sim |  |  |  |
| 9 | `disc_approach_tips` | `text[]` | sim |  |  |  |
| 10 | `vak_profile` | `character varying(20)` | sim |  |  |  |
| 11 | `vak_keywords` | `text[]` | sim |  |  |  |
| 12 | `eq_level` | `character varying(20)` | sim |  |  |  |
| 13 | `last_interactions_summary` | `text` | sim |  |  |  |
| 14 | `pending_issues` | `text[]` | sim |  |  |  |
| 15 | `rapport_points` | `text[]` | sim |  |  |  |
| 16 | `topics_to_explore` | `text[]` | sim |  |  |  |
| 17 | `topics_to_avoid` | `text[]` | sim |  |  |  |
| 18 | `primary_objective` | `text` | sim |  |  |  |
| 19 | `secondary_objectives` | `text[]` | sim |  |  |  |
| 20 | `recommended_approach` | `text` | sim |  |  |  |
| 21 | `opening_suggestion` | `text` | sim |  |  |  |
| 22 | `key_questions` | `text[]` | sim |  |  |  |
| 23 | `anticipated_objections` | `text[]` | sim |  |  |  |
| 24 | `prepared_responses` | `text[]` | sim |  |  |  |
| 25 | `desired_outcomes` | `text[]` | sim |  |  |  |
| 26 | `important_reminders` | `text[]` | sim |  |  |  |
| 27 | `generated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 28 | `valid_until` | `timestamp with time zone` | sim | `(now() + '24:00:00'::interval)` |  |  |
| 29 | `was_used` | `boolean` | sim | `false` |  |  |
| 30 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pre_contact_briefings_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| pre_contact_briefings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| pre_contact_briefings_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| pre_contact_briefings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pre_contact_briefings_pkey ON _dormant.pre_contact_briefings USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
