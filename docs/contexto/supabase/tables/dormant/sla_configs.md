# _dormant.sla_configs

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `pipeline_stage_id` | `uuid` | não |  |  |  |
| 3 | `tempo_maximo_horas` | `integer` | não |  |  |  |
| 4 | `alerta_warning_horas` | `integer` | sim |  |  |  |
| 5 | `alerta_danger_horas` | `integer` | sim |  |  |  |
| 6 | `acao_ao_expirar` | `workflow_action_type` | sim |  |  |  |
| 7 | `notificar_usuario` | `boolean` | sim | `true` |  |  |
| 8 | `notificar_gestor` | `boolean` | sim | `false` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sla_configs_pipeline_stage_id_fkey | FOREIGN KEY | `FOREIGN KEY (pipeline_stage_id) REFERENCES pipeline_stages(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sla_configs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sla_configs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sla_configs_pkey ON _dormant.sla_configs USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
