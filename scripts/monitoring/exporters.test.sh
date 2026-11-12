#!/usr/bin/env bash
# exporters.test.sh — testa rpc-perf-exporter.sh, rpc-plan-exporter.sh e
# ai-gateway-partitions-exporter.sh contra um Postgres real, num banco descartável.
#
# Lê PGHOST/PGPORT/PGUSER/PGPASSWORD do ambiente (precisa poder CREATE DATABASE). Sem banco
# acessível o teste é PULADO (saída 0) — para não quebrar CI sem Postgres.
# Roda sozinho: PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres bash exporters.test.sh
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDA="$AQUI/../migration/verify/tests/valida-prom.sh"
TMP="$(mktemp -d)"
PASSOU=0; FALHOU=0
DB="${MONITORING_TEST_DB_PREFIX:-monitoring_test}_$$"
ADMIN_DB="${PGDATABASE:-postgres}"

if ! command -v psql >/dev/null 2>&1 || ! PGCONNECT_TIMEOUT=3 psql -X -q -d "$ADMIN_DB" -Atc "SELECT 1" >/dev/null 2>&1; then
  echo "PULADO: sem Postgres acessível (defina PGHOST/PGPORT/PGUSER) — exporters.test.sh não rodou."
  rm -rf "$TMP"; exit 0
fi
limpa() {
  psql -X -q -d "$ADMIN_DB" -c "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE)" >/dev/null 2>&1
  rm -rf "$TMP"
}
trap limpa EXIT
psql -X -q -d "$ADMIN_DB" -c "CREATE DATABASE \"$DB\"" >/dev/null || { echo "FALHA: não consegui criar o banco $DB"; exit 1; }
export PGDATABASE="$DB"

ok()    { PASSOU=$((PASSOU + 1)); echo "ok    $1"; }
falha() { FALHOU=$((FALHOU + 1)); echo "FALHA $1"; [[ -n "${2:-}" && -f "$2" ]] && sed 's/^/        /' "$2" | head -n 30; return 0; }
# tem <descrição> <arquivo> <regex> / nao_tem idem
tem()     { if grep -Eq -- "$3" "$2"; then ok "$1"; else falha "$1 — faltou /$3/" "$2"; fi; }
nao_tem() { if grep -Eq -- "$3" "$2"; then falha "$1 — achou /$3/" "$2"; else ok "$1"; fi; }
# sai <descrição> <código esperado> <comando...> — saída em $TMP/out, stderr em $TMP/err
sai() {
  local d="$1" esperado="$2" rc; shift 2
  "$@" >"$TMP/out" 2>"$TMP/err"; rc=$?
  if [[ $rc -eq $esperado ]]; then ok "$d"; else falha "$d (rc=$rc, esperado $esperado)" "$TMP/err"; fi
}
# afirma <descrição> <comando de teste...>
afirma() { local d="$1"; shift; if "$@"; then ok "$d"; else falha "$d"; fi; }
valido() { if bash "$VALIDA" "$2" >"$TMP/valida.log" 2>&1; then ok "$1"; else falha "$1 — formato inválido" "$TMP/valida.log"; fi; }

psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL' || { echo "FALHA: fixture não carregou"; exit 1; }
CREATE TABLE public.rpc_perf_samples (
  id bigserial PRIMARY KEY, rpc_name text NOT NULL, duration_ms numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.rpc_plan_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), rpc_name text NOT NULL, plan jsonb NOT NULL DEFAULT '{}',
  plan_hash text NOT NULL DEFAULT 'h', plan_changed boolean NOT NULL DEFAULT false,
  captured_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.ai_gateway_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(), function_name text NOT NULL DEFAULT 'f',
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
SQL

# ───────────────────────── rpc-perf-exporter ─────────────────────────
P="$AQUI/rpc-perf-exporter.sh"
sai "perf: tabela vazia → documento válido, sem amostras" 0 bash "$P"
valido "perf: formato (vazio)" "$TMP/out"
tem     "perf: up=1 com tabela vazia" "$TMP/out" '^rpc_perf_exporter_up 1$'
nao_tem "perf: nenhuma série por RPC com tabela vazia" "$TMP/out" '^rpc_perf_(samples_total|latency_ms)\{'

psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
INSERT INTO public.rpc_perf_samples (rpc_name, duration_ms) SELECT 'get_ai_gateway_health', g * 100 FROM generate_series(1, 10) g;
INSERT INTO public.rpc_perf_samples (rpc_name, duration_ms, created_at) VALUES ('get_ai_gateway_health', 5000, now() - interval '20 minutes');
INSERT INTO public.rpc_perf_samples (rpc_name, duration_ms) VALUES ('outra-rpc', 10), ('outra_rpc', 20), ('com "aspas" e \barra', 30);
SQL
sai "perf: com dados" 0 bash "$P"
cp "$TMP/out" "$TMP/perf.prom"
valido "perf: formato (com dados, nomes com aspas/barra)" "$TMP/perf.prom"
tem "perf: contagem na janela de 10min (amostra de 20min atrás fica fora)" "$TMP/perf.prom" '^rpc_perf_samples_total\{rpc="get_ai_gateway_health"\} 10$'
tem "perf: p50" "$TMP/perf.prom" '^rpc_perf_latency_ms\{rpc="get_ai_gateway_health",quantile="0.5"\} 550\.00$'
tem "perf: p95" "$TMP/perf.prom" '^rpc_perf_latency_ms\{rpc="get_ai_gateway_health",quantile="0.95"\} 955\.00$'
tem "perf: p99" "$TMP/perf.prom" '^rpc_perf_latency_ms\{rpc="get_ai_gateway_health",quantile="0.99"\} 991\.00$'
tem "perf: max" "$TMP/perf.prom" '^rpc_perf_latency_ms\{rpc="get_ai_gateway_health",quantile="max"\} 1000\.00$'
tem "perf: limiar informativo default" "$TMP/perf.prom" '^rpc_perf_slow_p95_threshold_ms 800$'
if [[ "$(grep -c '^rpc_perf_samples_total{rpc="outra_rpc"}' "$TMP/perf.prom")" == 1 ]]; then ok "perf: nomes que colidem após a limpeza geram UMA série (duplicata invalidaria o arquivo)"
else falha "perf: série duplicada para outra_rpc" "$TMP/perf.prom"; fi
tem "perf: timestamp da execução" "$TMP/perf.prom" '^rpc_perf_exporter_last_run_timestamp_seconds [0-9]{10}$'
RPC_PERF_WINDOW_MINUTES=30 bash "$P" >"$TMP/out" 2>/dev/null
tem "perf: RPC_PERF_WINDOW_MINUTES=30 inclui a amostra antiga" "$TMP/out" '^rpc_perf_samples_total\{rpc="get_ai_gateway_health"\} 11$'
sai "perf: janela inválida ('10; DROP TABLE') → 1 sem tocar no banco" 1 env RPC_PERF_WINDOW_MINUTES='10; DROP TABLE public.rpc_perf_samples' bash "$P"
afirma "perf: uso inválido não imprime documento" test ! -s "$TMP/out"
sai "perf: janela 0 → 1" 1 env RPC_PERF_WINDOW_MINUTES=0 bash "$P"
sai "perf: limiar não numérico → 1" 1 env RPC_PERF_SLOW_P95_MS=abc bash "$P"
afirma "perf: tabela intacta após tentativa de injeção" test "$(psql -X -Atc 'SELECT count(*) FROM public.rpc_perf_samples')" = 14
mkdir -p "$TMP/tf dir"
sai "perf: TEXTFILE_DIR (caminho com espaço) grava rpc_perf.prom" 0 env TEXTFILE_DIR="$TMP/tf dir" bash "$P"
valido "perf: arquivo publicado é válido" "$TMP/tf dir/rpc_perf.prom"
afirma "perf: no modo arquivo nada vai para stdout" test ! -s "$TMP/out"
afirma "perf: arquivo publicado com modo 644" test "$(stat -c %a "$TMP/tf dir/rpc_perf.prom")" = 644
afirma "perf: nenhum temporário esquecido" test -z "$(find "$TMP/tf dir" -name '.rpc_perf.*')"
sai "perf: banco inexistente → 2" 2 env PGDATABASE=banco_que_nao_existe bash "$P"
valido "perf: documento de falha é completo e válido" "$TMP/out"
tem     "perf: falha publica up=0" "$TMP/out" '^rpc_perf_exporter_up 0$'
nao_tem "perf: falha não publica amostras" "$TMP/out" '^rpc_perf_(samples_total|latency_ms)\{'
sai "perf: falha no modo arquivo também publica (2)" 2 env PGDATABASE=banco_que_nao_existe TEXTFILE_DIR="$TMP/tf dir" bash "$P"
tem "perf: arquivo passou a ter up=0 (não ficou o antigo nem vazio)" "$TMP/tf dir/rpc_perf.prom" '^rpc_perf_exporter_up 0$'
sai "perf: --help" 0 bash "$P" --help

# ───────────────────────── rpc-plan-exporter ─────────────────────────
L="$AQUI/rpc-plan-exporter.sh"
sai "plan: tabela vazia → válido" 0 bash "$L"
valido "plan: formato (vazio)" "$TMP/out"
tem "plan: janela default publicada" "$TMP/out" '^rpc_plan_window_hours 6$'
psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
INSERT INTO public.rpc_plan_snapshots (rpc_name, plan_changed, captured_at)
SELECT 'get_ai_gateway_health', g <= 3, now() - (g || ' minutes')::interval FROM generate_series(1, 5) g;
INSERT INTO public.rpc_plan_snapshots (rpc_name, plan_changed, captured_at) VALUES
  ('get_ai_gateway_health', true, now() - interval '10 hours'),
  ('sem_amostras', false, now()),
  ('com "aspas" e \barra', true, now());
SQL
sai "plan: com dados" 0 bash "$L"
cp "$TMP/out" "$TMP/plan.prom"
valido "plan: formato (com dados; label com aspas e barra escapados)" "$TMP/plan.prom"
tem "plan: mudanças na janela de 6h (a de 10h atrás fica fora)" "$TMP/plan.prom" '^rpc_plan_changed\{rpc="get_ai_gateway_health"\} 3$'
tem "plan: snapshots na janela" "$TMP/plan.prom" '^rpc_plan_snapshots_total\{rpc="get_ai_gateway_health"\} 5$'
tem "plan: idade da última mudança (~60s)" "$TMP/plan.prom" '^rpc_plan_change_age_seconds\{rpc="get_ai_gateway_health"\} (5[0-9]|6[0-9]|7[0-9])$'
tem "plan: p95 de 24h cruzado com rpc_perf_samples (percentile_disc, inclui a amostra de 5000)" "$TMP/plan.prom" '^rpc_plan_p95_ms\{rpc="get_ai_gateway_health"\} 5000$'
tem "plan: RPC sem mudança → idade -1" "$TMP/plan.prom" '^rpc_plan_change_age_seconds\{rpc="sem_amostras"\} -1$'
tem "plan: RPC sem amostras de latência → p95 -1" "$TMP/plan.prom" '^rpc_plan_p95_ms\{rpc="sem_amostras"\} -1$'
tem "plan: label escapado" "$TMP/plan.prom" '^rpc_plan_changed\{rpc="com \\"aspas\\" e \\\\barra"\} 1$'
RPC_PLAN_WINDOW_HOURS=12 bash "$L" >"$TMP/out" 2>/dev/null
tem "plan: janela de 12h inclui a mudança antiga" "$TMP/out" '^rpc_plan_changed\{rpc="get_ai_gateway_health"\} 4$'
RPC_PLAN_WINDOW_HOURS=9999 bash "$L" >"$TMP/out" 2>/dev/null
tem "plan: janela acima do teto é limitada a 168 e a métrica mostra o valor USADO" "$TMP/out" '^rpc_plan_window_hours 168$'
RPC_PLAN_WINDOW_HOURS=0 bash "$L" >"$TMP/out" 2>/dev/null
tem "plan: janela 0 vira 1" "$TMP/out" '^rpc_plan_window_hours 1$'
sai "plan: janela não numérica → 1" 1 env RPC_PLAN_WINDOW_HOURS='6) OR true --' bash "$L"
sai "plan: banco inexistente → 2" 2 env PGDATABASE=banco_que_nao_existe bash "$L"
valido "plan: documento de falha é válido" "$TMP/out"
tem     "plan: falha publica up=0" "$TMP/out" '^rpc_plan_exporter_up 0$'
nao_tem "plan: falha NÃO publica rpc_plan_window_hours (dispara absent() do alerta)" "$TMP/out" '^rpc_plan_window_hours '
sai "plan: TEXTFILE_DIR grava rpc_plan.prom" 0 env TEXTFILE_DIR="$TMP/tf dir" bash "$L"
valido "plan: arquivo publicado é válido" "$TMP/tf dir/rpc_plan.prom"

# ───────────────────── ai-gateway-partitions-exporter ─────────────────────
G="$AQUI/ai-gateway-partitions-exporter.sh"
export TEXTFILE_DIR="$TMP/aigw"; mkdir -p "$TEXTFILE_DIR"
A="$TEXTFILE_DIR/aigw_partitions.prom"
sai "aigw: tabela sem partições → 0" 0 bash "$G"
valido "aigw: formato (sem partições)" "$A"
tem "aigw: total 0 e up 1" "$A" '^aigw_partitions_total 0$'
psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
DO $$
DECLARE m date := date_trunc('month', now() AT TIME ZONE 'UTC')::date;
BEGIN
  EXECUTE format('CREATE TABLE public.aigw_atual   PARTITION OF public.ai_gateway_metrics FOR VALUES FROM (%L) TO (%L)', m, m + interval '1 month');
  EXECUTE format('CREATE TABLE public.aigw_futura  PARTITION OF public.ai_gateway_metrics FOR VALUES FROM (%L) TO (%L)', m + interval '1 month', m + interval '2 month');
  EXECUTE format('CREATE TABLE public.aigw_vencida PARTITION OF public.ai_gateway_metrics FOR VALUES FROM (%L) TO (%L)', m - interval '8 month', m - interval '7 month');
  CREATE TABLE public.aigw_default PARTITION OF public.ai_gateway_metrics DEFAULT;
END $$;
INSERT INTO public.ai_gateway_metrics (created_at) SELECT now() FROM generate_series(1, 100);
ANALYZE public.aigw_atual;
SQL
sai "aigw: com 4 partições" 0 bash "$G"
valido "aigw: formato (com partições)" "$A"
tem "aigw: partição do mês corrente" "$A" '^aigw_partition_is_current\{partition="aigw_atual"\} 1$'
tem "aigw: partição futura" "$A" '^aigw_partition_is_future\{partition="aigw_futura"\} 1$'
tem "aigw: partição fora da retenção" "$A" '^aigw_partition_is_expiring\{partition="aigw_vencida"\} 1$'
tem "aigw: partição DEFAULT não é corrente…" "$A" '^aigw_partition_is_current\{partition="aigw_default"\} 0$'
tem "aigw: …nem futura…" "$A" '^aigw_partition_is_future\{partition="aigw_default"\} 0$'
tem "aigw: …nem vencida" "$A" '^aigw_partition_is_expiring\{partition="aigw_default"\} 0$'
tem "aigw: linhas estimadas após ANALYZE" "$A" '^aigw_partition_rows\{partition="aigw_atual"\} 100$'
tem "aigw: partição nunca analisada → 0 linhas (reltuples=-1 não vaza)" "$A" '^aigw_partition_rows\{partition="aigw_futura"\} 0$'
nao_tem "aigw: nenhum valor negativo" "$A" ' -[0-9]'
tem "aigw: totais" "$A" '^aigw_partitions_total 4$'
tem "aigw: vencidas não removidas" "$A" '^aigw_partitions_expiring_not_dropped 1$'
tem "aigw: nada acima dos limites default" "$A" '^aigw_partitions_over_bytes_limit 0$'
AIGW_BYTES_LIMIT=1 AIGW_ROWS_LIMIT=50 bash "$G" >/dev/null 2>&1
tem "aigw: AIGW_BYTES_LIMIT=1 → as 4 passam do limite" "$A" '^aigw_partitions_over_bytes_limit 4$'
tem "aigw: AIGW_ROWS_LIMIT=50 → só a corrente passa" "$A" '^aigw_partitions_over_rows_limit 1$'
AIGW_RETENTION_DAYS=400 bash "$G" >/dev/null 2>&1
tem "aigw: AIGW_RETENTION_DAYS=400 → nenhuma vencida" "$A" '^aigw_partitions_expiring_not_dropped 0$'
sai "aigw: limite não numérico → 1" 1 env AIGW_BYTES_LIMIT=500MB bash "$G"
afirma "aigw: arquivo publicado com modo 644" test "$(stat -c %a "$A")" = 644
sai "aigw: banco inexistente → 2" 2 env PGDATABASE=banco_que_nao_existe bash "$G"
valido "aigw: arquivo de falha é completo e válido (antes: 1 linha sem HELP/TYPE)" "$A"
tem     "aigw: falha publica up=0" "$A" '^aigw_partitions_exporter_up 0$'
tem     "aigw: falha ainda publica o timestamp da execução" "$A" '^aigw_partitions_last_run_timestamp_seconds [0-9]{10}$'
nao_tem "aigw: falha não publica contadores zerados (seriam um falso 'tudo certo')" "$A" '^aigw_partitions_(total|expiring_not_dropped) '
afirma "aigw: nenhum temporário esquecido" test -z "$(find "$TEXTFILE_DIR" -name '.aigw_partitions.*')"
sai "aigw: diretório de saída inexistente e não criável → 1" 1 env TEXTFILE_DIR=/proc/nao-existe bash "$G"
sai "aigw: --help" 0 bash "$G" --help

echo "exporters.test: $PASSOU ok, $FALHOU falha(s)"
[[ $FALHOU -eq 0 ]]
