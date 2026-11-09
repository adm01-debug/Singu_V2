#!/usr/bin/env bash
# Todo *.sql de verify/ roda limpo num banco VAZIO (sem extensão, sem tabela, sem pg_cron):
# nada de erro cru por relação/coluna inexistente ou divisão por zero.
EXPECTED_EXIT=0
run_guard(){ fumaca_sql; }
