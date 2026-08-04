# Smoke Tests E2E (Playwright)

Suite de smoke tests que valida as 3 jornadas críticas do SINGU como gate de regressão.

## Setup

```bash
npm i -D @playwright/test
npx playwright install chromium
```

## Variáveis de ambiente

| Var | Default | Descrição |
|-----|---------|-----------|
| `E2E_BASE_URL` | `http://localhost:8080` | URL do app |
| `E2E_USER_EMAIL` | — | Usuário seed com dados (pipeline + inbox) |
| `E2E_USER_PASS` | — | Senha do usuário seed |

## Execução

```bash
# Local
E2E_USER_EMAIL=qa@singu.local E2E_USER_PASS=*** \
  npx playwright test e2e/smoke.spec.ts

# CI
npx playwright test --reporter=github e2e/smoke.spec.ts
```

## Jornadas cobertas

1. **Auth + criar contato** — login → /contatos → novo → assert visível.
2. **Pipeline drag-and-drop** — /pipeline → arrasta primeiro card → assert toast.
3. **Inbox complete + undo** — /inbox → check tarefa → clica "Desfazer" → assert unchecked.

## Specs adicionais

- `interacoes-prefs-back-button.spec.ts` — garante que as preferências de
  visualização (density/perPage/view/sort) sobrevivem ao botão **Voltar** do
  navegador e à abertura via link compartilhado com os 4 params na URL.

```bash
E2E_USER_EMAIL=qa@singu.local E2E_USER_PASS=*** \
  npx playwright test e2e/interacoes-prefs-back-button.spec.ts
```

Os testes pulam silenciosamente quando as credenciais não estão configuradas (não falham CI sem seed).
