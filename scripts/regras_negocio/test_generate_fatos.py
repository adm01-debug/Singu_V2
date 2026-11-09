"""Fatos extraídos do SQL e robustez do gerador de regras (offline: sem banco, sem rede, sem LLM).

Cada teste codifica um bug real encontrado executando o gerador contra este repositório:
fixture de teste lida como schema, DDL dentro de DO $$ ignorado, ALTER POLICY ignorado,
policies de tabela dropada, policy atribuída a tabela homônima de outro schema, comentário
dentro de literal, e falhas de E/S que saíam com traceback ou exit 0.
"""
from __future__ import annotations

import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("generate.py")
SPEC = importlib.util.spec_from_file_location("context_rules_generate_fatos", SCRIPT)
generator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(generator)

BASE = """
CREATE TABLE public.contacts (id uuid PRIMARY KEY, user_id uuid);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dono" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
"""


class RepoCase(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="regras fatos ç-")  # espaço e acento de propósito
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.files: list[Path] = []

    def write(self, name: str, content: str | bytes) -> Path:
        file = self.root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(content if isinstance(content, bytes) else content.encode("utf-8"))
        self.files.append(file)
        return file

    def schema(self) -> dict:
        return generator.parse_sql_schema(self.root, self.files)

    def policies(self, schema: dict | None = None) -> dict:
        return {(p["table"], p["name"]): p for p in (schema or self.schema())["policies"]}

    def cli(self, *args: str, cwd: Path | None = None) -> subprocess.CompletedProcess:
        return subprocess.run([sys.executable, str(SCRIPT), "--repo", str(self.root), "--profile", "regras", "--no-pointer", *args],
                              capture_output=True, text=True, timeout=120, cwd=cwd or self.root, check=False)


class SchemaSourceTests(RepoCase):
    def test_test_fixtures_are_not_schema_and_cannot_replace_real_tables(self):
        real = "supabase/migrations/20260101000000_base.sql"
        self.write(real, BASE)
        for fake in ("supabase/tests/sidebar.sql", "tests/rls/report_schema.sql", "scripts/migration/tests/lib/fixture-schema.sql",
                     "scripts/migration/ddl/tests/stubs.sql", "e2e/schema.sql"):
            self.write(fake, "CREATE SCHEMA compat; CREATE TABLE compat.contacts (id int);\n"
                             "CREATE TABLE IF NOT EXISTS public.contacts (id int);\n"
                             "CREATE POLICY contacts_all ON public.contacts FOR ALL USING (true);\n"
                             "CREATE TYPE deal_stage AS ENUM ('novo');")
        schema = self.schema()
        self.assertEqual(schema["sources"], [real])
        self.assertEqual(sorted(schema["tables"]), ["contacts"])
        self.assertEqual([c["name"] for c in schema["tables"]["contacts"]["columns"]], ["id", "user_id"])
        self.assertEqual(sorted(self.policies(schema)), [("contacts", "dono")])
        self.assertEqual(schema["enums"], {})

    def test_root_level_test_directories_are_test_files(self):
        for path in ("tests/load/ask-crm.js", "tests/rls/admin.sql", "e2e/support/auth.ts", "cypress/x.ts",
                     "src/a.test.ts", "src/__tests__/a.ts", "pkg/tests/a.ts", "pkg/test/a.ts"):
            self.assertTrue(generator.is_test_file(path), path)
        for path in ("src/contests/a.ts", "src/latest/a.ts", "supabase/migrations/1_tests_table.sql", "src/e2e.ts"):
            self.assertFalse(generator.is_test_file(path), path)


class DoBlockTests(RepoCase):
    def test_static_ddl_inside_do_blocks_changes_the_schema(self):
        self.write("supabase/migrations/20260101000000_base.sql", BASE + """
CREATE POLICY "antiga" ON public.contacts FOR DELETE USING (true);
DO $$ BEGIN
  CREATE POLICY "leads_select" ON public.leads FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phone_type') THEN
    CREATE TYPE public.phone_type AS ENUM ('fixo', 'celular');
  END IF;
  IF to_regclass('public.phones') IS NULL THEN
    CREATE TABLE public.phones (id uuid PRIMARY KEY, kind public.phone_type);
    ALTER TABLE public.phones ENABLE ROW LEVEL SECURITY;
  ELSE
    DROP POLICY IF EXISTS "antiga" ON public.contacts;
  END IF;
  EXECUTE 'ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY';
  EXECUTE 'COMMENT ON TABLE public.leads IS ''it''''s''';
END $migration$;
""")
        schema = self.schema()
        self.assertEqual(sorted(self.policies(schema)), [("contacts", "dono"), ("leads", "leads_select")])
        self.assertIn("phones", schema["tables"])
        self.assertEqual(schema["enums"]["phone_type"], ["fixo", "celular"])
        self.assertEqual(schema["rls"]["phones"], "enabled")
        self.assertEqual(schema["rls"]["leads"], "enabled")

    def test_dynamic_sql_and_string_contents_are_not_facts(self):
        self.write("supabase/migrations/20260101000000_base.sql", BASE + """
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT tablename FROM pg_tables LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I USING (true)', 'p_' || r.tablename, r.tablename);
    EXECUTE 'CREATE POLICY ' || quote_ident(r.tablename) || ' ON public.contacts USING (true)';
  END LOOP;
  RAISE NOTICE 'then create table fantasma (id int)';
  PERFORM 'begin drop table contacts';
END $$;
""")
        schema = self.schema()
        self.assertEqual(sorted(schema["tables"]), ["contacts"])
        self.assertEqual(sorted(self.policies(schema)), [("contacts", "dono")])


class PolicyLifecycleTests(RepoCase):
    def test_alter_policy_updates_roles_expressions_and_name(self):
        self.write("supabase/migrations/20260101000000_base.sql", BASE + """
CREATE POLICY "logs" ON public.contacts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
""")
        self.write("supabase/migrations/20260201000000_alter.sql", """
ALTER POLICY "dono" ON public.contacts TO authenticated USING (((select auth.uid()) = user_id));
ALTER POLICY "logs"
ON public.contacts TO authenticated, service_role
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
ALTER POLICY "inexistente" ON public.contacts USING (true);
ALTER POLICY "dono" ON public.outra USING (false);
DO $$ BEGIN ALTER POLICY "dono" ON public.contacts RENAME TO "dono v2"; END $$;
""")
        policies = self.policies()
        self.assertEqual(sorted(policies), [("contacts", "dono v2"), ("contacts", "logs")])
        dono, logs = policies[("contacts", "dono v2")], policies[("contacts", "logs")]
        self.assertEqual((dono["roles"], dono["using"], dono["cmd"]), ("authenticated", "((select auth.uid()) = user_id)", "SELECT"))
        self.assertEqual((logs["roles"], logs["check"]), ("authenticated, service_role", "auth.uid() IS NOT NULL AND user_id = auth.uid()"))
        self.assertEqual(logs["src"], "supabase/migrations/20260201000000_alter.sql")

    def test_drop_table_takes_policies_triggers_indexes_and_rls_with_it(self):
        self.write("supabase/migrations/20260101000000_base.sql", BASE + """
CREATE INDEX contacts_user_idx ON public.contacts (user_id);
CREATE TRIGGER contacts_touch BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.touch();
""")
        self.write("supabase/migrations/20260201000000_recreate.sql", """
DROP TABLE IF EXISTS public.contacts CASCADE;
CREATE TABLE public.contacts (id uuid PRIMARY KEY, owner_id uuid);
CREATE POLICY "novo dono" ON public.contacts FOR ALL TO authenticated USING (owner_id = auth.uid());
""")
        schema = self.schema()
        self.assertEqual(sorted(self.policies(schema)), [("contacts", "novo dono")])
        self.assertEqual(schema["triggers"], [])
        self.assertEqual(schema["indexes"], [])
        self.assertNotIn("contacts", schema["rls"])  # a tabela recriada ainda não ligou RLS

    def test_access_matrix_never_borrows_policies_from_a_same_named_table(self):
        self.write("supabase/migrations/20260101000000_base.sql", BASE + "CREATE SCHEMA app; CREATE TABLE app.contacts (id int);")
        result = self.cli("--out", "saida")
        self.assertEqual(result.returncode, 0, result.stderr)
        matrix = json.loads((self.root / "saida/context.json").read_text(encoding="utf-8"))["access"]["matrix"]
        self.assertEqual(matrix["contacts"]["SELECT"], ["public: auth.uid() = user_id"])
        self.assertEqual(matrix["app.contacts"], {"rls": "não encontrado", "SELECT": [], "INSERT": [], "UPDATE": [], "DELETE": []})


class HostileSqlTests(RepoCase):
    def test_comment_markers_inside_literals_do_not_swallow_statements(self):
        sql = ("COMMENT ON TABLE public.a IS 'x -- y';\n/* fora /* aninhado; create table falsa1 (id int); */ ainda fora */\n"
               "-- create table falsa2 (id int);\nCREATE TABLE public.a (id int, n text DEFAULT '/* não é comentário */', s text DEFAULT 'a;b');\n"
               "CREATE FUNCTION public.f() RETURNS text LANGUAGE plpgsql AS $fn$ BEGIN RETURN 'a;b -- c $$ d'; END $fn$;\n"
               "CREATE TABLE public.depois (id int);\n")
        self.assertEqual(generator.strip_sql_comments("SELECT 'it''s -- ok', \"col--x\" -- fim\nFROM t /* a /* b */ c */;"),
                         "SELECT 'it''s -- ok', \"col--x\" \nFROM t ;")
        self.write("supabase/migrations/20260101000000_a.sql", sql)
        schema = self.schema()
        self.assertEqual(sorted(schema["tables"]), ["a", "depois"])
        self.assertEqual([c["name"] for c in schema["tables"]["a"]["columns"]], ["id", "n", "s"])
        self.assertIn("f", schema["functions"])

    def test_non_utf8_bom_crlf_empty_and_oversized_files_do_not_break_parsing(self):
        self.write("supabase/migrations/1_bin.sql", b"CREATE TABLE public.t\xe7\xff (id int);\r\nCREATE TABLE public.ok (id int);\r\n")
        self.write("supabase/migrations/2_bom.sql", b"\xef\xbb\xbfCREATE TABLE public.bom (id int);")
        self.write("supabase/migrations/3_vazio.sql", "")
        self.write("supabase/migrations/4_enorme.sql", "CREATE TABLE public.enorme (id int);\n" + "-- x\n" * (generator.MAX_SQL_BYTES // 5 + 10))
        self.write("supabase/migrations/5_grande.sql", "CREATE TABLE public.grande (id int);\nINSERT INTO public.grande VALUES "
                   + ",".join(f"({i},'v;{i}')" for i in range(120_000)) + ";\nCREATE TABLE public.fim (id int);\n")
        schema = self.schema()
        self.assertEqual(sorted(schema["tables"]), ["bom", "fim", "grande", "ok"])  # 4_enorme passa do limite e é ignorado

    def test_secrets_in_migrations_never_reach_the_output(self):
        self.write("supabase/migrations/20260101000000_cron.sql", BASE + """
SELECT cron.schedule('job', '* * * * *', $$ select net.http_post(url := 'https://x.supabase.co/functions/v1/a',
  headers := '{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.G4CANARYabcdefghijklmnop"}'::jsonb) $$);
CREATE FUNCTION public.dsn() RETURNS text LANGUAGE sql AS $$ SELECT 'postgresql://app:G4CANARYsenha@db.interno:5432/app' $$;
""")
        self.assertEqual(self.cli("--out", "saida").returncode, 0)
        for file in (self.root / "saida").rglob("*"):
            if file.is_file():
                self.assertNotIn("G4CANARY", file.read_text(encoding="utf-8", errors="replace"), file.name)


class CliRobustnessTests(RepoCase):
    def outputs(self, out: str) -> dict:
        skip = {"manifest.json", ".state.json", "context.json"}
        return {p.relative_to(self.root / out).as_posix(): "\n".join(line for line in p.read_text(encoding="utf-8").splitlines()
                                                                      if "Gerado automaticamente" not in line)
                for p in sorted((self.root / out).rglob("*")) if p.is_file() and p.name not in skip}

    def test_two_runs_are_identical_without_absolute_paths_or_temp_files(self):
        self.write("supabase/migrations/20260101000000_base.sql", BASE)
        self.write("src/a.ts", "export const LIMITE_MAXIMO = 10;\nsupabase.from('contacts').select('id').eq('status', 'ativo');\n")
        self.assertEqual(self.cli("--out", "saida").returncode, 0)
        first = self.outputs("saida")
        facts = json.loads((self.root / "saida/context.json").read_text(encoding="utf-8"))["facts_hash"]
        other_cwd = tempfile.mkdtemp(prefix="outro-cwd-")
        self.addCleanup(shutil.rmtree, other_cwd, True)
        self.assertEqual(self.cli("--out", "saida", "--force", cwd=Path(other_cwd)).returncode, 0)  # cwd diferente da raiz
        self.assertEqual(self.outputs("saida"), first)
        self.assertEqual(json.loads((self.root / "saida/context.json").read_text(encoding="utf-8"))["facts_hash"], facts)
        for name, text in first.items():
            self.assertNotIn(str(self.root), text, name)
        leftovers = [p.name for p in (self.root / "saida").rglob("*") if p.name.endswith(".tmp")]
        self.assertEqual(leftovers, [])

    def test_missing_repo_and_unwritable_output_exit_2_without_traceback(self):
        missing = subprocess.run([sys.executable, str(SCRIPT), "--repo", str(self.root / "nao-existe"), "--out", "x", "--no-pointer"],
                                 capture_output=True, text=True, timeout=60, check=False)
        self.assertEqual(missing.returncode, 2)
        self.assertIn("--repo não é um diretório", missing.stderr)
        self.assertFalse((self.root / "nao-existe").exists())
        self.write("arquivo.txt", "x")
        blocked = self.cli("--out", "arquivo.txt/sub")
        self.assertEqual(blocked.returncode, 2)
        self.assertIn("erro de E/S", blocked.stderr)
        for result in (missing, blocked):
            self.assertNotIn("Traceback", result.stderr)

    def test_empty_repo_deep_output_and_corrupt_state_still_generate(self):
        self.assertEqual(self.cli("--out", "a/b/c/saida").returncode, 0)  # sem migrations, pasta inexistente
        out = self.root / "a/b/c/saida"
        manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["arquivos"], ["07-REGRAS-DE-NEGOCIO.md", "10-ACESSO-E-SEGURANCA.md", "11-GLOSSARIO-E-LACUNAS.md", "context.json"])
        self.assertEqual(manifest["commit"], "")  # sem git: vazio, nunca o literal "HEAD"
        for corrupt in ("[1, 2]", "null", '{"facts_hash":', "�"):
            (out / ".state.json").write_text(corrupt, encoding="utf-8")
            result = self.cli("--out", "a/b/c/saida")
            self.assertEqual(result.returncode, 0, f"{corrupt!r}: {result.stderr}")
            self.assertIsInstance(json.loads((out / ".state.json").read_text(encoding="utf-8")), dict)

    def test_interrupted_run_is_completed_by_the_next_one_and_check_reports_staleness(self):
        self.write("supabase/migrations/20260101000000_base.sql", BASE)
        self.assertEqual(self.cli("--out", "saida", "--check").returncode, 1)  # nada gerado ainda
        self.assertFalse((self.root / "saida").exists())
        self.assertEqual(self.cli("--out", "saida").returncode, 0)
        self.assertEqual(self.cli("--out", "saida", "--check").returncode, 0)
        unchanged = self.cli("--out", "saida")
        self.assertIn("nada mudou", unchanged.stderr)
        (self.root / "saida/manifest.json").unlink()  # interrupção depois do .state.json, antes do manifest
        resumed = self.cli("--out", "saida")
        self.assertEqual(resumed.returncode, 0)
        self.assertNotIn("nada mudou", resumed.stderr)
        self.assertTrue((self.root / "saida/manifest.json").is_file())

    def test_concurrent_runs_on_the_same_output_leave_only_complete_files(self):
        self.write("supabase/migrations/20260101000000_base.sql", BASE)
        command = [sys.executable, str(SCRIPT), "--repo", str(self.root), "--out", "saida", "--profile", "regras", "--no-pointer", "--force"]
        runs = [subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True) for _ in range(4)]
        self.assertEqual([run.wait(timeout=120) for run in runs], [0, 0, 0, 0], [run.stderr.read() for run in runs])
        for run in runs:
            run.stderr.close()
        for name in ("context.json", "manifest.json", ".state.json"):
            json.loads((self.root / "saida" / name).read_text(encoding="utf-8"))
        self.assertEqual([p.name for p in (self.root / "saida").iterdir() if p.name.endswith(".tmp")], [])

    @unittest.skipUnless(shutil.which("git"), "git não está instalado")
    def test_repo_without_commits_has_empty_commit_not_the_word_head(self):
        subprocess.run(["git", "init", "-q", str(self.root)], check=True, env={**os.environ, "GIT_CONFIG_GLOBAL": os.devnull})
        self.assertEqual(generator.git(self.root, "rev-parse", "HEAD"), "")
        self.assertEqual(self.cli("--out", "saida").returncode, 0)
        self.assertEqual(json.loads((self.root / "saida/manifest.json").read_text(encoding="utf-8"))["commit"], "")


if __name__ == "__main__":
    unittest.main()
