"""Snapshot de ponta a ponta contra um Postgres de verdade, com stubs que imitam o Supabase.

Precisa de PGHOST/PGPORT/PGUSER (superusuário) apontando para um servidor LOCAL e do psycopg; sem
isso os testes se PULAM. Cria e apaga os próprios bancos/roles (prefixo g4_). Nunca roda contra host
remoto: o teste cria banco e roles, e produção só se toca com SNAPSHOT_TEST_ALLOW_REMOTE=1 explícito.

Prova: (1) saída determinística, (2) segredos plantados nunca chegam ao disco e o guard do workflow
continua verde, (3) contagens e policies batem com o catálogo, (4) sessão somente-leitura com timeout,
(5) role sem privilégio, banco vazio e banco inacessível degradam sem traceback.
"""
from __future__ import annotations

import importlib.util
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

try:
    import psycopg
except ImportError:  # CI sem o driver: o módulo inteiro se pula
    psycopg = None

SCRIPT = pathlib.Path(__file__).with_name("snapshot.py")
HOST, PORT, USER = os.environ.get("PGHOST", ""), os.environ.get("PGPORT", "5432"), os.environ.get("PGUSER", "postgres")
LOCAL = HOST in {"127.0.0.1", "localhost", "::1"} or HOST.startswith("/") or os.environ.get("SNAPSHOT_TEST_ALLOW_REMOTE") == "1"
SUFFIX = f"{os.getpid()}"
DB, EMPTY_DB, RO_ROLE, CFG_ROLE = f"g4_snap_{SUFFIX}", f"g4_vazio_{SUFFIX}", f"g4_ro_{SUFFIX}", f"g4_cfg_{SUFFIX}"
WORKFLOW_GUARD = re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sb_secret_|sb_publishable_|postgres(ql)?://[^ ]*:[^ @]+@")
VOLATILE = {"manifest.json", "stats.md", "stats.json", "cron-runs.md"}

FIXTURE = r"""
CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE SCHEMA cron; CREATE SCHEMA vault; CREATE SCHEMA realtime;
CREATE SCHEMA supabase_migrations; CREATE SCHEMA supabase_functions; CREATE SCHEMA net; CREATE SCHEMA app_private;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz, phone_confirmed_at timestamptz, created_at timestamptz DEFAULT now());
CREATE TABLE auth.identities (id uuid PRIMARY KEY, user_id uuid, provider text);
CREATE TABLE auth.mfa_factors (id uuid PRIMARY KEY, user_id uuid, factor_type text, status text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000001', 'pessoa.real@exemplo-pii.com');
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[], created_at timestamptz DEFAULT '2026-01-01');
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
INSERT INTO storage.buckets VALUES ('avatars', 'avatars', true, 1048576, '{image/png}', '2026-01-01');
CREATE POLICY "avatars owner" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND owner = (SELECT auth.uid()));
CREATE TABLE realtime.messages (id bigint, topic text);
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rt auth" ON realtime.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- pg_cron/supabase_vault não existem no PG local: tabela + linha em pg_extension bastam para o coletor
CREATE TABLE cron.job (jobid bigint PRIMARY KEY, jobname text, schedule text, command text, database text, username text, active boolean);
CREATE TABLE cron.job_run_details (jobid bigint, runid bigint, status text, start_time timestamptz, end_time timestamptz, return_message text);
INSERT INTO pg_extension (oid, extname, extowner, extnamespace, extrelocatable, extversion)
  VALUES (900001, 'pg_cron', 10, 'cron'::regnamespace, false, '1.6'), (900002, 'supabase_vault', 10, 'vault'::regnamespace, false, '0.3');
CREATE TABLE vault.secrets (id uuid DEFAULT gen_random_uuid(), name text, description text, secret text, created_at timestamptz DEFAULT '2026-01-01');
INSERT INTO vault.secrets (name, description, secret) VALUES ('cron_secret', 'segredo do cron', 'G4CANARY06-valor-do-vault');
CREATE FUNCTION net.http_post(url text, headers jsonb DEFAULT '{}', body jsonb DEFAULT '{}') RETURNS bigint LANGUAGE sql AS $$ SELECT 1::bigint $$;
CREATE FUNCTION supabase_functions.http_request() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TABLE supabase_migrations.schema_migrations (version text PRIMARY KEY, name text, statements text[]);

CREATE TYPE public.deal_stage AS ENUM ('novo', 'ganho', 'perdido');
CREATE DOMAIN public.email_br AS text CHECK (VALUE ~ '@');
CREATE TABLE public.contacts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email public.email_br, nome text NOT NULL, criado_em timestamptz DEFAULT now(), api_hint text DEFAULT 'ghp_G4CANARY13abcdefghijklmnopqrstu');
COMMENT ON TABLE public.contacts IS 'Contatos do CRM | chave antiga sk_live_G4CANARY12abcdefgh';
CREATE TABLE public.deals (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  stage public.deal_stage NOT NULL DEFAULT 'novo', valor numeric(12,2) CHECK (valor >= 0));
CREATE TABLE public.sem_rls (id int);
CREATE TABLE public.rls_sem_policy (id int PRIMARY KEY);
CREATE TABLE public."Tabela Ação" ("Coluna | Pipe" text, "aspas""dentro" int, id int PRIMARY KEY);
CREATE TABLE public.eventos (id bigint, criado date NOT NULL, PRIMARY KEY (id, criado)) PARTITION BY RANGE (criado);
CREATE TABLE public.eventos_2026 PARTITION OF public.eventos FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE app_private.config (chave text PRIMARY KEY, valor text);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY; ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY; ALTER TABLE public.deals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.rls_sem_policy ENABLE ROW LEVEL SECURITY; ALTER TABLE public."Tabela Ação" ENABLE ROW LEVEL SECURITY; ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_owner ON public.contacts FOR ALL TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY contacts_anon_nada ON public.contacts AS RESTRICTIVE FOR SELECT TO anon USING (false);
CREATE POLICY deals_dono ON public.deals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()));
CREATE POLICY "política com | pipe e `crase`" ON public."Tabela Ação" FOR SELECT USING (true);
CREATE POLICY eventos_leitura ON public.eventos FOR SELECT TO authenticated USING (true);
CREATE VIEW public.v_abertos AS SELECT id, contact_id FROM public.deals WHERE stage = 'novo';
CREATE VIEW public.v_invoker WITH (security_invoker = true) AS SELECT id FROM public.contacts;
CREATE MATERIALIZED VIEW public.mv_totais AS SELECT stage, count(*) AS n FROM public.deals GROUP BY 1;
CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$ SELECT true $$;
CREATE FUNCTION public.secdef_sem_path(p int) RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $fn$
BEGIN -- comentário com ; e $$ aninhado
  /* bloco /* aninhado */ ainda comentário */
  RETURN p + 1;
END $fn$;
CREATE FUNCTION public.secdef_sem_path(p text) RETURNS text LANGUAGE sql AS $$ SELECT p $$;
CREATE FUNCTION public.touch() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.criado_em = now(); PERFORM public.is_admin(); RETURN NEW; END $$;
CREATE FUNCTION public.chama_externo() RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  service_key text := 'G4CANARY15abcdefghijklmnop';
  dsn text := 'postgresql://app:G4CANARY04senha@db.exemplo.internal:5432/app';
  conninfo text := 'host=db.interno user=app password=G4CANARY05 dbname=app';
BEGIN
  PERFORM net.http_post(url := 'https://x.exemplo/functions/v1/job',
    headers := jsonb_build_object('Authorization', 'Bearer ' || 'G4CANARY16abcdefghijklmnopq', 'x-cron-secret', 'GQCANARYsemdigitoalgumaqui'));
  PERFORM net.http_post(url := 'https://x.exemplo/hook?token=G4CANARY17abcdefghijklmnop', headers := '{"apikey":"G4CANARY18abcdefghijklmnop"}'::jsonb);
END $$;
CREATE TRIGGER contacts_touch BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.touch();
CREATE TRIGGER on_auth_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.touch();
CREATE TRIGGER deals_webhook AFTER INSERT ON public.deals FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
  'https://x.exemplo/functions/v1/hook', 'POST', '{"Content-type":"application/json","Authorization":"Bearer G4CANARY09abcdefghijklmnop"}', '{}', '1000');
GRANT SELECT ON public.contacts TO anon, authenticated; GRANT SELECT (valor) ON public.deals TO anon; GRANT ALL ON public.deals TO authenticated;
INSERT INTO cron.job VALUES
 (1, 'job-jwt', '*/5 * * * *', $c$select net.http_post(url:='https://x.exemplo/functions/v1/a', headers:='{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiRzRDQU5BUlkiOjF9.G4CANARY01abcdefghijklmnopqrst"}'::jsonb)$c$, 'postgres', 'postgres', true),
 (2, 'job-sb', '0 3 * * *', $c$select net.http_post(url:='https://x.exemplo/functions/v1/b', headers:=jsonb_build_object('apikey','sb_secret_G4CANARY02abcdefgh'))$c$, 'postgres', 'postgres', true),
 (3, 'job-header', '0 4 * * *', $c$select net.http_post(url:='https://x.exemplo/functions/v1/c', headers:='{"x-cron-secret": "GQCANARYsegredocurtosemdigito"}'::jsonb); select public.is_admin()$c$, 'postgres', 'postgres', false),
 (4, NULL, '0 5 * * *', $c$select net.http_post('https://x.exemplo/c', jsonb_build_object('x-webhook-secret', 'G4CANARY19curto'))$c$, 'postgres', 'postgres', true);
INSERT INTO cron.job_run_details VALUES (1, 10, 'failed', now() - interval '1 hour', now(), 'ERROR: token=G4CANARY20abcdefghijklmnop rejeitado');
INSERT INTO supabase_migrations.schema_migrations VALUES
 ('20260101000000', 'init', ARRAY['create table x(id int)', $m$select vault.create_secret('G4CANARY07valor', 'cron_secret')$m$]),
 ('20260102000000', 'roles', ARRAY[$m$ALTER ROLE authenticator WITH PASSWORD 'G4CANARY08'$m$, $m$CREATE USER leitor WITH ENCRYPTED PASSWORD 'G4CANARY08b'$m$,
    $m$ALTER DATABASE postgres SET app.settings.service_role_key = 'G4CANARY21abcdefghijklmnop'$m$,
    $m$select vault.update_secret('00000000-0000-0000-0000-000000000000', 'G4CANARY22novo')$m$]);
CREATE FOREIGN DATA WRAPPER g4_dummy_fdw;
CREATE SERVER g4_s3 FOREIGN DATA WRAPPER g4_dummy_fdw OPTIONS (aws_access_key_id 'AKIAG4CANARYIDPUBLIC', aws_secret_access_key 'G4CANARY11/segredoAWS',
  password 'G4CANARY11b', api_key 'G4CANARY11c', region 'sa-east-1', conn 'postgres://u:G4CANARY11d@h/db');
ALTER TABLE public.contacts ADD CONSTRAINT contacts_nome_chk CHECK (nome <> 'CONTROLE-nao-e-segredo');
"""


def admin(dbname: str = "postgres"):
    return psycopg.connect(host=HOST, port=PORT, user=USER, dbname=dbname, autocommit=True, connect_timeout=5)


def available() -> str | None:
    if psycopg is None:
        return "psycopg não instalado"
    if not HOST:
        return "PGHOST não definido"
    if not LOCAL:
        return f"PGHOST={HOST} não é local (o teste cria bancos e roles)"
    try:
        with admin() as conn:
            if not conn.execute("SELECT rolsuper FROM pg_roles WHERE rolname = current_user").fetchone()[0]:
                return "PGUSER precisa ser superusuário para montar a fixture"
    except Exception as error:  # noqa: BLE001
        return f"Postgres indisponível: {str(error).splitlines()[0]}"
    return None


REASON = available()


@unittest.skipIf(REASON, f"sem Postgres local para o teste de ponta a ponta: {REASON}")
class SnapshotAgainstPostgres(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="snapshot pg ç-")
        cls.work = pathlib.Path(cls.temp.name)
        cls.created_roles = []
        with admin() as conn:
            for role in ("anon", "authenticated", "service_role", "authenticator"):  # roles do Supabase que os lints consultam
                if not conn.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (role,)).fetchone():
                    conn.execute(f'CREATE ROLE "{role}" NOLOGIN')
                    cls.created_roles.append(role)
            conn.execute(f"CREATE ROLE {RO_ROLE} LOGIN")
            conn.execute(f"CREATE ROLE {CFG_ROLE} NOLOGIN")
            conn.execute(f"ALTER ROLE {CFG_ROLE} SET \"app.settings.jwt_secret\" = 'G4CANARY10curto'")
            conn.execute(f"ALTER ROLE {CFG_ROLE} SET statement_timeout = '8s'")
            conn.execute(f"CREATE DATABASE {DB}")
            conn.execute(f"CREATE DATABASE {EMPTY_DB}")
        with admin(DB) as conn:
            conn.execute("SET client_min_messages = error")
            conn.execute(FIXTURE)
            conn.execute("CREATE PUBLICATION supabase_realtime FOR TABLE public.contacts")
        cls.first, cls.first_log = cls.run_snapshot("a")
        cls.second, _ = cls.run_snapshot("b")

    @classmethod
    def tearDownClass(cls):
        with admin() as conn:
            for db in (DB, EMPTY_DB):
                conn.execute(f"DROP DATABASE IF EXISTS {db} WITH (FORCE)")
            for role in (RO_ROLE, CFG_ROLE, *cls.created_roles):
                conn.execute(f'DROP ROLE IF EXISTS "{role}"')
        cls.temp.cleanup()

    @classmethod
    def url(cls, db: str = DB, user: str = USER, port: str = PORT, password: str = "") -> str:
        credentials = f"{user}:{password}" if password else user
        host = "127.0.0.1" if HOST.startswith("/") else HOST
        return f"postgresql://{credentials}@{host}:{port}/{db}"

    @classmethod
    def run_snapshot(cls, name: str, url: str | None = None, expect: int = 0):
        out = cls.work / name
        env = {"PATH": os.environ.get("PATH", ""), "SUPABASE_DB_URL": url or cls.url(), "SNAPSHOT_DIR": str(out),
               "PGDUMP": "false", "GEN_TYPES": "false", "REPO_ROOT": "", "HOME": str(cls.work)}
        result = subprocess.run([sys.executable, str(SCRIPT)], env=env, capture_output=True, text=True, timeout=180, check=False, cwd=cls.work)
        assert result.returncode == expect, f"exit {result.returncode}\n{result.stdout[-2000:]}\n{result.stderr[-2000:]}"
        return out, result.stdout + result.stderr

    @staticmethod
    def tree(out: pathlib.Path) -> dict[str, str]:
        files = {p.relative_to(out).as_posix(): p.read_text(encoding="utf-8") for p in sorted(out.rglob("*")) if p.is_file()}
        files["CHANGELOG.md"] = re.sub(r"^## \d{4}-\d\d-\d\d \d\d:\d\d UTC$", "## <data>", files["CHANGELOG.md"], flags=re.MULTILINE)
        return files

    def snapshot_json(self, out: pathlib.Path | None = None) -> dict:
        return json.loads(((out or self.first) / "snapshot.json").read_text(encoding="utf-8"))

    def test_two_collections_of_the_same_database_are_byte_identical(self):
        first, second = self.tree(self.first), self.tree(self.second)
        self.assertEqual(sorted(first), sorted(second))
        for name in first:
            if name not in VOLATILE:
                self.assertEqual(first[name], second[name], name)
        for name, text in first.items():
            self.assertNotIn(str(self.work), text, f"{name} contém caminho absoluto")
        again, log = self.run_snapshot("a")  # mesma pasta: nada estrutural muda, CHANGELOG não cresce
        self.assertIn("concluído: 0 grupos de mudança, 0 erros", log)
        self.assertEqual({k: v for k, v in self.tree(again).items() if k not in VOLATILE}, {k: v for k, v in first.items() if k not in VOLATILE})

    def test_planted_secrets_never_reach_disk_and_workflow_guard_passes(self):
        for name, text in self.tree(self.first).items():
            self.assertIsNone(re.search(r"G[4Q]CANARY", text), f"segredo plantado vazou em {name}")
            self.assertIsNone(WORKFLOW_GUARD.search(text), f"guard do contexto.yml dispararia em {name}")
            self.assertNotIn("pessoa.real@exemplo-pii.com", text, f"dado pessoal em {name}")
        self.assertNotIn("G4CANARY", self.first_log)
        self.assertIn("CONTROLE-nao-e-segredo", (self.first / "tables/public/contacts.md").read_text(encoding="utf-8"))  # literal comum fica
        self.assertIn("app.settings.jwt_secret=[REDACTED], statement_timeout=8s", (self.first / "roles.md").read_text(encoding="utf-8"))
        vault = (self.first / "vault.md").read_text(encoding="utf-8")
        self.assertIn("| cron_secret | segredo do cron |", vault)  # só o nome
        servers = (self.first / "foreign-servers.md").read_text(encoding="utf-8")
        self.assertIn("aws_secret_access_key=[REDACTED]", servers)
        self.assertIn("region=sa-east-1", servers)

    def test_counts_and_policies_match_the_catalog(self):
        db = self.snapshot_json()["db"]
        with admin(DB) as conn:
            scope = "schemaname IN ('public', 'app_private', 'storage', 'realtime')"
            catalog_policies = sorted((r[0], r[1], r[2], r[3], sorted(r[4])) for r in conn.execute(
                f"SELECT schemaname, tablename, policyname, cmd, roles::text[] FROM pg_policies WHERE {scope}"))
            tables = conn.execute("SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
                                  "WHERE c.relkind IN ('r','p') AND n.nspname IN ('public', 'app_private')").fetchone()[0]
            rls_on = sorted(r[0] for r in conn.execute("SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
                                                       "WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND c.relrowsecurity"))
        self.assertEqual(sorted((p["schema"], p["table"], p["name"], p["cmd"], sorted(p["roles"])) for p in db["policies"]), catalog_policies)
        self.assertEqual(len(db["tables"]), tables)
        self.assertEqual(sorted(t["name"] for t in db["tables"] if t["schema"] == "public" and t["rls_enabled"]), rls_on)
        self.assertEqual(sorted((t["schema"], t["table"], t["name"]) for t in db["triggers"]),
                         [("auth", "users", "on_auth_user"), ("public", "contacts", "contacts_touch"), ("public", "deals", "deals_webhook")])
        self.assertEqual([j["jobid"] for j in db["cron"]["jobs"]], [1, 2, 3, 4])
        readme = (self.first / "README.md").read_text(encoding="utf-8")
        for label, count in (("tabelas", tables), ("policies (RLS)", len(catalog_policies)), ("triggers", 3), ("cron jobs", 4), ("migrations", 2)):
            self.assertIn(f"| {label} | {count} |", readme)

    def test_each_table_file_lists_only_its_own_policies_and_odd_identifiers_render(self):
        contacts = (self.first / "tables/public/contacts.md").read_text(encoding="utf-8")
        deals = (self.first / "tables/public/deals.md").read_text(encoding="utf-8")
        self.assertIn("### `contacts_owner`", contacts)
        self.assertIn("### `contacts_anon_nada`", contacts)
        self.assertNotIn("deals_dono", contacts)
        self.assertIn("### `deals_dono`", deals)
        self.assertNotIn("contacts_owner", deals)
        self.assertIn("| RLS forçado (owner) | sim |", deals)
        odd = (self.first / "tables/public/Tabela_A_o.md").read_text(encoding="utf-8")
        self.assertIn("# public.Tabela Ação", odd)
        self.assertIn("`Coluna \\| Pipe`", odd)
        self.assertIn('`aspas"dentro`', odd)
        self.assertIn("| partição de | public.eventos |", (self.first / "tables/public/eventos_2026.md").read_text(encoding="utf-8"))
        lints = (self.first / "lints.md").read_text(encoding="utf-8")
        for expected in ("| ALTA | rls_disabled | public.sem_rls |", "| ALTA | secdef_mutable_search_path | public.secdef_sem_path(p integer) |",
                         "| MÉDIA | rls_no_policies | public.rls_sem_policy |", "| ALTA | view_security_definer | public.v_abertos |"):
            self.assertIn(expected, lints)
        self.assertNotIn("v_invoker", lints)

    def test_session_is_read_only_with_timeouts(self):
        spec = importlib.util.spec_from_file_location("snapshot_pg_session", SCRIPT)
        module = importlib.util.module_from_spec(spec)
        env = {"SUPABASE_DB_URL": self.url(), "SNAPSHOT_DIR": str(self.work / "sessao"), "PGDUMP": "false", "GEN_TYPES": "false", "REPO_ROOT": ""}
        with mock.patch.dict(os.environ, env, clear=True):
            spec.loader.exec_module(module)

        @module.section("escrita")
        def write(conn):
            conn.execute("CREATE TABLE public.nao_pode (id int)")
            return []

        @module.section("ajustes")
        def settings(conn):
            return {name: module.q(conn, f"SHOW {name}")[0][name] for name in ("default_transaction_read_only", "statement_timeout", "lock_timeout")}

        module.DB_SECTIONS = [write, settings]
        with mock.patch.object(module, "log"):
            db, _ = module.introspect_db(None)
        self.assertIsNone(db["escrita"])
        self.assertIn("read-only transaction", module.ERRORS[0]["error"])
        self.assertEqual(db["ajustes"], {"default_transaction_read_only": "on", "statement_timeout": "90s", "lock_timeout": "5s"})
        with admin(DB) as conn:
            self.assertIsNone(conn.execute("SELECT to_regclass('public.nao_pode')").fetchone()[0])

    def test_unprivileged_role_degrades_per_section(self):
        out, log = self.run_snapshot("sem-privilegio", self.url(user=RO_ROLE))
        errors = (out / "errors.md").read_text(encoding="utf-8")
        for section in ("cron", "vault", "migrations", "storage"):
            self.assertIn(f"| {section} | permission denied for schema", errors)
        self.assertNotIn("Traceback", log)
        self.assertGreater(len(self.snapshot_json(out)["db"]["tables"]), 0)  # o catálogo público continua coletado
        manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(sorted({e["section"] for e in manifest["erros"]} & {"cron", "vault"}), ["cron", "vault"])
        for name, text in self.tree(out).items():
            self.assertIsNone(re.search(r"G[4Q]CANARY", text), name)

    def test_empty_database_produces_a_complete_empty_snapshot(self):
        out, log = self.run_snapshot("vazio", self.url(db=EMPTY_DB))
        self.assertNotIn("Traceback", log)
        self.assertIn("| tabelas | 0 |", (out / "README.md").read_text(encoding="utf-8"))
        self.assertEqual(self.snapshot_json(out)["db"]["policies"], [])
        self.assertEqual({e["section"] for e in self.snapshot_json(out)["errors"]}, {"storage", "db_stats"})  # sem schema storage

    def test_unreachable_or_misspelled_database_exits_1_without_traceback_or_password(self):
        for label, url in (("porta fechada", self.url(port="1", password="SENHAsecreta123")),
                           ("banco inexistente", self.url(db="g4_nao_existe", password="SENHAsecreta123")),
                           ("esquema errado", self.url(password="SENHAsecreta123").replace("postgresql://", "postgre://"))):
            with self.subTest(label):
                out, log = self.run_snapshot(f"falha-{label[:5]}", url, expect=1)
                self.assertIn("Banco inacessível", log)
                self.assertNotIn("Traceback", log)
                self.assertNotIn("SENHAsecreta123", log)
                self.assertFalse((out / "snapshot.json").exists())


if __name__ == "__main__":
    unittest.main()
