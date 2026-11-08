CREATE OR REPLACE FUNCTION public.fn_video_queue_next(p_supplier text DEFAULT 'SPOT'::text)
 RETURNS TABLE(queue_id uuid, youtube_id text, youtube_url text, product_references text[], retry_count integer)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_record RECORD;
BEGIN
    SELECT viq.id, viq.youtube_id, viq.youtube_url, 
           viq.product_references, viq.retry_count
    INTO v_record
    FROM video_import_queue viq
    WHERE viq.status IN ('pending', 'error_download', 'error_upload')
      AND viq.source_supplier = p_supplier
      AND viq.retry_count < viq.max_retries
    ORDER BY 
      CASE WHEN viq.status = 'pending' THEN 0 ELSE 1 END,
      viq.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF v_record IS NULL THEN
        RETURN;
    END IF;
    
    UPDATE video_import_queue
    SET status = 'downloading',
        started_at = COALESCE(started_at, NOW())
    WHERE id = v_record.id;
    
    queue_id := v_record.id;
    youtube_id := v_record.youtube_id;
    youtube_url := v_record.youtube_url;
    product_references := v_record.product_references;
    retry_count := v_record.retry_count;
    RETURN NEXT;
END;
$function$
