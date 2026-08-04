---
name: Intent Data Module
description: Captura first-party de sinais de intenção com pixel JS, agregação em scores 0-100 por contato/conta com tendência, hub UI /intent e setup /intent/setup
type: feature
---

## Tabelas
- `intent_signals` — eventos brutos (page_view, email_open, email_click, form_submit, content_download, pricing_view, demo_request, social_engagement, search_query, competitor_mention) com peso 1-10, contact_id, external_company_id, signal_value JSONB, occurred_at. Audit trigger ativo.
- `intent_scores` — score agregado 0-100 por (user_id, scope, scope_id), trend (rising/stable/falling), signal_count_30d, top_signals JSONB. Unique(user_id, scope, scope_id).
- `intent_tracking_pixels` — pixels por domínio com pixel_key único, active bool, signal_count, last_signal_at.

RLS por user_id em todas. Pesos default por tipo no edge tracker.

## Edge Functions
- `intent-tracker` (público, verify_jwt=false): valida pixel_key, resolve contact_id por email, insere signal com peso. CORS aberto.
- `intent-aggregator` (auth ou service-role): agrega últimos 30d, calcula score = min(100, totalWeight/80*100), trend comparando janela 0-15 vs 15-30 dias, top 5 sinais. Upsert em intent_scores.
- `intent-pixel-snippet` (público GET): retorna JS minificado parametrizado com pixel_key. Captura page_view, form submits e pricing_view automaticamente. Expõe `window.SinguIntent.{track,identify,pageView}`.

## Hooks (`src/hooks/useIntent.ts`)
useIntentSignals, useIntentScore(scope,id), useTopIntentScores(scope,limit), useIntentPixels, useCreatePixel, useTogglePixel, useDeletePixel, useRefreshIntent, useCreateManualSignal. SIGNAL_TYPE_LABELS exportado.

## UI
- `/intent`: KPIs (sinais 24h/7d, contas hot ≥70, score médio), tabs Contas/Contatos hot + timeline com filtros tipo/período.
- `/intent/setup`: PixelSetupCard cria pixel, mostra snippet `<script async src=".../intent-pixel-snippet?k=PX_KEY">` para copiar.
- Componentes: IntentScoreBadge (cores por faixa + trend icon), HotAccountsTable, IntentSignalsTimeline, IntentSignalCard (widget para ContatoDetalhe/EmpresaDetalhe), PixelSetupCard.

## Navegação
Sidebar Operacional: "Intent Data" (Radar icon) abaixo de ABM. Rotas `/intent` e `/intent/setup` em App.tsx.

## Snippet de uso
```html
<script async src="https://PROJECT_REF.supabase.co/functions/v1/intent-pixel-snippet?k=px_..."></script>
<script>SinguIntent.identify("contato@empresa.com", "external_company_id");</script>
```
