# Suíte de validação dos guards (Rodada 23/10)

Cada arquivo em `scenarios/NN-*.sh` é um teste isolado:

```
setup()      — provisiona a condição no sandbox (Docker Postgres 15)
run_guard()  — executa o guard SQL/shell
assert_exit  — compara exit code observado com o esperado
cleanup()    — desfaz a condição
```

Requisitos: `docker`, `psql`, `jq`.

```
./run-all.sh                     # todos
./run-all.sh --only 04,11,14,17  # subset
PG_IMAGE=postgres:16 ./run-all.sh
```

Saída em `out/report-<UTC>.md` (Markdown) e `out/report-<UTC>.json` (CI).
Exit code do runner ≠ 0 se qualquer cenário falhar sua asserção.

A matriz completa (30 cenários) e o veredito de cada um estão em
`docs/AUDIT_VALIDATION_23_10.md`.