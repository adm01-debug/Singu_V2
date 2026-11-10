# Automação local — Singu_V2

O dispatcher `scripts/automation.mjs` liga as suites, o motor de manutenção e o adaptador de grafo. O perfil versionado `scripts/automation.config.json` é a fonte dos aliases e do registro exato de scripts. Apenas ferramentas determinísticas locais: não há chamadas de IA nem cobrança de API de IA. O CI usa minutos do GitHub Actions sujeitos ao plano da conta; execução local usa os recursos da máquina.

## Comandos

| Alias | Comando executado | Efeito |
|---|---|---|
| `automation:doctor` | `node scripts/automation.mjs doctor` | Verifica arquivos, aliases, registros e instalação local de hooks. |
| `automation:test` | `node scripts/automation.mjs test` | Roda exclusivamente as suites registradas abaixo. |
| `automation:check` | `node scripts/automation.mjs check --ref HEAD` | Inspeciona a referência HEAD em worktree isolada. |
| `automation:heal` | `node scripts/automation.mjs heal --ref origin/main` | Propõe e valida correções limitadas a partir de origin/main; não faz push. |
| `automation:nightly` | `node scripts/automation.mjs nightly --ref origin/main` | Atualiza o grafo e tenta manutenção isolada; relata as duas falhas independentemente. |
| `automation:graph` | `node scripts/automation.mjs graph` | Encaminha subcomandos do grafo; acrescente status, query, path ou explain. |
| `automation:status` | `node scripts/automation.mjs graph status` | Mostra a situação local do grafo. |
| `automation:install-hooks` | `node scripts/automation.mjs install-hooks` | Instala pontes locais reversíveis, encadeando hooks originais. |
| `automation:uninstall-hooks` | `node scripts/automation.mjs uninstall-hooks` | Restaura o hooksPath anterior, recusando sobrescrever alteração de terceiros. |

O comando estático para CI é `node scripts/automation.mjs doctor --static`. Ele verifica contratos; não comprova merge, execução remota, timer ou ponte instalada. `doctor` sem `--static` também exige a instalação local. Ausência de dependência é erro explícito; o dispatcher não instala pacotes automaticamente.

## Gatilhos e ativação

| Gatilho | Cadeia real de execução | Ativação |
|---|---|---|
| PR para main / push em main / dispatch | `.github/workflows/automation-local.yml` → `doctor --static` → `test` → suites exatas do perfil | Workflow versionado; atividade remota depende de publicação/merge e run observado. |
| pre-commit com tooling staged | Ponte privada → hook original → `automation.mjs hook pre-commit` → suites registradas | `automation:install-hooks` instala por clone; não é instalado pelo prepare. |
| pre-push | Ponte privada → hook original → doctor local → suites registradas | A mesma instalação local; erro bloqueia a operação. |
| Fontes staged / post-commit / post-merge / post-checkout | Ponte privada → hook original → adaptador de grafo marca estado sujo | Não reconstrói grafo durante commit nem altera staging. |
| Noturno local, previsto 04:30 | Timer do runtime → callback externo `repo-automation-nightly` → `scripts/automation-nightly.sh` → `automation.mjs nightly --ref origin/main` → graph ensure + motor heal | Configuração do timer fica fora do repositório, sob responsabilidade do runtime local. O callback versionado contém o comando real; presença do arquivo não comprova timer ativo. |

A ponte privada fica em `.tools/repo-automation/`; não substitui os arquivos Husky. Preserva erros, argumentos e stdin dos hooks originais, incluindo commit-msg. `prepare`, hooks e guards existentes foram preservados. Para reverter, use `automation:uninstall-hooks`. `nightly.file` aponta para `scripts/automation-nightly.sh`, cuja cadeia é verificada pelo doctor; nenhum arquivo fictício é usado como evidência de agendamento. O runtime deve conferir `systemctl --user status` e a cadeia do callback instalado antes de declarar o timer ativo.

## Suites efetivamente executadas

- `scripts/automation.unit.mjs`
- `scripts/maintenance/maintenance.unit.mjs`
- `scripts/graphify-local.unit.mjs`

As suites usam fixtures descartáveis e não executam os scripts operacionais do inventário. O motor mantém isolamento de rede, validações obrigatórias, escopo e quotas; um gate herdado vermelho bloqueia o patch. Nenhuma referência, tipo gerado, configuração de produção ou regra de negócio é alterada para forçar verde. O grafo usa o perfil específico `graphify.local.json`; seu estado local fica em `.tools/graphify/local-state/`.

## Registro exato dos demais scripts

Os registros `legacy` abaixo preservam ferramentas anteriores e seus chamadores; não são incluídos automaticamente no novo pipeline. Para arquivos TypeScript de apoio sem runner comprovado, o comando listado só valida o inventário; os chamadores originais continuam sendo a referência de execução. Referência literal indica onde o arquivo é citado, sem garantir que esse caminho rode nem autorização para executar operações contra serviços. Sem referência, o arquivo é mantido manual porque função, parâmetros e ambiente precisam de revisão antes de ativar qualquer gatilho. Scripts novos não cobertos por registro fazem `doctor --static` falhar; não existe registro genérico `scripts/**` para ocultá-los.

| Arquivo exato | Invocação manual de inventário | Chamadores literais / justificativa |
|---|---|---|
| `scripts/_pgdocs.py` | `python3 scripts/_pgdocs.py` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/_pgdocs_catalogo.py` | `python3 scripts/_pgdocs_catalogo.py` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/_pgteste.py` | `python3 scripts/_pgteste.py` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/_sqlseguro.py` | `python3 scripts/_sqlseguro.py` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/ai-context/cenarios.mjs` | `node scripts/ai-context/cenarios.mjs` | .github/workflows/contexto.yml |
| `scripts/ai-context/gerar.mjs` | `node scripts/ai-context/gerar.mjs` | package.json:scripts, .github/workflows/contexto.yml |
| `scripts/ai-context/gerar.unit.mjs` | `node --test scripts/ai-context/gerar.unit.mjs` | package.json:scripts, .github/workflows/contexto.yml |
| `scripts/apply-all.js` | `node scripts/apply-all.js` | scripts/apply-ddl-real.test.mjs |
| `scripts/apply-cli.test.mjs` | `node --test scripts/apply-cli.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/apply-ddl-real.test.mjs` | `node --test scripts/apply-ddl-real.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/apply-e2e.test.mjs` | `node --test scripts/apply-e2e.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/apply-falhas.test.mjs` | `node --test scripts/apply-falhas.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/apply-functions.js` | `node scripts/apply-functions.js` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/apply-migrations.js` | `node scripts/apply-migrations.js` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/apply-missing.js` | `node scripts/apply-missing.js` | scripts/apply-cli.test.mjs |
| `scripts/apply-remaining.js` | `node scripts/apply-remaining.js` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/apply-rls.js` | `node scripts/apply-rls.js` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/apply-triggers-views.js` | `node scripts/apply-triggers-views.js` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/audit-ausentes.mjs` | `node scripts/audit-ausentes.mjs` | scripts/audit-ausentes.test.mjs, scripts/check-supabase-project-ref.test.mjs, scripts/diff-tables.mjs |
| `scripts/audit-ausentes.test.mjs` | `node --test scripts/audit-ausentes.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/check-backend-linter-baseline.mjs` | `node scripts/check-backend-linter-baseline.mjs` | scripts/check-backend-linter-baseline.test.mjs |
| `scripts/check-backend-linter-baseline.test.mjs` | `node --test scripts/check-backend-linter-baseline.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/check-bundle-size.mjs` | `node scripts/check-bundle-size.mjs` | .github/workflows/ci.yml |
| `scripts/check-bundle-size.test.mjs` | `node --test scripts/check-bundle-size.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/check-deploy-timeout.test.mjs` | `node --test scripts/check-deploy-timeout.test.mjs` | .github/workflows/ci.yml |
| `scripts/check-edge-cors.mjs` | `node scripts/check-edge-cors.mjs` | .github/workflows/ci.yml |
| `scripts/check-edge-cors.test.mjs` | `node --test scripts/check-edge-cors.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/check-edge-imports.mjs` | `node scripts/check-edge-imports.mjs` | package.json:scripts |
| `scripts/check-publish-gates.test.mjs` | `node --test scripts/check-publish-gates.test.mjs` | .github/workflows/ci.yml |
| `scripts/check-rls-profiles.test.mjs` | `node --test scripts/check-rls-profiles.test.mjs` | .github/workflows/ci.yml |
| `scripts/check-supabase-project-ref.test.mjs` | `node --test scripts/check-supabase-project-ref.test.mjs` | .github/workflows/ci.yml |
| `scripts/chunk-apply.js` | `node scripts/chunk-apply.js` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/diff-tables.mjs` | `node scripts/diff-tables.mjs` | scripts/audit-ausentes.test.mjs |
| `scripts/fix-enums.js` | `node scripts/fix-enums.js` | scripts/apply-cli.test.mjs |
| `scripts/gen-supabase-types.mjs` | `node scripts/gen-supabase-types.mjs` | .github/workflows/contexto.yml |
| `scripts/gen-supabase-types.test.mjs` | `node --test scripts/gen-supabase-types.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/generate_data_dictionary.py` | `python3 scripts/generate_data_dictionary.py` | scripts/generate_real_dict.py, scripts/test_generate_docs.py |
| `scripts/generate_er_diagram.py` | `python3 scripts/generate_er_diagram.py` | scripts/generate_real_er.py |
| `scripts/generate_real_dict.py` | `python3 scripts/generate_real_dict.py` | scripts/generate_data_dictionary.py, scripts/test_generate_docs.py |
| `scripts/generate_real_er.py` | `python3 scripts/generate_real_er.py` | scripts/generate_er_diagram.py |
| `scripts/hardening/_pg-teste.mjs` | `node scripts/hardening/_pg-teste.mjs` | scripts/hardening/hardening-cluster.test.mjs, scripts/hardening/hardening.test.mjs |
| `scripts/hardening/hardening-cluster.test.mjs` | `node --test scripts/hardening/hardening-cluster.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/hardening/hardening.test.mjs` | `node --test scripts/hardening/hardening.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/inventario/banco.test.mjs` | `node --test scripts/inventario/banco.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/inventario/gerar-banco.mjs` | `node scripts/inventario/gerar-banco.mjs` | .github/workflows/inventario-estado-semanal.yml |
| `scripts/inventario/gerar-banco.test.mjs` | `node --test scripts/inventario/gerar-banco.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/inventario/gerar-repo.mjs` | `node scripts/inventario/gerar-repo.mjs` | .github/workflows/inventario-estado-semanal.yml |
| `scripts/inventario/gerar-repo.test.mjs` | `node --test scripts/inventario/gerar-repo.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/inventario/mudou-conteudo.mjs` | `node scripts/inventario/mudou-conteudo.mjs` | .github/workflows/inventario-estado-semanal.yml |
| `scripts/inventario/mudou-conteudo.test.mjs` | `node --test scripts/inventario/mudou-conteudo.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/lib/mgmt-mock.test.mjs` | `node --test scripts/lib/mgmt-mock.test.mjs` | scripts/lib/sql-split.test.mjs |
| `scripts/lib/sql-split.mjs` | `node scripts/lib/sql-split.mjs` | scripts/apply-all.js, scripts/apply-functions.js, scripts/apply-migrations.js, scripts/apply-missing.js |
| `scripts/lib/sql-split.test.mjs` | `node --test scripts/lib/sql-split.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/lib/supabase-mgmt.mjs` | `node scripts/lib/supabase-mgmt.mjs` | scripts/apply-all.js, scripts/apply-functions.js, scripts/apply-migrations.js, scripts/apply-missing.js |
| `scripts/lib/supabase-mgmt.test.mjs` | `node --test scripts/lib/supabase-mgmt.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/lint-providers.cjs` | `node scripts/lint-providers.cjs` | scripts/lint-providers.test.mjs |
| `scripts/lint-providers.test.mjs` | `node --test scripts/lint-providers.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/_lib.sh` | `sh scripts/migration/_lib.sh` | scripts/check-deploy-timeout.test.mjs, scripts/check-publish-gates.test.mjs, scripts/migration/auth/export-identities.sh, scripts/migration/auth/import-identities.sh |
| `scripts/migration/_mock_supabase.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/cdc/order-guard_test.ts, scripts/migration/cdc/replay_test.ts, scripts/migration/compliance/lgpd-snapshot_test.ts, scripts/migration/cutover/smoke-tests_test.ts |
| `scripts/migration/_pg_teste.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/cdc/order-guard_test.ts, scripts/migration/verify/rls-parity_test.ts, scripts/migration/verify/row-diff_test.ts |
| `scripts/migration/auth/export-identities.sh` | `sh scripts/migration/auth/export-identities.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/auth/import-identities.sh` | `sh scripts/migration/auth/import-identities.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/auth/rotate-jwt.sh` | `sh scripts/migration/auth/rotate-jwt.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/cdc/drain.sh` | `sh scripts/migration/cdc/drain.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/cdc/dry-run.sh` | `sh scripts/migration/cdc/dry-run.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/cdc/lag-watch.sh` | `sh scripts/migration/cdc/lag-watch.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/cdc/order-guard.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/cdc/order-guard_test.ts, scripts/migration/cdc/replay.ts |
| `scripts/migration/cdc/order-guard_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/cdc/replay.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/cdc/replay_test.ts |
| `scripts/migration/cdc/replay_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/chaos/inject.sh` | `sh scripts/migration/chaos/inject.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/compare-counts.sh` | `sh scripts/migration/compare-counts.sh` | scripts/migration/import-data.sh |
| `scripts/migration/compliance/lgpd-snapshot.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/compliance/lgpd-snapshot_test.ts |
| `scripts/migration/compliance/lgpd-snapshot_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/cutover/freeze-origin.sh` | `sh scripts/migration/cutover/freeze-origin.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/cutover/smoke-tests.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/cutover/smoke-tests_test.ts |
| `scripts/migration/cutover/smoke-tests_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/dashboard.sh` | `sh scripts/migration/dashboard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/ddl/ddl.test.mjs` | `node --test scripts/migration/ddl/ddl.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/ddl/verify-extensions.sh` | `sh scripts/migration/ddl/verify-extensions.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/dr/backup-encryption-check.sh` | `sh scripts/migration/dr/backup-encryption-check.sh` | .github/workflows/restore-drill.yml |
| `scripts/migration/dr/create-drill-backup.mjs` | `node scripts/migration/dr/create-drill-backup.mjs` | .github/workflows/restore-drill.yml |
| `scripts/migration/dr/restore-drill.sh` | `sh scripts/migration/dr/restore-drill.sh` | .github/workflows/restore-drill.yml |
| `scripts/migration/dr/wal-archive-check.sh` | `sh scripts/migration/dr/wal-archive-check.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/export-data.sh` | `sh scripts/migration/export-data.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/extract-ddl.sh` | `sh scripts/migration/extract-ddl.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/functions/deploy-all.sh` | `sh scripts/migration/functions/deploy-all.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/functions/preflight-secrets.sh` | `sh scripts/migration/functions/preflight-secrets.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/functions/rewrite-cron-urls.sh` | `sh scripts/migration/functions/rewrite-cron-urls.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/functions/secrets-leak-scan.sh` | `sh scripts/migration/functions/secrets-leak-scan.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/functions/set-secrets.sh` | `sh scripts/migration/functions/set-secrets.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/functions/verify-deploy.sh` | `sh scripts/migration/functions/verify-deploy.sh` | scripts/check-deploy-timeout.test.mjs, scripts/check-publish-gates.test.mjs |
| `scripts/migration/import-data-parallel.sh` | `sh scripts/migration/import-data-parallel.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/import-data.sh` | `sh scripts/migration/import-data.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/monitoring/post-cutover-watch.sh` | `sh scripts/migration/monitoring/post-cutover-watch.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/monitoring/synthetic-checks.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/monitoring/synthetic-checks_test.ts |
| `scripts/migration/monitoring/synthetic-checks_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/reset-passwords.sh` | `sh scripts/migration/reset-passwords.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/reset-passwords.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/reset-passwords_test.ts |
| `scripts/migration/reset-passwords_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/rollback.sh` | `sh scripts/migration/rollback.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/rollback/full-restore.sh` | `sh scripts/migration/rollback/full-restore.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/sql/sql.test.mjs` | `node --test scripts/migration/sql/sql.test.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/storage/_lib.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/storage/_lib_test.ts, scripts/migration/storage/copy-large.ts, scripts/migration/storage/copy-large_test.ts, scripts/migration/storage/copy-objects.ts |
| `scripts/migration/storage/_lib_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/storage/copy-large.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/storage/copy-large_test.ts |
| `scripts/migration/storage/copy-large_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/storage/copy-objects.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/storage/copy-objects_test.ts |
| `scripts/migration/storage/copy-objects_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/storage/create-buckets.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/storage/create-buckets_test.ts |
| `scripts/migration/storage/create-buckets_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/storage/list-buckets.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/storage/create-buckets_test.ts |
| `scripts/migration/storage/run.sh` | `sh scripts/migration/storage/run.sh` | scripts/migration/_lib.sh |
| `scripts/migration/storage/verify-counts.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/storage/verify-counts_test.ts |
| `scripts/migration/storage/verify-counts_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/tests/lib/sigrun.py` | `python3 scripts/migration/tests/lib/sigrun.py` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/unmark-must-reset.sh` | `sh scripts/migration/unmark-must-reset.sh` | scripts/migration/rollback.sh |
| `scripts/migration/verify/connection-pool-exhaustion-canary.sh` | `sh scripts/migration/verify/connection-pool-exhaustion-canary.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/dns-multi-region.sh` | `sh scripts/migration/verify/dns-multi-region.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/dns-propagation.sh` | `sh scripts/migration/verify/dns-propagation.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/dual-write-diverge.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/verify/dual-write-diverge_test.ts |
| `scripts/migration/verify/dual-write-diverge_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/exporter/full-audit-exporter.sh` | `sh scripts/migration/verify/exporter/full-audit-exporter.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/extensions-versions.sh` | `sh scripts/migration/verify/extensions-versions.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/full-audit.sh` | `sh scripts/migration/verify/full-audit.sh` | scripts/migration/verify/exporter/full-audit-exporter.sh, scripts/monitoring/check-runbook-coverage.sh |
| `scripts/migration/verify/grants-parity.sh` | `sh scripts/migration/verify/grants-parity.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/pitr-window-verifier.sh` | `sh scripts/migration/verify/pitr-window-verifier.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/planner-stats-freshness.sh` | `sh scripts/migration/verify/planner-stats-freshness.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/rls-parity.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/verify/rls-parity_test.ts |
| `scripts/migration/verify/rls-parity_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/row-diff-deep.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/verify/row-diff_test.ts |
| `scripts/migration/verify/row-diff.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/verify/row-diff-deep.ts, scripts/migration/verify/row-diff_test.ts |
| `scripts/migration/verify/row-diff_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/storage-bytes.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/verify/storage-bytes_test.ts |
| `scripts/migration/verify/storage-bytes_test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/storage-public-guard.ts` | `node scripts/automation.mjs doctor --static` | scripts/migration/verify/storage-bytes_test.ts |
| `scripts/migration/verify/tests/contrato-estatico.test.sh` | `sh scripts/migration/verify/tests/contrato-estatico.test.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/lib.sh` | `sh scripts/migration/verify/tests/lib.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/run-all.sh` | `sh scripts/migration/verify/tests/run-all.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/00-contrato-estatico.sh` | `sh scripts/migration/verify/tests/scenarios/00-contrato-estatico.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/01-table-without-pk.sh` | `sh scripts/migration/verify/tests/scenarios/01-table-without-pk.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/04-idle-in-transaction-aborted.sh` | `sh scripts/migration/verify/tests/scenarios/04-idle-in-transaction-aborted.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/11-checksums-off.sh` | `sh scripts/migration/verify/tests/scenarios/11-checksums-off.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/14-secdef-public-search-path.sh` | `sh scripts/migration/verify/tests/scenarios/14-secdef-public-search-path.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/17-archive-off.sh` | `sh scripts/migration/verify/tests/scenarios/17-archive-off.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/21-replication-slot-idle.sh` | `sh scripts/migration/verify/tests/scenarios/21-replication-slot-idle.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/24-ssl-off.sh` | `sh scripts/migration/verify/tests/scenarios/24-ssl-off.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/25-autovacuum-throttle.sh` | `sh scripts/migration/verify/tests/scenarios/25-autovacuum-throttle.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/25-collation-drift.sh` | `sh scripts/migration/verify/tests/scenarios/25-collation-drift.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/25-heap-corruption.sh` | `sh scripts/migration/verify/tests/scenarios/25-heap-corruption.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/25-orphaned-lo.sh` | `sh scripts/migration/verify/tests/scenarios/25-orphaned-lo.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/25-password-encryption.sh` | `sh scripts/migration/verify/tests/scenarios/25-password-encryption.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/25-pitr-window.sh` | `sh scripts/migration/verify/tests/scenarios/25-pitr-window.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/25-plan-cache-bloat.sh` | `sh scripts/migration/verify/tests/scenarios/25-plan-cache-bloat.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/25-replica-identity.sh` | `sh scripts/migration/verify/tests/scenarios/25-replica-identity.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/26-burn-rate-math.sh` | `sh scripts/migration/verify/tests/scenarios/26-burn-rate-math.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/26-cardinality-guard.sh` | `sh scripts/migration/verify/tests/scenarios/26-cardinality-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/26-dead-man-math.sh` | `sh scripts/migration/verify/tests/scenarios/26-dead-man-math.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/26-exporter-parse.sh` | `sh scripts/migration/verify/tests/scenarios/26-exporter-parse.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/26-runbook-coverage.sh` | `sh scripts/migration/verify/tests/scenarios/26-runbook-coverage.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/26-silence-template.sh` | `sh scripts/migration/verify/tests/scenarios/26-silence-template.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/30-invalid-indexes-guard.sh` | `sh scripts/migration/verify/tests/scenarios/30-invalid-indexes-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/31-rls-coverage-sem-rls.sh` | `sh scripts/migration/verify/tests/scenarios/31-rls-coverage-sem-rls.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/32-rls-coverage-sem-policy.sh` | `sh scripts/migration/verify/tests/scenarios/32-rls-coverage-sem-policy.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/33-not-valid-constraints.sh` | `sh scripts/migration/verify/tests/scenarios/33-not-valid-constraints.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/34-security-definer-audit.sh` | `sh scripts/migration/verify/tests/scenarios/34-security-definer-audit.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/35-function-volatility-audit.sh` | `sh scripts/migration/verify/tests/scenarios/35-function-volatility-audit.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/36-access-exclusive-locks-guard.sh` | `sh scripts/migration/verify/tests/scenarios/36-access-exclusive-locks-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/37-long-running-tx-guard.sh` | `sh scripts/migration/verify/tests/scenarios/37-long-running-tx-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/38-lock-wait-duration-guard.sh` | `sh scripts/migration/verify/tests/scenarios/38-lock-wait-duration-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/39-prepared-xacts-guard.sh` | `sh scripts/migration/verify/tests/scenarios/39-prepared-xacts-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/40-datfrozenxid-age-guard.sh` | `sh scripts/migration/verify/tests/scenarios/40-datfrozenxid-age-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/41-multixact-wraparound-guard.sh` | `sh scripts/migration/verify/tests/scenarios/41-multixact-wraparound-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/42-relfrozenxid-table-guard.sh` | `sh scripts/migration/verify/tests/scenarios/42-relfrozenxid-table-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/43-dead-tuple-ratio-guard.sh` | `sh scripts/migration/verify/tests/scenarios/43-dead-tuple-ratio-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/44-sequence-overflow-guard.sh` | `sh scripts/migration/verify/tests/scenarios/44-sequence-overflow-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/45-sequences-gap-check.sh` | `sh scripts/migration/verify/tests/scenarios/45-sequences-gap-check.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/46-fk-integrity.sh` | `sh scripts/migration/verify/tests/scenarios/46-fk-integrity.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/47-index-corruption-amcheck.sh` | `sh scripts/migration/verify/tests/scenarios/47-index-corruption-amcheck.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/48-heap-corruption-scan.sh` | `sh scripts/migration/verify/tests/scenarios/48-heap-corruption-scan.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/49-collation-version-mismatch.sh` | `sh scripts/migration/verify/tests/scenarios/49-collation-version-mismatch.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/50-replication-slots-guard.sh` | `sh scripts/migration/verify/tests/scenarios/50-replication-slots-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/51-replication-lag-guard.sh` | `sh scripts/migration/verify/tests/scenarios/51-replication-lag-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/52-subscription-lag-guard.sh` | `sh scripts/migration/verify/tests/scenarios/52-subscription-lag-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/53-wal-sender-timeout-guard.sh` | `sh scripts/migration/verify/tests/scenarios/53-wal-sender-timeout-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/54-cron-job-failover-guard.sh` | `sh scripts/migration/verify/tests/scenarios/54-cron-job-failover-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/55-pg-stat-statements-reset-guard.sh` | `sh scripts/migration/verify/tests/scenarios/55-pg-stat-statements-reset-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/56-pgss-config-ausente.sh` | `sh scripts/migration/verify/tests/scenarios/56-pgss-config-ausente.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/57-pgss-config-carregado.sh` | `sh scripts/migration/verify/tests/scenarios/57-pgss-config-carregado.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/58-logical-publication-guard.sh` | `sh scripts/migration/verify/tests/scenarios/58-logical-publication-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/59-schema-freeze-guard.sh` | `sh scripts/migration/verify/tests/scenarios/59-schema-freeze-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/60-wal-level-replica.sh` | `sh scripts/migration/verify/tests/scenarios/60-wal-level-replica.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/61-wal-level-logical-ok.sh` | `sh scripts/migration/verify/tests/scenarios/61-wal-level-logical-ok.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/62-checksums-on.sh` | `sh scripts/migration/verify/tests/scenarios/62-checksums-on.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/63-archive-on.sh` | `sh scripts/migration/verify/tests/scenarios/63-archive-on.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/64-ssl-on.sh` | `sh scripts/migration/verify/tests/scenarios/64-ssl-on.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/65-ssl-conexao-sem-tls.sh` | `sh scripts/migration/verify/tests/scenarios/65-ssl-conexao-sem-tls.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/66-archive-falhando.sh` | `sh scripts/migration/verify/tests/scenarios/66-archive-falhando.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/70-fumaca-banco-vazio.sh` | `sh scripts/migration/verify/tests/scenarios/70-fumaca-banco-vazio.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/71-fumaca-banco-com-dados.sh` | `sh scripts/migration/verify/tests/scenarios/71-fumaca-banco-com-dados.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/72-fumaca-papel-sem-privilegio.sh` | `sh scripts/migration/verify/tests/scenarios/72-fumaca-papel-sem-privilegio.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/73-fumaca-cluster-endurecido.sh` | `sh scripts/migration/verify/tests/scenarios/73-fumaca-cluster-endurecido.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/74-duplicate-indexes.sh` | `sh scripts/migration/verify/tests/scenarios/74-duplicate-indexes.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/75-sequences-audit.sh` | `sh scripts/migration/verify/tests/scenarios/75-sequences-audit.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/76-logical-vs-physical-drift.sh` | `sh scripts/migration/verify/tests/scenarios/76-logical-vs-physical-drift.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/77-cron-audits.sh` | `sh scripts/migration/verify/tests/scenarios/77-cron-audits.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/78-audits-com-achados.sh` | `sh scripts/migration/verify/tests/scenarios/78-audits-com-achados.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/80-full-audit-lista.sh` | `sh scripts/migration/verify/tests/scenarios/80-full-audit-lista.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/81-full-audit-ponta-a-ponta.sh` | `sh scripts/migration/verify/tests/scenarios/81-full-audit-ponta-a-ponta.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/82-full-audit-endurecido.sh` | `sh scripts/migration/verify/tests/scenarios/82-full-audit-endurecido.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/83-full-audit-sem-conexao.sh` | `sh scripts/migration/verify/tests/scenarios/83-full-audit-sem-conexao.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/86-exporter-falhas.sh` | `sh scripts/migration/verify/tests/scenarios/86-exporter-falhas.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/87-exporter-ponta-a-ponta.sh` | `sh scripts/migration/verify/tests/scenarios/87-exporter-ponta-a-ponta.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/88-wrappers-paridade.sh` | `sh scripts/migration/verify/tests/scenarios/88-wrappers-paridade.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/89-wrappers-canario-planner-timeline.sh` | `sh scripts/migration/verify/tests/scenarios/89-wrappers-canario-planner-timeline.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/90-pitr-window-verifier.sh` | `sh scripts/migration/verify/tests/scenarios/90-pitr-window-verifier.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/91-pitr-window-verifier-endurecido.sh` | `sh scripts/migration/verify/tests/scenarios/91-pitr-window-verifier-endurecido.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/92-dns-scripts.sh` | `sh scripts/migration/verify/tests/scenarios/92-dns-scripts.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/scenarios/93-contrato-estatico-detecta.sh` | `sh scripts/migration/verify/tests/scenarios/93-contrato-estatico-detecta.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tests/valida-prom.sh` | `sh scripts/migration/verify/tests/valida-prom.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/timeline-divergence-guard.sh` | `sh scripts/migration/verify/timeline-divergence-guard.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/triggers-parity.sh` | `sh scripts/migration/verify/triggers-parity.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migration/verify/tz-locale-parity.sh` | `sh scripts/migration/verify/tz-locale-parity.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/monitoring/ai-gateway-partitions-exporter.sh` | `sh scripts/monitoring/ai-gateway-partitions-exporter.sh` | .github/workflows/monitoring-lint.yml |
| `scripts/monitoring/check-runbook-coverage.sh` | `sh scripts/monitoring/check-runbook-coverage.sh` | .github/workflows/monitoring-lint.yml |
| `scripts/monitoring/rpc-perf-exporter.sh` | `sh scripts/monitoring/rpc-perf-exporter.sh` | .github/workflows/monitoring-lint.yml |
| `scripts/monitoring/rpc-plan-exporter.sh` | `sh scripts/monitoring/rpc-plan-exporter.sh` | .github/workflows/monitoring-lint.yml |
| `scripts/regras_negocio/generate.py` | `python3 scripts/regras_negocio/generate.py` | package.json:scripts, .github/workflows/contexto.yml |
| `scripts/regras_negocio/indice.py` | `python3 scripts/regras_negocio/indice.py` | package.json:scripts, .github/workflows/contexto.yml |
| `scripts/regras_negocio/test_generate.py` | `python3 scripts/regras_negocio/test_generate.py` | .github/workflows/contexto.yml |
| `scripts/regras_negocio/test_generate_fatos.py` | `python3 scripts/regras_negocio/test_generate_fatos.py` | .github/workflows/contexto.yml |
| `scripts/regras_negocio/test_indice.py` | `python3 scripts/regras_negocio/test_indice.py` | .github/workflows/contexto.yml |
| `scripts/retry-failed.js` | `node scripts/retry-failed.js` | scripts/apply-cli.test.mjs |
| `scripts/rls-matrix/check-rls-baseline.mjs` | `node scripts/rls-matrix/check-rls-baseline.mjs` | .github/workflows/rls-exposure-guard.yml |
| `scripts/rls-matrix/check-rls-baseline.test.mjs` | `node --test scripts/rls-matrix/check-rls-baseline.test.mjs` | .github/workflows/rls-exposure-guard.yml |
| `scripts/run_explain_analyze.py` | `python3 scripts/run_explain_analyze.py` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/sql-raiz.test.mjs` | `node --test scripts/sql-raiz.test.mjs` | scripts/hardening/_pg-teste.mjs |
| `scripts/supabase_snapshot/snapshot.py` | `python3 scripts/supabase_snapshot/snapshot.py` | package.json:scripts, .github/workflows/contexto.yml |
| `scripts/supabase_snapshot/test_snapshot.py` | `python3 scripts/supabase_snapshot/test_snapshot.py` | .github/workflows/contexto.yml |
| `scripts/test_generate_docs.py` | `python3 scripts/test_generate_docs.py` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/test_run_explain_analyze.py` | `python3 scripts/test_run_explain_analyze.py` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |

## Hooks e workflows anteriores

Hooks inventariados: `(default do Git)` era o hooksPath observado. A tabela registra os arquivos, sem afirmar bootstrap instalado ou execução efetiva em outro clone. O registro legacy desses hooks limita apenas execução arbitrária pelo dispatcher; o Git e a ponte preservam os gatilhos originais.

| Hook exato | Gatilho Git original | Referência de inventário |
|---|---|---|
| Nenhum hook versionado inventariado | — | A instalação do novo kit é independente. |

Workflows anteriores preservados: 7. Os gatilhos e condições de cada arquivo continuam definidos no YAML original; esta listagem não os promove ao novo pipeline e não executa suas operações.

- `.github/workflows/ci.yml`
- `.github/workflows/contexto.yml`
- `.github/workflows/fix-jwt-proxies-externas.yml`
- `.github/workflows/inventario-estado-semanal.yml`
- `.github/workflows/monitoring-lint.yml`
- `.github/workflows/restore-drill.yml`
- `.github/workflows/rls-exposure-guard.yml`

Os helpers dos corretores anteriores são cobertos por suites de regressão em fixtures; a chamada operacional original continua no respectivo hook/workflow. Os quatro registros principais e helpers ficam explícitos no JSON, sem globs para novos arquivos.
