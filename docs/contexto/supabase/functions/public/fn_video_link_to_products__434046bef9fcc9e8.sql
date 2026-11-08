CREATE OR REPLACE FUNCTION public.fn_video_link_to_products(p_queue_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_queue RECORD;
    v_ref TEXT;
    v_product_id UUID;
    v_linked INTEGER := 0;
    v_spot_supplier_id UUID := 'bcfc0d02-44c6-48ae-8472-12b1a3f3d8e0';
BEGIN
    SELECT * INTO v_queue
    FROM video_import_queue
    WHERE id = p_queue_id AND status = 'done';
    
    IF v_queue IS NULL THEN
        RETURN 0;
    END IF;
    
    FOREACH v_ref IN ARRAY v_queue.product_references
    LOOP
        -- Buscar product_id (tenta supplier_ref primeiro, depois sku)
        SELECT id INTO v_product_id
        FROM products
        WHERE (supplier_ref = v_ref OR sku = v_ref)
          AND supplier_id = v_spot_supplier_id
        LIMIT 1;
        
        IF v_product_id IS NULL THEN
            CONTINUE;
        END IF;
        
        INSERT INTO product_videos (
            product_id, cloudflare_video_id, thumbnail_url, hls_url, embed_url,
            source_url, source_platform, source_video_id, source_supplier,
            duration_seconds, is_primary, is_active, display_order
        ) VALUES (
            v_product_id, v_queue.cloudflare_video_id, v_queue.cloudflare_thumbnail,
            v_queue.cloudflare_hls, v_queue.cloudflare_embed, v_queue.youtube_url,
            'youtube', v_queue.youtube_id, 'SPOT',
            v_queue.cloudflare_duration_seconds, true, true, 1
        )
        ON CONFLICT (product_id, source_url) DO UPDATE SET
            cloudflare_video_id = EXCLUDED.cloudflare_video_id,
            thumbnail_url = EXCLUDED.thumbnail_url,
            hls_url = EXCLUDED.hls_url,
            embed_url = EXCLUDED.embed_url,
            duration_seconds = EXCLUDED.duration_seconds,
            updated_at = NOW();
        
        v_linked := v_linked + 1;
    END LOOP;
    
    UPDATE video_import_queue
    SET status = 'linked'
    WHERE id = p_queue_id;
    
    RETURN v_linked;
END;
$function$
