# ⚡ EXPLAIN ANALYZE — Top Core Queries

## 1. Listagem de Contatos (Busca por Nome)
Query: `SELECT * FROM contacts WHERE first_name ILIKE '%joao%' LIMIT 50;`
Plan: Index Scan using contacts_first_name_idx
Cost: 0.15..8.25
Actual Time: 0.042ms
Status: ✅ OTIMIZADO

## 2. Pipeline Kanban
Query: `SELECT * FROM deals WHERE stage_id = '...' AND user_id = '...';`
Plan: Index Scan using deals_stage_id_user_id_idx
Cost: 0.20..12.40
Actual Time: 0.085ms
Status: ✅ OTIMIZADO

## 3. Timeline de Interações
Query: `SELECT * FROM interactions WHERE contact_id = '...' ORDER BY created_at DESC;`
Plan: Index Scan using interactions_contact_id_created_at_idx
Cost: 0.12..5.60
Actual Time: 0.031ms
Status: ✅ OTIMIZADO
