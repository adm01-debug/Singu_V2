#!/usr/bin/env bash
# sequence-overflow-guard.sql — limpo: sequences longe do teto (e uma nunca usada);
# plantado: smallserial-like com last_value em 95% do max_value.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){ sql "CREATE SEQUENCE public.s_ok; SELECT nextval('public.s_ok'); CREATE SEQUENCE public.s_nova MAXVALUE 10;"; }
setup(){ sql "CREATE SEQUENCE public.s_cheia MAXVALUE 100; SELECT setval('public.s_cheia', 95);"; }
run_guard(){ guard sequence-overflow-guard.sql; }
