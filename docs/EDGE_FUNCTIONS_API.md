# SINGU CRM — Edge Functions API Reference

> Documentação completa dos 30 endpoints de Edge Functions do sistema.

---

## 🔐 Autenticação

Todas as funções (exceto `health`) exigem autenticação via headers:

```
Authorization: Bearer <JWT>
apikey: <SUPABASE_ANON_KEY>
Content-Type: application/json
```

Método padrão: **POST** (todas as funções rejeitam outros métodos).

---

## 📂 Categorias

| Grupo | Autenticação | Funções |
|-------|-------------|---------|
| **Frontend (JWT)** | `withAuth` | ai-writing-assistant, disc-analyzer, elevenlabs-tts, elevenlabs-scribe-token, enrich-contacts, enrichlayer-linkedin, evolution-api, external-data, firecrawl-scrape, generate-insights, generate-offer-suggestions, lux-trigger, rfm-analyzer, social-behavior-analyzer, social-events-detector, social-profile-scraper, suggest-next-action, voice-agent, voice-to-text |
| **Cron** | `x-cron-secret` | check-health-alerts, check-notifications, client-notifications, smart-reminders, template-success-notifications, weekly-digest |
| **Webhook** | Secret específico | bitrix24-webhook, evolution-webhook, lux-webhook |
| **Health** | Público (anon key) | health |
| **Push** | `withAuthOrServiceRole` | send-push-notification |

---

## 📡 Endpoints

### `health`
Verifica saúde do sistema (DB local + externo).

```json
// Request: POST (body vazio ou {})
// Response:
{
  "status": "healthy",
  "checks": {
    "runtime": { "status": "healthy" },
    "database": { "status": "healthy", "latencyMs": 129 },
    "external_database": { "status": "healthy", "latencyMs": 599 }
  }
}
```

---

### `external-data`
Proxy autenticado para o banco de dados externo. Suporta 5 ações.

**Action: `select`**
```json
{
  "action": "select",
  "table": "contacts",
  "select": "id,name,email",
  "filters": [{ "type": "eq", "column": "status", "value": "active" }],
  "order": { "column": "created_at", "ascending": false },
  "range": { "from": 0, "to": 49 },
  "countMethod": "planned"
}
```

**Action: `insert`**
```json
{ "action": "insert", "table": "contacts", "record": { "name": "João" } }
```

**Action: `update`**
```json
{ "action": "update", "table": "contacts", "id": "uuid", "updates": { "name": "Maria" } }
```

**Action: `delete`**
```json
{ "action": "delete", "table": "contacts", "id": "uuid" }
```

**Action: `rpc`**
```json
{ "action": "rpc", "functionName": "get_contact_intelligence", "params": { "p_contact_id": "uuid" } }
```

---

### `disc-analyzer`
Analisa perfil DISC via texto usando AI.

```json
// Request:
{ "text": "Texto da interação para analisar", "contactId": "uuid" }

// Response:
{
  "profile": {
    "primary": "D",
    "secondary": "I",
    "scores": { "D": 85, "I": 60, "S": 30, "C": 45 },
    "confidence": 0.82,
    "summary": "Perfil dominante com influência..."
  }
}
```

---

### `generate-insights`
Gera insights inteligentes para um contato.

```json
// Request:
{ "contactId": "uuid" }

// Response:
{ "insights": [{ "title": "...", "description": "...", "category": "relationship", "confidence": 0.9 }] }
```

---

### `ai-writing-assistant`
Assistente de escrita adaptativo (estilo DISC + Carnegie).

```json
// Request:
{
  "prompt": "Escreva um email de follow-up",
  "contactId": "uuid",
  "style": "formal",
  "discProfile": "D"
}

// Response:
{ "text": "Texto gerado...", "suggestions": ["alternativa 1", "alternativa 2"] }
```

---

### `social-behavior-analyzer`
Análise comportamental via redes sociais.

```json
// Request:
{ "contactId": "uuid", "socialData": { "linkedin": "...", "instagram": "..." } }

// Response:
{ "analysis": { "personality_traits": [...], "communication_style": "..." } }
```

---

### `elevenlabs-tts`
Text-to-Speech via ElevenLabs.

```json
// Request:
{ "text": "Texto para falar", "voiceId": "4tRn1lSkEn13EVTuqb0g" }

// Response: audio/mpeg stream
```

---

### `elevenlabs-scribe-token`
Gera token de sessão para Scribe (STT).

```json
// Request: {}
// Response:
{ "token": "scribe-session-token" }
```

---

### `voice-agent`
Processa comandos de voz via NLU (Gemini).

```json
// Request:
{ "transcript": "Buscar contato João Silva" }

// Response:
{
  "action": "search",
  "response": "Encontrei João Silva...",
  "data": { "query": "João Silva" }
}
```

---

### `voice-to-text`
Speech-to-Text via ElevenLabs Scribe.

```json
// Request: FormData com arquivo de áudio
// Response:
{ "text": "Transcrição do áudio" }
```

---

### `rfm-analyzer`
Análise RFM (Recência, Frequência, Monetário).

```json
// Request:
{ "contactId": "uuid" }

// Response:
{ "rfm": { "recency": 5, "frequency": 3, "monetary": 4, "segment": "Champions" } }
```

---

### `suggest-next-action`
Sugere próxima ação para um contato.

```json
// Request:
{ "contactId": "uuid" }

// Response:
{ "suggestion": { "action": "follow_up", "reason": "...", "priority": "high" } }
```

---

### `generate-offer-suggestions`
Gera sugestões de ofertas personalizadas.

```json
// Request:
{ "contactId": "uuid", "context": "renovação de contrato" }

// Response:
{ "offers": [{ "title": "...", "description": "...", "confidence": 0.85 }] }
```

---

### `enrich-contacts`
Enriquece dados de contato via APIs externas.

```json
// Request:
{ "contactId": "uuid" }

// Response:
{ "enriched": { "linkedin_url": "...", "company": "...", "title": "..." } }
```

---

### `enrichlayer-linkedin`
Enriquecimento via EnrichLayer (LinkedIn).

```json
// Request:
{ "linkedinUrl": "https://linkedin.com/in/..." }

// Response:
{ "profile": { "name": "...", "headline": "...", "company": "..." } }
```

---

### `social-profile-scraper`
Scraping de perfis sociais.

```json
// Request:
{ "url": "https://instagram.com/...", "platform": "instagram" }

// Response:
{ "profile": { "bio": "...", "followers": 1500, "posts": 200 } }
```

---

### `social-events-detector`
Detecta eventos sociais relevantes.

```json
// Request:
{ "contactId": "uuid" }

// Response:
{ "events": [{ "type": "job_change", "details": "...", "date": "2026-04-01" }] }
```

---

### `firecrawl-scrape`
Web scraping via Firecrawl.

```json
// Request:
{ "url": "https://example.com" }

// Response:
{ "content": "Markdown do site...", "metadata": { "title": "..." } }
```

---

### `lux-trigger`
Dispara enriquecimento LUX Intelligence.

```json
// Request:
{ "entityId": "uuid", "entityType": "contact", "requestType": "full" }

// Response:
{ "id": "lux-request-id", "status": "processing" }
```

---

### `evolution-api`
Proxy para Evolution API (WhatsApp).

```json
// Request:
{ "action": "sendMessage", "phone": "5511999999999", "message": "Olá!" }

// Response:
{ "success": true, "messageId": "..." }
```

---

### Funções Cron

Todas exigem header `x-cron-secret`:

| Função | Descrição |
|--------|-----------|
| `check-health-alerts` | Verifica alertas de saúde de relacionamentos |
| `check-notifications` | Processa fila de notificações |
| `client-notifications` | Envia notificações programadas |
| `smart-reminders` | Gera lembretes inteligentes baseados em cadência |
| `template-success-notifications` | Notifica sucesso de templates |
| `weekly-digest` | Gera e envia resumo semanal |

---

### Webhooks

| Função | Secret Header | Descrição |
|--------|--------------|-----------|
| `evolution-webhook` | `x-evolution-secret` | Recebe mensagens WhatsApp |
| `bitrix24-webhook` | `x-bitrix-secret` | Sincroniza com Bitrix24 |
| `lux-webhook` | `x-lux-secret` | Callback de enriquecimento LUX |

---

## ⚠️ Rate Limiting

| Endpoint | Limite |
|----------|--------|
| `external-data` | 60 req/min por IP |
| `disc-analyzer` | 30 req/min |
| `generate-insights` | 20 req/min |
| Demais | 60 req/min (padrão) |

---

## 🔄 Códigos de Resposta

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 400 | Payload inválido (validação Zod) |
| 401 | Não autenticado |
| 405 | Método não permitido (só POST) |
| 429 | Rate limit atingido |
| 500 | Erro interno |
