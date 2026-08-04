# ADR-008: Logger Estruturado com Supressão em Produção

**Status:** Aceita  
**Data:** 2026-04-12  
**Decisores:** Equipe de Engenharia

## Contexto

`console.log` em produção expõe dados sensíveis e polui a saída. Precisávamos de um logger que suprima output em produção mas forneça logs ricos em dev.

## Decisão

Criar `src/lib/logger.ts` — um logger centralizado que:
1. Suprime **todo** output quando `import.meta.env.DEV === false`
2. Emite logs estruturados com timestamp, level e correlation ID (`requestId`)
3. Suporta `logger.structured()` para JSON machine-readable

Regra: **zero `console.log` direto** em componentes/hooks. ESLint + testes de arquitetura validam compliance.

## Consequências

- **Positivo:** Zero vazamento de dados em produção
- **Positivo:** Correlação de logs via `requestId` facilita debugging
- **Positivo:** Validação automatizada previne regressão
- **Negativo:** Devs precisam importar `logger` ao invés de `console`
