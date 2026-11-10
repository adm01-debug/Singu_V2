# ⚡ EXPLAIN — consultas centrais

> Gerado automaticamente por `scripts/run_explain_analyze.py` em 2026-11-10 com EXPLAIN real no banco. Não edite à mão.
>
> Modo: `EXPLAIN (FORMAT JSON)` — plano e custo estimados pelo banco; as consultas NÃO foram executadas (rode com `--analyze` para medir tempo real).
>
> Servidor: PostgreSQL 17. Origem: consultas centrais embutidas.

> Observação: as tabelas estavam quase vazias na coleta (estimativa de 1 linha), então o custo e a escolha de `Seq Scan` em `deals` refletem o volume de hoje; reavalie com `--analyze` conforme os dados crescerem.

## 1. Listagem de contatos (busca por nome)

```sql
SELECT * FROM public.contacts WHERE first_name ILIKE '%teste%' LIMIT 50
```

| Medida | Valor |
| :--- | :--- |
| Nó raiz do plano | `Limit` |
| Custo estimado (inicial..total) | 12.59..13.70 |
| Linhas estimadas | 1 |

Acessos a dados: `Bitmap Heap Scan on contacts`, `Bitmap Index Scan using idx_contacts_first_name_trgm`.

```text
Limit  (cost=12.59..13.70 rows=1 width=1805)
  ->  Bitmap Heap Scan on contacts  (cost=12.59..13.70 rows=1 width=1805)
        Recheck Cond: (first_name ~~* '%teste%'::text)
        ->  Bitmap Index Scan using idx_contacts_first_name_trgm  (cost=0.00..12.59 rows=1 width=0)
              Index Cond: (first_name ~~* '%teste%'::text)
```

## 2. Pipeline Kanban (negócios de um usuário por estágio)

```sql
SELECT * FROM public.deals WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid ORDER BY pipeline_stage, updated_at DESC LIMIT 200
```

| Medida | Valor |
| :--- | :--- |
| Nó raiz do plano | `Limit` |
| Custo estimado (inicial..total) | 1.05..1.05 |
| Linhas estimadas | 1 |

Acessos a dados: `Seq Scan on deals`.

⚠️ Varredura sequencial (tabela lida inteira) em: `deals`.

```text
Limit  (cost=1.05..1.05 rows=1 width=322)
  ->  Sort  (cost=1.05..1.05 rows=1 width=322)
        Sort Key: pipeline_stage, updated_at DESC
        ->  Seq Scan on deals  (cost=0.00..1.04 rows=1 width=322)
              Filter: (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
```

## 3. Timeline de interações de um contato

```sql
SELECT * FROM public.interactions WHERE contact_id = '00000000-0000-0000-0000-000000000000'::uuid ORDER BY created_at DESC LIMIT 50
```

| Medida | Valor |
| :--- | :--- |
| Nó raiz do plano | `Limit` |
| Custo estimado (inicial..total) | 0.29..2.50 |
| Linhas estimadas | 1 |

Acessos a dados: `Index Scan using idx_interactions_contact_created on interactions`.

```text
Limit  (cost=0.29..2.50 rows=1 width=667)
  ->  Index Scan using idx_interactions_contact_created on interactions  (cost=0.29..2.50 rows=1 width=667)
        Index Cond: (contact_id = '00000000-0000-0000-0000-000000000000'::uuid)
```
