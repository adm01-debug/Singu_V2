
CREATE OR REPLACE FUNCTION public.get_behavioral_regen_cron_health()
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean,
  last_run_at timestamptz,
  last_status text,
  last_duration_ms integer,
  runs_24h integer,
  failures_24h integer,
  success_rate_pct numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, cron
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  RETURN QUERY
  WITH jobs AS (
    SELECT j.jobid, j.jobname, j.schedule, j.active
    FROM cron.job j
    WHERE j.jobname IN (
      'process-behavioral-regen-queue-5min',
      'cleanup-behavioral-regen-queue-daily'
    )
  ),
  runs AS (
    SELECT
      d.jobid,
      count(*) FILTER (WHERE d.start_time > now() - interval '24 hours') AS runs_24h,
      count(*) FILTER (WHERE d.start_time > now() - interval '24 hours' AND d.status <> 'succeeded') AS fails_24h,
      max(d.start_time) AS last_run,
      (array_agg(d.status ORDER BY d.start_time DESC))[1] AS last_status,
      (array_agg(EXTRACT(EPOCH FROM (d.end_time - d.start_time))*1000 ORDER BY d.start_time DESC))[1]::int AS last_dur_ms
    FROM cron.job_run_details d
    WHERE d.jobid IN (SELECT jobid FROM jobs)
    GROUP BY d.jobid
  )
  SELECT
    j.jobname,
    j.schedule,
    j.active,
    r.last_run,
    r.last_status,
    r.last_dur_ms,
    COALESCE(r.runs_24h, 0)::int,
    COALESCE(r.fails_24h, 0)::int,
    CASE WHEN COALESCE(r.runs_24h,0) = 0 THEN NULL
         ELSE round(100.0 * (r.runs_24h - r.fails_24h)::numeric / r.runs_24h, 1)
    END
  FROM jobs j
  LEFT JOIN runs r ON r.jobid = j.jobid
  ORDER BY j.jobname;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_behavioral_regen_cron_health() TO authenticated;
