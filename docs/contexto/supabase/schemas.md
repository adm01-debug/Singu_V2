# Schemas

Schemas internos do Supabase ficam fora da introspecção geral (`_analytics, _realtime, _supavisor, auth, cron, extensions, graphql, graphql_public, net, pg_stat_statements, pgbouncer, pgmq, pgsodium, pgsodium_masks, pgtle, realtime, repack, storage, supabase_functions, supabase_migrations, vault`).

| schema | owner | USAGE para roles da API | comentário |
|---|---|---|---|
| _dormant | postgres | anon, authenticated, service_role | Tabelas vazias movidas do public em 2026-03-21. Incluído no search_path para compatibilidade com functions existentes. Reverter tabela: ALTER TABLE _dormant.xxx SET SCHEMA public; |
| ops_backup | postgres |  |  |
| public | pg_database_owner | anon, authenticated, service_role | standard public schema |
| reporting | postgres | authenticated |  |
| singu_migration | postgres |  | Schema temporário para migração do banco SINGU (rqodmqosrotmtrjnnjul / Lovable Cloud) para o banco oficial. Criado em 2026-04-16. Remover após validação. |
| zapp_history | postgres | authenticated, service_role | Histórico WhatsApp vindo da Evolution API: messages, mídia, áudio transcrito, links, sumários diários, embeddings. Alimenta SINGU com input bruto. |
