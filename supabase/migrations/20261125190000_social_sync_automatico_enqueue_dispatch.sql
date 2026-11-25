-- Fecha a lacuna da feature "Sincronizacao de interesses sociais"
-- (docs/estado/02_INTELIGENCIA_IA.md, item 50).
--
-- O que ja existia: o worker (edge function sync-social-interests) e o consumidor
-- (edge function generate-offer-suggestions, que le social_behavior_analysis).
-- O que faltava: produtor e disparo. O unico caminho que enfileirava era o botao
-- "Sincronizar" do frontend (src/hooks/commercial/useSocialSync.ts:52), contato a
-- contato, por clique humano. Estado real do banco canonico em 2026-11-25:
-- social_sync_queue = 0 linhas e social_behavior_analysis = 0 linhas, com 2.318
-- contatos tendo interacao com texto e 4.755 contatos ativos. Efeito de negocio:
-- metade do scoring de generate-offer-suggestions (o bloco socialAnalysis) nunca
-- recebe dado, entao a recomendacao ignora o lado social do cliente.
--
-- Esta migration adiciona o produtor e o despachante que faltavam, sem mexer no
-- contrato da edge function (body {contactId, queueId}) nem na tabela da fila:
--   1. public.enqueue_social_sync(limit, stale_days)      -> produz a fila;
--   2. public.dispatch_social_sync(limit)                 -> chama a edge function;
--   3. public.requeue_social_sync_stuck(stuck_minutes)    -> destrava presos/falhos.
-- As tres escrevem em tabela com RLS e a #2 chama net.http_post, por isso sao
-- SECURITY DEFINER com search_path fixo, EXECUTE revogado de PUBLIC/anon/authenticated
-- e concedido somente a service_role (mesmo padrao de
-- 20260716000029_revoke_auth_internal_mvs_and_secdef_pipeline_fns.sql).
--
-- Idempotente: CREATE OR REPLACE + unschedule por nome antes de agendar.
-- Reversao: seção -- DOWN MIGRATION no fim.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

CREATE OR REPLACE FUNCTION public.enqueue_social_sync(
  p_limit integer DEFAULT 500,
  p_stale_days integer DEFAULT 30
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_inserted integer;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'enqueue_social_sync: p_limit precisa ser >= 1 (recebido %)', p_limit;
  END IF;
  IF p_stale_days IS NULL OR p_stale_days < 1 THEN
    RAISE EXCEPTION 'enqueue_social_sync: p_stale_days precisa ser >= 1 (recebido %)', p_stale_days;
  END IF;

  WITH candidato AS (
    SELECT c.id AS contact_id, max(i.created_at) AS ultima_interacao
    FROM public.contacts c
    JOIN public.interactions i ON i.contact_id = c.id
    WHERE (
        nullif(btrim(coalesce(i.conteudo, '')), '') IS NOT NULL
        OR nullif(btrim(coalesce(i.content, '')), '') IS NOT NULL
        OR nullif(btrim(coalesce(i.assunto, '')), '') IS NOT NULL
        OR nullif(btrim(coalesce(i.resumo, '')), '') IS NOT NULL
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.social_sync_queue q
        WHERE q.contact_id = c.id AND q.status IN ('pending', 'processing')
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.social_behavior_analysis a
        WHERE a.contact_id = c.id
          AND a.analysis_date > now() - make_interval(days => p_stale_days)
      )
    GROUP BY c.id
    ORDER BY max(i.created_at) DESC
    LIMIT p_limit
  ), inserido AS (
    INSERT INTO public.social_sync_queue (contact_id, status, retry_count)
    SELECT contact_id, 'pending', 0 FROM candidato
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM inserido;

  RETURN v_inserted;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.dispatch_social_sync(p_limit integer DEFAULT 25)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  r record;
  v_secret text;
  v_url text := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/sync-social-interests';
  v_count integer := 0;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'dispatch_social_sync: p_limit precisa ser >= 1 (recebido %)', p_limit;
  END IF;

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret';

  IF v_secret IS NULL OR btrim(v_secret) = '' THEN
    RAISE EXCEPTION 'dispatch_social_sync: singu_cron_secret ausente no Vault; a edge function responderia 401 e a fila nao drenaria';
  END IF;

  FOR r IN
    SELECT id, contact_id
    FROM public.social_sync_queue
    WHERE status = 'pending'
      AND (last_attempt IS NULL OR last_attempt < now() - interval '3 minutes')
    ORDER BY created_at
    LIMIT p_limit
  LOOP
    PERFORM net.http_post(
      url     := v_url,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', v_secret
      ),
      body    := jsonb_build_object('contactId', r.contact_id, 'queueId', r.id),
      timeout_milliseconds := 30000
    );
    UPDATE public.social_sync_queue SET last_attempt = now() WHERE id = r.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.requeue_social_sync_stuck(p_stuck_minutes integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_count integer;
BEGIN
  IF p_stuck_minutes IS NULL OR p_stuck_minutes < 1 THEN
    RAISE EXCEPTION 'requeue_social_sync_stuck: p_stuck_minutes precisa ser >= 1 (recebido %)', p_stuck_minutes;
  END IF;

  WITH reciclado AS (
    UPDATE public.social_sync_queue q
    SET status = 'pending',
        retry_count = q.retry_count + 1,
        error_log = 'reagendado apos ficar preso em processing/failed',
        updated_at = now()
    WHERE q.retry_count < coalesce(q.max_retries, 3)
      AND (
        (q.status = 'processing' AND q.last_attempt < now() - make_interval(mins => p_stuck_minutes))
        OR (q.status = 'failed' AND coalesce(q.last_attempt, q.created_at) < now() - make_interval(mins => p_stuck_minutes * 4))
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM reciclado;

  RETURN v_count;
END;
$fn$;

REVOKE ALL ON FUNCTION public.enqueue_social_sync(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dispatch_social_sync(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.requeue_social_sync_stuck(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_social_sync(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_social_sync(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.requeue_social_sync_stuck(integer) TO service_role;

DO $agenda$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'singu-social-enqueue-daily') THEN
    PERFORM cron.unschedule('singu-social-enqueue-daily');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'singu-social-dispatch') THEN
    PERFORM cron.unschedule('singu-social-dispatch');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'singu-social-requeue-stuck') THEN
    PERFORM cron.unschedule('singu-social-requeue-stuck');
  END IF;

  PERFORM cron.schedule(
    'singu-social-enqueue-daily',
    '0 5 * * *',
    $job$SELECT public.enqueue_social_sync(500, 30);$job$
  );
  PERFORM cron.schedule(
    'singu-social-dispatch',
    '*/5 * * * *',
    $job$SELECT public.dispatch_social_sync(25);$job$
  );
  PERFORM cron.schedule(
    'singu-social-requeue-stuck',
    '25 * * * *',
    $job$SELECT public.requeue_social_sync_stuck(30);$job$
  );
END;
$agenda$;

DO $postcondition$
BEGIN
  IF (SELECT count(*) FROM cron.job WHERE jobname IN ('singu-social-enqueue-daily', 'singu-social-dispatch', 'singu-social-requeue-stuck')) <> 3 THEN
    RAISE EXCEPTION 'pos-condicao falhou: os 3 jobs de sincronizacao social nao foram agendados';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'dispatch_social_sync' AND p.prosecdef) THEN
    RAISE EXCEPTION 'pos-condicao falhou: dispatch_social_sync precisa ser SECURITY DEFINER';
  END IF;
END;
$postcondition$;
COMMIT;

-- DOWN MIGRATION
-- BEGIN;
--   SELECT cron.unschedule('singu-social-enqueue-daily');
--   SELECT cron.unschedule('singu-social-dispatch');
--   SELECT cron.unschedule('singu-social-requeue-stuck');
--   DROP FUNCTION IF EXISTS public.requeue_social_sync_stuck(integer);
--   DROP FUNCTION IF EXISTS public.dispatch_social_sync(integer);
--   DROP FUNCTION IF EXISTS public.enqueue_social_sync(integer, integer);
-- COMMIT;