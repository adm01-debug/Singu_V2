# ADR-009: Rate Limiting em Múltiplas Camadas

**Status:** Aceita  
**Data:** 2026-04-12  
**Decisores:** Equipe de Engenharia

## Contexto

APIs expostas a brute force e abuso de recursos (especialmente endpoints de IA que consomem créditos). Precisávamos de rate limiting tanto no frontend quanto no backend.

## Decisão

### Frontend (Auth)
- `rateLimiter.ts` com sliding window: 5 tentativas / 15 min
- Bloqueios progressivos: 1min → 5min → 15min → 1h
- UI exibe tentativas restantes e countdown

### Backend (Edge Functions)
- `_shared/rate-limit.ts` com sliding window in-memory por IP
- Limites configuráveis por função (ex: insights: 10/min, external-data: 60/min)
- Retorna `429` com mensagem clara

## Consequências

- **Positivo:** Protege contra brute force e abuso de API
- **Positivo:** Limites por função permitem tuning fino
- **Negativo:** Rate limit in-memory no Edge Function reseta no cold start (aceitável para escala atual)
