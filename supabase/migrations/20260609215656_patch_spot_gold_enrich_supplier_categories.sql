-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260609215656
-- nome:   patch_spot_gold_enrich_supplier_categories

-- MELHORIA 4: fn_spot_gold_enrich agora promove supplier_categories Prata → Ouro
CREATE OR REPLACE FUNCTION public.fn_spot_gold_enrich(p_supplier_id uuid, p_parent_ref text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_tax int; v_cat int; v_seo int; v_extra int;
BEGIN
  PERFORM set_config('app.bulk_import_mode','true', true);

  UPDATE public.products p
  SET supplier_type=pp.supplier_type, supplier_type_code=pp.supplier_type_code,
      supplier_subtype=pp.supplier_subtype, supplier_subtype_code=pp.supplier_subtype_code,
      supplier_categories=pp.supplier_categories
  FROM public.produtos_padronizacao pp
  WHERE pp.product_id=p.id AND pp.supplier_id=p_supplier_id
    AND (p_parent_ref IS NULL OR pp.supplier_reference=p_parent_ref);
  GET DIAGNOSTICS v_tax = ROW_COUNT;

  UPDATE public.products p
  SET category_id = m.category_id
  FROM public.produtos_padronizacao pp
  JOIN public.supplier_subtype_category_map m
    ON m.supplier_id = pp.supplier_id
   AND lower(unaccent(m.subtype_desc)) = lower(unaccent(pp.supplier_subtype))
  WHERE pp.product_id=p.id AND pp.supplier_id=p_supplier_id
    AND p.category_id IS NULL AND m.category_id IS NOT NULL
    AND (p_parent_ref IS NULL OR pp.supplier_reference=p_parent_ref);
  GET DIAGNOSTICS v_cat = ROW_COUNT;

  -- SEO NÃO-DESTRUTIVO: apenas preenche vazios (nunca sobrescreve og/meta já geradas).
  UPDATE public.products p
  SET ai_title        = COALESCE(p.ai_title, nullif(pp.supplier_seo_name,'')),
      ai_description  = COALESCE(p.ai_description, nullif(pp.supplier_seo_short_description,'')),
      og_description  = COALESCE(p.og_description, nullif(pp.supplier_seo_short_description,'')),
      meta_description= COALESCE(p.meta_description,
                          CASE WHEN char_length(nullif(pp.supplier_seo_short_description,'')) BETWEEN 50 AND 170
                               THEN pp.supplier_seo_short_description END)
  FROM public.produtos_padronizacao pp
  WHERE pp.product_id=p.id AND pp.supplier_id=p_supplier_id
    AND (p_parent_ref IS NULL OR pp.supplier_reference=p_parent_ref)
    AND (pp.supplier_seo_name IS NOT NULL OR pp.supplier_seo_short_description IS NOT NULL);
  GET DIAGNOSTICS v_seo = ROW_COUNT;

  UPDATE public.products p
  SET certificates       = COALESCE(pp.certificates, p.certificates),
      certificate_files  = COALESCE(pp.certificate_files, p.certificate_files),
      related_references = COALESCE(pp.related_references, p.related_references),
      is_seasonal        = COALESCE(pp.is_seasonal, p.is_seasonal),
      pvc_free           = COALESCE(pp.pvc_free, p.pvc_free)
  FROM public.produtos_padronizacao pp
  WHERE pp.product_id=p.id AND pp.supplier_id=p_supplier_id
    AND (p_parent_ref IS NULL OR pp.supplier_reference=p_parent_ref);
  GET DIAGNOSTICS v_extra = ROW_COUNT;

  RETURN jsonb_build_object('taxonomia_gold',v_tax,'categorias_por_subtype',v_cat,'seo_atualizados',v_seo,'extras_atualizados',v_extra);
END $function$;
