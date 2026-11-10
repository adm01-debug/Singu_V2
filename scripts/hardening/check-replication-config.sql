-- check-replication-config.sql — Auditoria hardening 26/11.
-- Confere configuração crítica para replicação lógica, TLS e integridade.
-- Produção auditada: ssl=on, wal_level=logical, archive_mode=on,
-- data_checksums=OFF (gap: sem detecção local de corrupção de página; Supabase
-- é gerenciado e o PITR cobre recuperação — risco MEDIO em hardening), slots=10,
-- wal_senders=10 (max constantes, default).
-- Também reprova ssl_min_protocol_version abaixo de TLSv1.2 (TLS 1.0/1.1 são obsoletos).
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/hardening/check-replication-config.sql
-- Saída: tabela com as configurações; termina com "OK check-replication-config." (código 0) ou
--   "FATAL: config critica divergente: ..." no stderr (código 3). Somente leitura.
\echo '== check-replication-config =='
\pset pager off
\set ON_ERROR_STOP on

SELECT name, setting, unit, source
  FROM pg_settings
 WHERE name IN ('ssl','ssl_min_protocol_version','wal_level','archive_mode',
                'data_checksums','max_replication_slots','max_wal_senders',
                'max_connections','shared_buffers','work_mem')
 ORDER BY name;

DO $BODY$
DECLARE
  v_ssl     text; v_wal text; v_arch text; v_chk text;
  v_slots   text; v_senders text; v_tls text;
  v_probs   text := '';
BEGIN
  SELECT setting INTO v_ssl     FROM pg_settings WHERE name='ssl';
  SELECT setting INTO v_wal     FROM pg_settings WHERE name='wal_level';
  SELECT setting INTO v_arch    FROM pg_settings WHERE name='archive_mode';
  SELECT setting INTO v_chk     FROM pg_settings WHERE name='data_checksums';
  SELECT setting INTO v_slots   FROM pg_settings WHERE name='max_replication_slots';
  SELECT setting INTO v_senders FROM pg_settings WHERE name='max_wal_senders';
  SELECT setting INTO v_tls     FROM pg_settings WHERE name='ssl_min_protocol_version';

  IF v_ssl  <> 'on' THEN v_probs := v_probs || E'\n  - ssl=' || v_ssl || ' (deve ser on)'; END IF;
  IF v_wal  <> 'logical' THEN v_probs := v_probs || E'\n  - wal_level=' || v_wal
                                             || ' (deve ser logical p/ Realtime/CDC)'; END IF;
  IF v_arch <> 'on' THEN v_probs := v_probs || E'\n  - archive_mode=' || v_arch
                                              || ' (deve ser on)'; END IF;
  IF v_tls IN ('TLSv1', 'TLSv1.1') THEN v_probs := v_probs || E'\n  - ssl_min_protocol_version=' || v_tls
                                                           || ' (minimo aceito: TLSv1.2)'; END IF;
  IF v_slots::int   < 5  THEN v_probs := v_probs || E'\n  - max_replication_slots=' || v_slots; END IF;
  IF v_senders::int < 5  THEN v_probs := v_probs || E'\n  - max_wal_senders=' || v_senders; END IF;

  IF v_probs <> '' THEN
    RAISE EXCEPTION 'FATAL: config critica divergente:%', v_probs;
  END IF;

  IF v_chk <> 'on' THEN
    RAISE NOTICE 'NOTICE: data_checksums=off — sem deteccao local de corrupcao de pagina (risco MEDIO; mitigado pelo PITR gerenciado).';
  END IF;
  RAISE NOTICE 'OK: config de replicacao/TLS alinhada.';
END
$BODY$;
\echo 'OK check-replication-config.'
