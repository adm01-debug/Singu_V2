#!/usr/bin/env bash
# cron-job-failover-guard.sql — o original estourava 'relation "cron.job" does not exist'
# sem pg_cron e nunca falhava com ele. pg_cron não existe no sandbox: as tabelas do schema
# cron são dublês com as mesmas colunas. Limpo: job local. Plantado: job ativo preso a outro nó.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){
  psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
CREATE SCHEMA cron;
CREATE TABLE cron.job(jobid bigserial PRIMARY KEY, schedule text, command text, nodename text DEFAULT 'localhost',
  nodeport int DEFAULT 5432, database text DEFAULT current_database(), username text DEFAULT current_user,
  active boolean DEFAULT true, jobname text);
CREATE TABLE cron.job_run_details(jobid bigint, runid bigserial PRIMARY KEY, status text, return_message text,
  start_time timestamptz, end_time timestamptz);
INSERT INTO cron.job(schedule, command, jobname) VALUES ('* * * * *', 'SELECT 1', 'local');
INSERT INTO cron.job(schedule, command, jobname, nodename, active) VALUES ('* * * * *', 'SELECT 1', 'antigo-desativado', '10.0.0.9', false);
INSERT INTO cron.job_run_details(jobid, status, return_message, start_time) VALUES (1, 'failed', 'erro x', now());
SQL
}
setup(){ sql "INSERT INTO cron.job(schedule, command, jobname, nodename) VALUES ('0 3 * * *', 'SELECT 2', 'orfao', '10.0.0.9')"; }
run_guard(){ guard cron-job-failover-guard.sql; }
