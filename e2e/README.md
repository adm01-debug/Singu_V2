# Testes E2E (Playwright)

O gate combina a suíte canônica em `e2e/` nos três navegadores com os specs de
regressão em `tests/` no Chromium.

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
| `E2E_ALLOW_WRITES` | — | `1` libera jornadas que gravam dados (criar contato, mover deal, concluir tarefa, aprovar sugestões). Use somente em ambiente descartável; o CI aponta para o Supabase de produção e não define esta variável. |

## Execução

```bash
# Local
E2E_USER_EMAIL=qa@singu.local E2E_USER_PASS=*** \
  npm run test:e2e

# CI
npx playwright test
```

`npm run test:e2e` sempre executa um build de produção antes de iniciar o
`vite preview`. O CI já possui um step de build e chama o Playwright diretamente.

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
  npm run test:e2e -- e2e/interacoes-prefs-back-button.spec.ts
```

Localmente, os testes autenticados são ignorados quando as credenciais não estão
configuradas. O CI valida a presença dos secrets antes de executar a suíte.
