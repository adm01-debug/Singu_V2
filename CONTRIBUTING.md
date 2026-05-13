# Guia de Contribuição — SINGU CRM

Obrigado por contribuir! Este documento define o processo de desenvolvimento, revisão e entrega do SINGU CRM.

---

## 🌳 Git Flow — Trunk-Based Development

Utilizamos **trunk-based development** com branch principal `main` sempre deployável.

### Branches

- `main` — branch de produção. Sempre verde (CI passa 100%).
- `feat/<slug>` — novas features (ex: `feat/abm-account-scoring`).
- `fix/<slug>` — correções de bug (ex: `fix/rls-mcp-tool-calls`).
- `chore/<slug>` — manutenção (ex: `chore/bump-deps`).
- `docs/<slug>` — apenas documentação.

### Regras

1. **Branches curtas** — máximo 3 dias de vida. PRs grandes são quebrados.
2. **PR obrigatório** — nenhum commit direto em `main`.
3. **Rebase sobre merge** — mantém histórico linear.
4. **Squash merge** — 1 PR = 1 commit em `main`.

## 🛡️ Proteção de Branch (Branch Protection Rules)

Para garantir a integridade da branch `main`, as seguintes regras são aplicadas via GitHub:

1. **Requisição de Pull Request:** É proibido fazer push direto para `main`.
2. **Aprovações Obrigatórias:** Todo PR deve ter pelo menos **1 aprovação** de um revisor.
3. **Status Checks Obrigatórios:** O workflow de CI deve passar 100% (Lint, Typecheck, Testes, Build, Lighthouse).
4. **Histórico Linear:** Apenas merges de squash ou rebase são permitidos.
5. **Branches Desatualizadas:** Devem ser rebasadas antes do merge.

---

## 📝 Convenção de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
<tipo>(<escopo>): <descrição curta>

[corpo opcional]

[rodapé opcional]
```

### Tipos aceitos

| Tipo        | Uso                                              |
|-------------|--------------------------------------------------|
| `feat`      | Nova funcionalidade                              |
| `fix`       | Correção de bug                                  |
| `perf`      | Melhoria de performance                          |
| `refactor`  | Refatoração sem mudança funcional                |
| `docs`      | Apenas documentação                              |
| `test`      | Adição ou correção de testes                     |
| `chore`     | Manutenção (deps, build, CI)                     |
| `security`  | Correção de vulnerabilidade                      |

### Exemplos

```
feat(abm): adiciona scoring de engajamento por conta
fix(rls): corrige WITH CHECK false em mcp_tool_calls
security(auth): restringe INSERT em login_attempts a service_role
```

---

## 🔍 Code Review

### SLA

- **Primeira resposta:** em até **4 horas úteis**.
- **Aprovação/ajustes:** em até **1 dia útil** para PRs <200 linhas.
- **PRs grandes (>500 linhas):** quebrar em PRs menores.

### Quem revisa

- Todo PR precisa de **pelo menos 1 aprovação** de um reviewer designado (não o autor).
- PRs que tocam `supabase/migrations/`, `src/hooks/useAuth.tsx` ou `_shared/auth.ts` exigem **revisor sênior**.

### Checklist do revisor

- [ ] Código compila (`tsc --noEmit` limpo)
- [ ] Testes passam (`vitest run`)
- [ ] ESLint sem novos warnings
- [ ] RLS preservado (se tocou tabelas)
- [ ] Sem `console.log` em código de produção
- [ ] Sem secrets hardcoded
- [ ] Documentação atualizada (README/ADR/CHANGELOG)

---

## ✅ Checklist do PR (autor)

Antes de abrir o PR, certifique-se de que:

- [ ] Rebase feito sobre `main` atualizada
- [ ] `npm run build` local passa
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx vitest run` todos os testes verdes
- [ ] Arquivo novo/modificado ≤ 400 linhas (padrão de manutenibilidade)
- [ ] Nenhum uso de `any` (use `unknown` + type guards)
- [ ] TanStack Query para fetching (sem `useEffect` para dados)
- [ ] Textos de UI em **português**
- [ ] Reusou primitivas (`EmptyState`, `useActionToast`, `ExternalDataCard`)
- [ ] RLS policies testadas se tocou banco
- [ ] ADR criada se decisão arquitetural não-óbvia
- [ ] CHANGELOG atualizado (se user-facing)

---

## 🚨 Hotfix

Para correções urgentes em produção:

1. Branch `hotfix/<slug>` a partir de `main`.
2. PR com label `hotfix` → aprovação acelerada (1h SLA).
3. Após merge: cherry-pick para branches de longa duração se existirem.
4. Post-mortem obrigatório em `docs/incidents/` se foi incidente de produção.

---

## 🧪 Padrões Técnicos

Consulte:

- `docs/ARCHITECTURE.md` — decisões arquiteturais
- `docs/SECURITY.md` — política de segurança
- `docs/adr/` — Architecture Decision Records
- `mem://standards/code-quality-and-engineering-standards` — padrões de qualidade

**Resumo obrigatório:**

1. Português em toda UI/documentação.
2. Max 400 linhas por arquivo.
3. Sem `any` — use `unknown` + Zod validation.
4. TanStack Query exclusivo para server state.
5. Sem `useEffect` para fetch (usar `useQuery`).
6. Semantic tokens (HSL) — nunca cores hardcoded em componentes.
7. RLS em 100% das tabelas com dados de usuário.

---

## 🔐 Segurança

- Nunca commite secrets — use Supabase Secrets.
- Reporte vulnerabilidades conforme `docs/SECURITY.md` (responsible disclosure).
- Não compartilhe credenciais em screenshots de PRs.

---

## 📬 Canais

- **Issues técnicas:** GitHub Issues com label apropriada.
- **Discussões de arquitetura:** abrir ADR draft em `docs/adr/`.
- **Incidentes de produção:** seguir `docs/RUNBOOK.md`.
