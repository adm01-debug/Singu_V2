# 🚩 TECH DEBT BACKLOG — SINGU CRM

Este documento centraliza o débito técnico identificado durante as rodadas de auditoria e desenvolvimento.
**Atualizado na Rodada Q (auditoria exaustiva 23-itens).**

## ✅ Resolvidos na Rodada Q
- [x] **Security Invoker Views** — Todas as 11 views públicas já estão com `security_invoker=true, security_barrier=true` (verificado em `pg_class.reloptions`).
- [x] **Lock Otimista no `useContacts`** — Hook usa `updateExternalDataWithVersion` + `ConcurrentEditError` + fallback de `version` via `updated_at`.
- [x] **Lighthouse CI** — Job `Lighthouse CI (performance budgets)` já ativo em `.github/workflows/ci.yml`.
- [x] **HIBP (Leaked Password Protection)** — Ativado via `configure_auth` (password_hibp_enabled=true).
- [x] **Feedback global de sincronização** — `GlobalSyncIndicator` montado no `AppChrome` consumindo `useIsFetching()`.
- [x] **Componentes UX reutilizáveis** — `SmartBackButton`, `ProgressStepper` disponíveis em `src/components/navigation/` e `src/components/feedback/`.

## 🏗️ Arquitetura
- [ ] **Composition Root de Providers** — extrair `AppProviders` para composição declarativa via `providers.reduce`.
- [ ] **Edge Functions Isolation** — migrar `generate-insights` para worker dedicado se execução > 5s (exige decisão de infra).
- [ ] **Logs estruturados nas 3 edge functions remanescentes** — `check-notifications`, `generate-insights`, `check-health-alerts` para `tracedLogger`.

## 🛡️ Segurança
- [ ] **MFA obrigatório para todos** (hoje só admins) — requer política de rollout + banner de enrollment.
- [ ] **Revogar PAT `ghp_f9Hr...`** — ação manual fora do sandbox (GitHub Settings).

## 💾 Banco de Dados
- [ ] **Particionamento mensal de `audit_log`** — planejar janela de manutenção (tabela em produção).
- [ ] **Auditar N+1 em `useContactTimeline`** — refatorar para `.in('id', […])` batched.

## 🧪 Qualidade
- [ ] **Erradicar ~240 `: any` restantes** — focar em `src/lib/externalData.ts` e helpers JSONB.
- [ ] **Encapsular 20 `eslint-disable` de JSONB** em helpers tipados com Zod.
- [ ] **Testes Vitest para hooks de cálculo** (RFM, DISC).

## ⚡ Performance
- [ ] **`<picture>` + AVIF** em galeria de assets (usar `vite-imagetools`).
- [ ] **Avaliar RSC parcial** se bundle passar 400 KB (hoje dentro do budget).

## 🎨 UX
- [ ] **Adotar `SmartBackButton` nas páginas de detalhe** (Contact, Company, Deal, etc.).
- [ ] **`KeyboardShortcutOverlay` global** — overlay descobrível com atalhos.
- [ ] **Padronização glassmorphism** Header/Sidebar vs Canvas.

## 🛠️ Infraestrutura
- [ ] **Cross-Region Replication** — validar latência em US-East (ação de infra).

## 🚀 Produto
- [ ] **BI Avançado** — dashboards drag-and-drop.
- [ ] **Global Search AI** — sair de Beta.