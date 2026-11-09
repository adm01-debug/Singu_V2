#!/usr/bin/env bash
# not-valid-constraints.sql — limpo: CHECK e FK validados; plantado: CHECK ... NOT VALID.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){ sql "CREATE TABLE public.pai(id int PRIMARY KEY); CREATE TABLE public.t(a int PRIMARY KEY CHECK (a > 0), p int REFERENCES public.pai(id));"; }
setup(){ sql "ALTER TABLE public.t ADD CONSTRAINT t_a_max CHECK (a < 1000) NOT VALID"; }
run_guard(){ guard not-valid-constraints.sql; }
