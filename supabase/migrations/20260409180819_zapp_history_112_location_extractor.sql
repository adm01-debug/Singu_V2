-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409180819
-- nome:   zapp_history_112_location_extractor

-- Tabela de cidades brasileiras principais (top 100 + capitais)
CREATE TABLE IF NOT EXISTS zapp_history.location_dictionary (
  id SERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  region TEXT,
  is_capital BOOLEAN DEFAULT FALSE,
  patterns TEXT[],
  UNIQUE(city, state)
);

INSERT INTO zapp_history.location_dictionary (city, state, region, is_capital, patterns) VALUES
  ('São Paulo','SP','sudeste',TRUE,'{sao paulo,são paulo,sp,capital sp,grande sp}'),
  ('Rio de Janeiro','RJ','sudeste',TRUE,'{rio de janeiro,rio,rj}'),
  ('Belo Horizonte','MG','sudeste',TRUE,'{belo horizonte,bh,bhz}'),
  ('Brasília','DF','centro_oeste',TRUE,'{brasilia,brasília,df,bsb}'),
  ('Salvador','BA','nordeste',TRUE,'{salvador,ssa,bahia capital}'),
  ('Fortaleza','CE','nordeste',TRUE,'{fortaleza,for}'),
  ('Curitiba','PR','sul',TRUE,'{curitiba,cwb}'),
  ('Recife','PE','nordeste',TRUE,'{recife,rec}'),
  ('Porto Alegre','RS','sul',TRUE,'{porto alegre,poa}'),
  ('Manaus','AM','norte',TRUE,'{manaus,mao}'),
  ('Belém','PA','norte',TRUE,'{belem,belém,bel}'),
  ('Goiânia','GO','centro_oeste',TRUE,'{goiania,goiânia,gyn}'),
  ('Guarulhos','SP','sudeste',FALSE,'{guarulhos,gru}'),
  ('Campinas','SP','sudeste',FALSE,'{campinas,cps}'),
  ('São Bernardo do Campo','SP','sudeste',FALSE,'{sao bernardo,são bernardo,sbc}'),
  ('Santo André','SP','sudeste',FALSE,'{santo andre,santo andré,abc}'),
  ('Osasco','SP','sudeste',FALSE,'{osasco}'),
  ('Sorocaba','SP','sudeste',FALSE,'{sorocaba}'),
  ('Ribeirão Preto','SP','sudeste',FALSE,'{ribeirao preto,ribeirão preto,rao}'),
  ('São José dos Campos','SP','sudeste',FALSE,'{sao jose dos campos,são josé dos campos,sjc}'),
  ('Niterói','RJ','sudeste',FALSE,'{niteroi,niterói}'),
  ('Duque de Caxias','RJ','sudeste',FALSE,'{duque de caxias}'),
  ('Nova Iguaçu','RJ','sudeste',FALSE,'{nova iguacu,nova iguaçu}'),
  ('São Gonçalo','RJ','sudeste',FALSE,'{sao goncalo,são gonçalo}'),
  ('Florianópolis','SC','sul',TRUE,'{florianopolis,florianópolis,floripa,fln}'),
  ('Joinville','SC','sul',FALSE,'{joinville,joi}'),
  ('Blumenau','SC','sul',FALSE,'{blumenau,bnu}'),
  ('Maringá','PR','sul',FALSE,'{maringa,maringá,mga}'),
  ('Londrina','PR','sul',FALSE,'{londrina,ldb}'),
  ('Vitória','ES','sudeste',TRUE,'{vitoria,vitória,vix}'),
  ('Vila Velha','ES','sudeste',FALSE,'{vila velha}'),
  ('Cuiabá','MT','centro_oeste',TRUE,'{cuiaba,cuiabá,cgb}'),
  ('Campo Grande','MS','centro_oeste',TRUE,'{campo grande,cgr}'),
  ('Natal','RN','nordeste',TRUE,'{natal,nat}'),
  ('João Pessoa','PB','nordeste',TRUE,'{joao pessoa,joão pessoa,jpa}'),
  ('Aracaju','SE','nordeste',TRUE,'{aracaju,aju}'),
  ('Maceió','AL','nordeste',TRUE,'{maceio,maceió,mcz}'),
  ('Teresina','PI','nordeste',TRUE,'{teresina,thz}'),
  ('São Luís','MA','nordeste',TRUE,'{sao luis,são luís,slz}'),
  ('Palmas','TO','norte',TRUE,'{palmas,pmw}'),
  ('Porto Velho','RO','norte',TRUE,'{porto velho,pvh}'),
  ('Rio Branco','AC','norte',TRUE,'{rio branco,rbr}'),
  ('Boa Vista','RR','norte',TRUE,'{boa vista,bvb}'),
  ('Macapá','AP','norte',TRUE,'{macapa,macapá,mcp}')
ON CONFLICT (city, state) DO NOTHING;

CREATE OR REPLACE FUNCTION zapp_history.extract_location(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE AS $fn$
DECLARE
  r RECORD;
  v_text_lower TEXT;
  v_pattern TEXT;
  v_cep TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Procura cidades/UFs no dicionário
  FOR r IN SELECT city, state, region, is_capital, patterns FROM zapp_history.location_dictionary
  LOOP
    FOREACH v_pattern IN ARRAY r.patterns
    LOOP
      IF v_text_lower ~ ('\m' || lower(v_pattern) || '\M') THEN
        v_cep := (regexp_match(p_text, '\d{5}-?\d{3}'))[1];
        RETURN jsonb_build_object(
          'city', r.city,
          'state', r.state,
          'region', r.region,
          'is_capital', r.is_capital,
          'cep', v_cep
        );
      END IF;
    END LOOP;
  END LOOP;

  -- Só CEP sem cidade
  v_cep := (regexp_match(p_text, '\d{5}-?\d{3}'))[1];
  IF v_cep IS NOT NULL THEN
    RETURN jsonb_build_object('cep', v_cep);
  END IF;

  RETURN NULL;
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS location_extracted JSONB;

CREATE INDEX IF NOT EXISTS idx_messages_location_gin
  ON zapp_history.messages USING GIN (location_extracted)
  WHERE location_extracted IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.extract_location(TEXT) TO authenticated, service_role;
