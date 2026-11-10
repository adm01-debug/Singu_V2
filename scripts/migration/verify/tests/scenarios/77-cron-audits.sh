#!/usr/bin/env bash
# mv-refresh-audit.sql e cron-timezone-audit.sql com um schema cron dublê (pg_cron não
# existe no sandbox). Sem pg_cron os dois fazem SKIP (fumaça 70); com ele, avisam e nunca falham.
EXPECTED_EXIT=0
setup(){
  psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
CREATE SCHEMA cron;
CREATE TABLE cron.job(jobid bigserial PRIMARY KEY, schedule text, command text, nodename text DEFAULT 'localhost',
  nodeport int DEFAULT 5432, database text DEFAULT current_database(), username text DEFAULT current_user,
  active boolean DEFAULT true, jobname text);
CREATE TABLE public.base(id int PRIMARY KEY);
CREATE MATERIALIZED VIEW public.mv_com_job AS SELECT count(*) AS n FROM public.base;
CREATE MATERIALIZED VIEW public.mv_sem_job AS SELECT count(*) AS n FROM public.base;
INSERT INTO cron.job(schedule, command, jobname) VALUES ('0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_com_job', 'refresh');
INSERT INTO cron.job(schedule, command, jobname) VALUES ('0 * * * *', 'SELECT count(*) FROM public.mv_sem_job', 'so-le');
SQL
}
run_guard(){
  guard mv-refresh-audit.sql >"$SCN_TMP/mv.log" 2>&1 || { cat "$SCN_TMP/mv.log"; return 1; }
  contem "$SCN_TMP/mv.log" 'WARNING: .*1 MV\(s\) sem cron REFRESH' || return 1
  contem "$SCN_TMP/mv.log" 'public.mv_sem_job .*NO_CRON' || return 1
  PGOPTIONS='-c timezone=America/Sao_Paulo' guard cron-timezone-audit.sql >"$SCN_TMP/tz.log" 2>&1 || { cat "$SCN_TMP/tz.log"; return 1; }
  contem "$SCN_TMP/tz.log" 'WARNING: .*2 cron job\(s\) com TZ amb' || return 1
  PGOPTIONS='-c timezone=UTC' guard cron-timezone-audit.sql >"$SCN_TMP/utc.log" 2>&1 || return 1
  nao_contem "$SCN_TMP/utc.log" 'WARNING' || return 1
  sql "UPDATE cron.job SET command = 'REFRESH MATERIALIZED VIEW public.mv_sem_job' WHERE jobname = 'so-le'" || return 1
  guard mv-refresh-audit.sql >"$SCN_TMP/mv2.log" 2>&1 || return 1
  nao_contem "$SCN_TMP/mv2.log" 'WARNING'
}
