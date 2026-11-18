-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260610120903
-- nome:   fix_sm_promote_images_selective_update

-- MIGRATION: fix_sm_promote_images_selective_update
-- ROOT CAUSE: fn_sm_promote_images_to_gold fazia UPDATE products para TODOS os 1323
-- produtos SM a cada ciclo (mesmo com 0 novas imagens), causando deadlock com
-- qualquer outro processo que tocasse products (pipeline, fn_promote_padronizacao, etc.)
-- FIX: coletar array de product_ids afetados no FOR loop e só atualizar esses produtos.
-- Quando 0 imagens são promovidas, o UPDATE é completamente pulado.

CREATE OR REPLACE FUNCTION public.fn_sm_promote_images_to_gold(p_limit integer DEFAULT 500)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sup  CONSTANT uuid := '841cd690-210a-422a-908c-7676828db272';
  v_org  CONSTANT uuid := '5db5aee1-064b-4ef4-9193-345dcd8274ea';
  v_tid_main    CONSTANT uuid := '7ea182ff-edcc-4c4c-b7a1-443b07500f6c';
  v_tid_gallery CONSTANT uuid := '1590e144-e3f8-41e6-98f9-f4a25bae496d';
  v_total_ins  int := 0;
  v_total_skip int := 0;
  r            record;
  v_pi         uuid;
  v_variant_id uuid;
  v_color_id   uuid;
  -- FIX: rastrear apenas os produtos afetados neste ciclo
  -- Evita deadlock causado pelo UPDATE ALL em 1323 produtos a cada chamada
  v_affected_products uuid[] := ARRAY[]::uuid[];
BEGIN
  FOR r IN
    SELECT
      s.id           AS stg_id,
      s.product_id,
      s.cloudflare_image_id,
      s.cloudflare_url,
      s.source_url,
      s.cf_filename,
      s.image_type,
      s.is_primary,
      (s.display_order + 1) AS disp_ord_adj,
      s.image_slug
    FROM sm_images_staging s
    WHERE s.status='uploaded'
      AND s.cloudflare_image_id IS NOT NULL
      AND s.cloudflare_url      IS NOT NULL
      AND s.product_id          IS NOT NULL
      AND s.product_image_id    IS NULL
    ORDER BY s.product_id,
             CASE WHEN s.image_type='main' THEN 0 ELSE 1 END,
             s.display_order
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    v_pi := NULL;
    v_variant_id := NULL;
    v_color_id   := NULL;

    SELECT pv.id, pv.color_id
    INTO v_variant_id, v_color_id
    FROM product_variants pv
    WHERE pv.product_id = r.product_id
    LIMIT 1;

    INSERT INTO product_images (
      product_id,
      variant_id,
      color_id,
      cloudflare_image_id,
      url_cdn,
      url_original,
      filename,
      image_type,
      image_type_id,
      is_primary,
      display_order,
      applies_to_color,
      source_supplier,
      supplier_code,
      alt_text,
      is_active,
      organization_id
    )
    VALUES (
      r.product_id,
      v_variant_id,
      v_color_id,
      r.cloudflare_image_id,
      r.cloudflare_url,
      r.source_url,
      r.cf_filename,
      r.image_type,
      CASE r.image_type
        WHEN 'main'    THEN v_tid_main
        WHEN 'gallery' THEN v_tid_gallery
        ELSE v_tid_gallery
      END,
      r.is_primary,
      r.disp_ord_adj,
      TRUE,
      'somarcas',
      'SOMARCAS',
      CASE WHEN length(initcap(replace(replace(
        coalesce(r.image_slug,''),'-',' '),'_',' '))) >= 10
      THEN initcap(replace(replace(coalesce(r.image_slug,''),'-',' '),'_',' '))
      ELSE NULL END,
      TRUE,
      v_org
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_pi;

    IF v_pi IS NOT NULL THEN
      UPDATE sm_images_staging
      SET status='promoted', product_image_id=v_pi, updated_at=now()
      WHERE id=r.stg_id;
      v_total_ins := v_total_ins + 1;
    ELSE
      SELECT id INTO v_pi FROM product_images
      WHERE cloudflare_image_id = r.cloudflare_image_id;

      UPDATE sm_images_staging
      SET status='promoted', product_image_id=v_pi, updated_at=now()
      WHERE id=r.stg_id;
      v_total_skip := v_total_skip + 1;
    END IF;

    -- FIX: registrar produto afetado para UPDATE seletivo (evita UPDATE ALL)
    v_affected_products := array_append(v_affected_products, r.product_id);

  END LOOP;

  -- FIX: Cache products.images SOMENTE para produtos com novas imagens neste ciclo.
  -- Antes: UPDATE ALL em 1323 produtos (mesmo com 0 promoções) → deadlock frequente.
  -- Agora: UPDATE seletivo apenas nos produtos que tiveram imagens inseridas/atualizadas.
  IF cardinality(v_affected_products) > 0 THEN
    -- Deduplicar o array antes do UPDATE
    UPDATE products p
    SET images = (
      SELECT jsonb_agg(
        jsonb_build_object(
          'cf_id',      pi2.cloudflare_image_id,
          'url',        pi2.url_cdn,
          'type',       pi2.image_type,
          'is_primary', pi2.is_primary,
          'order',      pi2.display_order,
          'alt',        pi2.alt_text,
          'variant_id', pi2.variant_id,
          'color_id',   pi2.color_id
        ) ORDER BY pi2.is_primary DESC, pi2.display_order
      )
      FROM product_images pi2
      WHERE pi2.product_id=p.id AND pi2.is_active=TRUE AND pi2.source_supplier='somarcas'
    )
    WHERE p.supplier_id=v_sup
      AND p.id = ANY(v_affected_products);
  END IF;

  RETURN jsonb_build_object(
    'status','ok',
    'inserted',v_total_ins,
    'skipped',v_total_skip,
    'supplier','SO_MARCAS',
    'products_updated', cardinality(v_affected_products)
  );
END;
$function$;
