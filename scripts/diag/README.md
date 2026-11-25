# `scripts/diag/` — ferramentas de diagnóstico do banco

Ferramentas **manuais**, para investigar produção quando algo quebra. **Não** rodam na CI
(para a CI use `tests/rls/`, que roda isolado e sem dado real).

Origem: resíduo do bundle do agente `hermes` (ponteira `57d6fbe8c`), auditado antes de
fechar as branches antigas. Os outros 14 arquivos daquele bundle (`diag/rlsval/*.sql` e
`diag/rlsval.sh`) **não** foram portados porque já existem em `tests/rls/`, em versão
igual ou mais nova — ver "Rastreabilidade" no fim.

## Como rodar

Precisa de `psql` com a connection string do projeto (o painel do Supabase dá a string
em *Project Settings → Database*). Use sempre uma sessão que **reverta** a transação:

```bash
psql "$DATABASE_URL" -f scripts/diag/scan_triggers.sql
```

Os arquivos que escrevem dado abrem `BEGIN;` no topo e terminam em `ROLLBACK;` — nada é
persistido. Exceção: nenhuma. `fix_triggers.sql` **é DDL de reparo** e só deve ser
aplicado manualmente com o banco quebrado; ele não é migration e não está na lista de
migrations aplicadas.

## Arquivos

| Arquivo | O que faz | Quando usar |
| --- | --- | --- |
| `scan_triggers.sql` | Faz um `UPDATE`/`DELETE` de uma linha em cada tabela `public` que tenha gatilho de UPDATE ou DELETE, com `ROLLBACK`, e imprime `ok/falhas/vazias`. | Suspeita de gatilho quebrado após mudança de schema (ex.: coluna `version` ausente). |
| `verify_triggers.sql` | Exercita a cadeia inteira em `ROLLBACK`: versionamento otimista em `contacts`, auditoria em `audit_log` nos dois formatos (`table_name/record_id` e `entity_type/entity_id`), `interactions` com e sem `user_id`/`company_id`, `calculate_relationship_metrics_internal`, `relationship_stage`, e confere que token de `oauth_tokens` **não** vaza para `new_data`. | Depois de mexer em gatilho/auditoria, ou ao desconfiar de vazamento de token no log. |
| `anon_crm_probe.sql` | Põe a sessão em `SET LOCAL ROLE anon` e chama as RPCs de CRM (`get_contact_360_by_phone`, `get_contact_intelligence_by_phone`, `get_companies_by_phones_batch`, `search_contacts_advanced`) com um telefone real do banco, reportando tamanho da resposta ou o erro. Compara antes/depois das migrations de least-privilege. | Auditoria de exposição anônima: confirma que `anon` não lê CRM. |
| `fix_triggers.sql` | DDL de reparo: garante `contacts.version`, `companies.version`, `competitors.updated_at` e que `audit_log` aceita os dois formatos de coluna. | Banco com escrita quebrada por gatilho (23502/42703). Ver "Estado em produção". |

## Estado em produção (verificado em 25/11/2026)

Tudo o que `fix_triggers.sql` garante **já está aplicado** no projeto
`pgxfvjmuubtbowutlide`: `contacts.version`, `companies.version`,
`competitors.updated_at`, `audit_log.table_name`, `audit_log.entity_type` e
`audit_log.record_id` existem, com 423 gatilhos em `public`. As migrations da mesma
ponteira também estão registradas em `supabase_migrations.schema_migrations`:
`20261006120000` (least_privilege_canonical), `20261006120100`
(storage_buckets_singu) e `20261006130000` (frontend_rpcs_authenticated).

Ou seja: `fix_triggers.sql` é rede de segurança, não algo pendente.

## Rastreabilidade — nada foi perdido

Os 14 arquivos `diag/rlsval/*.sql` da ponteira `57d6fbe8c` têm equivalente em
`tests/rls/`, e o `main` é superset em 8 deles:

- idênticos: `admin.sql`, `anon.sql`, `authenticated_least_privilege.sql`, `mtta_sla_breach.sql`
- `main` maior/mais novo: `ai_gateway_health_mttr.sql`,
  `ai_gateway_metrics_least_privilege.sql`, `deal_rooms_share_token.sql`,
  `functions_authenticated_allowlist.sql`, `functions_least_privilege.sql`,
  `psychographic_matrix.sql`, `public_endpoints_least_privilege.sql`,
  `security_definer_hardening.sql`
- `rlsval/migration.sql` é a migration `20261006120000_least_privilege_canonical`
  (já aplicada) — não é teste.
- `diag/apply.sql` era um wrapper para aplicar a `20261006130000` (já aplicada) e
  `diag/fn15.sql` listava assinaturas de 7 funções: sem valor de diagnóstico próprio.
- `diag/rls.sql` (3 linhas) lista DEFINERs e privilégios: coberto por
  `tests/rls/security_definer_hardening.sql`.