#!/usr/bin/env bash
# alerts.test.sh — valida ai-gateway-partitions-alerts.yml e rpc-perf-alerts.yml.
#   1. Estrutura (sem ferramenta externa): todo alerta tem expr, severity, summary e
#      description; nomes únicos; todo alerta com `for`.
#   2. Contrato com os exporters: toda métrica usada numa expressão é realmente emitida por
#      um dos três exporters, com os labels e valores de label usados nos seletores. Os
#      exporters rodam aqui com um psql dublê (sem banco).
#   3. promtool check rules (sintaxe do YAML, do PromQL e dos templates) e promtool test
#      rules (cada alerta dispara quando deve e fica quieto quando não deve). Usa o
#      promtool do PATH ou a imagem prom/prometheus via docker; se nenhum dos dois existir,
#      esta parte fica marcada NÃO VERIFICADO e o teste segue (saída 0).
# Não precisa de banco nem de rede (o docker usa a imagem já baixada).
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REGRAS=("$AQUI/ai-gateway-partitions-alerts.yml" "$AQUI/rpc-perf-alerts.yml")
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
PASSOU=0; FALHOU=0; NAO_VERIFICADO=0
ok()    { PASSOU=$((PASSOU + 1)); echo "ok    $1"; }
falha() { FALHOU=$((FALHOU + 1)); echo "FALHA $1"; [[ -n "${2:-}" && -f "$2" ]] && sed 's/^/        /' "$2" | head -n 40; return 0; }
# veredito <código> <descrição> [arquivo de log] — ok se o código for 0
veredito() { if [[ "$1" -eq 0 ]]; then ok "$2"; else falha "$2" "${3:-}"; fi; }
# afirma <descrição> <comando de teste...>
afirma() { local d="$1"; shift; if "$@"; then ok "$d"; else falha "$d"; fi; }

# ── 1. estrutura ──
for f in "${REGRAS[@]}"; do
  b="$(basename "$f")"
  awk -v arq="$b" '
    function fecha() {
      if (nome == "") return
      if (!tem_expr) { print arq ": " nome " sem expr"; ruim = 1 }
      if (!tem_for)  { print arq ": " nome " sem for"; ruim = 1 }
      if (!tem_sev)  { print arq ": " nome " sem labels.severity"; ruim = 1 }
      if (!tem_sum)  { print arq ": " nome " sem annotations.summary"; ruim = 1 }
      if (!tem_desc) { print arq ": " nome " sem annotations.description"; ruim = 1 }
      if (visto[nome]++) { print arq ": alerta duplicado " nome; ruim = 1 }
      nome = ""
    }
    /^[ ]*- alert:/ { fecha(); nome = $3; tem_expr = tem_for = tem_sev = tem_sum = tem_desc = 0; total++; next }
    nome != "" && /^[ ]+expr:/        { tem_expr = 1 }
    nome != "" && /^[ ]+for: *[0-9]+[smhd]$/ { tem_for = 1 }
    nome != "" && /^[ ]+severity: *(critical|high|warning|info)$/ { tem_sev = 1 }
    nome != "" && /^[ ]+summary:/     { tem_sum = 1 }
    nome != "" && /^[ ]+description:/ { tem_desc = 1 }
    /\t/ { print arq ":" FNR ": TAB no YAML"; ruim = 1 }
    END { fecha(); if (total == 0) { print arq ": nenhum alerta"; ruim = 1 }; exit ruim }' "$f" >"$TMP/estrutura.log" 2>&1
  veredito $? "estrutura: $b" "$TMP/estrutura.log"
  afirma "termina com quebra de linha: $b" test -z "$(tail -c 1 "$f")"
done

# Cópias sem o bloco annotations: (a) isola as expressões para o cruzamento com os
# exporters; (b) o promtool test compara anotações expandidas — aqui interessa o PromQL.
mkdir -p "$TMP/regras"
for f in "${REGRAS[@]}"; do
  awk '
    /^[ ]*annotations:[ ]*$/ { ind = match($0, /[^ ]/); pulando = 1; next }
    pulando { if ($0 ~ /^[ ]*$/) next; if (match($0, /[^ ]/) > ind) next; pulando = 0 }
    !/^[ ]*#/ { print }' "$f" >"$TMP/regras/$(basename "$f")"
done

# ── 2. métricas das regras × métricas dos exporters ──
mkdir -p "$TMP/bin" "$TMP/tf"
cat >"$TMP/bin/psql" <<'EOS'
#!/usr/bin/env bash
# psql dublê: devolve linhas no formato que cada exporter pede (-F tab ou '|').
case "$*" in
  *percentile_cont*)    printf 'get_ai_gateway_health\t10\t550.00\t955.00\t991.00\t1000.00\n' ;;
  *rpc_plan_snapshots*) printf 'get_ai_gateway_health\t3\t60\t5\t900\n' ;;
  *ai_gateway_metrics*) printf 'aigw_2026_11|100|8192|2026-11-01 00:00:00+00|2026-12-01 00:00:00+00\n' ;;
  *) exit 1 ;;
esac
EOS
chmod +x "$TMP/bin/psql"
{
  PATH="$TMP/bin:$PATH" bash "$AQUI/rpc-perf-exporter.sh"
  PATH="$TMP/bin:$PATH" bash "$AQUI/rpc-plan-exporter.sh"
  PATH="$TMP/bin:$PATH" TEXTFILE_DIR="$TMP/tf" bash "$AQUI/ai-gateway-partitions-exporter.sh" && cat "$TMP/tf/aigw_partitions.prom"
} >"$TMP/emitido.prom" 2>"$TMP/emitido.err"
veredito $? "exporters rodam com psql dublê" "$TMP/emitido.err"
grep -v '^#' "$TMP/emitido.prom" >"$TMP/series.txt"

usadas=0
while IFS= read -r metrica; do
  usadas=$((usadas + 1))
  grep -q "^${metrica}[ {]" "$TMP/series.txt" || falha "métrica $metrica usada em alerta mas NÃO emitida por nenhum exporter"
done < <(grep -ohE '\b(aigw|rpc_perf|rpc_plan)_[a-z0-9_]+' "$TMP/regras"/*.yml | sort -u)
afirma "as $usadas métricas usadas nas expressões foram conferidas contra a saída dos exporters (mínimo 10)" test "$usadas" -ge 10

seletores=0
while IFS= read -r seletor; do
  seletores=$((seletores + 1))
  metrica="${seletor%%\{*}"; corpo="${seletor#*\{}"; corpo="${corpo%\}}"
  [[ -n "$corpo" ]] || continue
  candidatos="$(grep "^${metrica}{" "$TMP/series.txt")"
  IFS=',' read -r -a pares <<<"$corpo"
  for par in "${pares[@]}"; do
    chave="${par%%=*}"; valor="${par#*=}"
    grep -q "[{,]${chave}=" <<<"$candidatos" || { falha "seletor $seletor: label '$chave' não existe em $metrica"; continue 2; }
    [[ "$par" == *'=~'* || "$par" == *'!='* ]] && continue
    candidatos="$(grep -F "${chave}=${valor}" <<<"$candidatos")"
    [[ -n "$candidatos" ]] || { falha "seletor $seletor: nenhuma série emitida com ${chave}=${valor}"; continue 2; }
  done
done < <(grep -ohE '\b(aigw|rpc_perf|rpc_plan)_[a-z0-9_]+\{[^}]*\}' "$TMP/regras"/*.yml | sort -u)
afirma "os $seletores seletores com labels foram conferidos contra séries realmente emitidas (mínimo 4)" test "$seletores" -ge 4

# ── 3. promtool ──
PROMTOOL=()
if command -v promtool >/dev/null 2>&1; then
  PROMTOOL=(promtool)
elif command -v docker >/dev/null 2>&1 && docker image inspect prom/prometheus:latest >/dev/null 2>&1; then
  chmod -R a+rX "$TMP"
  PROMTOOL=(docker run --rm -v "$TMP:/w:ro" -w /w --entrypoint promtool prom/prometheus:latest)
fi
if [[ ${#PROMTOOL[@]} -eq 0 ]]; then
  NAO_VERIFICADO=1
  echo "NÃO VERIFICADO: promtool indisponível (sem binário no PATH e sem imagem prom/prometheus) — sintaxe e semântica do PromQL não foram checadas."
else
  mkdir -p "$TMP/originais"; cp "${REGRAS[@]}" "$TMP/originais/"; chmod -R a+rX "$TMP"
  ( cd "$TMP" && "${PROMTOOL[@]}" check rules originais/ai-gateway-partitions-alerts.yml originais/rpc-perf-alerts.yml ) >"$TMP/check.log" 2>&1
  veredito $? "promtool check rules ($(grep -oE '[0-9]+ rules' "$TMP/check.log" | awk '{s+=$1} END{print s+0}') regras em 2 arquivos)" "$TMP/check.log"

  QUIETOS=""
  for a in AiGatewayPartitionExporterDown AiGatewayPartitionBloatBytes AiGatewayPartitionBloatRows \
           AiGatewayPartitionExpiringNotDropped AiGatewayNoCurrentPartition AiGatewayPartitionExporterStale \
           AiGatewayHealthRpcSlow RpcPerfSamplesMissing RpcPerfCriticalP99 RpcPerfDegradation RpcPlanRegression \
           RpcPlanExporterMissing RpcPlanChurn RpcPlanChurnWithLatency RpcPerfExporterDown RpcPlanExporterDown; do
    QUIETOS+="      - {eval_time: 2h30m, alertname: $a, exp_alerts: []}"$'\n'
  done
  n_regras="$(grep -hc -- '- alert:' "${REGRAS[@]}" | awk '{s+=$1} END{print s}')"
  afirma "o cenário 'tudo saudável' lista os $n_regras alertas dos YAML (alerta novo exige atualizar alerts.test.sh)" \
    test "$(grep -c alertname <<<"$QUIETOS")" = "$n_regras"

  SAUDAVEL="
      - {series: 'aigw_partitions_exporter_up', values: '1x1700'}
      - {series: 'aigw_partitions_last_run_timestamp_seconds', values: '0+60x1700'}
      - {series: 'aigw_partitions_expiring_not_dropped', values: '0x1700'}
      - {series: 'rpc_perf_exporter_up', values: '1x1700'}
      - {series: 'rpc_perf_exporter_last_run_timestamp_seconds', values: '0+60x1700'}
      - {series: 'rpc_plan_exporter_up', values: '1x1700'}
      - {series: 'rpc_plan_exporter_last_run_timestamp_seconds', values: '0+60x1700'}
      - {series: 'rpc_plan_window_hours', values: '6x1700'}"
  cat >"$TMP/testes.yml" <<YML
rule_files: [regras/ai-gateway-partitions-alerts.yml, regras/rpc-perf-alerts.yml]
evaluation_interval: 1m
tests:
  - name: tudo saudavel - nenhum alerta
    interval: 1m
    input_series:$SAUDAVEL
      - {series: 'aigw_partition_is_current{partition="p_atual"}', values: '1x1700'}
      - {series: 'aigw_partition_bytes{partition="p_atual"}', values: '1000x1700'}
      - {series: 'aigw_partition_rows{partition="p_atual"}', values: '10x1700'}
      - {series: 'rpc_perf_samples_total{rpc="get_ai_gateway_health"}', values: '5x1700'}
      - {series: 'rpc_perf_latency_ms{rpc="get_ai_gateway_health",quantile="0.95"}', values: '100x1700'}
      - {series: 'rpc_perf_latency_ms{rpc="get_ai_gateway_health",quantile="0.99"}', values: '200x1700'}
      - {series: 'rpc_plan_changed{rpc="get_ai_gateway_health"}', values: '0x1700'}
      - {series: 'rpc_plan_p95_ms{rpc="get_ai_gateway_health"}', values: '100x1700'}
    alert_rule_test:
$QUIETOS
  - name: particoes existem mas nenhuma cobre o mes atual
    interval: 1m
    input_series:
      - {series: 'aigw_partitions_exporter_up', values: '1x60'}
      - {series: 'aigw_partition_is_current{partition="velha"}', values: '0x60'}
    alert_rule_test:
      - eval_time: 15m
        alertname: AiGatewayNoCurrentPartition
        exp_alerts: [{exp_labels: {severity: critical, component: ai-gateway-metrics}}]
      - {eval_time: 15m, alertname: AiGatewayPartitionExporterDown, exp_alerts: []}

  - name: zero particoes (a soma nao existe) tambem dispara
    interval: 1m
    input_series:
      - {series: 'aigw_partitions_exporter_up', values: '1x60'}
    alert_rule_test:
      - eval_time: 15m
        alertname: AiGatewayNoCurrentPartition
        exp_alerts: [{exp_labels: {severity: critical, component: ai-gateway-metrics}}]

  - name: exporter reportando up=0 - so o alerta do exporter
    interval: 1m
    input_series:
      - {series: 'aigw_partitions_exporter_up', values: '0x60'}
    alert_rule_test:
      - eval_time: 20m
        alertname: AiGatewayPartitionExporterDown
        exp_alerts: [{exp_labels: {severity: warning, component: ai-gateway-metrics}}]
      - {eval_time: 20m, alertname: AiGatewayNoCurrentPartition, exp_alerts: []}

  - name: exporter sumiu (cron parado, metrica ausente)
    interval: 1m
    input_series:
      - {series: 'up{job="outro"}', values: '1x60'}
    alert_rule_test:
      - eval_time: 20m
        alertname: AiGatewayPartitionExporterDown
        exp_alerts: [{exp_labels: {severity: warning, component: ai-gateway-metrics}}]
      - {eval_time: 20m, alertname: AiGatewayNoCurrentPartition, exp_alerts: []}

  - name: textfile parou de ser atualizado
    interval: 1m
    input_series:
      - {series: 'aigw_partitions_exporter_up', values: '1x60'}
      - {series: 'aigw_partitions_last_run_timestamp_seconds', values: '0x60'}
    alert_rule_test:
      - {eval_time: 29m, alertname: AiGatewayPartitionExporterStale, exp_alerts: []}
      - eval_time: 40m
        alertname: AiGatewayPartitionExporterStale
        exp_alerts: [{exp_labels: {severity: warning, component: ai-gateway-metrics}}]

  - name: bloat e retencao
    interval: 1m
    input_series:
      - {series: 'aigw_partition_bytes{partition="gorda"}', values: '600000000x180'}
      - {series: 'aigw_partition_bytes{partition="magra"}', values: '524288000x180'}
      - {series: 'aigw_partition_rows{partition="gorda"}', values: '6000000x180'}
      - {series: 'aigw_partitions_expiring_not_dropped', values: '2x180'}
    alert_rule_test:
      - {eval_time: 29m, alertname: AiGatewayPartitionBloatBytes, exp_alerts: []}
      - eval_time: 31m
        alertname: AiGatewayPartitionBloatBytes
        exp_alerts: [{exp_labels: {severity: warning, component: ai-gateway-metrics, partition: gorda}}]
      - eval_time: 31m
        alertname: AiGatewayPartitionBloatRows
        exp_alerts: [{exp_labels: {severity: warning, component: ai-gateway-metrics, partition: gorda}}]
      - {eval_time: 1h59m, alertname: AiGatewayPartitionExpiringNotDropped, exp_alerts: []}
      - eval_time: 2h1m
        alertname: AiGatewayPartitionExpiringNotDropped
        exp_alerts: [{exp_labels: {severity: warning, component: ai-gateway-metrics}}]

  - name: RPC lenta (p95 e p99)
    interval: 1m
    input_series:
      - {series: 'rpc_perf_samples_total{rpc="get_ai_gateway_health"}', values: '5x60'}
      - {series: 'rpc_perf_latency_ms{rpc="get_ai_gateway_health",quantile="0.95"}', values: '900x60'}
      - {series: 'rpc_perf_latency_ms{rpc="get_ai_gateway_health",quantile="0.99"}', values: '3000x60'}
      - {series: 'rpc_perf_latency_ms{rpc="outra",quantile="0.95"}', values: '5000x60'}
    alert_rule_test:
      - eval_time: 11m
        alertname: AiGatewayHealthRpcSlow
        exp_alerts: [{exp_labels: {severity: high, service: ai-gateway, component: rpc, rpc: get_ai_gateway_health, quantile: "0.95"}}]
      - eval_time: 6m
        alertname: RpcPerfCriticalP99
        exp_alerts: [{exp_labels: {severity: critical, service: ai-gateway, component: rpc, rpc: get_ai_gateway_health, quantile: "0.99"}}]
      - {eval_time: 16m, alertname: RpcPerfSamplesMissing, exp_alerts: []}

  - name: amostras da RPC sumiram
    interval: 1m
    input_series:
      - {series: 'rpc_perf_samples_total{rpc="outra"}', values: '5x60'}
    alert_rule_test:
      - eval_time: 16m
        alertname: RpcPerfSamplesMissing
        exp_alerts: [{exp_labels: {severity: warning, service: ai-gateway, component: exporter, rpc: get_ai_gateway_health}}]

  - name: plano mudou - regressao, churn e churn com latencia
    interval: 1m
    input_series:
      - {series: 'rpc_plan_window_hours', values: '6x60'}
      - {series: 'rpc_plan_changed{rpc="instavel"}', values: '3x60'}
      - {series: 'rpc_plan_p95_ms{rpc="instavel"}', values: '900x60'}
      - {series: 'rpc_plan_changed{rpc="rapida"}', values: '2x60'}
      - {series: 'rpc_plan_p95_ms{rpc="rapida"}', values: '100x60'}
      - {series: 'rpc_plan_changed{rpc="estavel"}', values: '0x60'}
    alert_rule_test:
      - eval_time: 6m
        alertname: RpcPlanRegression
        exp_alerts:
          - {exp_labels: {severity: warning, service: rpc, component: query-plan, rpc: instavel}}
          - {exp_labels: {severity: warning, service: rpc, component: query-plan, rpc: rapida}}
      - eval_time: 31m
        alertname: RpcPlanChurn
        exp_alerts: [{exp_labels: {severity: high, service: rpc, component: query-plan, rpc: instavel}}]
      - eval_time: 16m
        alertname: RpcPlanChurnWithLatency
        exp_alerts: [{exp_labels: {severity: critical, service: rpc, component: query-plan, rpc: instavel}}]
      - {eval_time: 16m, alertname: RpcPlanExporterMissing, exp_alerts: []}

  - name: exporters de RPC falhando (up=0) e exporter de plano sem publicar a janela
    interval: 1m
    input_series:
      - {series: 'rpc_perf_exporter_up', values: '0x60'}
      - {series: 'rpc_perf_exporter_last_run_timestamp_seconds', values: '0+60x60'}
      - {series: 'rpc_plan_exporter_up', values: '0x60'}
      - {series: 'rpc_plan_exporter_last_run_timestamp_seconds', values: '0+60x60'}
    alert_rule_test:
      - eval_time: 11m
        alertname: RpcPerfExporterDown
        exp_alerts: [{exp_labels: {severity: warning, service: rpc, component: exporter}}]
      - eval_time: 11m
        alertname: RpcPlanExporterDown
        exp_alerts: [{exp_labels: {severity: warning, service: rpc, component: exporter}}]
      - eval_time: 16m
        alertname: RpcPlanExporterMissing
        exp_alerts: [{exp_labels: {severity: warning, service: rpc, component: exporter}}]

  - name: exporters de RPC parados (up=1 antigo, timestamp congelado)
    interval: 1m
    input_series:
      - {series: 'rpc_perf_exporter_up', values: '1x60'}
      - {series: 'rpc_perf_exporter_last_run_timestamp_seconds', values: '0x60'}
    alert_rule_test:
      - {eval_time: 10m, alertname: RpcPerfExporterDown, exp_alerts: []}
      - eval_time: 22m
        alertname: RpcPerfExporterDown
        exp_alerts: [{exp_labels: {severity: warning, service: rpc, component: exporter}}]

  - name: degradacao - p95 da ultima hora 2x o baseline de 24h
    interval: 1m
    input_series:
      - {series: 'rpc_perf_latency_ms{rpc="r",quantile="0.95"}', values: '100x1440 200x120'}
      - {series: 'rpc_perf_latency_ms{rpc="s",quantile="0.95"}', values: '100x1560'}
    alert_rule_test:
      - {eval_time: 23h, alertname: RpcPerfDegradation, exp_alerts: []}
      - eval_time: 25h30m
        alertname: RpcPerfDegradation
        exp_alerts: [{exp_labels: {severity: warning, service: rpc, component: perf-trend, rpc: r, quantile: "0.95"}}]
YML
  chmod -R a+rX "$TMP"
  ( cd "$TMP" && "${PROMTOOL[@]}" test rules testes.yml ) >"$TMP/test.log" 2>&1
  veredito $? "promtool test rules ($(grep -c '^  - name:' "$TMP/testes.yml") cenários de alerta)" "$TMP/test.log"
fi

echo "alerts.test: $PASSOU ok, $FALHOU falha(s)$([[ $NAO_VERIFICADO -eq 1 ]] && echo ', promtool NÃO VERIFICADO')"
[[ $FALHOU -eq 0 ]]
