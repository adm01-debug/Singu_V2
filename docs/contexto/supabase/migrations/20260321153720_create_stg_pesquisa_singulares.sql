CREATE TABLE stg_pesquisa_singulares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  nome_crm TEXT NOT NULL,
  cnpj_no_banco TEXT,
  cnpj_correto TEXT,
  cnpj_tipo TEXT CHECK (cnpj_tipo IN ('MATRIZ','FILIAL','TERCEIRO','NULL')),
  razao_social_rfb TEXT,
  nome_fantasia_rfb TEXT,
  situacao_cadastral_rfb TEXT,
  data_abertura_rfb DATE,
  sede_cidade TEXT,
  sede_uf TEXT,
  central_vinculada TEXT,
  central_id UUID,
  
  -- Status e classificação
  status_pesquisa TEXT NOT NULL CHECK (status_pesquisa IN (
    'SINGULAR_LEGÍTIMA','PAC_DISFARÇADO','CLONE_MERGEADO','INCORPORADA',
    'INVESTIGAR','CNPJ_TERCEIRO','RECLASSIFICADO'
  )),
  veredito TEXT NOT NULL,
  acao_executada TEXT,
  data_acao DATE,
  
  -- Evidências web
  fonte_site_cresol BOOLEAN DEFAULT false,
  fonte_bureau_coop BOOLEAN DEFAULT false,
  fonte_receita_federal BOOLEAN DEFAULT false,
  fonte_banco_central BOOLEAN DEFAULT false,
  fonte_noticias BOOLEAN DEFAULT false,
  
  evidencia_assembleias_2025 BOOLEAN DEFAULT false,
  evidencia_demonstracoes_financeiras BOOLEAN DEFAULT false,
  evidencia_premiacao_baser BOOLEAN DEFAULT false,
  evidencia_inauguracoes BOOLEAN DEFAULT false,
  
  urls_fontes TEXT[],
  
  -- Dados operacionais raspados
  qtd_agencias INTEGER,
  qtd_cooperados INTEGER,
  ativos_totais_reais NUMERIC,
  estados_atuacao TEXT[],
  
  -- Histórico de incorporações/fusões
  incorporada_por TEXT,
  incorporada_em DATE,
  nome_anterior TEXT,
  
  -- Relação com outros registros no banco
  registro_clone_id UUID,
  registro_real_id UUID,
  dados_migrados JSONB,
  
  -- Notas livres
  observacoes TEXT,
  
  -- Metadata
  pesquisado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pesquisado_por TEXT DEFAULT 'higienizacao_claude',
  sessao_chat TEXT DEFAULT '2026-03-21'
);

COMMENT ON TABLE stg_pesquisa_singulares IS 'Staging table com todas as informações raspadas da internet durante higienização de Singulares Cresol em 2026-03-21. Fontes: site cresol.com.br, Bureau Coop, Receita Federal, Banco Central, notícias.';
