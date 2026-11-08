ALTER TABLE contacts DROP CONSTRAINT chk_departamento;
ALTER TABLE contacts ADD CONSTRAINT chk_departamento CHECK (
  departamento IS NULL OR departamento = ANY (ARRAY[
    'Compras','Marketing','RH','Diretoria','Financeiro','Comercial','Gestão'
  ])
);
