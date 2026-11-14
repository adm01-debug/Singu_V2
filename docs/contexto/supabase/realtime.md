# Realtime

## Publications

| publication | all tables | insert | update | delete | truncate |
|---|---|---|---|---|---|
| supabase_realtime | não | sim | sim | sim | sim |
| supabase_realtime_messages_publication | não | sim | sim | sim | sim |

## Tabelas publicadas (Postgres Changes)

| publication | tabela | replica identity |
|---|---|---|
| supabase_realtime | public.interactions | default |
| supabase_realtime | public.smart_notifications | default |
| supabase_realtime | zapp_history.conversation_daily_summaries | full |
| supabase_realtime | zapp_history.conversations | full |
| supabase_realtime | zapp_history.message_audio | full |
| supabase_realtime | zapp_history.message_media | full |
| supabase_realtime | zapp_history.messages | full |
| supabase_realtime_messages_publication | realtime.messages_2026_11_11 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_12 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_13 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_14 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_15 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_16 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_17 |  |

## Broadcast / Presence (policies em realtime.messages)

_nenhum_
