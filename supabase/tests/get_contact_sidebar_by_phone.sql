-- Teste de regressão de public.get_contact_sidebar_by_phone
--
-- Como rodar (a função só executa como service_role/superuser):
--   psql "$DATABASE_URL" -f supabase/tests/get_contact_sidebar_by_phone.sql
-- O script inteiro roda numa transação com ROLLBACK no fim — não deixa resíduo.
--
-- Cobre as etapas 10–17 do plano PLANO_SIDEBAR_CONTATO_3_SECOES_100_ETAPAS
-- (Zapp_Web_V2): normalização de telefone, duplicata/deleted, blocos
-- professional/personal/singu_profile, fallbacks de contacts.behavior e
-- assessed_at.

BEGIN;

-- As branches de preview são reconstruídas apenas pelas migrations do
-- repositório. Parte do schema legado de produção foi criada antes desse
-- histórico e ainda não existe nelas. Estes stubs reproduzem somente as
-- colunas/tabelas lidas pela RPC; como fazem parte desta transação, o ROLLBACK
-- final devolve a branch exatamente ao estado anterior.
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS departamento text,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_of uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.contact_phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id),
  phone_type text,
  numero_normalizado text,
  is_primary boolean DEFAULT false,
  is_whatsapp boolean DEFAULT false,
  numero_e164 text,
  confiabilidade smallint,
  numero text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id),
  email_type text,
  email text,
  is_primary boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_social_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id),
  plataforma text,
  handle text,
  url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Produção e previews têm conjuntos diferentes de triggers legados, alguns
-- incompatíveis com o schema atual (auditoria sem `table_name`, incremento de
-- `contacts.version` ausente, sincronizações em cascata). As fixtures já
-- preenchem diretamente todos os campos que a RPC lê. `SET LOCAL` desativa
-- esses efeitos apenas nesta sessão/transação; ROLLBACK restaura o modo e
-- nenhuma fixture chega ao banco.
SET LOCAL session_replication_role = replica;

DO $$
DECLARE
  v_base    uuid := gen_random_uuid();
  v_company uuid := gen_random_uuid();
  v_other   uuid := gen_random_uuid();
  v_dup     uuid := gen_random_uuid();
  v_template uuid := gen_random_uuid();
  v_res     jsonb;
  v_user    uuid := gen_random_uuid();
  v_inf     uuid;
  v_inf_ids uuid[] := ARRAY[]::uuid[];
  v_i       integer;
  v_assessed_expected timestamptz := '2099-01-01 12:34:56+00';
BEGIN
  -- ============ fixture ============
  -- user_id em contacts é NOT NULL com FK para auth.users. A branch preview
  -- nasce sem dados: reutilizar um usuário quando houver ou criar uma fixture
  -- dentro desta transação (o ROLLBACK remove tudo no final).
  SELECT id INTO v_user FROM auth.users LIMIT 1;
  IF v_user IS NULL THEN
    v_user := gen_random_uuid();
    -- Algumas branches antigas têm o gatilho handle_new_user() esperando a
    -- coluna profiles.email, embora a tabela ainda não a tenha. O ajuste fica
    -- restrito a esta transação e é removido pelo ROLLBACK no final do teste.
    EXECUTE 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text';
    INSERT INTO auth.users (id) VALUES (v_user);
  END IF;

  INSERT INTO public.companies (id, user_id, name, nome_crm, nome_fantasia, logo_url)
  VALUES (v_company, v_user, 'Empresa XPTO SA', 'Empresa XPTO SA', 'XPTO', 'https://exemplo.com/logo.png');

  INSERT INTO public.contacts (id, user_id, company_id, first_name, last_name,
    cargo, departamento, role_title, data_nascimento, behavior, is_duplicate)
  VALUES (v_base, v_user, v_company, 'Teste', 'Sidebar',
    'Diretor', 'Comercial', 'Head de Vendas', '1985-03-14',
    '{"discProfile":"C","discConfidence":95,"preferredChannel":"whatsapp","needsApproval":true,"decisionCriteria":["price","quality"],"decisionPower":8,"temperamentProfile":{"primary":"sanguine"}}'::jsonb,
    false);

  -- telefone em 3 formatos conhecidos
  INSERT INTO public.contact_phones (contact_id, numero, numero_normalizado, numero_e164, phone_type, is_whatsapp, is_primary, confiabilidade)
  VALUES (v_base, '(11) 98877-6655', '11988776655', '+5511988776655', 'celular_corporativo', true, true, 90);

  INSERT INTO public.contact_emails (contact_id, email, email_type, is_primary, is_verified)
  VALUES (v_base, 'teste.sidebar@xpto.com', 'corporativo', true, true);

  INSERT INTO public.contact_social_media (contact_id, plataforma, handle, url, is_active)
  VALUES
    (v_base, 'linkedin', null, 'https://linkedin.com/in/teste-sidebar', true),
    (v_base, 'instagram', '@teste.sidebar', 'https://instagram.com/teste.sidebar', true);

  -- Template legado: esses defaults não são avaliação e devem permanecer
  -- ausentes no payload. Depois o mesmo contato é promovido a uma avaliação
  -- JSON real para cobrir ambos os lados da regra.
  INSERT INTO public.contacts (id, user_id, first_name, last_name, behavior, is_duplicate)
  VALUES (
    v_template, v_user, 'Template', 'Legado',
    '{"decisionCriteria":[],"needsApproval":false,"decisionPower":5}'::jsonb,
    false
  );
  INSERT INTO public.contact_phones (contact_id, numero, numero_normalizado, numero_e164)
  VALUES (v_template, '11666660000', '11666660000', '+5511666660000');

  -- contato de referência para approver/influencer
  INSERT INTO public.contacts (id, user_id, first_name, last_name, cargo, is_duplicate)
  VALUES (v_other, v_user, 'Aprovador', 'Teste', 'CEO', false);

  -- duplicata que deve resolver para v_base
  INSERT INTO public.contacts (id, user_id, first_name, last_name, is_duplicate, duplicate_of)
  VALUES (v_dup, v_user, 'Teste', 'Duplicado', true, v_base);
  INSERT INTO public.contact_phones (contact_id, numero, numero_normalizado, numero_e164, is_whatsapp)
  VALUES (v_dup, '11881234567', '11881234567', '+5511881234567', true);
  -- a duplicata resolve via contact_id: o telefone dela precisa apontar para ela
  -- e o teste abaixo consulta pelo telefone da DUPLICATA esperando o canônico.

  -- ============ 10. normalização do telefone ============
  v_res := public.get_contact_sidebar_by_phone('+55 (11) 9 8877-6655');
  ASSERT v_res->>'contact_id' = v_base::text, 'normalização falhou para +55 (11) 9 8877-6655';
  ASSERT v_res->>'found' = 'true', 'found != true';

  v_res := public.get_contact_sidebar_by_phone('11988776655');
  ASSERT v_res->>'contact_id' = v_base::text, 'normalização falhou para 11988776655';

  v_res := public.get_contact_sidebar_by_phone('5511988776655');
  ASSERT v_res->>'contact_id' = v_base::text, 'normalização falhou para 5511988776655';

  -- ============ 11. duplicata resolve para o canônico ============
  v_res := public.get_contact_sidebar_by_phone('11881234567');
  ASSERT v_res->>'contact_id' = v_base::text, 'duplicata não resolveu para o canônico';

  -- 11b. duplicata MESCLADA (is_duplicate + duplicate_of + deleted_at):
  -- a mesclagem marca deleted_at; a RPC segue duplicate_of mesmo assim.
  INSERT INTO public.contacts (id, user_id, first_name, last_name, is_duplicate, duplicate_of, deleted_at)
  VALUES (gen_random_uuid(), v_user, 'Mesclado', 'Dup', true, v_base, now())
  RETURNING id INTO v_other;
  INSERT INTO public.contact_phones (contact_id, numero, numero_normalizado, numero_e164, is_whatsapp)
  VALUES (v_other, '11887770000', '11887770000', '+5511887770000', true);
  v_res := public.get_contact_sidebar_by_phone('11887770000');
  ASSERT v_res->>'contact_id' = v_base::text, 'duplicata mesclada não resolveu o canônico';

  -- 11c. telefone compartilhado: contato ativo responde mesmo quando o
  -- apagado tem is_whatsapp/is_primary melhor posicionados no ORDER BY.
  INSERT INTO public.contacts (id, user_id, first_name, last_name, is_duplicate)
  VALUES (gen_random_uuid(), v_user, 'Ativo', 'Compart', false)
  RETURNING id INTO v_other;
  INSERT INTO public.contacts (id, user_id, first_name, last_name, is_duplicate, deleted_at)
  VALUES (gen_random_uuid(), v_user, 'Apagado', 'Compart', false, now())
  RETURNING id INTO v_dup;
  INSERT INTO public.contact_phones (contact_id, numero, numero_normalizado, numero_e164, is_whatsapp, is_primary)
  VALUES
    (v_dup,   '11888880000', '11888880000', '+5511888880000', true, true),
    (v_other, '11888880000', '11888880000', '+5511888880000', false, false);
  v_res := public.get_contact_sidebar_by_phone('11888880000');
  ASSERT v_res->>'contact_id' = v_other::text, 'telefone compartilhado não escolheu o ativo';

  -- 11d. VAK: scores do cadastro (contact_behavior.vak_*) vencem os de
  -- rapport e os do jsonb de behavior.
  INSERT INTO public.contacts (id, user_id, first_name, last_name, is_duplicate)
  VALUES (gen_random_uuid(), v_user, 'VAK', 'Teste', false)
  RETURNING id INTO v_other;
  INSERT INTO public.contact_phones (contact_id, numero, numero_normalizado, is_whatsapp)
  VALUES (v_other, '11777700000', '11777700000', true);
  INSERT INTO public.contact_behavior (contact_id, vak_primary, vak_visual, vak_auditory, vak_kinesthetic)
  VALUES (v_other, 'visual', 70, 20, 10);
  INSERT INTO public.contact_rapport_strategy (contact_id, visual_preference_score, auditory_preference_score, kinesthetic_preference_score)
  VALUES (v_other, 5, 5, 90);
  v_res := public.get_contact_sidebar_by_phone('11777700000');
  ASSERT v_res#>>'{singu_profile,vak,primary}' = 'visual', 'vak primary errado';
  ASSERT (v_res#>>'{singu_profile,vak,visual}')::int = 70, 'vak visual não veio do cadastro';
  ASSERT (v_res#>>'{singu_profile,vak,kinesthetic}')::int = 10, 'vak kinesthetic não veio do cadastro';

  -- Defaults legados isolados não habilitam decisão/orçamento.
  v_res := public.get_contact_sidebar_by_phone('11666660000');
  ASSERT v_res#>>'{singu_profile,decision}' IS NULL, 'template vazio criou decision';
  ASSERT v_res#>>'{singu_profile,budget}' IS NULL, 'template vazio criou budget';

  -- JSON meaningful: false e poder 5 seriam válidos se acompanhados de outro
  -- sinal; aqui usamos speed/criteria/role para provar essa distinção.
  UPDATE public.contacts
  SET behavior = '{"decisionSpeed":"fast","decisionCriteria":["roi"],"needsApproval":false,"decisionPower":5,"decisionRole":"economic"}'::jsonb
  WHERE id = v_template;
  v_res := public.get_contact_sidebar_by_phone('11666660000');
  ASSERT v_res#>>'{singu_profile,decision,speed}' = 'fast', 'decision JSON não retornou speed';
  ASSERT v_res#>>'{singu_profile,decision,needs_approval}' = 'false', 'false legítimo do JSON foi perdido';
  ASSERT (v_res#>>'{singu_profile,budget,decision_power}')::int = 5, 'poder 5 legítimo do JSON foi perdido';
  ASSERT v_res#>>'{singu_profile,budget,decision_role}' = 'economic', 'role JSON não retornou';

  -- ============ 12. bloco professional ============
  v_res := public.get_contact_sidebar_by_phone('11988776655');
  ASSERT v_res#>>'{professional,whatsapp,numero_e164}' = '+5511988776655', 'whatsapp errado';
  ASSERT v_res#>>'{professional,whatsapp,phone_type}' = 'celular_corporativo', 'phone_type errado';
  ASSERT v_res#>>'{professional,email_corporativo,email}' = 'teste.sidebar@xpto.com', 'email errado';
  ASSERT (v_res#>>'{professional,email_corporativo,is_verified}')::boolean, 'is_verified errado';
  ASSERT v_res#>>'{professional,empresa,nome}' = 'XPTO', 'nome da empresa errado';
  ASSERT v_res#>>'{professional,empresa,id}' = v_company::text, 'company_id errado';
  ASSERT v_res#>>'{professional,departamento}' = 'Comercial', 'departamento errado';
  ASSERT v_res#>>'{professional,cargo}' = 'Diretor', 'cargo errado';

  -- ============ 13. bloco personal ============
  ASSERT jsonb_array_length(v_res#>'{personal,social}') = 2, 'social != 2 itens';
  ASSERT v_res#>>'{personal,data_nascimento}' IN ('1985-03-14', '1985-03-14T00:00:00'), 'data_nascimento errada';

  -- contato sem rede devolve []
  v_res := public.get_contact_sidebar_by_phone('11881234567'); -- v_base via canônico ainda tem redes; usar outro
  INSERT INTO public.contacts (id, user_id, first_name, last_name, is_duplicate)
  VALUES (gen_random_uuid(), v_user, 'Sem', 'Rede', false)
  RETURNING id INTO v_other;
  INSERT INTO public.contact_phones (contact_id, numero, numero_normalizado, numero_e164)
  VALUES (v_other, '11999990000', '11999990000', '+5511999990000');
  v_res := public.get_contact_sidebar_by_phone('11999990000');
  ASSERT jsonb_array_length(v_res#>'{personal,social}') = 0, 'social vazio errado';
  ASSERT v_res#>>'{personal,data_nascimento}' IS NULL, 'data_nascimento deveria ser null';

  -- ============ 14. fallback DISC via contacts.behavior ============
  v_res := public.get_contact_sidebar_by_phone('11988776655');
  ASSERT v_res#>>'{singu_profile,disc,primary}' = 'C', 'disc fallback errado';
  ASSERT (v_res#>>'{singu_profile,disc,confidence}')::int = 95, 'disc confidence errado';

  -- Fallback completo de contact_behavior, com `false` legítimo acompanhado
  -- por velocidade/critérios e budget boolean convertido para o contrato.
  INSERT INTO public.contact_behavior (
    contact_id, main_fear, motivation_primary, decision_speed,
    decision_criteria, needs_approval, approver_id, budget_authority,
    decision_role, decision_power
  ) VALUES (
    v_base, 'Perder previsibilidade', 'Crescimento', 'slow',
    '{quality}', false,
    (SELECT id FROM public.contacts WHERE first_name = 'Aprovador' LIMIT 1),
    true, 'technical', 7
  );
  v_res := public.get_contact_sidebar_by_phone('11988776655');
  ASSERT v_res#>>'{singu_profile,fears_motivation,main_fear}' = 'Perder previsibilidade', 'fears fallback errado';
  ASSERT v_res#>>'{singu_profile,decision,speed}' = 'slow', 'decision não veio de contact_behavior';
  ASSERT v_res#>>'{singu_profile,decision,needs_approval}' = 'false', 'false legítimo de contact_behavior foi perdido';
  ASSERT v_res#>>'{singu_profile,decision,approver_name}' IS NOT NULL, 'approver de contact_behavior não resolveu';
  ASSERT v_res#>>'{singu_profile,budget,authority}' = 'yes', 'budget boolean não foi mapeado';
  ASSERT v_res#>>'{singu_profile,budget,decision_role}' = 'technical', 'role não veio de contact_behavior';
  ASSERT (v_res#>>'{singu_profile,budget,decision_power}')::int = 7, 'power não veio de contact_behavior';

  -- ============ 15. big_five / mbti / enneagram ============
  INSERT INTO public.contact_personality (contact_id, big_five_openness, big_five_confidence,
    mbti_type, mbti_e_i_score, enneagram_type, enneagram_wing, temperament_primary)
  VALUES (v_base, 72, 88, 'ENTJ', 65, 3, 2, 'choleric');
  v_res := public.get_contact_sidebar_by_phone('11988776655');
  ASSERT (v_res#>>'{singu_profile,big_five,openness}')::int = 72, 'big_five errado';
  ASSERT v_res#>>'{singu_profile,mbti,type}' = 'ENTJ', 'mbti errado';
  ASSERT (v_res#>>'{singu_profile,enneagram,type}')::int = 3, 'enneagram errado';
  -- temperament: linha de contact_personality vence o fallback de behavior
  ASSERT v_res#>>'{singu_profile,temperament,primary}' = 'choleric', 'temperament errado';

  -- ============ 16. metaprograms, decision, budget, influencers, rapport, objections ============
  INSERT INTO public.contact_metaprograms (contact_id, toward_score, away_from_score, internal_score, external_score, notes)
  VALUES (v_base, 80, 30, 90, 20, 'orientado a resultado');
  INSERT INTO public.contact_decision_making (contact_id, decision_speed, decision_criteria, needs_approval, approver_id, budget_authority)
  VALUES (v_base, 'fast', '{roi,prazo}', false, (SELECT id FROM public.contacts WHERE first_name = 'Aprovador' LIMIT 1), 'aprovador_final');

  FOR v_i IN 1..6 LOOP
    v_inf := gen_random_uuid();
    INSERT INTO public.contacts (id, user_id, first_name, last_name, cargo, is_duplicate)
    VALUES (v_inf, v_user, 'Influenciador ' || v_i, 'Teste', 'Cargo ' || v_i, false);
    v_inf_ids := array_append(v_inf_ids, v_inf);
  END LOOP;
  INSERT INTO public.contact_influence (contact_id, decision_role, decision_power, influencer_ids)
  VALUES (v_base, 'economic', 9, v_inf_ids);
  INSERT INTO public.contact_rapport_strategy (contact_id, visual_preference_score, auditory_preference_score,
    kinesthetic_preference_score, digital_preference_score, pacing_speed, voice_tone_preferred,
    preferred_triggers, emotional_anchors, resistance_triggers, notes)
  VALUES (v_base, 85, 10, 5, 60, 'fast', 'objetivo', '{scarcity}', '{familia}', '{politica}', 'rapport teste');
  INSERT INTO public.contact_objection_scripts (
    contact_id, user_id, objection_type, script_content,
    neurological_bias, effectiveness_score
  )
  SELECT v_base, v_user, 'preco', 'Script ' || g, 'anchoring', 100 - g
  FROM generate_series(1, 12) AS g;

  -- Valor futuro controlado torna o aceite de MAX(updated_at) exato e não
  -- dependente do relógio da máquina que executa o teste.
  UPDATE public.contact_objection_scripts
  SET updated_at = v_assessed_expected
  WHERE contact_id = v_base AND script_content = 'Script 1';

  v_res := public.get_contact_sidebar_by_phone('11988776655');
  ASSERT (v_res#>>'{singu_profile,metaprograms,toward}')::int = 80, 'metaprograms errado';
  ASSERT v_res#>>'{singu_profile,decision,speed}' = 'fast', 'decision errado';
  ASSERT v_res#>>'{singu_profile,decision,approver_name}' IS NOT NULL, 'approver_name não resolvido';
  ASSERT v_res#>>'{singu_profile,budget,authority}' = 'aprovador_final', 'budget errado';
  ASSERT (v_res#>>'{singu_profile,budget,decision_power}')::int = 9, 'decision_power errado';
  ASSERT jsonb_array_length(v_res#>'{singu_profile,influencers}') = 5, 'limite de 5 influencers não aplicado';
  ASSERT v_res#>>'{singu_profile,rapport,pacing_speed}' = 'fast', 'rapport errado';
  ASSERT (v_res#>>'{singu_profile,rapport,channel_scores,visual}')::int = 85, 'channel_scores errado';
  ASSERT jsonb_array_length(v_res#>'{singu_profile,objection_scripts}') = 10, 'limite de 10 scripts não aplicado';
  ASSERT (v_res#>>'{singu_profile,objection_scripts,0,effectiveness_score}')::int = 99,
    'scripts não vieram por effectiveness_score DESC';

  -- ============ 17. assessed_at ============
  ASSERT (v_res#>>'{singu_profile,assessed_at}')::timestamptz = v_assessed_expected,
    'assessed_at não é o max(updated_at) exato';

  -- contato sem avaliação → assessed_at null
  v_res := public.get_contact_sidebar_by_phone('11999990000');
  ASSERT v_res#>>'{singu_profile,assessed_at}' IS NULL, 'assessed_at deveria ser null';

  -- ============ not found ============
  ASSERT public.get_contact_sidebar_by_phone('00000000')->>'found' = 'false', 'not found errado';
  ASSERT public.get_contact_sidebar_by_phone(null)->>'found' = 'false', 'null phone errado';
  ASSERT public.get_contact_sidebar_by_phone('')->>'found' = 'false', 'empty phone errado';

  RAISE NOTICE 'get_contact_sidebar_by_phone: todos os asserts passaram';
END $$;

-- 18. grants: anon/authenticated sem EXECUTE, service_role com EXECUTE
DO $$
BEGIN
  ASSERT NOT has_function_privilege('anon', 'public.get_contact_sidebar_by_phone(text)', 'EXECUTE'),
    'anon tem EXECUTE em get_contact_sidebar_by_phone';
  ASSERT NOT has_function_privilege('authenticated', 'public.get_contact_sidebar_by_phone(text)', 'EXECUTE'),
    'authenticated tem EXECUTE em get_contact_sidebar_by_phone';
  ASSERT has_function_privilege('service_role', 'public.get_contact_sidebar_by_phone(text)', 'EXECUTE'),
    'service_role sem EXECUTE em get_contact_sidebar_by_phone';
  RAISE NOTICE 'grants OK';
END $$;

ROLLBACK;
