# 🛠️ Technical Debt Backlog — SINGU CRM

Este documento consolida os débitos técnicos identificados durante as auditorias e rodadas de desenvolvimento.

## 1. Arquitetura & Domínio
- [ ] **DDD Core Extraction**: Mover lógica de `src/lib/` para `src/domain/` (Parcialmente iniciado na Rodada P).
- [ ] **Circular Dependencies**: Corrigir dependências circulares remanescentes identificadas pelo `dependency-cruiser`.
- [ ] **Query N+1**: Auditar `external-data` proxy para evitar queries N+1 latentes em listas grandes.

## 2. Banco de Dados & Performance
- [ ] **Atomic Transitions**: Migrar mutações críticas de deals/leads para RPCs (Iniciado com `move_deal`).
- [ ] **Image Optimization**: Implementar pipeline de AVIF/WebP automático para logos e avatares.
- [ ] **Index Audit**: Analisar planos de execução das top 20 queries usando `pg_stat_statements`.

## 3. Segurança
- [ ] **Pen-Test Externo**: Realizar e documentar resultados de teste de intrusão profissional.
- [ ] **MFA Enforcement**: Expandir obrigatoriedade de MFA para todas as roles com acesso a dados sensíveis (PII).

## 4. Manutenibilidade
- [ ] **Conventional Commits**: Enforçar via `commitlint` (Implementado Rodada P).
- [ ] **Cognitive Complexity**: Manter limite de 15 por função via ESLint SonarJS.