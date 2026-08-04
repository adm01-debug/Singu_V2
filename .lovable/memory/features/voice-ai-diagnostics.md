---
name: Voice AI Diagnostics
description: Edge Function health check, painel de teste E2E e página admin para diagnóstico do Voice AI (ElevenLabs + Gemini)
type: feature
---

## Arquitetura

- **Edge Function** `voice-ai-health`: testa conectividade com ElevenLabs STT (token Scribe), ElevenLabs TTS (geração de áudio) e Gemini NLU (Lovable AI Gateway) em paralelo, retornando status e latência por serviço.
- **Hook** `useVoiceAIHealth`: React Query com staleTime 5min e refresh manual via mutation.
- **Componente** `VoiceAITestPanel.tsx`: teste E2E completo — grava 5s de áudio, transcreve via STT, processa intenção via NLU, reproduz resposta via TTS, exibe timeline de latências.
- **Página** `/admin/voice-diagnostics`: protegida por RequireAdmin, com cards de status por serviço, painel de teste interativo e referência de intenções.

## Serviços Verificados

| Serviço | Endpoint | Métrica |
|---------|----------|---------|
| ElevenLabs STT | `/v1/single-use-token/realtime_scribe` | Token gerado |
| ElevenLabs TTS | `/v1/text-to-speech/{voiceId}` | Áudio bytes > 0 |
| Gemini NLU | `ai.gateway.lovable.dev/v1/chat/completions` | Content não-vazio |

## Intenções Testadas
- `search`, `navigate`, `answer`, `create_interaction`, `create_reminder`
