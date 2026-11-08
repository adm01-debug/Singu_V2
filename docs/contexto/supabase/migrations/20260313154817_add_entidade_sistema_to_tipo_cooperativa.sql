ALTER TABLE companies DROP CONSTRAINT companies_tipo_cooperativa_check;
ALTER TABLE companies ADD CONSTRAINT companies_tipo_cooperativa_check 
  CHECK (tipo_cooperativa = ANY (ARRAY['CENTRAL','SINGULAR','PAC','CONFEDERACAO','ENTIDADE_SISTEMA']));
