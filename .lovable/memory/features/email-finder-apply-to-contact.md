---
name: EmailFinder Apply-to-Contact Flow
description: Botões "Usar este email" no EmailFinder + diálogo de busca contextual em EmailsCard que aplicam emails encontrados em contact_emails (tabela externa) com is_primary automático.
type: feature
---

## Componentes

- `useApplyFoundEmail.ts` — mutation que insere em `contact_emails` (externo via `insertExternalData`). Marca `is_primary=true` se contato não tinha email principal. Bloqueia duplicatas. Define `is_verified` quando score≥70 e `fonte='email_finder'`.
- `EmailFinderWidget.tsx` — adiciona botão "Usar este email" no resultado best e botão "Usar" em cada candidato. Quando sem `contactId` (modo standalone em `/enrichment`), mostra Select de contatos via `useContacts`. Suporta props de prefill: `prefillFirstName`, `prefillLastName`, `prefillDomain`, `onApplied`.
- `EmailFinderDialog.tsx` — wrapper modal reutilizável que pré-preenche o widget.
- `EmailsCard.tsx` — botão "Buscar" no header (apenas quando `contactId` + nome presentes) abre o `EmailFinderDialog` com `firstName`, `lastName` e domain extraído de `contact.email` (se houver).

## Fluxo

1. Em `/contatos/:id` aba Dados → card Emails → "Buscar" → modal abre pré-preenchido → busca → "Usar este email" → registro inserido em `contact_emails` → trigger DB de validação (#2) enfileira validação automática → invalidação de queries `contact-relational-data` atualiza UI.
2. Em `/enrichment` → EmailFinder standalone → busca → seleciona contato no Select → "Usar este email" → mesmo fluxo.

## Restrições

- Sem `useEffect` para fetch (apenas para sincronizar prefill).
- 100% PT-BR.
- Reutiliza edge functions `email-finder` e hooks `useEmailFinder`/`useEmailVerifier` existentes.
