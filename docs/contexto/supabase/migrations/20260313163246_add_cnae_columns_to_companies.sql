ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnae_principal VARCHAR(10);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnae_principal_desc VARCHAR(200);
COMMENT ON COLUMN companies.cnae_principal IS 'CNAE fiscal principal (código numérico, ex: 6424702)';
COMMENT ON COLUMN companies.cnae_principal_desc IS 'Descrição do CNAE fiscal principal';
