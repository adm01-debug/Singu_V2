-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321192939
-- nome:   document_function_categories

-- ============================================================
-- A3: Documentar funções por categoria
-- ============================================================

-- TRIGGERS DE NORMALIZAÇÃO (core do pipeline de dados)
COMMENT ON FUNCTION trg_normalizar_telefone IS '[TRIGGER][CORE] Normaliza company_phones: extrai dígitos, remove DDI 55, valida 8-13 dígitos, classifica celular/fixo, seta is_whatsapp. BEFORE INSERT/UPDATE.';
COMMENT ON FUNCTION trg_normalizar_telefone_contact IS '[TRIGGER][CORE] Normaliza contact_phones: mesma lógica de trg_normalizar_telefone para tabela de contatos. BEFORE INSERT/UPDATE.';
COMMENT ON FUNCTION trg_normalizar_email IS '[TRIGGER][CORE] Normaliza emails: LOWER(TRIM()), classifica tipo (pessoal/corporativo/nfe/financeiro/comercial/compras/marketing). BEFORE INSERT/UPDATE.';

-- TRIGGERS DE SEARCH
COMMENT ON FUNCTION update_company_search_vector IS '[TRIGGER][SEARCH] Atualiza search_vector de companies para full-text search. BEFORE INSERT/UPDATE.';
COMMENT ON FUNCTION update_contact_search_vector IS '[TRIGGER][SEARCH] Atualiza search_vector de contacts para full-text search. BEFORE INSERT/UPDATE.';

-- TRIGGERS DE NOME
COMMENT ON FUNCTION auto_preencher_nomes_contato IS '[TRIGGER][NOME] Auto-preenche first_name, last_name, nome_tratamento, assinatura a partir de full_name. BEFORE INSERT.';
COMMENT ON FUNCTION auto_atualizar_nomes_contato IS '[TRIGGER][NOME] Recalcula nomes derivados quando full_name muda. BEFORE UPDATE.';

-- UPSERTS SAFE (criadas nesta sessão)
COMMENT ON FUNCTION upsert_company_phone IS '[UPSERT][SAFE] Insere ou atualiza phone por (company_id, numero_normalizado). Trigger faz normalização. Use em vez de INSERT direto.';
COMMENT ON FUNCTION upsert_company_email IS '[UPSERT][SAFE] Insere ou atualiza email por (company_id, LOWER(email)). Trigger faz normalização. Use em vez de INSERT direto.';
COMMENT ON FUNCTION upsert_contact_phone IS '[UPSERT][SAFE] Insere ou atualiza phone por (contact_id, numero_normalizado). Trigger faz normalização. Use em vez de INSERT direto.';
COMMENT ON FUNCTION upsert_contact_email IS '[UPSERT][SAFE] Insere ou atualiza email por (contact_id, LOWER(email)). Trigger faz normalização. Use em vez de INSERT direto.';

-- BUSINESS LOGIC
COMMENT ON FUNCTION ativar_cliente IS '[BUSINESS] Ativa customer: seta cliente_ativado=true, registra quem/quando.';
COMMENT ON FUNCTION inativar_cliente IS '[BUSINESS] Inativa customer: seta cliente_ativado=false, registra motivo/quem/quando.';
COMMENT ON FUNCTION transferir_cliente IS '[BUSINESS] Transfere customer entre vendedores: atualiza vendedor_id, registra histórico.';
COMMENT ON FUNCTION registrar_compra IS '[BUSINESS] Registra compra: atualiza última_compra, total_compras, valor_total.';
COMMENT ON FUNCTION sdr_qualificar_cliente IS '[BUSINESS] SDR qualifica customer: atribui closer, muda status pipeline.';

-- QUERY HELPERS
COMMENT ON FUNCTION get_health_check IS '[QUERY] Health check do banco: retorna score de completude + estatísticas gerais.';
COMMENT ON FUNCTION search_companies IS '[QUERY] Full-text search em companies usando search_vector (GIN index).';
COMMENT ON FUNCTION search_contacts IS '[QUERY] Full-text search em contacts usando search_vector (GIN index).';
COMMENT ON FUNCTION get_dashboard_data IS '[QUERY] Dados agregados para dashboard principal.';
