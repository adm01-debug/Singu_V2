#!/usr/bin/env bash
# fk-integrity.sql — o original gerava SQL terminando em "UNION ALL" (erro de sintaxe com
# qualquer FK) e a mensagem final de sucesso aparecia sempre.
# Limpo: FK simples, FK composta e linhas com NULL (MATCH SIMPLE). Plantado: filha órfã
# inserida com session_replication_role=replica (como um import com triggers desligados).
EXPECTED_EXIT=0
DOIS_LADOS=1
setup_ok(){
  psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
CREATE TABLE public.pai(id int PRIMARY KEY);
CREATE TABLE public.filho(id int PRIMARY KEY, pai_id int REFERENCES public.pai(id));
CREATE TABLE public.par(a int, b int, PRIMARY KEY (a, b));
CREATE TABLE public.usa_par(id int PRIMARY KEY, a int, b int, FOREIGN KEY (a, b) REFERENCES public.par(a, b));
INSERT INTO public.pai VALUES (1), (2);
INSERT INTO public.filho VALUES (1, 1), (2, NULL);
INSERT INTO public.par VALUES (1, 1);
INSERT INTO public.usa_par VALUES (1, 1, 1), (2, NULL, NULL), (3, 9, NULL);
SQL
}
setup(){ sql "SET session_replication_role = replica; INSERT INTO public.filho VALUES (3, 999); INSERT INTO public.usa_par VALUES (4, 1, 2);"; }
run_guard(){
  espera_saida nonzero guard fk-integrity.sql >"$SCN_TMP/saida.log" 2>&1 || return 1
  contem "$SCN_TMP/saida.log" 'FK ORFA: 2 constraint\(s\) violada\(s\), 2 linha' || return 1
  contem "$SCN_TMP/saida.log" 'public.usa_par .*a,b'          # FK composta avaliada inteira
}
run_guard_ok(){ guard fk-integrity.sql; }
