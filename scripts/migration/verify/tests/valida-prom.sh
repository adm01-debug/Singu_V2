#!/usr/bin/env bash
# valida-prom.sh <arquivo.prom> [...] — valida o formato de exposição em texto do Prometheus
# usado pelo textfile collector do node_exporter. Um erro em UMA linha faz o node_exporter
# descartar o arquivo inteiro, por isso os exporters são testados com este validador.
#
# Regras: toda linha é "# HELP nome texto", "# TYPE nome tipo" ou "nome{label="v",...} valor";
# nomes e labels válidos; valor numérico (inteiro, decimal, notação científica, NaN, ±Inf);
# TYPE único por métrica e declarado antes das amostras; toda métrica com amostra tem HELP e
# TYPE; nenhuma amostra repetida (mesmo nome + labels); arquivo termina com quebra de linha.
# Saída: 0 = válido; 1 = inválido (uma linha "arquivo:linha: motivo" por problema); 2 = uso.
set -euo pipefail

[[ $# -ge 1 ]] || { echo "uso: valida-prom.sh <arquivo.prom> [...]" >&2; exit 2; }
status=0
for arquivo in "$@"; do
  [[ -r "$arquivo" ]] || { echo "$arquivo: não consigo ler" >&2; status=1; continue; }
  if [[ -s "$arquivo" && -n "$(tail -c 1 "$arquivo")" ]]; then
    echo "$arquivo: não termina com quebra de linha"; status=1
  fi
  LC_ALL=C awk -v arq="$arquivo" '
    function erro(msg) { printf "%s:%d: %s\n", arq, NR, msg; ruim = 1 }
    /^$/ { next }
    /^# HELP / {
      if ($3 !~ /^[a-zA-Z_:][a-zA-Z0-9_:]*$/) erro("HELP com nome inválido: " $3)
      if (help[$3]++) erro("HELP duplicado: " $3)
      next
    }
    /^# TYPE / {
      if ($3 !~ /^[a-zA-Z_:][a-zA-Z0-9_:]*$/) erro("TYPE com nome inválido: " $3)
      if ($4 !~ /^(counter|gauge|histogram|summary|untyped)$/) erro("TYPE desconhecido: " $4)
      if (tipo[$3]++) erro("TYPE duplicado: " $3)
      if (amostras[$3]) erro("TYPE depois das amostras: " $3)
      next
    }
    /^#/ { next }
    {
      if ($0 !~ /^[a-zA-Z_:][a-zA-Z0-9_:]*(\{([a-zA-Z_][a-zA-Z0-9_]*="([^"\\]|\\[\\"n])*"(,[a-zA-Z_][a-zA-Z0-9_]*="([^"\\]|\\[\\"n])*")*)?\})? (-?[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?|NaN|[-+]?Inf)$/) {
        erro("amostra malformada: " $0); next
      }
      serie = $0; sub(/ [^ ]+$/, "", serie)
      nome = serie; sub(/\{.*$/, "", nome)
      if (visto[serie]++) erro("amostra duplicada: " serie)
      if (!(nome in help)) erro("amostra sem HELP: " nome)
      if (!(nome in tipo)) erro("amostra sem TYPE: " nome)
      amostras[nome]++
    }
    END { exit ruim }
  ' "$arquivo" || status=1
done
exit "$status"
