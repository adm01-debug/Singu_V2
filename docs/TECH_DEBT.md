 # 🚩 TECH DEBT BACKLOG — SINGU CRM
 
 Este documento centraliza o débito técnico identificado durante as rodadas de auditoria e desenvolvimento.
 
 ## 🏗️ Arquitetura
 - [ ] **Consolidação de Provedores**: `lint-providers.cjs` detecta excesso de nesting; planejar `Composition Root`.
 - [ ] **Edge Functions Isolation**: Migrar lógica de `generate-insights` para um worker dedicado se o tempo de execução exceder 5s.
 
 ## 🛡️ Segurança
 - [ ] **Hardening de MFA**: Tornar MFA obrigatório para todos os usuários (atualmente apenas admins).
 - [ ] **Security Invoker Views**: Migrar views legadas de `SECURITY DEFINER` para `SECURITY INVOKER` onde possível.
 
 ## 💾 Banco de Dados
 - [ ] **Audit Trail Storage**: Implementar particionamento na tabela `audit_log` por mês.
 - [ ] **Queries N+1**: Auditar `useContactTimeline` para garantir que sub-entidades sejam buscadas em batch.
 
 ## ⚡ Performance
 - [ ] **Image Optimization**: Adotar `<picture>` com AVIF em toda a galeria de assets.
 - [ ] **React Server Components**: Avaliar migração parcial se o bundle size ultrapassar 400KB.
 
 ## 🛠️ Infraestrutura
 - [ ] **Lighthouse CI**: Integrar ao workflow de PR para evitar regressões de UX.
 - [ ] **Cross-Region Replication**: Validar latência de réplicas em US-East para redundância.