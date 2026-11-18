-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409205757
-- nome:   zapp_history_145_disc_playbook

CREATE TABLE IF NOT EXISTS zapp_history.disc_playbook (
  profile TEXT PRIMARY KEY,
  abordagem TEXT NOT NULL,
  o_que_fazer TEXT[] NOT NULL,
  o_que_evitar TEXT[] NOT NULL,
  gatilhos_eficazes TEXT[] NOT NULL,
  exemplo_resposta TEXT
);

INSERT INTO zapp_history.disc_playbook (profile, abordagem, o_que_fazer, o_que_evitar, gatilhos_eficazes, exemplo_resposta) VALUES
(
  'D',
  'Direto, objetivo, focado em resultado. Sem rodeios.',
  ARRAY[
    'Ir direto ao ponto: preço, prazo, condição',
    'Apresentar 2-3 opções no máximo (não confundir)',
    'Mostrar resultado final / ROI',
    'Respeitar tempo: respostas curtas e práticas',
    'Confirmar decisão e seguir adiante'
  ],
  ARRAY[
    'Conversa fiada / small talk',
    'Detalhes técnicos demais',
    'Múltiplas opções confusas',
    'Demora pra responder',
    'Linguagem rebuscada'
  ],
  ARRAY['urgência','exclusividade','autoridade','resultado garantido','desafio'],
  'Olá! Para 1000 unidades fica R$ 8.500, prazo 12 dias úteis, pagamento 50/50. Pode confirmar pra produzir?'
),
(
  'I',
  'Caloroso, social, entusiasmado. Cliente compra a relação.',
  ARRAY[
    'Usar tom amigável e descontraído',
    'Mostrar entusiasmo pelo projeto dele',
    'Compartilhar cases de sucesso de outros clientes',
    'Usar fotos, vídeos, depoimentos visuais',
    'Personalizar a conversa (nome, contexto)'
  ],
  ARRAY[
    'Tom frio / formal demais',
    'Só números e tabelas',
    'Cortar entusiasmo do cliente',
    'Ignorar emojis ou gentilezas'
  ],
  ARRAY['novidade','exclusivo pra você','outros clientes amaram','vai ficar incrível','case de sucesso'],
  'Oi! Adorei seu projeto, vai ficar incrível! 🙌 Tenho um case parecido onde fizemos algo super especial. Posso te mostrar?'
),
(
  'S',
  'Paciente, confiável, foco em relacionamento de longo prazo.',
  ARRAY[
    'Tom calmo, formal e cortês',
    'Explicar o processo passo a passo',
    'Garantir suporte pós-venda',
    'Mostrar estabilidade da empresa (anos no mercado, certificados)',
    'Evitar pressão de tempo'
  ],
  ARRAY[
    'Pressão pra fechar rápido',
    'Mudanças de última hora',
    'Tom agressivo ou impaciente',
    'Promessas exageradas'
  ],
  ARRAY['parceria de longo prazo','garantia','suporte','tradição','confiança','testado e aprovado'],
  'Prezado(a), agradeço o contato. Vamos seguir cada etapa com calma para garantir que tudo saia perfeito. Estamos há 15 anos no mercado e oferecemos suporte completo pós-entrega.'
),
(
  'C',
  'Analítico, técnico, busca dados e especificações.',
  ARRAY[
    'Enviar ficha técnica completa',
    'Mostrar certificações e selos',
    'Comparar especificações com concorrentes (se favorável)',
    'Oferecer amostra ou prototipagem',
    'Responder por escrito (não áudio)'
  ],
  ARRAY[
    'Respostas vagas ou aproximadas',
    'Pressionar pra decidir sem dados',
    'Não ter especificação técnica',
    'Linguagem informal / emojis demais'
  ],
  ARRAY['certificado','especificação técnica','dados','comparativo','garantia documentada','rastreabilidade'],
  'Boa tarde. Segue ficha técnica completa: material X, gramatura Y, certificação ABNT NBR Z. Posso enviar amostra para aprovação antes da produção em escala.'
)
ON CONFLICT (profile) DO UPDATE SET
  abordagem = EXCLUDED.abordagem,
  o_que_fazer = EXCLUDED.o_que_fazer,
  o_que_evitar = EXCLUDED.o_que_evitar,
  gatilhos_eficazes = EXCLUDED.gatilhos_eficazes,
  exemplo_resposta = EXCLUDED.exemplo_resposta;

GRANT SELECT ON zapp_history.disc_playbook TO authenticated;

-- RPC pra retornar playbook completo de uma mensagem
CREATE OR REPLACE FUNCTION zapp_history.get_playbook_for_message(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $fn$
DECLARE
  v_msg zapp_history.messages%ROWTYPE;
  v_playbook zapp_history.disc_playbook%ROWTYPE;
BEGIN
  SELECT * INTO v_msg FROM zapp_history.messages WHERE id = p_message_id;
  IF NOT FOUND OR v_msg.disc_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Mensagem sem perfil DISC');
  END IF;

  SELECT * INTO v_playbook FROM zapp_history.disc_playbook WHERE profile = v_msg.disc_profile->>'profile';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Playbook não encontrado para perfil ' || (v_msg.disc_profile->>'profile'));
  END IF;

  RETURN jsonb_build_object(
    'message_id', v_msg.id,
    'perfil_detectado', v_msg.disc_profile,
    'tom_comunicacao', v_msg.communication_tone->>'tone',
    'etapa_funil', v_msg.funnel_stage,
    'journey_stage', v_msg.journey_stage,
    'lead_score', v_msg.lead_score,
    'playbook', jsonb_build_object(
      'abordagem', v_playbook.abordagem,
      'o_que_fazer', v_playbook.o_que_fazer,
      'o_que_evitar', v_playbook.o_que_evitar,
      'gatilhos_eficazes', v_playbook.gatilhos_eficazes,
      'exemplo_resposta', v_playbook.exemplo_resposta
    )
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.get_playbook_for_message(UUID) TO authenticated, service_role;
