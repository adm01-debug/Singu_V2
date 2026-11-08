# Workflows de CI — o que cada um faz

> **Gerado por `scripts/ci/render-workflow-docs.mjs`.** Não edite à mão: `--check` falha se
> este arquivo divergir do bloco `# docs:` de cada workflow. Para mudar o texto daqui, mude o
> bloco no YAML.

**8 workflows, 7 com bloco `# docs:`.**

| Workflow | Arquivo | Gatilho | O que prova | Quando falha | Quem é avisado | Custo/sem (min) | Falha (7 d) |
|---|---|---|---|---|---|---|---|
| Contexto para agentes de IA (10 min) | [`contexto.yml`](../../.github/workflows/contexto.yml) | push em main que toque código, banco, scripts das automações ou docs/contexto/regras/manual/; a cada 10 min (minuto 3); dispatch | branch contexto com docs/contexto/{codigo,supabase,regras}/ regerados das três fontes de verdade (código em main, banco oficial, código+migrations+manual/) e docs/contexto/00-INDEX.md montado a partir dos manifests | falha fatal de produtor reprova o workflow; fontes com artefato publicam e as demais mantêm a última versão; erro de download impede a publicação | ninguém (a branch contexto é a prova; errors.md em supabase/ e erros_do_gerador em codigo/ listam seções com falha) | — | — |
| Docs de CI sem drift | [`docs-ci.yml`](../../.github/workflows/docs-ci.yml) | pull_request e push em main que toquem .github/workflows/, scripts/ci/ ou docs/ci/ | docs/ci/README.md e a projecao exata dos blocos "# docs:" dos workflows, e o gerador passa nos proprios testes | PR vermelha com o comando a rodar (node scripts/ci/render-workflow-docs.mjs) e commitar | ninguem — o check da PR e o aviso | — | — |
| Fix JWT proxies externas | [`fix-jwt-proxies-externas.yml`](../../.github/workflows/fix-jwt-proxies-externas.yml) | so manual (workflow_dispatch) — Actions, Fix JWT proxies externas, Run workflow | as 23 proxies externas deployadas sem codigo no repositorio ficam com verify_jwt = false fechado, e a conferencia final sai vazia | alguma proxy nao aceitou a mudanca; o job fica vermelho e o estado final lista quem sobrou | ninguem — quem disparou le o resumo do run | — | — |
| Inventário do estado real (semanal) | [`inventario-estado-semanal.yml`](../../.github/workflows/inventario-estado-semanal.yml) | agendado (seg 10:23 UTC) e dispatch | inventario/estado (banco, edge functions, uso de tabelas, rotas do front, alcance das edges) regerado do banco oficial e do codigo | o job fica vermelho e o inventario nao e atualizado | PR automation/inventario-estado com o inventario novo | — | — |
| monitoring-lint | [`monitoring-lint.yml`](../../.github/workflows/monitoring-lint.yml) | push e pull_request que toquem monitoring/, docs/runbooks/, scripts/monitoring/ ou este workflow | regras do Prometheus (promtool) e config do Alertmanager (amtool) validas, todo alerta com runbook e nenhum segredo no exporter | PR vermelha no job correspondente (promtool, amtool, runbook-coverage ou secret-leak-scan) | ninguem — o proprio check da PR e o aviso | — | — |
| Teste de restauração lógica | [`restore-drill.yml`](../../.github/workflows/restore-drill.yml) | pull_request que toque o workflow, os scripts de DR ou o teste de integracao; e dispatch | copia logica do banco restaura em PostgreSQL efemero, os bloqueios funcionam e a instancia e removida no fim | o job fica vermelho; a evidencia e preservada inclusive nas falhas de preparacao e a instancia efemera nao removida tambem derruba o run | ninguem — evidencia fica no artifact do run, sem dados do banco | — | — |
| RLS exposure guard | [`rls-exposure-guard.yml`](../../.github/workflows/rls-exposure-guard.yml) | pull_request e push em main que toquem supabase/migrations/ ou scripts/rls-matrix/; agendado (seg 06:00 UTC); dispatch | a exposicao real de RLS medida com a anon key e com um usuario logado sem role bate com scripts/rls-matrix/rls-baseline.json | o job fica vermelho e aponta a tabela que passou a expor mais do que o baseline | ninguem — o check da PR e o run agendado vermelho sao o aviso | — | — |

## Detalhe

### Contexto para agentes de IA (10 min) (`contexto.yml`)

- **Gatilho:** push em main que toque código, banco, scripts das automações ou docs/contexto/regras/manual/; a cada 10 min (minuto 3); dispatch
- **O que prova:** branch contexto com docs/contexto/{codigo,supabase,regras}/ regerados das três fontes de verdade (código em main, banco oficial, código+migrations+manual/) e docs/contexto/00-INDEX.md montado a partir dos manifests
- **Quando falha:** falha fatal de produtor reprova o workflow; fontes com artefato publicam e as demais mantêm a última versão; erro de download impede a publicação
- **Quem é avisado:** ninguém (a branch contexto é a prova; errors.md em supabase/ e erros_do_gerador em codigo/ listam seções com falha)

### Docs de CI sem drift (`docs-ci.yml`)

- **Gatilho:** pull_request e push em main que toquem .github/workflows/, scripts/ci/ ou docs/ci/
- **O que prova:** docs/ci/README.md e a projecao exata dos blocos "# docs:" dos workflows, e o gerador passa nos proprios testes
- **Quando falha:** PR vermelha com o comando a rodar (node scripts/ci/render-workflow-docs.mjs) e commitar
- **Quem é avisado:** ninguem — o check da PR e o aviso

### Fix JWT proxies externas (`fix-jwt-proxies-externas.yml`)

- **Gatilho:** so manual (workflow_dispatch) — Actions, Fix JWT proxies externas, Run workflow
- **O que prova:** as 23 proxies externas deployadas sem codigo no repositorio ficam com verify_jwt = false fechado, e a conferencia final sai vazia
- **Quando falha:** alguma proxy nao aceitou a mudanca; o job fica vermelho e o estado final lista quem sobrou
- **Quem é avisado:** ninguem — quem disparou le o resumo do run

### Inventário do estado real (semanal) (`inventario-estado-semanal.yml`)

- **Gatilho:** agendado (seg 10:23 UTC) e dispatch
- **O que prova:** inventario/estado (banco, edge functions, uso de tabelas, rotas do front, alcance das edges) regerado do banco oficial e do codigo
- **Quando falha:** o job fica vermelho e o inventario nao e atualizado
- **Quem é avisado:** PR automation/inventario-estado com o inventario novo

### monitoring-lint (`monitoring-lint.yml`)

- **Gatilho:** push e pull_request que toquem monitoring/, docs/runbooks/, scripts/monitoring/ ou este workflow
- **O que prova:** regras do Prometheus (promtool) e config do Alertmanager (amtool) validas, todo alerta com runbook e nenhum segredo no exporter
- **Quando falha:** PR vermelha no job correspondente (promtool, amtool, runbook-coverage ou secret-leak-scan)
- **Quem é avisado:** ninguem — o proprio check da PR e o aviso

### Teste de restauração lógica (`restore-drill.yml`)

- **Gatilho:** pull_request que toque o workflow, os scripts de DR ou o teste de integracao; e dispatch
- **O que prova:** copia logica do banco restaura em PostgreSQL efemero, os bloqueios funcionam e a instancia e removida no fim
- **Quando falha:** o job fica vermelho; a evidencia e preservada inclusive nas falhas de preparacao e a instancia efemera nao removida tambem derruba o run
- **Quem é avisado:** ninguem — evidencia fica no artifact do run, sem dados do banco

### RLS exposure guard (`rls-exposure-guard.yml`)

- **Gatilho:** pull_request e push em main que toquem supabase/migrations/ ou scripts/rls-matrix/; agendado (seg 06:00 UTC); dispatch
- **O que prova:** a exposicao real de RLS medida com a anon key e com um usuario logado sem role bate com scripts/rls-matrix/rls-baseline.json
- **Quando falha:** o job fica vermelho e aponta a tabela que passou a expor mais do que o baseline
- **Quem é avisado:** ninguem — o check da PR e o run agendado vermelho sao o aviso

## O que NÃO é bug

> Comportamento que parece erro mas é intencional. Cada item vem do bloco `# nao-e-bug:` do YAML.

| Workflow | Situação | Por quê não é bug |
|---|---|---|
| [`contexto.yml`](../../.github/workflows/contexto.yml) | **sem-commit** | "nada mudou" no publicar significa que nenhuma das três fontes mudou desde a última publicação |
| [`contexto.yml`](../../.github/workflows/contexto.yml) | **metricas** | métricas/manifests do banco aguardam 60 min desde a coleta publicada; commits de código não reiniciam o prazo; data ausente/inválida/futura e mudanças de saúde/estado do índice publicam sem espera |
| [`contexto.yml`](../../.github/workflows/contexto.yml) | **banco-pulado** | sem o secret SUPABASE_DB_URL o job do banco sai verde com aviso e a pasta supabase/ fica como estava |

## Sem bloco `# docs:`

> Estes workflows rodam sem declarar gatilho, prova, falha e quem é avisado. Quem for mexer
> em um deles acrescenta o bloco no topo do YAML e roda o gerador de novo.

- [`ci.yml`](../../.github/workflows/ci.yml) — CI
