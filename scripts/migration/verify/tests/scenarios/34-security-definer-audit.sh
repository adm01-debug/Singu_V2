#!/usr/bin/env bash
# security-definer-audit.sql — limpo: SECDEF com SET search_path; plantado: SECDEF sem.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){ sql "CREATE FUNCTION public.f_ok() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = '' AS 'SELECT 1';
                 CREATE FUNCTION public.f_invoker() RETURNS int LANGUAGE sql AS 'SELECT 1';"; }
setup(){ sql "CREATE FUNCTION public.f_ruim() RETURNS int LANGUAGE sql SECURITY DEFINER AS 'SELECT 1'"; }
run_guard(){ guard security-definer-audit.sql; }
