CREATE OR REPLACE FUNCTION public.fn_cf_collect_sm_legacy_dispatch(p_start_page integer, p_end_page integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'net'
AS $function$
DECLARE
  v_creds jsonb;
  v_token text;
  v_account_id text;
  v_page integer;
  v_url text;
  v_request_id bigint;
  v_request_ids bigint[] := ARRAY[]::bigint[];
BEGIN
  v_creds := fn_get_cf_credentials();
  v_account_id := v_creds->>'account_id';
  v_token := v_creds->>'api_token';
  
  FOR v_page IN p_start_page..p_end_page LOOP
    v_url := format(
      'https://api.cloudflare.com/client/v4/accounts/%s/images/v1?page=%s&per_page=100&sort_order=asc',
      v_account_id, v_page
    );
    
    SELECT net.http_get(
      url := v_url,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_token,
        '[REDACTED]', 'application/json'
      )
    ) INTO v_request_id;
    
    v_request_ids := array_append(v_request_ids, v_request_id);
  END LOOP;
  
  RETURN jsonb_build_object(
    'dispatched_count', array_length(v_request_ids, 1),
    'request_ids', v_request_ids,
    'first_id', v_request_ids[1],
    'last_id', v_request_ids[array_length(v_request_ids, 1)]
  );
END;
$function$
