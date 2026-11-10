#!/usr/bin/env bash
# logical-vs-physical-drift.sql — o original estourava "relation public.contacts does not
# exist" fora do schema de produção. Agora: tabela ausente vira linha AUSENTE; a saída é
# determinística e muda quando os dados mudam.
EXPECTED_EXIT=0
setup(){ sql "CREATE TABLE public.contacts(id int PRIMARY KEY); INSERT INTO public.contacts SELECT g FROM generate_series(1, 10) g; CREATE TABLE public.deals(nome text);"; }
run_guard(){
  local a b c
  a="$(guard logical-vs-physical-drift.sql 2>&1)" || { echo "$a"; return 1; }
  b="$(guard logical-vs-physical-drift.sql 2>&1)" || return 1
  [[ "$a" == "$b" ]] || { echo "saída não determinística"; return 1; }
  grep -Eq '^contacts\|10\|[0-9a-f]{32}$' <<<"$a" || { echo "$a"; return 1; }
  grep -Fxq 'companies|AUSENTE|-' <<<"$a" || { echo "$a"; return 1; }
  grep -Fxq 'deals|SEM_COLUNA_ID|-' <<<"$a" || { echo "$a"; return 1; }
  sql "DELETE FROM public.contacts WHERE id = 3" || return 1
  c="$(guard logical-vs-physical-drift.sql 2>&1)" || return 1
  [[ "$a" != "$c" ]] || { echo "checksum não mudou após DELETE"; return 1; }
  c="$(guard logical-vs-physical-drift.sql -v tabelas=contacts 2>&1)" || return 1
  [[ "$(grep -c '|' <<<"$c")" == 1 ]] || { echo "-v tabelas ignorado: $c"; return 1; }
}
