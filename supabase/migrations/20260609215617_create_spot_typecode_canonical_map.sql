-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260609215617
-- nome:   create_spot_typecode_canonical_map

-- MELHORIA 2: De-para de TypeCode legado → canônico (duplo esquema SPOT)
CREATE TABLE IF NOT EXISTS public.spot_typecode_map (
  legacy_code text PRIMARY KEY,
  canonical_code text NOT NULL,
  canonical_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.spot_typecode_map IS 
'Normaliza o duplo esquema de TypeCode da SPOT (legado numérico → canônico 4 dígitos). Aplicado no Silver via fn_spot_silver_enrich. Bronze preserva o original (lossless).';

INSERT INTO public.spot_typecode_map (legacy_code, canonical_code, canonical_type) VALUES
  ('2',    '0031', 'Escrita'),
  ('3',    '0029', 'Tecnologia'),
  ('4',    '0030', 'Escritório'),
  ('5',    '0032', 'Mochilas, Pastas & Sacolas'),
  ('6',    '0037', 'Pessoal & Viagem'),
  ('7',    '0038', 'Chaveiros & Porta-cartões'),
  ('8',    '0036', 'Casa, Restaurante & Bar'),
  ('9',    '0033', 'Sacolas & Bolsas Térmicas'),
  ('10',   '0035', 'Squeezes & Copos'),
  ('11',   '0040', 'Sol & Chuva'),
  ('12',   '0039', 'Criança & Escolar'),
  ('0034', '0028', 'Esporte & Ar Livre')
ON CONFLICT (legacy_code) DO UPDATE 
SET canonical_code = EXCLUDED.canonical_code,
    canonical_type = EXCLUDED.canonical_type;
