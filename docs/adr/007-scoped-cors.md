# ADR-007: CORS Scoped por Origem

**Status:** Aceita  
**Data:** 2026-04-12  
**Decisores:** Equipe de Engenharia

## Contexto

Edge Functions precisam aceitar requisições cross-origin de múltiplos domínios (produção, preview). O uso de `Access-Control-Allow-Origin: *` é inseguro em endpoints autenticados.

## Decisão

Implementar CORS dinâmico que valida o header `Origin` contra uma allowlist de domínios `*.lovable.app`. Funções utilitárias (`scopedCorsHeaders`, `handleCorsAndMethod`, `jsonOk`, `jsonError`) resolvem automaticamente o origin correto.

## Consequências

- **Positivo:** Elimina wildcard CORS em produção; header `Vary: Origin` garante cache correto em CDNs
- **Positivo:** Backward-compatible — funções existentes continuam funcionando sem mudança
- **Negativo:** Requer manutenção da allowlist ao adicionar novos domínios
