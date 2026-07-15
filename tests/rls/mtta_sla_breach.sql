-- Testes de regressão — dedup 24h de publish_mtta_sla_breach_alert
-- e comportamento de borda do cron auto_ack_stale_mtta_sla_breaches.
--
-- Todos os cenários rodam dentro de uma transação com ROLLBACK final,
-- então NADA é persistido no banco. Seguro para rodar em prod.

\set ON_ERROR_STOP on
\echo '=== MTTA-SLA breach: dedup + auto-ack ==='

BEGIN;

-- Fixtures: usuário admin sintético + jwt claim para as chamadas de publish.
-- Usa um UUID determinístico só para este teste.
DO $$
DECLARE
  v_admin UUID := '00000000-0000-0000-0000-0000000ac001';
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin, 'admin')
  ON CONFLICT DO NOTHING;
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin::text, 'role', 'authenticated')::text,
    true
  );
  PERFORM set_config('role', 'authenticated', true);
END $$;

-- Isola o alert_type deste teste — apaga qualquer resíduo prévio.
DELETE FROM public.system_alerts WHERE alert_type = 'mtta_critical_sla_breach';

--
-- CENÁRIO 1 — dedup 24h: duas publicações consecutivas geram 1 alerta aberto.
--
\echo 'C1: dedup — segunda publicação em <24h não duplica'
SELECT public.publish_mtta_sla_breach_alert(45, 30);
SELECT public.publish_mtta_sla_breach_alert(60, 30);

DO $$
DECLARE v_open INT;
BEGIN
  SELECT COUNT(*) INTO v_open
  FROM public.system_alerts
  WHERE alert_type = 'mtta_critical_sla_breach'
    AND acknowledged_at IS NULL;
  IF v_open <> 1 THEN
    RAISE EXCEPTION '❌ C1 FALHOU: esperava 1 alerta aberto, achou %', v_open;
  END IF;
  RAISE NOTICE '✅ C1 OK: dedup respeitado (1 aberto)';
END $$;

--
-- CENÁRIO 2 — auto-ack NÃO fecha breach recente (<24h).
--
\echo 'C2: auto-ack ignora breaches recentes'
DO $$
DECLARE v_acked INT;
BEGIN
  PERFORM public.auto_ack_stale_mtta_sla_breaches();
  SELECT COUNT(*) INTO v_acked
  FROM public.system_alerts
  WHERE alert_type = 'mtta_critical_sla_breach'
    AND acknowledged_at IS NOT NULL;
  IF v_acked <> 0 THEN
    RAISE EXCEPTION '❌ C2 FALHOU: auto-ack fechou breach recente (%)', v_acked;
  END IF;
  RAISE NOTICE '✅ C2 OK: breach <24h preservado';
END $$;

--
-- CENÁRIO 3 — auto-ack FECHA breach vencido (>24h) e marca metadata.
--
\echo 'C3: auto-ack fecha breach >24h e marca auto_ack_reason'
UPDATE public.system_alerts
   SET created_at = now() - interval '25 hours'
 WHERE alert_type = 'mtta_critical_sla_breach';

DO $$
DECLARE
  v_closed INT;
  v_reason TEXT;
BEGIN
  SELECT public.auto_ack_stale_mtta_sla_breaches() INTO v_closed;
  IF v_closed <> 1 THEN
    RAISE EXCEPTION '❌ C3 FALHOU: esperava 1 auto-ack, retornou %', v_closed;
  END IF;

  SELECT metadata->>'auto_ack_reason' INTO v_reason
  FROM public.system_alerts
  WHERE alert_type = 'mtta_critical_sla_breach'
  ORDER BY created_at DESC LIMIT 1;
  IF v_reason IS DISTINCT FROM 'sla_window_expired' THEN
    RAISE EXCEPTION '❌ C3 FALHOU: auto_ack_reason=% (esperado sla_window_expired)', v_reason;
  END IF;
  RAISE NOTICE '✅ C3 OK: 1 breach fechado com motivo correto';
END $$;

--
-- CENÁRIO 4 — dedup ignora breaches JÁ RECONHECIDOS: após ack, nova
-- publicação cria um novo alerta aberto (o antigo não bloqueia).
--
\echo 'C4: dedup libera nova publicação após ack do anterior'
SELECT public.publish_mtta_sla_breach_alert(90, 30);
DO $$
DECLARE v_open INT;
BEGIN
  SELECT COUNT(*) INTO v_open
  FROM public.system_alerts
  WHERE alert_type = 'mtta_critical_sla_breach'
    AND acknowledged_at IS NULL;
  IF v_open <> 1 THEN
    RAISE EXCEPTION '❌ C4 FALHOU: esperava 1 novo aberto pós-ack, achou %', v_open;
  END IF;
  RAISE NOTICE '✅ C4 OK: dedup não bloqueia após ack';
END $$;

--
-- CENÁRIO 5 — auto-ack é idempotente: rodar 2x não altera nada na 2ª.
--
\echo 'C5: auto-ack idempotente'
UPDATE public.system_alerts
   SET created_at = now() - interval '48 hours'
 WHERE alert_type = 'mtta_critical_sla_breach'
   AND acknowledged_at IS NULL;

DO $$
DECLARE v1 INT; v2 INT;
BEGIN
  SELECT public.auto_ack_stale_mtta_sla_breaches() INTO v1;
  SELECT public.auto_ack_stale_mtta_sla_breaches() INTO v2;
  IF v1 < 1 OR v2 <> 0 THEN
    RAISE EXCEPTION '❌ C5 FALHOU: run1=%, run2=% (esperado >=1 e 0)', v1, v2;
  END IF;
  RAISE NOTICE '✅ C5 OK: idempotência confirmada (run1=%, run2=0)', v1;
END $$;

--
-- CENÁRIO 6 — auto-ack NÃO toca alertas de outros alert_types (escopo).
--
\echo 'C6: auto-ack escopado ao alert_type mtta_critical_sla_breach'
INSERT INTO public.system_alerts (alert_type, severity, message, created_at)
VALUES ('unrelated_test_type', 'warning', 'canário', now() - interval '48 hours');

DO $$
DECLARE v_other_acked INT;
BEGIN
  PERFORM public.auto_ack_stale_mtta_sla_breaches();
  SELECT COUNT(*) INTO v_other_acked
  FROM public.system_alerts
  WHERE alert_type = 'unrelated_test_type'
    AND acknowledged_at IS NOT NULL;
  IF v_other_acked <> 0 THEN
    RAISE EXCEPTION '❌ C6 FALHOU: auto-ack afetou outro alert_type';
  END IF;
  RAISE NOTICE '✅ C6 OK: escopo preservado';
END $$;

ROLLBACK;

\echo '=== ✅ Todos os cenários MTTA-SLA passaram ==='