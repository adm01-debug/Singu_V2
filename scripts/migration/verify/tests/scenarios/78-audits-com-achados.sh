#!/usr/bin/env bash
# Audits informativos com achados plantados: têm de AVISAR (WARNING/linha na listagem) e
# continuar saindo 0 — audit não derruba nada.
EXPECTED_EXIT=0
requires(){ exige_extensao_disponivel postgres_fdw && exige_extensao_disponivel amcheck; }
setup(){
  psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
CREATE EXTENSION postgres_fdw;
CREATE SERVER srv FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host '127.0.0.1', dbname 'x');
CREATE USER MAPPING FOR CURRENT_USER SERVER srv OPTIONS (user 'u', password 'segredo-de-teste');
CREATE TABLE public.aberta(id int PRIMARY KEY, obs text);
GRANT SELECT ON public.aberta TO PUBLIC;
ALTER TABLE public.aberta SET (autovacuum_enabled = false);
ALTER TABLE public.aberta ALTER COLUMN obs SET STORAGE PLAIN;
CREATE FUNCTION public.f_publica() RETURNS int LANGUAGE sql AS 'SELECT 1';
CREATE EXTENSION amcheck VERSION '1.0';
SQL
}
run_guard(){
  local f
  for f in fdw-credentials-audit autovacuum-audit public-role-privileges-audit toast-storage-audit \
           toast-compression-audit extension-upgrade-available-audit extension-minor-version-parity password-encryption-audit; do
    guard "$f.sql" >"$SCN_TMP/$f.log" 2>&1 || { echo "✖ $f saiu != 0"; cat "$SCN_TMP/$f.log"; return 1; }
  done
  contem "$SCN_TMP/fdw-credentials-audit.log" 'WARNING: +FDW LEAK: 1 mapping' || return 1
  contem "$SCN_TMP/autovacuum-audit.log" 'WARNING: +1 tabela\(s\) com autovacuum desligado' || return 1
  contem "$SCN_TMP/public-role-privileges-audit.log" 'public +\| aberta +\| SELECT' || return 1
  contem "$SCN_TMP/public-role-privileges-audit.log" 'public +\| f_publica' || return 1
  contem "$SCN_TMP/toast-storage-audit.log" 'aberta +\| obs .*PLAIN' || return 1
  contem "$SCN_TMP/toast-compression-audit.log" 'aberta +\| obs .*PLAIN' || return 1
  contem "$SCN_TMP/extension-upgrade-available-audit.log" 'amcheck +\| 1\.0 ' || return 1
  PGOPTIONS='-c password_encryption=md5' guard password-encryption-audit.sql >"$SCN_TMP/pw.log" 2>&1 || return 1
  contem "$SCN_TMP/pw.log" 'WARNING: +password_encryption=md5' || return 1
  sql "ALTER EXTENSION amcheck UPDATE" || return 1
  guard extension-upgrade-available-audit.sql >"$SCN_TMP/up.log" 2>&1 || return 1
  nao_contem "$SCN_TMP/up.log" 'amcheck'
}
