# SINGU CRM — Guia de Onboarding para Desenvolvedores

> Objetivo: Dev produtivo em < 4 horas.

---

## ⏱️ Roteiro (3h30)

| Tempo | Atividade |
|-------|-----------|
| 0:00 - 0:30 | Setup do ambiente e primeiro `npm run dev` |
| 0:30 - 1:00 | Leitura do README.md e ADRs (docs/adr/) |
| 1:00 - 1:30 | Explorar o sistema na preview (todas as páginas) |
| 1:30 - 2:00 | Ler a estrutura de pastas e entender os módulos |
| 2:00 - 2:30 | Estudar 3 arquivos-chave (abaixo) |
| 2:30 - 3:00 | Rodar testes e entender a suíte |
| 3:00 - 3:30 | Fazer uma pequena mudança (sugestão abaixo) |

---

## 🚀 Setup (10 min)

```bash
git clone <repo-url>
cd singu-crm
npm install
npm run dev
# Acesse http://localhost:5173
```

- O `.env` é gerenciado automaticamente (não precisa configurar)
- O banco de dados está na nuvem (Lovable Cloud)

---

## 📚 Leitura Essencial (por ordem)

1. **README.md** — Visão geral, stack, módulos
2. **docs/adr/** — 10 decisões arquiteturais (15 min de leitura)
3. **docs/RUNBOOK.md** — Como operar o sistema
4. **docs/EDGE_FUNCTIONS_API.md** — API reference
5. **CHANGELOG.md** — Histórico de releases

---

## 🗂️ 3 Arquivos para Entender o Sistema

### 1. `src/lib/externalData.ts`
O coração da comunicação com o banco externo. Entenda:
- Como o proxy funciona (Edge Function `external-data`)
- Circuit Breaker para resiliência
- Cache de token de autenticação

### 2. `src/hooks/voice/useTranscriptProcessor.ts`
Exemplo de hook complexo com:
- State machine implícita (idle → processing → speaking → idle)
- Error handling com retry
- Separação de concerns (refs, callbacks, cleanup)

### 3. `supabase/functions/_shared/auth.ts`
Padrão de segurança para todas as Edge Functions:
- Scoped CORS (não wildcard)
- JWT validation
- Rate limiting helpers

---

## 🏗️ Arquitetura em 5 Minutos

```
Usuário → React App → TanStack Query → Edge Function → DB Externo
                    → Supabase Client → DB Local (Lovable Cloud)
```

**Regra de ouro:** Dados de CRM (contatos, empresas, deals) vêm do **banco externo** via `queryExternalData()`. Dados do app (perfil, preferências, análises) ficam no **banco local**.

### Padrões obrigatórios:
- **Logger** — Nunca `console.log`, sempre `logger.info/warn/error`
- **Tokens** — Design system com semantic tokens, nunca cores hardcoded
- **Auth** — Toda Edge Function usa `withAuth()` ou `requireCronSecret()`
- **Validação** — Zod nas Edge Functions, schema no frontend
- **Erros** — Try-catch com feedback visual (toast/card de erro)

---

## 🧪 Testes

```bash
npm test              # Roda 4.470+ testes
npm run test:watch    # Watch mode para desenvolvimento
npx tsc --noEmit      # Type checking (deve dar 0 erros)
```

### Onde estão os testes:
- `src/data/__tests__/` — Integridade de dados estáticos
- `src/__tests__/` — E2E, integração, security, stress
- `src/test/` — Helpers e setup

### Convenções:
- Nomes: `*.test.ts` ou `*.test.tsx`
- Framework: Vitest + Testing Library
- Cada módulo novo deve ter testes unitários

---

## 🔧 Primeira Contribuição (sugestão)

1. Abra `src/pages/Dashboard.tsx`
2. Localize o `DashboardStatsGrid`
3. Adicione um tooltip explicativo em um dos cards de KPI
4. Rode os testes para garantir que nada quebrou
5. Verifique o TypeScript: `npx tsc --noEmit`

---

## ❓ FAQ

**P: Onde vejo logs de Edge Functions?**
R: Lovable Cloud → Edge Function Logs (ver RUNBOOK.md)

**P: Como adiciono uma nova tabela?**
R: Use a ferramenta de migração do Lovable (nunca SQL manual)

**P: Como chamo uma RPC do banco externo?**
R: `callExternalRpc('nome_da_funcao', { params })` — ver `src/lib/externalData.ts`

**P: Como adiciono uma nova Edge Function?**
R: Crie `supabase/functions/<nome>/index.ts` com padrão `Deno.serve()` + `withAuth()` + `scopedCorsHeaders()`

**P: Como testo algo no banco?**
R: Use `queryExternalData()` no dev tools ou crie um teste

---

## 📞 Suporte

- **Runbook:** `docs/RUNBOOK.md` para procedimentos operacionais
- **ADRs:** `docs/adr/` para entender decisões de arquitetura
- **API:** `docs/EDGE_FUNCTIONS_API.md` para referência de endpoints
