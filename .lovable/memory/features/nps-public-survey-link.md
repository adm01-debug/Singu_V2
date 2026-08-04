---
name: NPS Public Survey Link
description: Pesquisas NPS/CSAT podem ser respondidas por link público sem login (/survey/:token), com expiração de 30 dias e RLS por token.
type: feature
---
- Coluna `public_token` (UUID, unique, default gen_random_uuid) em `csat_surveys`
- RLS pública: SELECT/UPDATE permitidos a anon/authenticated quando token válido e não expirado
- UPDATE só permitido se status='sent' (impede duplicar resposta) e novo status ∈ {answered, sent}
- Página `/survey/:token` (rota pública, fora do RequireAuth) — busca pesquisa, escala 0-10 com cores semânticas, textarea opcional
- Estados: loading / not-found / expired / already-answered / form / success
- `SendSurveyDialog` em duas etapas: (1) selecionar contato e canal → (2) exibir link copiável com botões Copy + ExternalLink
- Hook `useNpsSurveys` retorna `public_token` no createSurvey result
