-- Testes de regressão — dedup 24h de publish_mtta_sla_breach_alert
-- e comportamento de borda do cron auto_ack_stale_mtta_sla_breaches.
--
-- Todos os cenários rodam dentro de uma transação com ROLLBACK final,
-- então NADA é persistido no banco. Seguro para rodar em prod.

\set ON_ERROR_STOP on
\echo '=== MTTA-SLA breach: dedup 24h + auto-ack (regressão) ==='

BEGIN;

-- Isola o alert_type deste teste — apaga qualquer resíduo prévio.
DELETE FROM public.system_alerts WHERE alert_type = 'mtta_critical_sla_breach';

-- Predicado dedup usado pelo publish_mtta_sla_breach_alert:
-- "existe alerta do mesmo tipo, não reconhecido, com created_at > now()-24h?"
-- Encapsulado numa função local (temp) para reuso nos cenários.
CREATE OR REPLACE FUNCTION pg_temp.mtta_dedup_hit() RETURNS BOOLEAN
LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_alerts
    WHERE alert_type = 'mtta_critical_sla_breach'
      AND acknowledged_at IS NULL
      AND created_at > now() - interval '24 hours'
  );
$$;

--
-- CENÁRIO 1 — dedup 24h: com 1 breach recente aberto, o predicado bloqueia
-- novas publicações.
--
\echo 'C1: dedup — breach recente aberto bloqueia publicação'
INSERT INTO public.system_alerts (alert_type, severity, message, metadata)
VALUES ('mtta_critical_sla_breach', 'warning', 'seed', jsonb_build_object('mtta_minutes', 45, 'sla_minutes', 30));

DO $$
BEGIN
  IF NOT pg_temp.mtta_dedup_hit() THEN
    RAISE EXCEPTION '❌ C1 FALHOU: dedup deveria bloquear (existe aberto <24h)';
  END IF;
  RAISE NOTICE '✅ C1 OK: dedup bloqueia com breach aberto recente';
END $$;

--
-- CENÁRIO 2 — auto-ack NÃO fecha breach recente (<24h).
--
\echo 'C2: auto-ack ignora breaches recentes (<24h)'
DO $$
DECLARE v_closed INT;
BEGIN
  SELECT public.auto_ack_stale_mtta_sla_breaches() INTO v_closed;
  IF v_closed <> 0 THEN
    RAISE EXCEPTION '❌ C2 FALHOU: auto-ack fechou % breach(es) recentes', v_closed;
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
\echo 'C4: dedup libera após ack — predicado retorna falso'
DO $$
BEGIN
  IF pg_temp.mtta_dedup_hit() THEN
    RAISE EXCEPTION '❌ C4 FALHOU: dedup ainda bloqueia mesmo após todos ackados';
  END IF;
  RAISE NOTICE '✅ C4 OK: dedup libera quando não há aberto <24h';
END $$;

-- Simula nova publicação (INSERT direto, imitando o efeito do publish).
INSERT INTO public.system_alerts (alert_type, severity, message, metadata)
VALUES ('mtta_critical_sla_breach', 'warning', 'novo pós-ack',
        jsonb_build_object('mtta_minutes', 90, 'sla_minutes', 30));

DO $$
BEGIN
  IF NOT pg_temp.mtta_dedup_hit() THEN
    RAISE EXCEPTION '❌ C4b FALHOU: novo insert deveria reativar dedup';
  END IF;
  RAISE NOTICE '✅ C4b OK: novo breach reativa dedup';
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