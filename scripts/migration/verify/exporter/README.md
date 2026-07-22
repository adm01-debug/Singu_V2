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

## Metricas

| Nome | Tipo | Labels | Semantica |
| ---- | ---- | ------ | --------- |
| `guard_status` | gauge | `name`, `severity` | 0 OK, 1 WARN, 2 FATAL |
| `guard_last_run_timestamp_seconds` | gauge | — | Dead-man switch |
| `guard_run_duration_seconds` | gauge | — | SLO de execucao |
| `guard_audit_exit_code` | gauge | — | 0 = pass, >0 = fatais |
| `guard_exporter_up` | gauge | — | 1 se exporter terminou |

## Cardinalidade

`name` cardinalidade == numero de guards (66 na 25/10). Multiplicado por 2
severidades = **~130 series**, muito abaixo do limite operacional (10k). A
`db-guards.yml` agrega `sum by (severity)` para dashboards.

## Escrita atomica

Escreve em `$OUT_FILE.$$.tmp` e faz `mv -f` — evita que node_exporter leia
arquivo parcial. Obrigatorio pelo protocolo do textfile collector.

## Timezone

Timestamps sao UNIX epoch (`date +%s`), imunes a timezone drift. O exporter
nunca formata datas locais em labels.

## Alertas relacionados

Ver `monitoring/prometheus/rules/db-guards.yml` para as regras que consomem
estas metricas (FATAL, WARN, dead-man switch).