#!/usr/bin/env bash
# Checagens estáticas (não usam o banco): cabeçalho/contrato de cada *.sql, cobertura das
# listas do full-audit.sh e cobertura de cenários por guard.
EXPECTED_EXIT=0
run_guard(){ bash "$SCRIPT_DIR/contrato-estatico.test.sh"; }
