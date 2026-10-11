DO $$
BEGIN
  IF to_regprocedure('public.to_title_case_pt(text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.to_title_case_pt(text) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.to_title_case_pt(text) TO authenticated, service_role;
  END IF;
END $$;

-- DOWN MIGRATION (Rollback manual; restaura ACL anterior do helper)
-- GRANT EXECUTE ON FUNCTION public.to_title_case_pt(text) TO PUBLIC;
