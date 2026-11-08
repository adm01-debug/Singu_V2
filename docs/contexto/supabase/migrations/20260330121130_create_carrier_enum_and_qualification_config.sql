-- Enum separado para carriers (D4: separado)
CREATE TYPE carrier_homologation_status AS ENUM (
  'pendente', 'em_analise', 'homologado', 'reprovado', 'suspenso', 'vencido'
);

-- Tabela de configuração de segmentos (D3: separada)
CREATE TABLE carrier_qualification_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_code text NOT NULL UNIQUE,
  name_pt text NOT NULL,
  description_pt text,
  score_min numeric(5,2) NOT NULL,
  score_max numeric(5,2) NOT NULL,
  color text,
  icon text,
  priority integer NOT NULL,
  recommended_actions_pt text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed data: mesmas faixas, ações específicas para transporte
INSERT INTO carrier_qualification_config (segment_code, name_pt, description_pt, score_min, score_max, color, priority, recommended_actions_pt) VALUES
('excelente', 'Excelente', 'Transportadora de alto desempenho', 80.01, 100.00, '#4CAF50', 1, 
  ARRAY['Ampliar rotas e cobertura', 'Negociar contrato de longo prazo', 'Usar como referência para novas transportadoras']),
('bom', 'Bom', 'Transportadora confiável com bom desempenho', 60.01, 80.00, '#8BC34A', 2, 
  ARRAY['Manter parceria', 'Considerar para rotas prioritárias', 'Monitorar pontualidade']),
('regular', 'Regular', 'Transportadora com desempenho mediano', 40.01, 60.00, '#FFC107', 3, 
  ARRAY['Acompanhar evolução', 'Solicitar melhoria no rastreamento', 'Revisar SLA de frete']),
('insuficiente', 'Insuficiente', 'Transportadora com desempenho abaixo do esperado', 20.01, 40.00, '#FF5722', 4, 
  ARRAY['Plano de ação com transportadora', 'Monitorar próximas 5 entregas', 'Buscar alternativas de frete']),
('critico', 'Crítico', 'Transportadora com desempenho crítico', 0.00, 20.00, '#F44336', 5, 
  ARRAY['Bloquear novos envios', 'Acionar transportadora reserva', 'Revisar contrato e reavaliar homologação']);

-- RLS (mesmo padrão aberto)
ALTER TABLE carrier_qualification_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carrier_qual_config_select" ON carrier_qualification_config FOR SELECT USING (true);
CREATE POLICY "carrier_qual_config_insert" ON carrier_qualification_config FOR INSERT WITH CHECK (true);
CREATE POLICY "carrier_qual_config_update" ON carrier_qualification_config FOR UPDATE USING (true);
CREATE POLICY "carrier_qual_config_delete" ON carrier_qualification_config FOR DELETE USING (true);

COMMENT ON TABLE carrier_qualification_config IS 'Segmentos de classificação de transportadoras (Excelente a Crítico) com faixas de score e ações recomendadas';
