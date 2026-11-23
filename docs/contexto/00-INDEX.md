# CONTEXTO PARA AGENTES DE IA — ÍNDICE ÚNICO

> Gerado automaticamente por indice.py · 2026-11-23 14:00 UTC · HEAD `7e545e5bbb` · Não edite à mão.

Um sistema, três fontes de verdade, três produtores independentes. **Leia este arquivo e vá direto à fonte certa.** Cada fato tem um dono: se duas fontes discordarem, vale o dono.

## Onde está cada coisa

| Preciso de… | Fonte (dona do fato) | Onde ler | Estado |
|---|---|---|---|
| Regras que não podem ser quebradas: RLS por operação, estados e transições, validações, fórmulas, prazos, erros de negócio, testes como especificação, inconsistências código×schema (NÃO VERIFICADO) e regras humanas (`manual/`) | **regras de negócio** | `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md` | ok · 3 min atrás |
| Tabelas, colunas, RLS/políticas, funções, triggers, cron, storage, lints — **como está em produção agora** | **banco real** | `docs/contexto/supabase/README.md` | ok · 44 min atrás |
| Rotas, telas, módulos, hooks, edge functions, grafo de dependências, testes, scripts, convenções | **código** | `docs/contexto/codigo/INDEX.md` | ok · 0 min atrás |

## Ordem de leitura antes de qualquer tarefa ou planejamento

1. **regras de negócio** — Qualquer mudança de comportamento · Antes de criar status/valor/validação · Antes de planejar.
2. **banco real** — Vou tocar tabela/coluna/política/função SQL · Quero saber se algo existe de verdade no banco.
3. **código** — Vou mexer em tela/rota/hook/edge · Preciso saber onde uma coisa vive e quem a usa.

## Regras do protocolo

- Tabela/coluna/política existe? → **banco real**. Migrations do repo são histórico, não estado.
- Onde fica, quem chama, o que importa o quê? → **código**.
- Pode fazer isso? Qual estado vem depois? Qual o limite? → **regras de negócio** (inclui `manual/`, escrito por humanos, prioridade máxima).
- Item listado como **NÃO VERIFICADO** ou **inconsistência** em qualquer fonte: confirme na fonte dona antes de assumir.
- Nada aqui é editado à mão. Para registrar uma regra que só o negócio sabe, escreva em `manual/` da fonte de regras.

<details><summary>Arquivos de <b>banco real</b> (`docs/contexto/supabase/`)</summary>

- `docs/contexto/supabase/CHANGELOG.md`
- `docs/contexto/supabase/README.md`
- `docs/contexto/supabase/auth.md`
- `docs/contexto/supabase/cron-runs.md`
- `docs/contexto/supabase/cron.md`
- `docs/contexto/supabase/edge-functions.md`
- `docs/contexto/supabase/errors.md`
- `docs/contexto/supabase/extensions.md`
- `docs/contexto/supabase/foreign-servers.md`
- `docs/contexto/supabase/functions.md`
- `docs/contexto/supabase/grants.md`
- `docs/contexto/supabase/indexes.md`
- `docs/contexto/supabase/lints.md`
- `docs/contexto/supabase/manifest.json`
- `docs/contexto/supabase/migrations.md`
- `docs/contexto/supabase/policies.md`
- `docs/contexto/supabase/project-config.md`
- `docs/contexto/supabase/queues.md`
- `docs/contexto/supabase/realtime.md`
- `docs/contexto/supabase/relationships.md`
- `docs/contexto/supabase/roles.md`
- `docs/contexto/supabase/schemas.md`
- `docs/contexto/supabase/sequences.md`
- `docs/contexto/supabase/snapshot.json`
- `docs/contexto/supabase/stats.json`
- `docs/contexto/supabase/stats.md`
- `docs/contexto/supabase/storage.md`
- `docs/contexto/supabase/tables.md`
- `docs/contexto/supabase/tables/_supabase_internal_triggers.md`
- `docs/contexto/supabase/tables/dormant/access_denied_logs.md`
- `docs/contexto/supabase/tables/dormant/active_power_ups.md`
- `docs/contexto/supabase/tables/dormant/active_sessions.md`
- `docs/contexto/supabase/tables/dormant/activity_goals.md`
- `docs/contexto/supabase/tables/dormant/activity_log.md`
- `docs/contexto/supabase/tables/dormant/alert_log.md`
- `docs/contexto/supabase/tables/dormant/alertas_inativacao.md`
- `docs/contexto/supabase/tables/dormant/api_usage_log.md`
- `docs/contexto/supabase/tables/dormant/automation_logs.md`
- `docs/contexto/supabase/tables/dormant/automation_rules.md`
- `docs/contexto/supabase/tables/dormant/available_spins.md`
- `docs/contexto/supabase/tables/dormant/battle_participants.md`
- `docs/contexto/supabase/tables/dormant/bitrix24_sync_logs.md`
- `docs/contexto/supabase/tables/dormant/blocked_ips.md`
- `docs/contexto/supabase/tables/dormant/cadence_steps.md`
- `docs/contexto/supabase/tables/dormant/cadence_tasks.md`
- `docs/contexto/supabase/tables/dormant/cadences.md`
- `docs/contexto/supabase/tables/dormant/carrier_contacts.md`
- `docs/contexto/supabase/tables/dormant/category_metrics.md`
- `docs/contexto/supabase/tables/dormant/challenge_progress.md`
- `docs/contexto/supabase/tables/dormant/chat_conversations.md`
- `docs/contexto/supabase/tables/dormant/chat_messages.md`
- `docs/contexto/supabase/tables/dormant/circuit_breaker_events.md`
- `docs/contexto/supabase/tables/dormant/client_portfolio.md`
- `docs/contexto/supabase/tables/dormant/client_values.md`
- `docs/contexto/supabase/tables/dormant/closing_moment_analysis.md`
- `docs/contexto/supabase/tables/dormant/cognitive_bias_history.md`
- `docs/contexto/supabase/tables/dormant/cognitive_biases.md`
- `docs/contexto/supabase/tables/dormant/collectible_badges.md`
- `docs/contexto/supabase/tables/dormant/communication_cadence.md`
- `docs/contexto/supabase/tables/dormant/communication_preferences.md`
- `docs/contexto/supabase/tables/dormant/company_tags.md`
- `docs/contexto/supabase/tables/dormant/compatibility_alerts.md`
- `docs/contexto/supabase/tables/dormant/compatibility_settings.md`
- `docs/contexto/supabase/tables/dormant/competitive_chat_messages.md`
- `docs/contexto/supabase/tables/dormant/competitive_seasons.md`
- `docs/contexto/supabase/tables/dormant/contact_availability.md`
- `docs/contexto/supabase/tables/dormant/contact_cadence.md`
- `docs/contexto/supabase/tables/dormant/contact_communication_style.md`
- `docs/contexto/supabase/tables/dormant/contact_compatibility.md`
- `docs/contexto/supabase/tables/dormant/contact_eq_scores.md`
- `docs/contexto/supabase/tables/dormant/contact_metaprograms.md`
- `docs/contexto/supabase/tables/dormant/contact_preferences.md`
- `docs/contexto/supabase/tables/dormant/contact_relationships.md`
- `docs/contexto/supabase/tables/dormant/contact_relatives.md`
- `docs/contexto/supabase/tables/dormant/contact_rfm_scores.md`
- `docs/contexto/supabase/tables/dormant/contact_tags.md`
- `docs/contexto/supabase/tables/dormant/contact_time_analysis.md`
- `docs/contexto/supabase/tables/dormant/contact_trigger_preferences.md`
- `docs/contexto/supabase/tables/dormant/contact_values.md`
- `docs/contexto/supabase/tables/dormant/custom_field_values.md`
- … +602

</details>

<details><summary>Arquivos de <b>código</b> (`docs/contexto/codigo/`)</summary>

- `docs/contexto/codigo/GRAPH_REPORT.md`
- `docs/contexto/codigo/INDEX.md`
- `docs/contexto/codigo/banco.json`
- `docs/contexto/codigo/baseline.json`
- `docs/contexto/codigo/componentes.json`
- `docs/contexto/codigo/convencoes.json`
- `docs/contexto/codigo/edge-functions.json`
- `docs/contexto/codigo/ferramentas.json`
- `docs/contexto/codigo/grafo-arestas.json`
- `docs/contexto/codigo/grafo-graphify.json`
- `docs/contexto/codigo/grafo.json`
- `docs/contexto/codigo/hooks.json`
- `docs/contexto/codigo/logica.json`
- `docs/contexto/codigo/manifest.json`
- `docs/contexto/codigo/modulos.json`
- `docs/contexto/codigo/rotas.json`
- `docs/contexto/codigo/scripts.json`
- `docs/contexto/codigo/testes.json`

</details>

<details><summary>Arquivos de <b>regras de negócio</b> (`docs/contexto/regras/`)</summary>

- `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`
- `docs/contexto/regras/10-ACESSO-E-SEGURANCA.md`
- `docs/contexto/regras/11-GLOSSARIO-E-LACUNAS.md`
- `docs/contexto/regras/context.json`
- `docs/contexto/regras/manifest.json`
- `docs/contexto/regras/manual/README.md`
- `docs/contexto/regras/manual/TEMPLATE-regras-de-negocio.md`

</details>
