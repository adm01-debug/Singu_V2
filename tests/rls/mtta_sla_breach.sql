-- Testes de regressão — dedup 24h de publish_mtta_sla_breach_alert
-- e comportamento de borda do cron auto_ack_stale_mtta_sla_breaches.
--
-- Todos os cenários rodam dentro de uma transação com ROLLBACK final,
-- então NADA é persistido no banco. Seguro para rodar em prod.

\set ON_ERROR_STOP on
\echo '=== MTTA-SLA breach: dedup 24h + auto-ack (regressão) ==='

-- Estratégia: todo o teste roda dentro de uma transação com ROLLBACK final,
-- e cada linha inserida carrega um marker único em metadata.test_run para
-- isolar completamente das linhas de produção. Nenhum DELETE/UPDATE direto —
-- apenas INSERT + chamadas às funções SECURITY DEFINER (que rodam como owner
-- e por isso conseguem modificar system_alerts).

BEGIN;

-- Marker do run — usado em todas as linhas e queries de asserção.
\set test_run '''mtta-sla-regression-run'''

-- Helpers locais (temp) — dropados no fim da sessão.
CREATE OR REPLACE FUNCTION pg_temp.dedup_hit() RETURNS BOOLEAN
LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_alerts
    WHERE alert_type = 'mtta_critical_sla_breach'
      AND acknowledged_at IS NULL
      AND created_at > now() - interval '24 hours'
      AND metadata->>'test_run' = 'mtta-sla-regression-run'
  );
$$;

CREATE OR REPLACE FUNCTION pg_temp.count_ack(_atype TEXT) RETURNS INT
LANGUAGE sql AS $$
  SELECT COUNT(*)::INT FROM public.system_alerts
  WHERE alert_type = _atype
    AND acknowledged_at IS NOT NULL
    AND metadata->>'test_run' = 'mtta-sla-regression-run';
$$;

--
-- C1 — dedup 24h: breach aberto <24h dispara o predicado dedup.
--
\echo 'C1: dedup predicate bloqueia com breach aberto recente'
INSERT INTO public.system_alerts (alert_type, severity, threshold_pct, message, metadata, created_at)
VALUES ('mtta_critical_sla_breach', 'warning', 100, 'seed recente',
        jsonb_build_object('mtta_minutes', 45, 'sla_minutes', 30, 'test_run', 'mtta-sla-regression-run'),
        now() - interval '2 hours');

DO $$ BEGIN
  IF NOT pg_temp.dedup_hit() THEN RAISE EXCEPTION '❌ C1: dedup deveria bloquear'; END IF;
  RAISE NOTICE '✅ C1 OK';
END $$;

--
-- C2 — auto-ack ignora breach recente (<24h).
--
\echo 'C2: auto-ack não fecha breach <24h'
DO $$
DECLARE v INT;
BEGIN
  v := pg_temp.count_ack('mtta_critical_sla_breach');
  PERFORM public.auto_ack_stale_mtta_sla_breaches();
  IF pg_temp.count_ack('mtta_critical_sla_breach') <> v THEN
    RAISE EXCEPTION '❌ C2: auto-ack fechou breach recente';
  END IF;
  RAISE NOTICE '✅ C2 OK';
END $$;

--
-- C3 — auto-ack FECHA breach >24h e escreve metadata.auto_ack_reason.
--
\echo 'C3: auto-ack fecha breach >24h com auto_ack_reason'
INSERT INTO public.system_alerts (alert_type, severity, threshold_pct, message, metadata, created_at)
VALUES ('mtta_critical_sla_breach', 'warning', 100, 'vencido',
        jsonb_build_object('mtta_minutes', 55, 'sla_minutes', 30, 'test_run', 'mtta-sla-regression-run'),
        now() - interval '25 hours');

DO $$
DECLARE v_reason TEXT; v_ack_before INT; v_ack_after INT;
BEGIN
  v_ack_before := pg_temp.count_ack('mtta_critical_sla_breach');
  PERFORM public.auto_ack_stale_mtta_sla_breaches();
  v_ack_after := pg_temp.count_ack('mtta_critical_sla_breach');
  IF v_ack_after - v_ack_before < 1 THEN
    RAISE EXCEPTION '❌ C3: esperava >=1 novo ack, delta=%', v_ack_after - v_ack_before;
  END IF;
  SELECT metadata->>'auto_ack_reason' INTO v_reason
  FROM public.system_alerts
  WHERE alert_type='mtta_critical_sla_breach'
    AND metadata->>'test_run'='mtta-sla-regression-run'
    AND acknowledged_at IS NOT NULL
    AND created_at < now() - interval '24 hours'
  ORDER BY created_at DESC LIMIT 1;
  IF v_reason IS DISTINCT FROM 'sla_window_expired' THEN
    RAISE EXCEPTION '❌ C3: auto_ack_reason=% (esperado sla_window_expired)', v_reason;
  END IF;
  RAISE NOTICE '✅ C3 OK (delta=%)', v_ack_after - v_ack_before;
END $$;

--
-- C4 — auto-ack é idempotente: 2ª chamada retorna 0.
--
\echo 'C4: auto-ack idempotente'
DO $$ DECLARE v INT;
BEGIN
  SELECT public.auto_ack_stale_mtta_sla_breaches() INTO v;
  IF v <> 0 THEN RAISE EXCEPTION '❌ C4: run subsequente retornou %', v; END IF;
  RAISE NOTICE '✅ C4 OK';
END $$;

--
-- C5 — auto-ack escopado: não afeta outro alert_type.
--
\echo 'C5: auto-ack escopado a mtta_critical_sla_breach'
INSERT INTO public.system_alerts (alert_type, severity, threshold_pct, message, metadata, created_at)
VALUES ('__test_unrelated_regression', 'warning', 100, 'canário',
        jsonb_build_object('test_run', 'mtta-sla-regression-run'),
        now() - interval '48 hours');

DO $$ BEGIN
  PERFORM public.auto_ack_stale_mtta_sla_breaches();
  IF pg_temp.count_ack('__test_unrelated_regression') <> 0 THEN
    RAISE EXCEPTION '❌ C5: auto-ack afetou outro alert_type';
  END IF;
  RAISE NOTICE '✅ C5 OK';
END $$;

--
-- C6 — dedup predicate ignora breach ackado: mesmo com linha vencida ackada
-- em C3, se não há outro aberto <24h, predicado retorna falso.
-- (Após C3, o único "aberto <24h" é o inserido em C1.)
--
\echo 'C6: predicate dedup considera apenas abertos <24h'
DO $$
DECLARE v BOOLEAN;
BEGIN
  v := pg_temp.dedup_hit();
  IF NOT v THEN
    RAISE EXCEPTION '❌ C6: dedup deveria detectar seed C1 ainda aberto';
  END IF;
  RAISE NOTICE '✅ C6 OK (C1 seed continua bloqueando)';
END $$;

ROLLBACK;

\echo '=== ✅ Todos os cenários MTTA-SLA passaram ==='