CREATE UNIQUE INDEX IF NOT EXISTS company_emails_company_id_lower_email_unique
  ON public.company_emails (company_id, lower(email));

-- Rollback: restaura o índice anterior; upsert_company_email volta a falhar no ON CONFLICT.
-- DROP INDEX IF EXISTS public.company_emails_company_id_lower_email_unique;
