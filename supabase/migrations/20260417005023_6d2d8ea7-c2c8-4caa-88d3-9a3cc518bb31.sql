-- =========================================
-- SALES PLAYBOOKS & BATTLE CARDS
-- =========================================

-- 1. sales_playbooks
CREATE TABLE public.sales_playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scenario TEXT NOT NULL CHECK (scenario IN ('discovery','demo','negotiation','objection','closing','winback','onboarding','custom')),
  stage_target TEXT,
  industry_target TEXT,
  persona_target TEXT,
  content JSONB NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_playbooks_user ON public.sales_playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_playbooks_scenario ON public.sales_playbooks(user_id, scenario) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_sales_playbooks_tags ON public.sales_playbooks USING GIN(tags);

ALTER TABLE public.sales_playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playbooks_select_own" ON public.sales_playbooks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "playbooks_insert_own" ON public.sales_playbooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "playbooks_update_own" ON public.sales_playbooks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "playbooks_delete_own" ON public.sales_playbooks
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_sales_playbooks_updated_at
  BEFORE UPDATE ON public.sales_playbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_sales_playbooks
  AFTER INSERT OR UPDATE OR DELETE ON public.sales_playbooks
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- 2. battle_cards
CREATE TABLE public.battle_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  competitor_name TEXT NOT NULL,
  competitor_logo_url TEXT,
  summary TEXT,
  our_strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  their_strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing_comparison TEXT,
  win_themes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  landmines TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  proof_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated_by UUID,
  version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_battle_cards_user ON public.battle_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_cards_competitor ON public.battle_cards(user_id, lower(competitor_name)) WHERE active = true;

ALTER TABLE public.battle_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "battle_cards_select_own" ON public.battle_cards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "battle_cards_insert_own" ON public.battle_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "battle_cards_update_own" ON public.battle_cards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "battle_cards_delete_own" ON public.battle_cards
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_battle_cards_updated_at
  BEFORE UPDATE ON public.battle_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_battle_cards
  AFTER INSERT OR UPDATE OR DELETE ON public.battle_cards
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- 3. playbook_usage_log
CREATE TABLE public.playbook_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  playbook_id UUID REFERENCES public.sales_playbooks(id) ON DELETE CASCADE,
  battle_card_id UUID REFERENCES public.battle_cards(id) ON DELETE CASCADE,
  contact_id UUID,
  deal_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('opened','copied','shared','recommended','used_in_deal')),
  context JSONB DEFAULT '{}'::jsonb,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbook_usage_user ON public.playbook_usage_log(user_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_playbook_usage_playbook ON public.playbook_usage_log(playbook_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_playbook_usage_battle_card ON public.playbook_usage_log(battle_card_id, opened_at DESC);

ALTER TABLE public.playbook_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playbook_usage_select_own" ON public.playbook_usage_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "playbook_usage_insert_own" ON public.playbook_usage_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Trigger: increment usage_count on usage log
CREATE OR REPLACE FUNCTION public.increment_playbook_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.playbook_id IS NOT NULL AND NEW.action IN ('opened','used_in_deal') THEN
    UPDATE public.sales_playbooks
    SET usage_count = usage_count + 1
    WHERE id = NEW.playbook_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_playbook_usage_increment
  AFTER INSERT ON public.playbook_usage_log
  FOR EACH ROW EXECUTE FUNCTION public.increment_playbook_usage();

-- 5. seed_playbook_defaults
CREATE OR REPLACE FUNCTION public.seed_playbook_defaults(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Discovery playbook
  INSERT INTO public.sales_playbooks (user_id, name, description, scenario, stage_target, content, tags)
  VALUES (
    _user_id,
    'Discovery Inicial — SPIN',
    'Roteiro estruturado para primeira conversa de descoberta usando framework SPIN (Situation, Problem, Implication, Need-payoff).',
    'discovery',
    'qualified',
    jsonb_build_object('sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Abertura (2 min)',
        'type', 'talktrack',
        'body', 'Agradeça o tempo, confirme duração da call, defina objetivo conjunto: "Hoje eu queria entender melhor seu cenário atual e ver se faz sentido conversarmos sobre uma solução. Pode ser?"',
        'items', jsonb_build_array()
      ),
      jsonb_build_object(
        'title', 'Situação',
        'type', 'questions',
        'body', 'Entenda o contexto sem julgar.',
        'items', jsonb_build_array(
          'Como vocês fazem isso hoje?',
          'Quem faz parte do processo?',
          'Há quanto tempo está dessa forma?',
          'Qual ferramenta/processo atual?'
        )
      ),
      jsonb_build_object(
        'title', 'Problema',
        'type', 'questions',
        'body', 'Identifique dores reais.',
        'items', jsonb_build_array(
          'O que mais te incomoda no processo atual?',
          'Onde vocês perdem tempo?',
          'O que falta ter visibilidade?',
          'Quando foi a última vez que isso causou um problema concreto?'
        )
      ),
      jsonb_build_object(
        'title', 'Implicação',
        'type', 'questions',
        'body', 'Amplifique o custo da inação.',
        'items', jsonb_build_array(
          'Se isso continuar, qual o impacto no próximo trimestre?',
          'Quanto isso custa por mês em horas/dinheiro?',
          'Como isso afeta seu time e clientes?'
        )
      ),
      jsonb_build_object(
        'title', 'Need-payoff',
        'type', 'questions',
        'body', 'Faça o cliente verbalizar o valor.',
        'items', jsonb_build_array(
          'Se você resolvesse isso, qual seria o ganho?',
          'Como seria o cenário ideal pra você?',
          'O que mudaria pro seu time?'
        )
      ),
      jsonb_build_object(
        'title', 'Próximos Passos',
        'type', 'next_steps',
        'body', 'Sempre saia com data e ação acordadas.',
        'items', jsonb_build_array(
          'Marcar demo personalizada na próxima semana',
          'Confirmar quem mais precisa estar na próxima conversa',
          'Enviar resumo + materiais relevantes em até 24h'
        )
      )
    )),
    ARRAY['discovery','spin','qualificacao']
  );

  -- Demo playbook
  INSERT INTO public.sales_playbooks (user_id, name, description, scenario, stage_target, content, tags)
  VALUES (
    _user_id,
    'Demo Personalizada de Alto Impacto',
    'Estrutura de demo focada em casos do cliente, não em features.',
    'demo',
    'demo',
    jsonb_build_object('sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Pré-Demo (preparação)',
        'type', 'next_steps',
        'body', 'Faça lição de casa antes.',
        'items', jsonb_build_array(
          'Reler notas do discovery',
          'Preparar 2-3 cenários espelhando dores citadas',
          'Confirmar agenda + participantes 24h antes',
          'Testar áudio/vídeo/tela 10 min antes'
        )
      ),
      jsonb_build_object(
        'title', 'Recap & Confirmação (5 min)',
        'type', 'talktrack',
        'body', 'Recapitule o que ouviu no discovery e confirme: "Pelo que entendi, suas 3 prioridades são X, Y, Z. Faz sentido focarmos nisso hoje?"',
        'items', jsonb_build_array()
      ),
      jsonb_build_object(
        'title', 'Demo guiada por dor',
        'type', 'talktrack',
        'body', 'Para cada dor: mostre o problema → mostre a solução → peça reação. Não corra pelas features.',
        'items', jsonb_build_array(
          'Dor 1 → fluxo na ferramenta → "Como isso resolveria seu caso?"',
          'Dor 2 → fluxo → reação',
          'Dor 3 → fluxo → reação'
        )
      ),
      jsonb_build_object(
        'title', 'Perguntas durante a demo',
        'type', 'questions',
        'body', 'Engaje, não monologue.',
        'items', jsonb_build_array(
          'Faz sentido até aqui?',
          'Como vocês fariam isso hoje?',
          'Quem mais usaria essa funcionalidade?'
        )
      ),
      jsonb_build_object(
        'title', 'Fechamento da demo',
        'type', 'next_steps',
        'body', 'Nunca termine sem next step.',
        'items', jsonb_build_array(
          'Resumir benefícios mostrados',
          'Perguntar: "Em uma escala de 0-10, quão alinhado isso está?"',
          'Agendar próxima call (proposta ou aprofundamento técnico)',
          'Enviar gravação + material em 24h'
        )
      )
    )),
    ARRAY['demo','apresentacao']
  );

  -- Objection handling: pricing
  INSERT INTO public.sales_playbooks (user_id, name, description, scenario, content, tags)
  VALUES (
    _user_id,
    'Objeção: "Está caro"',
    'Roteiro para tratar objeção de preço sem dar desconto reflexo.',
    'objection',
    jsonb_build_object('sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Não reaja com desconto',
        'type', 'talktrack',
        'body', 'Antes de qualquer coisa, valide e investigue: "Quando você diz caro, caro comparado a quê?"',
        'items', jsonb_build_array()
      ),
      jsonb_build_object(
        'title', 'Perguntas de diagnóstico',
        'type', 'questions',
        'body', 'Descubra o que está por trás.',
        'items', jsonb_build_array(
          'Caro comparado a qual alternativa?',
          'Vocês têm budget aprovado pra esse tipo de solução?',
          'Qual seria o ROI esperado pra justificar?',
          'O que precisaria estar incluso pra fazer sentido?'
        )
      ),
      jsonb_build_object(
        'title', 'Respostas estruturadas',
        'type', 'objections',
        'body', 'Use a fórmula: validar → reframe → evidência → pergunta.',
        'items', jsonb_build_array(
          '"Entendo. Outros clientes disseram o mesmo no início, mas em 3 meses tiveram ROI de Xx por causa de Y. Pra vocês, qual seria o impacto de resolver isso?"',
          '"O preço reflete o resultado. Se o problema custa R$ X/mês pra vocês, em quanto tempo isso se paga?"',
          '"Posso te mostrar como cliente Z, do mesmo porte, justificou o investimento?"'
        )
      ),
      jsonb_build_object(
        'title', 'Quando faz sentido flexibilizar',
        'type', 'next_steps',
        'body', 'Só negocie troca por troca.',
        'items', jsonb_build_array(
          'Pagamento à vista por desconto pequeno',
          'Contrato anual em vez de mensal',
          'Reduzir escopo (não preço por feature)',
          'Validar com gerência antes de oferecer'
        )
      )
    )),
    ARRAY['objecao','preco','negociacao']
  );

  -- Closing playbook
  INSERT INTO public.sales_playbooks (user_id, name, description, scenario, stage_target, content, tags)
  VALUES (
    _user_id,
    'Fechamento Assumptivo',
    'Como conduzir o fechamento assumindo o sim, com técnicas de closing.',
    'closing',
    'negotiation',
    jsonb_build_object('sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Sinais de compra',
        'type', 'talktrack',
        'body', 'Reconheça quando o cliente já decidiu.',
        'items', jsonb_build_array(
          'Pergunta sobre implementação ou onboarding',
          'Pergunta sobre treinamento do time',
          'Pergunta sobre faturamento/contrato',
          'Mudança de "se" para "quando"'
        )
      ),
      jsonb_build_object(
        'title', 'Técnicas de fechamento',
        'type', 'objections',
        'body', 'Escolha a técnica certa pro contexto.',
        'items', jsonb_build_array(
          '**Assumptivo**: "Pra começarmos dia 1º, preciso do contrato assinado até sexta. Posso enviar?"',
          '**Alternativo**: "Você prefere começar com o plano Pro ou Enterprise?"',
          '**Urgência real**: "Esse desconto é até sexta porque fechamos lote aqui"',
          '**Resumo de valor**: "Recapitulando o que vamos resolver pra vocês..."'
        )
      ),
      jsonb_build_object(
        'title', 'Tratando hesitação final',
        'type', 'questions',
        'body', 'Descubra o que está bloqueando.',
        'items', jsonb_build_array(
          'O que falta pra você assinar hoje?',
          'Quem mais precisa aprovar?',
          'Qual o pior cenário se vocês não fizerem isso agora?'
        )
      ),
      jsonb_build_object(
        'title', 'Próximos passos pós-sim',
        'type', 'next_steps',
        'body', 'Aja rápido pra evitar buyer remorse.',
        'items', jsonb_build_array(
          'Enviar contrato em até 2h',
          'Agendar kickoff de implementação',
          'Apresentar CSM/onboarding na mesma semana',
          'Pedir referência/case quando aplicável'
        )
      )
    )),
    ARRAY['fechamento','closing','negociacao']
  );

  -- Battle cards example
  INSERT INTO public.battle_cards (
    user_id, competitor_name, summary,
    our_strengths, their_strengths, weaknesses,
    pricing_comparison, win_themes, landmines, proof_points
  )
  VALUES (
    _user_id,
    'Concorrente Genérico A',
    'Player tradicional, foco em grandes contas, processo de venda lento.',
    jsonb_build_array(
      jsonb_build_object('title','Implementação rápida','detail','Onboarding em 2 semanas vs 3+ meses deles'),
      jsonb_build_object('title','Suporte humano','detail','Atendimento dedicado em português 24/7'),
      jsonb_build_object('title','Preço transparente','detail','Sem custos ocultos de implementação')
    ),
    jsonb_build_array(
      jsonb_build_object('title','Marca consolidada','detail','30 anos de mercado'),
      jsonb_build_object('title','Ecossistema amplo','detail','Muitas integrações nativas')
    ),
    jsonb_build_array(
      jsonb_build_object('title','Implementação demorada','detail','Projetos típicos 6+ meses'),
      jsonb_build_object('title','Suporte caro','detail','SLA premium custa 2x'),
      jsonb_build_object('title','UI desatualizada','detail','Reclamações frequentes de UX em reviews')
    ),
    'Eles cobram setup fee de 30-50% do ACV. Nós: zero setup.',
    ARRAY[
      'Velocidade de implementação',
      'Suporte humano em português',
      'Preço transparente sem surpresas',
      'UX moderna que o time adota'
    ],
    ARRAY[
      'Não competir em volume de integrações',
      'Não atacar a marca diretamente',
      'Cuidado: eles têm relacionamento longo com TI legado'
    ],
    jsonb_build_array(
      jsonb_build_object('client','Cliente X','result','Migrou em 3 semanas, ROI em 2 meses'),
      jsonb_build_object('client','Cliente Y','result','Reduziu custo total em 40% vs concorrente A')
    )
  );

  INSERT INTO public.battle_cards (
    user_id, competitor_name, summary,
    our_strengths, their_strengths, weaknesses,
    pricing_comparison, win_themes, landmines, proof_points
  )
  VALUES (
    _user_id,
    'Concorrente Low-Cost B',
    'Solução barata, foco em SMB, pouca profundidade.',
    jsonb_build_array(
      jsonb_build_object('title','Profundidade funcional','detail','Recursos avançados que escalam com a empresa'),
      jsonb_build_object('title','Confiabilidade enterprise','detail','SLA 99.9%, ISO 27001'),
      jsonb_build_object('title','Customer Success','detail','CSM dedicado a partir do plano Pro')
    ),
    jsonb_build_array(
      jsonb_build_object('title','Preço baixo','detail','30-50% mais barato'),
      jsonb_build_object('title','Setup simples','detail','Self-service em minutos')
    ),
    jsonb_build_array(
      jsonb_build_object('title','Limitações em escala','detail','Trava em volumes médios'),
      jsonb_build_object('title','Sem suporte humano','detail','Apenas chat com bot'),
      jsonb_build_object('title','Sem segurança enterprise','detail','Sem SSO, sem auditoria avançada')
    ),
    'Aparentemente mais barato, mas custa caro quando o time cresce e precisa migrar.',
    ARRAY[
      'TCO em 12-24 meses é menor que o deles',
      'Risco zero de migração futura',
      'Segurança e compliance enterprise',
      'Suporte humano quando importa'
    ],
    ARRAY[
      'Não brigar por preço de tabela',
      'Cuidado em prospects muito early-stage'
    ],
    jsonb_build_array(
      jsonb_build_object('client','Cliente Z','result','Migrou do concorrente B após 8 meses por limitações'),
      jsonb_build_object('client','Cliente W','result','Avaliou os dois e escolheu nós pelo TCO de 24m')
    )
  );
END;
$$;