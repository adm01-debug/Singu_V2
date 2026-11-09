# full-audit-exporter — Rodada 26/10

Exporta o resultado do `full-audit.sh` como metricas Prometheus via
node_exporter textfile collector.

## Instalacao

1. Instale `node_exporter` com `--collector.textfile.directory=/var/lib/node_exporter/textfile_collector`.
2. Garanta que `DEST_DB_URL` esteja no ambiente (`~/.env` do usuario do cron).
3. Instale o cron (a cada 5 min):

```cron
*/5 * * * * /opt/db-guards/scripts/migration/verify/exporter/full-audit-exporter.sh >/dev/null 2>&1
```

4. Prometheus fara scrape via node_exporter (`/metrics`).

## Variaveis de ambiente

| Variavel | Default | Uso |
| -------- | ------- | --- |
| `TEXTFILE_DIR` | `/var/lib/node_exporter/textfile_collector` | onde publicar `db_guards.prom` |
| `AUDIT_LOG_FILE` | temporario (apagado ao fim) | guarda o log bruto do `full-audit.sh` (modo 0600) |
| `AUDIT_TIMEOUT_SECONDS` | `0` (sem limite) | mata a auditoria que passar do tempo |
| `AUDIT_SCRIPT` | `../full-audit.sh` | troca o script de auditoria (testes) |

## Metricas

| Nome | Tipo | Labels | Semantica |
| ---- | ---- | ------ | --------- |
| `guard_status` | gauge | `name`, `severity` | 0 OK, 1 WARN, 2 FATAL |
| `guard_last_run_timestamp_seconds` | gauge | — | Dead-man switch: ultima auditoria **valida** |
| `guard_run_duration_seconds` | gauge | — | SLO de execucao |
| `guard_audit_exit_code` | gauge | — | 0 = pass, 1 = fatais, 2 = config, 3 = sem conexao, 124 = tempo esgotado, 127 = script ausente |
| `guard_exporter_error` | gauge | — | 1 se a auditoria nao rodou |
| `guard_exporter_up` | gauge | — | 1 se exporter terminou com auditoria valida; **ausente** em caso de erro |

`severity="warn"` vira 1 quando o guard imprime `WARNING:` ou termina com saida
diferente de zero (linha `WARN-FAIL` do `full-audit.sh`).

## Quando a auditoria nao roda

Sem conexao com o banco, sem `DEST_DB_URL`, com estouro de tempo ou com o script
ausente, o exporter **nao** publica arquivo vazio nem parcial: publica um arquivo
completo com `guard_exporter_error 1`, omite `guard_exporter_up` (o alerta
`DBGuardExporterDown` usa `absent(guard_exporter_up)`) e repete `guard_status` e
`guard_last_run_timestamp_seconds` da ultima auditoria valida — o dead-man
continua contando e um FATAL ativo nao desaparece por causa de uma queda de rede.
O codigo de saida nesse caso e 3.

## Cardinalidade

`name` cardinalidade == numero de guards na bateria (69: 26 FATAL + 43 WARN; confira
com `full-audit.sh --listar`). Cada guard pertence a uma unica severidade, entao sao
**~70 series**, muito abaixo do limite operacional (10k). A `db-guards.yml` agrega
`sum by (severity)` para dashboards.

## Escrita atomica e concorrencia

Escreve em arquivo temporario oculto no mesmo diretorio (`.db_guards.XXXXXX`, que o
node_exporter ignora por nao terminar em `.prom`) e faz `mv -f` — evita que o
node_exporter leia arquivo parcial. Obrigatorio pelo protocolo do textfile
collector. Um `flock` em `.db_guards.lock` impede duas execucoes sobrepostas: a
segunda sai sem alterar nada.

## Timezone

Timestamps sao UNIX epoch (`date +%s`), imunes a timezone drift. O exporter
nunca formata datas locais em labels.

## Alertas relacionados

Ver `monitoring/prometheus/rules/db-guards.yml` para as regras que consomem
estas metricas (FATAL, WARN, dead-man switch).

## Testes

`scripts/migration/verify/tests/run-all.sh --only 26,86,87` (parse do log, modos de
falha e execucao ponta a ponta contra um Postgres real).
