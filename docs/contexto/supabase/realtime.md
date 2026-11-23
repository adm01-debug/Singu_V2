# Realtime

## Publications

| publication | all tables | insert | update | delete | truncate |
|---|---|---|---|---|---|
| supabase_realtime | não | sim | sim | sim | sim |
| supabase_realtime_messages_publication | não | sim | sim | sim | sim |

## Tabelas publicadas (Postgres Changes)

| publication | tabela | replica identity |
|---|---|---|
| supabase_realtime | public.alerts | default |
| supabase_realtime | public.companies | default |
| supabase_realtime | public.contacts | default |
| supabase_realtime | public.health_alerts | default |
| supabase_realtime | public.insights | default |
| supabase_realtime | public.interactions | default |
| supabase_realtime | public.smart_notifications | default |
| supabase_realtime | public.whatsapp_messages | default |
| supabase_realtime | zapp_history.conversation_daily_summaries | full |
| supabase_realtime | zapp_history.conversations | full |
| supabase_realtime | zapp_history.message_audio | full |
| supabase_realtime | zapp_history.message_media | full |
| supabase_realtime | zapp_history.messages | full |
| supabase_realtime_messages_publication | realtime.messages_2026_11_19 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_20 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_21 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_22 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_23 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_24 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_25 |  |
| supabase_realtime_messages_publication | realtime.messages_2026_11_26 |  |

## Broadcast / Presence (policies em realtime.messages)

_nenhum_
