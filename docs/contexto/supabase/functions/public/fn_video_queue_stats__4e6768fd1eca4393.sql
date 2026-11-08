CREATE OR REPLACE FUNCTION public.fn_video_queue_stats(p_supplier text DEFAULT 'SPOT'::text)
 RETURNS TABLE(total bigint, pending bigint, downloading bigint, uploading bigint, done bigint, linked bigint, error_count bigint, products_linked bigint)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        count(*),
        count(*) FILTER (WHERE viq.status = 'pending'),
        count(*) FILTER (WHERE viq.status = 'downloading'),
        count(*) FILTER (WHERE viq.status = 'uploading'),
        count(*) FILTER (WHERE viq.status = 'done'),
        count(*) FILTER (WHERE viq.status = 'linked'),
        count(*) FILTER (WHERE viq.status LIKE 'error%'),
        (SELECT count(*) FROM product_videos pv WHERE pv.source_supplier = p_supplier)
    FROM video_import_queue viq
    WHERE viq.source_supplier = p_supplier;
END;
$function$
