-- Revoke execute from public on all functions in public schema
DO $$ 
DECLARE 
    func_record RECORD;
BEGIN 
    FOR func_record IN 
        SELECT p.oid::regprocedure::text as func_id
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public'
    LOOP 
        EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || func_record.func_id || ' FROM PUBLIC, anon';
    END LOOP; 
END $$;

-- Selectively grant back to public-facing functions
GRANT EXECUTE ON FUNCTION public.submit_public_form(text, jsonb, jsonb, text, text) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_deal_room_by_token(text) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_buyer_view(text, text) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buyer_add_comment(text, text, text) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buyer_toggle_milestone(text, uuid, boolean, text) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_buyer_document_path(text, uuid) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_form_view(text) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_magnet_view(text) TO PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.immutable_unaccent(text) TO PUBLIC, anon;
