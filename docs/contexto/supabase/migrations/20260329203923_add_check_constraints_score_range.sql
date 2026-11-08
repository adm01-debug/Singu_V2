-- Proteção de range no nível do banco (além da function)
ALTER TABLE supplier_scores ADD CONSTRAINT chk_score_geral_range CHECK (score_geral BETWEEN 0 AND 100);
ALTER TABLE supplier_scores ADD CONSTRAINT chk_score_preco_range CHECK (score_preco BETWEEN 0 AND 100);
ALTER TABLE supplier_scores ADD CONSTRAINT chk_score_prazo_range CHECK (score_prazo BETWEEN 0 AND 100);
ALTER TABLE supplier_scores ADD CONSTRAINT chk_score_qualidade_range CHECK (score_qualidade BETWEEN 0 AND 100);
ALTER TABLE supplier_scores ADD CONSTRAINT chk_score_entrega_range CHECK (score_entrega BETWEEN 0 AND 100);
ALTER TABLE suppliers ADD CONSTRAINT chk_suppliers_score_range CHECK (score_geral IS NULL OR score_geral BETWEEN 0 AND 100);
