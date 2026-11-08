-- Migration: DEFAULT false + NOT NULL on nullable boolean columns in base tables
-- Prevents 3-value logic bugs (WHERE col = true misses NULL rows in Postgres).
-- trigger_intensity_history boolean cols are GENERATED columns — skip those.
-- interactions.follow_up_required: 10,461 rows, 0 NULLs, all false.

ALTER TABLE public.interactions
  ALTER COLUMN follow_up_required SET DEFAULT false,
  ALTER COLUMN follow_up_required SET NOT NULL;
