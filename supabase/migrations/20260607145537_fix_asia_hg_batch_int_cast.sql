-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260607145537
-- nome:   fix_asia_hg_batch_int_cast

-- Fix: stock_quantity_future pode vir como decimal "92.944" da API hg/products
-- Cast direto ::int falha; cast via ::numeric::int é robusto
CREATE OR REPLACE FUNCTION public.fn_ingest_asia_hg_batch(p_produtos jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_supplier_id     uuid := 'd2734e23-d633-4819-bb15-e51aa44e2118';
  v_atualizados     int  := 0;
  v_nao_encontrados int  := 0;
  v_erros           int  := 0;
  v_row_count       int;
  v_produto         jsonb;
  v_sku             text;
  v_f3_patch        jsonb;
  v_hash_novo       text;
  v_sqf             int;
  v_sp              boolean;
  v_asp             boolean;
BEGIN
  FOR v_produto IN SELECT * FROM jsonb_array_elements(p_produtos)
  LOOP
    BEGIN
      v_sku := trim(v_produto->>'sku');
      IF v_sku IS NULL OR v_sku = '' THEN CONTINUE; END IF;

      -- FIX: ::numeric::int é robusto para "0", "92.944", "500.000" etc.
      -- O cast direto ::int falha com strings decimais da API hg/products
      v_sqf := NULLIF(NULLIF(trim(COALESCE(v_produto->>'stock_quantity_future','')), ''), 'null')::numeric::int;
      v_sp  := CASE WHEN (v_produto->>'susceptible_product') IN ('true','false') 
                    THEN (v_produto->>'susceptible_product')::boolean 
                    ELSE NULL END;
      v_asp := CASE WHEN (v_produto->>'active_stock_sp') IN ('true','false') 
                    THEN (v_produto->>'active_stock_sp')::boolean 
                    ELSE NULL END;

      v_f3_patch := jsonb_build_object(
        '_f3_fonte',              'hg_products_publico',
        '_f3_updated_at',         to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SSZ'),
        'hg_id',                  v_produto->>'id',
        'susceptible_product',    v_sp,
        'active_stock_sp',        v_asp,
        'stock_quantity_future',  v_sqf,
        'characteristics_image',  COALESCE(v_produto->'characteristics_images'->'featured_image', 'null'::jsonb),
        'video_embed_urls', COALESCE(
          (SELECT jsonb_agg(emb)
           FROM jsonb_array_elements(COALESCE(v_produto->'video_product','[]'::jsonb)) vp,
                jsonb_array_elements(COALESCE(vp->'embedUrl','[]'::jsonb)) emb),
          '[]'::jsonb
        ),
        'tags_styled',    COALESCE(v_produto->'tags',       '[]'::jsonb),
        'variations_hg',  COALESCE(v_produto->'variations', '[]'::jsonb)
      );

      v_hash_novo := md5(v_f3_patch::text);

      -- Match multi-estratégia:
      -- 1. supplier_sku exato (novo F1: MC511P)
      -- 2. supplier_sku + P (novo F1 com P)
      -- 3. supplier_sku LIKE 'CM3850RO-%' (variantes com traço)
      -- 4. raw_data.referencia = sku (legado: referencia = CM3850)
      -- 5. v_sku LIKE referencia || '%' (legado: CM3850RO starts with CM3850)
      WITH rows_to_update AS (
        SELECT id, site_data->>'_f3_hash' as hash_atual
        FROM supplier_products_raw
        WHERE supplier_id = v_supplier_id
          AND (
            supplier_sku = v_sku
            OR supplier_sku = v_sku || 'P'
            OR supplier_sku LIKE v_sku || '-%'
            OR raw_data->>'referencia' = v_sku
            OR (raw_data->>'referencia' IS NOT NULL
                AND raw_data->>'referencia' != ''
                AND v_sku LIKE (raw_data->>'referencia') || '%')
          )
      )
      UPDATE supplier_products_raw spr SET
        site_data  = COALESCE(site_data, '{}'::jsonb)
                     || v_f3_patch
                     || jsonb_build_object('_f3_hash', v_hash_novo),
        updated_at = now()
      FROM rows_to_update rtu
      WHERE spr.id = rtu.id
        AND (rtu.hash_atual IS DISTINCT FROM v_hash_novo);

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_atualizados := v_atualizados + v_row_count;

      IF NOT EXISTS (
        SELECT 1 FROM supplier_products_raw
        WHERE supplier_id = v_supplier_id
          AND (
            supplier_sku = v_sku
            OR supplier_sku = v_sku || 'P'
            OR supplier_sku LIKE v_sku || '-%'
            OR raw_data->>'referencia' = v_sku
            OR (raw_data->>'referencia' IS NOT NULL
                AND raw_data->>'referencia' != ''
                AND v_sku LIKE (raw_data->>'referencia') || '%')
          )
      ) THEN
        v_nao_encontrados := v_nao_encontrados + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_erros := v_erros + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'atualizados',     v_atualizados,
    'nao_encontrados', v_nao_encontrados,
    'erros',           v_erros,
    'total_input',     jsonb_array_length(p_produtos)
  );
END;
$function$;
