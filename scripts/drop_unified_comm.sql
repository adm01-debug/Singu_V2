DROP FUNCTION IF EXISTS public.get_unified_communication_history(uuid, integer);
DROP FUNCTION IF EXISTS public.get_unified_communication_history(uuid, uuid, text, integer);
NOTIFY pgrst, 'reload schema';
