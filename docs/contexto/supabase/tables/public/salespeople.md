# public.salespeople

> Cadastro de vendedores

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | reporting.mv_daily_kpis |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `email` | `text` | sim |  |  |  |
| 4 | `avatar_url` | `text` | sim |  |  |  |
| 5 | `commission_rate` | `numeric(5,2)` | não | `10.00` |  |  |
| 6 | `is_active` | `boolean` | não | `true` |  |  |
| 7 | `role` | `salesperson_role` | não | `'hybrid'::salesperson_role` |  |  |
| 8 | `auth_user_id` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| salespeople_auth_user_id_key | UNIQUE | `UNIQUE (auth_user_id)` |  |  | sim |
| salespeople_email_key | UNIQUE | `UNIQUE (email)` |  |  | sim |
| salespeople_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.active_power_ups | active_power_ups_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.activity_goals | activity_goals_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.available_spins | available_spins_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.battle_participants | battle_participants_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.challenge_progress | challenge_progress_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.chat_conversations | chat_conversations_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.client_portfolio | client_portfolio_assigned_by_fkey | assigned_by | NO ACTION |
| _dormant.client_portfolio | client_portfolio_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.competitive_chat_messages | competitive_chat_messages_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.daily_challenge_progress | daily_challenge_progress_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.daily_streak_achievements | daily_streak_achievements_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.deal_chat_history | deal_chat_history_salesperson_id_fkey | salesperson_id | SET NULL |
| _dormant.deal_outcomes | deal_outcomes_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.digital_signatures | digital_signatures_created_by_fkey | created_by | NO ACTION |
| _dormant.feed_comments | feed_comments_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.feed_reactions | feed_reactions_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.kudos | kudos_from_salesperson_id_fkey | from_salesperson_id | CASCADE |
| _dormant.kudos | kudos_to_salesperson_id_fkey | to_salesperson_id | CASCADE |
| _dormant.lead_routing_log | lead_routing_log_from_salesperson_id_fkey | from_salesperson_id | NO ACTION |
| _dormant.lead_routing_log | lead_routing_log_to_salesperson_id_fkey | to_salesperson_id | NO ACTION |
| _dormant.objections_library | objections_library_created_by_fkey | created_by | NO ACTION |
| _dormant.performance_bets | performance_bets_bettor_id_fkey | bettor_id | CASCADE |
| _dormant.performance_bets | performance_bets_target_id_fkey | target_id | CASCADE |
| _dormant.playbook_progress | playbook_progress_completed_by_fkey | completed_by | NO ACTION |
| _dormant.prize_wheel_spins | prize_wheel_spins_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.progressive_goals | progressive_goals_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.prospect_cadences | prospect_cadences_salesperson_id_fkey | salesperson_id | NO ACTION |
| _dormant.quotes | quotes_salesperson_id_fkey | salesperson_id | SET NULL |
| _dormant.rank_change_notifications | rank_change_notifications_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.sales_goals | sales_goals_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.sales_streaks | sales_streaks_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.sales_territories | sales_territories_salesperson_id_fkey | salesperson_id | SET NULL |
| _dormant.salesperson_badges | salesperson_badges_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.salesperson_leagues | salesperson_leagues_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.salesperson_preferences | salesperson_preferences_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.salesperson_xp | salesperson_xp_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.team_closers | team_closers_closer_id_fkey | closer_id | CASCADE |
| _dormant.teams | teams_sdr_id_fkey | sdr_id | SET NULL |
| _dormant.territory_history | territory_history_from_salesperson_id_fkey | from_salesperson_id | NO ACTION |
| _dormant.territory_history | territory_history_to_salesperson_id_fkey | to_salesperson_id | NO ACTION |
| _dormant.tournament_matches | tournament_matches_player1_id_fkey | player1_id | NO ACTION |
| _dormant.tournament_matches | tournament_matches_player2_id_fkey | player2_id | NO ACTION |
| _dormant.tournament_matches | tournament_matches_winner_id_fkey | winner_id | NO ACTION |
| _dormant.tournament_participants | tournament_participants_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.victory_feed | victory_feed_salesperson_id_fkey | salesperson_id | CASCADE |
| _dormant.weekly_matchups | weekly_matchups_player1_id_fkey | player1_id | CASCADE |
| _dormant.weekly_matchups | weekly_matchups_player2_id_fkey | player2_id | CASCADE |
| _dormant.weekly_matchups | weekly_matchups_winner_id_fkey | winner_id | NO ACTION |
| _dormant.xp_history | xp_history_salesperson_id_fkey | salesperson_id | CASCADE |
| public.achievements | achievements_salesperson_id_fkey | salesperson_id | CASCADE |
| public.sales | sales_salesperson_id_fkey | salesperson_id | NO ACTION |
| public.sales_activities | sales_activities_salesperson_id_fkey | salesperson_id | SET NULL |
| public.sales_tasks | sales_tasks_salesperson_id_fkey | salesperson_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| salespeople_auth_user_id_key | btree | auth_user_id | sim | sim |  | `CREATE UNIQUE INDEX salespeople_auth_user_id_key ON public.salespeople USING btree (auth_user_id)` |
| salespeople_email_key | btree | email | sim | sim |  | `CREATE UNIQUE INDEX salespeople_email_key ON public.salespeople USING btree (email)` |
| salespeople_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX salespeople_pkey ON public.salespeople USING btree (id)` |


## Policies (RLS)

### `legacy_sales_service`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `legacy_salespeople_owner`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth_user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_salespeople | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_func |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_
