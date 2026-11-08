CREATE OR REPLACE FUNCTION public.fn_video_queue_update(p_queue_id uuid, p_status text, p_cloudflare_video_id text DEFAULT NULL::text, p_cloudflare_thumbnail text DEFAULT NULL::text, p_cloudflare_hls text DEFAULT NULL::text, p_cloudflare_embed text DEFAULT NULL::text, p_cloudflare_duration integer DEFAULT NULL::integer, p_file_size bigint DEFAULT NULL::bigint, p_error text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    UPDATE video_import_queue
    SET status = p_status,
        cloudflare_video_id = COALESCE(p_cloudflare_video_id, cloudflare_video_id),
        cloudflare_thumbnail = COALESCE(p_cloudflare_thumbnail, cloudflare_thumbnail),
        cloudflare_hls = COALESCE(p_cloudflare_hls, cloudflare_hls),
        cloudflare_embed = COALESCE(p_cloudflare_embed, cloudflare_embed),
        cloudflare_duration_seconds = COALESCE(p_cloudflare_duration, cloudflare_duration_seconds),
        file_size_bytes = COALESCE(p_file_size, file_size_bytes),
        last_error = p_error,
        retry_count = CASE WHEN p_status LIKE 'error%' THEN retry_count + 1 ELSE retry_count END,
        completed_at = CASE WHEN p_status IN ('done','linked') THEN NOW() ELSE completed_at END
    WHERE id = p_queue_id;
END;
$function$
