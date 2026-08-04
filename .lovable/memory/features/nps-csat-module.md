---
name: NPS / CSAT Module
description: Módulo completo de pesquisas de satisfação NPS/CSAT — envio, registro de respostas, dashboard com promotores/neutros/detratores, taxa de resposta e distribuição
type: feature
---
Módulo `/nps` para gestão de pesquisas NPS/CSAT usando tabela `csat_surveys`.

**Componentes:**
- `useNpsSurveys` (hook): TanStack Query, calcula métricas (npsScore, promoters, passives, detractors, responseRate, avgScore)
- `SendSurveyDialog`: enviar pesquisa para contato com canal (email/whatsapp/sms/in_app), expira em 30 dias
- `AnswerSurveyDialog`: registrar resposta 0-10 com cores (vermelho/amarelo/verde) + comentário opcional
- `NPS.tsx` (página): 5 KPIs (NPS Score, Promotores, Neutros, Detratores, Taxa Resposta), tabs (todas/pendentes/respondidas/promotores/detratores), barra de distribuição

**Cálculo NPS:** `((promoters - detractors) / answered) * 100`. Categorias: 9-10 promotor, 7-8 neutro, 0-6 detrator.

**Integração:** rota `/nps` em App.tsx, sidebar em "Análise" com ícone Star.
