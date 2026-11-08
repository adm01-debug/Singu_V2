CREATE OR REPLACE FUNCTION trg_fn_sync_company_supplier()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando is_supplier muda para TRUE: criar registro em suppliers se não existe
  IF NEW.is_supplier = true AND (OLD.is_supplier IS DISTINCT FROM true) THEN
    INSERT INTO suppliers (id, company_id, created_at, updated_at)
    VALUES (gen_random_uuid(), NEW.id, NOW(), NOW())
    ON CONFLICT (company_id) DO NOTHING;
  END IF;

  -- Quando is_supplier muda para FALSE: NÃO deleta (preserva histórico)
  -- Apenas registra que não é mais fornecedor ativo

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_sync_supplier
  AFTER UPDATE OF is_supplier ON companies
  FOR EACH ROW
  WHEN (OLD.is_supplier IS DISTINCT FROM NEW.is_supplier)
  EXECUTE FUNCTION trg_fn_sync_company_supplier();

-- Também para INSERT (nova company já marcada como fornecedor)
CREATE TRIGGER trg_company_insert_sync_supplier
  AFTER INSERT ON companies
  FOR EACH ROW
  WHEN (NEW.is_supplier = true)
  EXECUTE FUNCTION trg_fn_sync_company_supplier();

COMMENT ON FUNCTION trg_fn_sync_company_supplier IS 
'Sincroniza companies ↔ suppliers automaticamente. Quando is_supplier=true, cria registro em suppliers.';
