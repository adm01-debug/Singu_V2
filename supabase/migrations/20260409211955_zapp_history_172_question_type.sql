-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409211955
-- nome:   zapp_history_172_question_type

CREATE OR REPLACE FUNCTION zapp_history.detect_question_type(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_questions TEXT[] := ARRAY[]::TEXT[];
  v_qcount INT := 0;
  v_type TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('has_question',false); END IF;
  v_text_lower := lower(p_text);

  v_qcount := (length(p_text) - length(replace(p_text, '?', '')));
  IF v_qcount = 0 AND v_text_lower !~ '(quanto|quando|onde|como|qual|quem|por que|porque)' THEN
    RETURN jsonb_build_object('has_question', false);
  END IF;

  IF v_text_lower ~ '\m(quanto custa|qual.{0,20}(pre[çc]o|valor))\M' THEN v_questions := array_append(v_questions, 'preco'); END IF;
  IF v_text_lower ~ '\m(quanto tempo|qual.{0,20}prazo|quando.{0,30}(entreg|fica pronto|chega))\M' THEN v_questions := array_append(v_questions, 'prazo'); END IF;
  IF v_text_lower ~ '\m(como (funciona|fa[cz]o|pe[çc]o)|qual.{0,20}processo)\M' THEN v_questions := array_append(v_questions, 'processo'); END IF;
  IF v_text_lower ~ '\m(qual.{0,20}(diferen[cç]a|melhor)|comparativo|por que escolher)\M' THEN v_questions := array_append(v_questions, 'comparativo'); END IF;
  IF v_text_lower ~ '\m(onde|em que (cidade|estado|local))\M' THEN v_questions := array_append(v_questions, 'localizacao'); END IF;
  IF v_text_lower ~ '\m(tem.{0,20}(estoque|dispon[íi]vel|pronta entrega)|fazem|trabalham com)\M' THEN v_questions := array_append(v_questions, 'disponibilidade'); END IF;
  IF v_text_lower ~ '\m(forma de pagamento|aceitam.{0,15}(cart[ãa]o|boleto|pix|parcel)|parcel)\M' THEN v_questions := array_append(v_questions, 'pagamento'); END IF;
  IF v_text_lower ~ '\m(quantidade m[íi]nima|m[íi]nimo de pedido|menor pedido)\M' THEN v_questions := array_append(v_questions, 'quantidade_minima'); END IF;
  IF v_text_lower ~ '\m(amostra|prot[óo]tipo|teste antes|prova)\M' THEN v_questions := array_append(v_questions, 'amostra'); END IF;

  -- Tipo: aberta vs fechada vs escolha
  IF v_text_lower ~ '\m(qual (deles|opção|modelo)|prefer[ie] (qual|este|aquele)|ou |entre.{0,20}e )\M' THEN v_type := 'escolha';
  ELSIF v_text_lower ~ '\m(sim ou n[ãa]o|tem ou n[ãa]o|fazem ou n[ãa]o|aceitam ou n[ãa]o)\M' THEN v_type := 'fechada_sim_nao';
  ELSIF v_text_lower ~ '\m(quanto|quando|onde|como|qual|quem|por que|porque|me explica|me diga)\M' THEN v_type := 'aberta';
  ELSE v_type := 'fechada_sim_nao';
  END IF;

  RETURN jsonb_build_object(
    'has_question', true,
    'type', v_type,
    'question_count', v_qcount,
    'topics', to_jsonb(v_questions)
  );
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS question_analysis JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_question_type ON zapp_history.messages((question_analysis->>'type'))
  WHERE question_analysis IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_question_type(TEXT) TO authenticated, service_role;
