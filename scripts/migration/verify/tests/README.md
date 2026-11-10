# Suíte de validação dos guards (Rodada 23/10)

Cada arquivo em `scenarios/NN-*.sh` é um teste isolado, carregado pelo `run-all.sh` dentro
de um subshell e executado num **banco próprio**, criado e dropado pelo runner:

```
EXPECTED_EXIT=0|nonzero|N   código de saída esperado de run_guard (default 0)
DOIS_LADOS=1                (opcional) antes de plantar a condição, o guard tem de sair 0
CLUSTER=endurecido          (opcional) exige o sandbox com TLS/checksums/archive/wal_level=logical
requires()                  (opcional) devolve != 0 e explica → cenário vira SKIP
setup_ok()                  (opcional, com DOIS_LADOS) fixture SAUDÁVEL — prova que não há falso-positivo
run_guard_ok()              (opcional, com DOIS_LADOS) comando do lado limpo (default: run_guard)
setup()                     planta a condição ruim
run_guard()                 executa o guard SQL/shell
cleanup_scenario()          desfaz o que não morre com o banco (slots, roles, sessões)
```

Funções de apoio (`lib.sh`): `guard arquivo.sql [-v var=valor]`, `sql`, `sql_at`, `db_url`,
`config`, `exige_config`, `espera_ate`, `bg_abre`/`bg_envia`/`bg_fecha` (sessões que ficam
abertas), `dubla` (psql/dig falsos no PATH), `espera_saida`, `contem`/`nao_contem`,
`fumaca_sql`, `valida_prom`.

Requisitos: `psql`; `docker` só no modo padrão; `jq`, `openssl` e `pg_receivewal` para os
cenários que os usam (sem eles o cenário vira SKIP).

## Modos

```
./run-all.sh                      # Docker: sobe postgres:15-alpine (e o endurecido sob demanda)
./run-all.sh --only 04,11,14,17   # subset por número
./run-all.sh --list               # lista cenários, cluster e expectativa
PG_IMAGE=postgres:17-alpine ./run-all.sh

# Sem Docker: usa um Postgres que já está de pé (papel com CREATE DATABASE)
USE_EXISTING_PG=1 GUARD_PGHOST=127.0.0.1 GUARD_PGPORT=5432 GUARD_PGUSER=postgres ./run-all.sh
```

Variáveis: `GUARD_PGHOST/GUARD_PGPORT/GUARD_PGUSER/GUARD_PGPASSWORD` (caem para `PG*`),
`GUARD_DB_PREFIX` (default `guardtest`), `GUARD_OUT_DIR` (default `tests/out/`, ignorado pelo
git), `GUARD_SCENARIO_TIMEOUT` (default 180 s), `GUARD_DOCKER_PORT`/`GUARD_DOCKER_HARD_PORT`
(54329/54330), `PG_IMAGE`.

No modo existente o cluster **nunca** é reconfigurado: cenários que dependem de config de
cluster (`CLUSTER=endurecido`, `max_prepared_transactions`, `shared_preload_libraries`)
saem como SKIP com o motivo. Guards que olham o cluster inteiro (sessões, slots) podem ser
afetados por outras cargas no mesmo servidor — para um veredito limpo use o modo Docker.

Saída em `out/report-<UTC>.md` (Markdown) e `out/report-<UTC>.json` (CI), mais um `.log` por
cenário. Exit code do runner: 0 = nenhum FAIL (SKIP não reprova); 1 = algum FAIL; 2 = erro
de uso/infra.

## Cobertura

Hoje são 81 cenários (confira com `./run-all.sh --list | wc -l`):

| Faixa | O que cobre |
| ----- | ----------- |
| `00`, `93` | contrato estático (cabeçalho, variáveis com default, listas do `full-audit.sh`, dois lados por guard) e prova de que ele reprova violações |
| `01`–`25` | regressões das Rodadas 23–25 (F1–F4, gaps 21/24/25), agora com os dois lados |
| `26` | monitoração: regras, runbook e parse do exporter |
| `30`–`59` | um cenário por guard: lado limpo + lado plantado |
| `60`–`66` | guards de config de cluster (`wal_level`, checksums, archive, TLS) nos dois sandboxes |
| `70`–`73` | fumaça: **todo** `*.sql` roda limpo em banco vazio, com dados, sem privilégio e no cluster endurecido |
| `74`–`78` | audits com achados plantados (avisam e continuam saindo 0) |
| `80`–`87` | `full-audit.sh` e exporter ponta a ponta, inclusive modos de falha |
| `88`–`92` | wrappers shell (paridade, canário, PITR, planner, timeline, DNS com `dig` dublê) |

`contrato-estatico.test.sh` também roda sozinho, sem banco. A matriz histórica e o veredito
da Rodada 23 estão em `docs/AUDIT_VALIDATION_23_10.md`.
