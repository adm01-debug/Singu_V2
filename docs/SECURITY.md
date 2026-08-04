# SINGU CRM — Política de Segurança

## 🔒 Visão Geral

O SINGU CRM aplica uma abordagem de segurança em múltiplas camadas, cobrindo frontend, backend (Edge Functions), banco de dados e infraestrutura.

---

## 🛡️ Camadas de Proteção

### 1. Autenticação & Autorização
- **JWT obrigatório** em todas as Edge Functions via `withAuth()`
- **RBAC** com tabela `user_roles` e função `has_role()` (SECURITY DEFINER)
- **Service Role** aceito apenas em endpoints S2S via `withAuthOrServiceRole()`
- **Cron Jobs** protegidos por `requireCronSecret()`
- **Webhooks** validados por `requireWebhookSecret()`

### 2. Row Level Security (RLS)
- **212 políticas RLS** ativas cobrindo 100% das tabelas públicas
- Todas escopadas por `auth.uid() = user_id`
- Função `has_role()` utilizada para políticas administrativas

### 3. CORS
- **Scoped CORS** — não usa wildcard `*`
- Origens restritas a `.lovable.app` e `.lovableproject.com`
- Header `Vary: Origin` para compatibilidade com CDN

### 4. Cabeçalhos HTTP (index.html)
- `Content-Security-Policy` (script-src, style-src, img-src)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (restringe câmera, microfone, geolocalização, pagamentos)

### 5. Proteção contra Ataques
- **Rate Limiting** — sliding window em Edge Functions críticas
- **Sanitização XSS** — DOMPurify em todos os inputs renderizados
- **Validação Zod** — schemas rigorosos em payloads de Edge Functions
- **Circuit Breaker** — proteção contra cascata de falhas externas

### 6. Dados Sensíveis
- Secrets gerenciados exclusivamente via Supabase Secrets
- `localStorage` usado apenas para preferências de UI (tema, sidebar)
- Nenhuma chave privada no código-fonte
- Tokens de sessão em memória com refresh automático

---

## 🔍 Auditoria

| Controle | Status |
|----------|--------|
| RLS em todas as tabelas | ✅ |
| JWT em todas as Edge Functions | ✅ |
| 0 CVEs em dependências | ✅ |
| Sanitização XSS | ✅ |
| Rate limiting | ✅ |
| Audit log (trigger) | ✅ |
| CORS scoped | ✅ |
| Security headers | ✅ |

---

## 📋 Responsible Disclosure

Se você encontrar uma vulnerabilidade de segurança, por favor:

1. **NÃO** abra uma issue pública
2. Envie um e-mail para a equipe de desenvolvimento com:
   - Descrição detalhada da vulnerabilidade
   - Passos para reprodução
   - Impacto potencial
3. Aguarde confirmação antes de divulgar publicamente

---

## 🔄 Processo de Review

- Todo código passa por TypeScript strict check (`noEmit`)
- Testes de segurança automatizados (`security-hardening.test.ts`)
- Scan de dependências via `npm audit`
- Revisão de RLS policies em cada migração
