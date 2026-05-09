-- Revoke execution from public and anon roles for the sensitive query function
REVOKE EXECUTE ON FUNCTION public.execute_readonly_query(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.execute_readonly_query(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.execute_readonly_query(text) FROM authenticated;

-- Grant execution specifically to service_role so Edge Functions can still use it
GRANT EXECUTE ON FUNCTION public.execute_readonly_query(text) TO service_role;