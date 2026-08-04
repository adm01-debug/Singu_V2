# ADR-010: Validação com Zod em Dupla Camada

**Status:** Aceita  
**Data:** 2026-04-12  
**Decisores:** Equipe de Engenharia

## Contexto

Inputs do usuário precisam ser validados tanto no frontend (UX) quanto no backend (segurança). Schemas duplicados levam a inconsistências.

## Decisão

1. **Frontend:** `src/lib/validationSchemas.ts` com schemas Zod reutilizáveis para formulários (via `@hookform/resolvers/zod`)
2. **Backend:** Edge Functions usam Zod para validar payloads antes de processar, retornando erros estruturados com `fieldErrors`
3. **Filter Guard:** Funções como `external-data` sanitizam filtros automaticamente, ignorando objetos/arrays malformados (exceto operador `in`)
4. **UUID Guard:** Validação de UUID em inputs que referenciam entidades do banco

## Consequências

- **Positivo:** Single source of truth para regras de validação
- **Positivo:** Erros claros e acionáveis no frontend
- **Positivo:** Proteção server-side contra SQL injection via parameterized queries
- **Negativo:** Schemas podem divergir se não sincronizados manualmente
