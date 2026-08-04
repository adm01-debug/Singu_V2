---
name: AI Conversational Assistant
description: Assistente IA conversacional com histórico persistente, threads múltiplas, contexto de entidade (contato/empresa) e memória de conversa.
type: feature
---
- Tabelas: `ai_chat_threads` (título, pinned, archived, context_entity_*), `ai_chat_messages` (role user/assistant/system, tokens_used) com RLS por user_id e CASCADE delete.
- Edge Function `ai-assistant`: Gemini 2.5 Flash, carrega últimas 20 mensagens, injeta contexto de contato/empresa quando vinculado, auto-titula primeira mensagem, persiste tokens.
- Hook `useAiAssistant`: threads, messages, createThread/sendMessage/deleteThread/togglePin/renameThread, otimistic UI.
- Página `/assistente` (Assistente.tsx): sidebar com threads (pin/delete), área de chat com bubbles, quick prompts, Enter para enviar, contagem de tokens visível.
- Rate limit: 30 req/min por IP. Sem auto-confirm de email.
- Complementar ao `AskCrmChat` (one-shot floating) — este é full-page com persistência.
