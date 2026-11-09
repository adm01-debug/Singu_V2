-- Dados sintéticos da ORIGEM (nenhum dado real). Inclui valores hostis a CSV.
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ana@exemplo.test',  '{"must_reset_password": true, "migrated_at": "2026-01-01"}'),
  ('00000000-0000-0000-0000-000000000002', 'Bia@Exemplo.test',  '{"must_reset_password": true}'),
  ('00000000-0000-0000-0000-000000000003', 'o''brien@exemplo.test', '{"must_reset_password": true}'),
  ('00000000-0000-0000-0000-000000000004', 'livre@exemplo.test', '{}');
INSERT INTO auth.identities (user_id, provider, provider_id, email, identity_data) VALUES
  ('00000000-0000-0000-0000-000000000001', 'google', 'g-1', 'ana@exemplo.test', '{"sub": "g-1", "nome": "Ana, \"a\" primeira"}'),
  ('00000000-0000-0000-0000-000000000002', 'github', 'h-2', 'bia@exemplo.test', '{"sub": "h-2"}'),
  ('00000000-0000-0000-0000-000000000002', 'google', 'g-2', 'bia@exemplo.test', '{}');
INSERT INTO storage.buckets VALUES ('documents', 'documents', false), ('avatars', 'avatars', true);
INSERT INTO storage.objects (bucket_id, name) VALUES ('documents', 'a.pdf'), ('documents', 'b.pdf'), ('avatars', 'x.png');
SELECT cron.schedule('nightly', '0 3 * * *', $c$SELECT net.http_post('https://refantigo.supabase.co/functions/v1/x', '{}')$c$);
SELECT cron.schedule('it''s; odd', '*/5 * * * *', 'SELECT 1; -- ; comentário');

INSERT INTO public.companies (name) SELECT 'Empresa ' || g FROM generate_series(1, 5) g;
INSERT INTO public.contacts (id, company_id, name, notes, meta) VALUES
  ('10000000-0000-0000-0000-000000000001', 1, 'José "Zé" da Silva', E'linha 1\nlinha 2, com vírgula', '{"k": "v;$$"}'),
  ('10000000-0000-0000-0000-000000000002', 2, 'Ünïcødé 漢字 😀', NULL, NULL),
  ('10000000-0000-0000-0000-000000000003', NULL, '', E'aspas '' simples e \\ barra', '{}'),
  ('10000000-0000-0000-0000-000000000004', 5, 'x', 'y', '[]');
INSERT INTO public.deals (contact_id, stage, amount)
  SELECT '10000000-0000-0000-0000-000000000001', 'novo', g * 10.5 FROM generate_series(1, 7) g;
INSERT INTO public.interactions (deal_id, contact_id, body) SELECT g, '10000000-0000-0000-0000-000000000002', 'i' || g FROM generate_series(1, 7) g;
INSERT INTO public.whatsapp_messages (contact_id, body) SELECT '10000000-0000-0000-0000-000000000001', 'm' || g FROM generate_series(1, 3) g;
INSERT INTO public.profiles VALUES ('00000000-0000-0000-0000-000000000001', 'Ana');
INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000001', 'admin'), ('00000000-0000-0000-0000-000000000002', 'user');
INSERT INTO public.categories (id, parent_id, name) VALUES (1, NULL, 'raiz'), (2, 1, 'filha');
SELECT setval('public.categories_id_seq', 2);
SET session_replication_role = replica;
INSERT INTO public.cycle_a VALUES (1, 1); INSERT INTO public.cycle_b VALUES (1, 1);
SET session_replication_role = origin;
INSERT INTO public."Order Items" (deal_id, "Qty") VALUES (1, 3), (2, 4);
INSERT INTO public.login_attempts (email) SELECT 'x@exemplo.test' FROM generate_series(1, 9);
INSERT INTO public.error_logs (msg) VALUES ('e1'), ('e2');
INSERT INTO public.behavioral_profile_regen_queue (processed_at) VALUES (NULL), (now());
INSERT INTO public.system_health_snapshots DEFAULT VALUES;
INSERT INTO public.audit_log VALUES (1, '2026-01-15', 'a'), (2, '2027-05-05', 'b');
ANALYZE;
