-- EF-6: Atomic queue claiming — prevent double-processing on concurrent cron invocations.
--
-- Both queue workers had a TOCTOU race: SELECT pending rows → (gap) → UPDATE to 'processing'.
-- Two overlapping cron invocations could claim the same batch simultaneously, leading to
-- duplicate API calls, duplicated validation results, and wasted capacity.
--
-- Fix: a single SQL UPDATE...RETURNING with FOR UPDATE SKIP LOCKED atomically marks rows
-- as claimed and returns them, eliminating the gap.

-- ─── validation_queue ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.claim_validation_batch(
  p_batch_size  int DEFAULT 50,
  p_max_attempts int DEFAULT 3
)
RETURNS SETOF public.validation_queue
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.validation_queue
  SET status = 'processing'
  WHERE id IN (
    SELECT id
    FROM   public.validation_queue
    WHERE  status     = 'pending'
      AND  attempts   < p_max_attempts
    ORDER  BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT  p_batch_size
  )
  RETURNING *;
$$;

-- Only service_role can execute this function (cron workers run as service_role)
REVOKE EXECUTE ON FUNCTION public.claim_validation_batch(int, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.claim_validation_batch(int, int) TO service_role;

COMMENT ON FUNCTION public.claim_validation_batch IS
  'Atomically claims a batch of pending validation_queue rows (FOR UPDATE SKIP LOCKED). '
  'Returns claimed rows; caller must set status to done/error when finished.';

-- ─── behavioral_profile_regen_queue ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.claim_regen_batch(
  p_batch_size int DEFAULT 10,
  p_lock_minutes int DEFAULT 15
)
RETURNS SETOF public.behavioral_profile_regen_queue
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.behavioral_profile_regen_queue
  SET
    -- Temporarily push next_run_at forward so concurrent workers skip these rows.
    -- The edge function resets next_run_at on failure (exponential backoff) or
    -- deletes the row on success.
    next_run_at         = now() + (p_lock_minutes * INTERVAL '1 minute'),
    last_processed_at   = now()
  WHERE contact_id IN (
    SELECT contact_id
    FROM   public.behavioral_profile_regen_queue
    WHERE  next_run_at <= now()
      AND  attempts    < 5
    ORDER  BY next_run_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT  p_batch_size
  )
  RETURNING *;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_regen_batch(int, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.claim_regen_batch(int, int) TO service_role;

COMMENT ON FUNCTION public.claim_regen_batch IS
  'Atomically claims a batch of due behavioral_profile_regen_queue rows. '
  'Sets next_run_at forward by p_lock_minutes to prevent double-claiming under concurrency. '
  'Caller deletes on success or resets next_run_at with exponential backoff on failure.';
