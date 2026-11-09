-- archive-command-health.sql — Rodada 21/10
-- Proposito: falha se o arquivamento de WAL (base do PITR) esta desligado ou falhando.
-- Rodada 23/10 (F4): falha se archive_mode=off (falso-negativo silencioso
-- quando archiver esta desligado).
-- Classe   : GUARD FATAL
-- Limiar   : archive_mode fora de on/always; ou falhas > :max_falha_pct % das tentativas.
-- Variaveis: -v max_falha_pct=5 (default 5)
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Requer   : config de cluster (archive_mode) — o lado "ok" so e testavel em sandbox Docker.
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_falha_pct}
\else
  \set max_falha_pct 5
\endif
SELECT set_config('guard.max_falha_pct', :'max_falha_pct', false) AS _cfg \gset
\echo '== archive-command-health =='
DO $$
DECLARE v_mode text;
BEGIN
  SELECT setting INTO v_mode FROM pg_settings WHERE name='archive_mode';
  IF v_mode IS NULL OR v_mode NOT IN ('on','always') THEN
    RAISE EXCEPTION 'FATAL: archive_mode=%. PITR indisponivel.', COALESCE(v_mode, '<desconhecido>');
  END IF;
END $$;
SELECT archived_count, last_archived_wal, last_archived_time,
       failed_count, last_failed_wal, last_failed_time,
       stats_reset
  FROM pg_stat_archiver;
DO $$
DECLARE
  v_ratio numeric;
  v_max numeric := current_setting('guard.max_falha_pct')::numeric;
BEGIN
  SELECT ROUND(100.0 * failed_count / NULLIF(archived_count + failed_count, 0), 2)
    INTO v_ratio FROM pg_stat_archiver;
  IF COALESCE(v_ratio, 0) > v_max THEN
    RAISE EXCEPTION 'FATAL: archive failure ratio % pct > % pct.', v_ratio, v_max;
  END IF;
END $$;
\echo 'OK archive_command saudavel.'
