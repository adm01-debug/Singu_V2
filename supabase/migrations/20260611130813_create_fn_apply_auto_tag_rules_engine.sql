-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260611130813
-- nome:   create_fn_apply_auto_tag_rules_engine

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  fn_apply_auto_tag_rules — Motor completo de regras de tags     ║
-- ║  Substitui fn_auto_link_tags (limitado a SPOT + Keywords)        ║
-- ║  Processa: keyword, material, category, technique, price, stock  ║
-- ╚══════════════════════════════════════════════════════════════════╝
CREATE OR REPLACE FUNCTION public.fn_apply_auto_tag_rules(
  p_product_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_product        products%ROWTYPE;
  v_rule           RECORD;
  v_tag_id         uuid;
  v_matches        boolean;
  v_added          integer := 0;
  v_skipped        integer := 0;
  v_cat_name       text;
  v_material_names text;
  v_technique_text text;
  v_price          numeric;
BEGIN
  -- Carregar produto
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'product_not_found');
  END IF;

  -- ── Pré-carregar dados auxiliares ─────────────────────────────────

  -- Nome da categoria
  SELECT LOWER(c.name)
  INTO v_cat_name
  FROM categories c
  WHERE c.id = v_product.category_id;

  -- Materiais agregados (string para busca ILIKE)
  SELECT LOWER(string_agg(mt.name, ' | '))
  INTO v_material_names
  FROM product_materials pm
  JOIN material_types mt ON mt.id = pm.material_id
  WHERE pm.product_id = p_product_id;

  -- Técnicas de impressão (de technique_list JSONB arrays)
  SELECT LOWER(string_agg(te.value, ' | '))
  INTO v_technique_text
  FROM product_print_positions ppp,
       LATERAL jsonb_array_elements_text(
         CASE WHEN jsonb_typeof(ppp.technique_list) = 'array'
              THEN ppp.technique_list
              ELSE '[]'::jsonb
         END
       ) AS te(value)
  WHERE ppp.product_id = p_product_id;

  -- Preço base para regras de preço
  v_price := COALESCE(v_product.cost_price, v_product.base_price);

  -- ── Processar cada regra ativa por prioridade ─────────────────────
  FOR v_rule IN
    SELECT * FROM auto_tag_rules
    WHERE is_active = true
    ORDER BY priority, rule_name
  LOOP
    v_matches := false;

    CASE v_rule.rule_type

      -- ── KEYWORD: busca em nome + descrição ─────────────────────────
      WHEN 'keyword' THEN
        IF v_rule.condition_operator = 'contains' THEN
          v_matches := (
            LOWER(COALESCE(v_product.name,              '')) ILIKE '%' || LOWER(v_rule.condition_value) || '%'
            OR LOWER(COALESCE(v_product.description,    '')) ILIKE '%' || LOWER(v_rule.condition_value) || '%'
            OR LOWER(COALESCE(v_product.short_description,'')) ILIKE '%' || LOWER(v_rule.condition_value) || '%'
          );
        END IF;

      -- ── MATERIAL: busca nos materiais do produto ────────────────────
      WHEN 'material' THEN
        IF v_rule.condition_operator = 'contains'
           AND v_material_names IS NOT NULL THEN
          v_matches := v_material_names ILIKE '%' || LOWER(v_rule.condition_value) || '%';
        END IF;

      -- ── CATEGORY: busca no nome da categoria ───────────────────────
      WHEN 'category' THEN
        IF v_rule.condition_operator = 'contains'
           AND v_cat_name IS NOT NULL THEN
          v_matches := v_cat_name ILIKE '%' || LOWER(v_rule.condition_value) || '%';
        END IF;

      -- ── TECHNIQUE: busca nas técnicas de impressão ─────────────────
      WHEN 'technique' THEN
        IF v_rule.condition_operator = 'contains'
           AND v_technique_text IS NOT NULL THEN
          v_matches := v_technique_text ILIKE '%' || LOWER(v_rule.condition_value) || '%';
        END IF;

      -- ── PRICE: comparação numérica ─────────────────────────────────
      WHEN 'price' THEN
        IF v_price IS NOT NULL THEN
          CASE v_rule.condition_operator
            WHEN 'less_than'    THEN v_matches := v_price <  v_rule.condition_value::numeric;
            WHEN 'greater_than' THEN v_matches := v_price >  v_rule.condition_value::numeric;
            WHEN 'between'      THEN v_matches := v_price BETWEEN
              v_rule.condition_value::numeric AND v_rule.condition_value_max::numeric;
            ELSE NULL;
          END CASE;
        END IF;

      -- ── STOCK: comparação de estoque ───────────────────────────────
      WHEN 'stock' THEN
        IF v_product.stock_quantity IS NOT NULL THEN
          CASE v_rule.condition_operator
            WHEN 'greater_than' THEN v_matches := v_product.stock_quantity >  v_rule.condition_value::integer;
            WHEN 'equals'       THEN v_matches := v_product.stock_quantity =  v_rule.condition_value::integer;
            WHEN 'less_than'    THEN v_matches := v_product.stock_quantity <  v_rule.condition_value::integer;
            ELSE NULL;
          END CASE;
        END IF;

      ELSE
        -- Tipo desconhecido: ignorar silenciosamente
        NULL;
    END CASE;

    -- ── Aplicar tag se regra bateu ────────────────────────────────────
    IF v_matches THEN
      SELECT id INTO v_tag_id
      FROM tags
      WHERE slug = v_rule.tag_slug
        AND is_active = true
      LIMIT 1;

      IF v_tag_id IS NOT NULL THEN
        INSERT INTO product_tags (product_id, tag_id, created_at)
        VALUES (p_product_id, v_tag_id, now())
        ON CONFLICT (product_id, tag_id) DO NOTHING;

        IF FOUND THEN
          v_added := v_added + 1;
        ELSE
          v_skipped := v_skipped + 1;
        END IF;
      END IF;
    END IF;

  END LOOP; -- fim loop regras

  RETURN jsonb_build_object(
    'success',  true,
    'product_id', p_product_id,
    'tags_added',   v_added,
    'tags_skipped', v_skipped
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'product_id', p_product_id,
    'error', SQLERRM
  );
END;
$$;

-- Permissões
REVOKE ALL ON FUNCTION public.fn_apply_auto_tag_rules(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_apply_auto_tag_rules(uuid) TO service_role, authenticated;

COMMENT ON FUNCTION public.fn_apply_auto_tag_rules IS
  'Motor completo de regras de tags. Processa auto_tag_rules por tipo '
  '(keyword, material, category, technique, price, stock). '
  'Idempotente: ON CONFLICT DO NOTHING em product_tags. '
  'Substitui fn_auto_link_tags (limitado a SPOT + KeyWords apenas).';
