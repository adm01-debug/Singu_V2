-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409205300
-- nome:   zapp_history_143_customization_extractor

CREATE OR REPLACE FUNCTION zapp_history.extract_customization(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_result JSONB := '{}'::jsonb;
  v_colors TEXT[] := ARRAY[]::TEXT[];
  v_materials TEXT[] := ARRAY[]::TEXT[];
  v_techniques TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- CORES
  IF v_text_lower ~ '\m(branco|brancas?|branca)\M' THEN v_colors := array_append(v_colors, 'branco'); END IF;
  IF v_text_lower ~ '\m(preto|pretas?|preta)\M' THEN v_colors := array_append(v_colors, 'preto'); END IF;
  IF v_text_lower ~ '\m(azul|azuis|azul marinho|azul royal|azul claro)\M' THEN v_colors := array_append(v_colors, 'azul'); END IF;
  IF v_text_lower ~ '\m(vermelho|vermelhas?|vermelha)\M' THEN v_colors := array_append(v_colors, 'vermelho'); END IF;
  IF v_text_lower ~ '\m(verde|verdes|verde escuro|verde claro)\M' THEN v_colors := array_append(v_colors, 'verde'); END IF;
  IF v_text_lower ~ '\m(amarelo|amarelas?|amarela)\M' THEN v_colors := array_append(v_colors, 'amarelo'); END IF;
  IF v_text_lower ~ '\m(laranja|laranjas)\M' THEN v_colors := array_append(v_colors, 'laranja'); END IF;
  IF v_text_lower ~ '\m(rosa|rosas|pink)\M' THEN v_colors := array_append(v_colors, 'rosa'); END IF;
  IF v_text_lower ~ '\m(roxo|roxas?|roxa|lil[áa]s)\M' THEN v_colors := array_append(v_colors, 'roxo'); END IF;
  IF v_text_lower ~ '\m(cinza|cinzas|grafite|chumbo)\M' THEN v_colors := array_append(v_colors, 'cinza'); END IF;
  IF v_text_lower ~ '\m(dourado|dourada|gold)\M' THEN v_colors := array_append(v_colors, 'dourado'); END IF;
  IF v_text_lower ~ '\m(prata|prateado|silver)\M' THEN v_colors := array_append(v_colors, 'prata'); END IF;
  IF v_text_lower ~ '\m(bege|caramelo|marrom|marrons)\M' THEN v_colors := array_append(v_colors, 'marrom'); END IF;

  -- MATERIAIS
  IF v_text_lower ~ '\m(plastic[oa]|pl[áa]stic[oa]|polipropileno|pp|abs)\M' THEN v_materials := array_append(v_materials, 'plastico'); END IF;
  IF v_text_lower ~ '\m(metal|met[áa]lic[oa]|alum[íi]nio|aluminio|inox|a[çc]o)\M' THEN v_materials := array_append(v_materials, 'metal'); END IF;
  IF v_text_lower ~ '\m(vidro|cristal)\M' THEN v_materials := array_append(v_materials, 'vidro'); END IF;
  IF v_text_lower ~ '\m(porcelana|cer[âa]mica|ceramica|louça)\M' THEN v_materials := array_append(v_materials, 'ceramica'); END IF;
  IF v_text_lower ~ '\m(madeira|bambu|eco|sustent[áa]vel|ecol[óo]gic[oa])\M' THEN v_materials := array_append(v_materials, 'madeira_eco'); END IF;
  IF v_text_lower ~ '\m(algod[ãa]o|tecido|polyester|poli[ée]ster|nylon)\M' THEN v_materials := array_append(v_materials, 'tecido'); END IF;
  IF v_text_lower ~ '\m(couro|sint[ée]tic[oa]|courino)\M' THEN v_materials := array_append(v_materials, 'couro'); END IF;
  IF v_text_lower ~ '\m(silicone|borracha)\M' THEN v_materials := array_append(v_materials, 'silicone'); END IF;

  -- TÉCNICAS DE PERSONALIZAÇÃO
  IF v_text_lower ~ '(silk|silkscreen|silk screen|silk-screen|serigrafia)' THEN v_techniques := array_append(v_techniques, 'silkscreen'); END IF;
  IF v_text_lower ~ '(grava[çc][ãa]o (a )?laser|laser)' THEN v_techniques := array_append(v_techniques, 'laser'); END IF;
  IF v_text_lower ~ '(bordado|bordada|bordados)' THEN v_techniques := array_append(v_techniques, 'bordado'); END IF;
  IF v_text_lower ~ '(transfer|sublima[çc][ãa]o|sublim[áa]vel)' THEN v_techniques := array_append(v_techniques, 'sublimacao'); END IF;
  IF v_text_lower ~ '(tampografia|tampogr[áa]fica)' THEN v_techniques := array_append(v_techniques, 'tampografia'); END IF;
  IF v_text_lower ~ '(uv|impress[ãa]o uv|digital uv)' THEN v_techniques := array_append(v_techniques, 'uv'); END IF;
  IF v_text_lower ~ '(adesivo|adesivada|etiqueta)' THEN v_techniques := array_append(v_techniques, 'adesivo'); END IF;
  IF v_text_lower ~ '(hot stamping|relevo|baixo relevo|alto relevo)' THEN v_techniques := array_append(v_techniques, 'relevo'); END IF;

  IF array_length(v_colors, 1) > 0 THEN v_result := v_result || jsonb_build_object('colors', to_jsonb(v_colors)); END IF;
  IF array_length(v_materials, 1) > 0 THEN v_result := v_result || jsonb_build_object('materials', to_jsonb(v_materials)); END IF;
  IF array_length(v_techniques, 1) > 0 THEN v_result := v_result || jsonb_build_object('techniques', to_jsonb(v_techniques)); END IF;

  IF v_result = '{}'::jsonb THEN RETURN NULL; END IF;
  RETURN v_result;
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS customization_extracted JSONB;

CREATE INDEX IF NOT EXISTS idx_messages_customization ON zapp_history.messages USING GIN (customization_extracted)
  WHERE customization_extracted IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.extract_customization(TEXT) TO authenticated, service_role;
