"""Redação de segredos e modos de falha do snapshot — offline (driver e rede substituídos por dublês).

Cada caso de vazamento abaixo foi reproduzido contra um Postgres local com segredos plantados antes
da correção (ver test_snapshot_pg.py para a prova de ponta a ponta).
"""
from __future__ import annotations

import contextlib
import io
import json
import pathlib
import re
import sys
import time
import unittest
from unittest import mock

try:
    import fcntl
except ImportError:  # Windows
    fcntl = None

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import test_snapshot as base  # reaproveita a fixture offline do módulo vizinho

# Mesma expressão do passo "Guard — nenhum segredo na saída" de .github/workflows/contexto.yml.
WORKFLOW_GUARD = re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|sb_secret_|sb_publishable_|postgres(ql)?://[^ ]*:[^ @]+@")

LEAKS = {
    "cabeçalho JSON sem dígito": ('''headers:='{"x-cron-secret": "SegredoSoComLetrasAqui"}'::jsonb''', "SegredoSoComLetrasAqui"),
    "jsonb_build_object": ("jsonb_build_object('x-webhook-secret', 'curto-123456')", "curto-123456"),
    "apikey em jsonb_build_object": ("jsonb_build_object('apikey', 'AbCdEfGhIjKl')", "AbCdEfGhIjKl"),
    "Bearer concatenado": ("jsonb_build_object('Authorization', 'Bearer ' || 'tok_abcdefghijkl')", "tok_abcdefghijkl"),
    "atribuição plpgsql": ("service_key text := 'Valor15abcdefghijk';", "Valor15abcdefghijk"),
    "argumento nomeado": ("call f(api_key => 'ChaveNomeada99')", "ChaveNomeada99"),
    "default de coluna": ("api_token text DEFAULT 'TokenPadrao0001'", "TokenPadrao0001"),
    "conninfo libpq": ("dblink('host=db user=app password=hunter2 dbname=x')", "hunter2"),
    "senha curta entre aspas": ("password = 'abc'", "abc'"),
    "vault.create_secret": ("select vault.create_secret('valor do cofre', 'cron_secret')", "valor do cofre"),
    "vault.create_secret nomeado": ("select vault.create_secret(new_secret => 'it''s secret', new_name => 'x')", "it''s secret"),
    "vault.update_secret": ("select vault.update_secret('00000000-0000-0000-0000-000000000000', 'NovoValor')", "NovoValor"),
    "DSN com senha": ("'postgresql://app:SenhaDoBanco@db.interno:5432/app'", "SenhaDoBanco"),
    "DSN https": ("https://usuario:SenhaHttp@host/x", "SenhaHttp"),
    "JWT": ("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.assinatura_abcdefghijk", "assinatura_abcdefghijk"),
    "chave sb_secret": ("apikey: sb_secret_abcdefgh12345678", "abcdefgh12345678"),
    "PASSWORD em DDL": ("ALTER ROLE authenticator WITH PASSWORD 'x1'", "x1'"),
    "token em URL": ("https://x/hook?token=abcdef0123456789abcdef", "abcdef0123456789abcdef"),
}
KEPT = [
    "ARRAY['token','api_key','apiKey','secret','password','service_role_key','webhook_secret']",
    "jsonb_build_object('tracking_token', v_log.tracking_token, 'expires_at', now())",
    "'Bearer ' || current_setting('app.settings.service_role_key', true)",
    "CHECK (nome <> 'literal-qualquer-123')",
    "USING ((user_id = ( SELECT auth.uid() AS uid)))",
    "http://host:8080/caminho e user@host e mailto:a@b",
    "RAISE EXCEPTION 'token inválido ou expirado'",
    "select vault.create_secret(v_valor, 'nome')",
]


class ScrubTests(base.SnapshotFixture):
    def test_planted_secrets_are_redacted_and_the_workflow_guard_stays_green(self):
        for label, (text, secret) in LEAKS.items():
            with self.subTest(label):
                scrubbed = self.snapshot.scrub(text)
                self.assertNotIn(secret, scrubbed)
                self.assertIn("REDACTED", scrubbed)
                self.assertIsNone(WORKFLOW_GUARD.search(scrubbed), scrubbed)  # redação não pode disparar o guard
                self.assertEqual(self.snapshot.scrub(scrubbed), scrubbed)  # idempotente

    def test_key_names_references_and_plain_literals_are_preserved(self):
        for text in KEPT:
            with self.subTest(text):
                self.assertEqual(self.snapshot.scrub(text), text)

    def test_scrub_stays_linear_on_megabyte_blobs(self):
        # `\w+://` reavaliava a palavra inteira a cada posição: 40 KB já levavam 2 s, 2 MB não terminavam.
        blobs = {"hex": "decode('" + "ff" * 500_000 + "','hex')", "palavra": "A" * 1_000_000,
                 "valores": ",".join(f"({i},'v{i}')" for i in range(120_000))}
        for label, text in blobs.items():
            with self.subTest(label):
                started = time.monotonic()
                self.assertEqual(self.snapshot.scrub(text), text)
                self.assertLess(time.monotonic() - started, 10)

    def test_settings_and_api_config_hide_values_only_when_the_name_is_secret(self):
        snapshot = self.snapshot
        self.assertEqual(snapshot.redact_settings(["app.settings.jwt_secret=abc", "statement_timeout=8s", "search_path=public", "sem_igual"]),
                         ["app.settings.jwt_secret=[REDACTED]", "statement_timeout=8s", "search_path=public", "sem_igual"])
        self.assertIsNone(snapshot.redact_settings(None))
        config = snapshot.redact({"jwt_exp": 3600, "password_min_length": 8, "refresh_token_rotation_enabled": True, "smtp_pass": "s3nha",
                                  "sms_messagebird_access_key": "chave", "external_google_secret": "", "site_url": "https://app",
                                  "nested": [{"api_key": "k", "mfa_max_enrolled_factors": 10}], "hook_secret": None})
        self.assertEqual(config, {"jwt_exp": 3600, "password_min_length": 8, "refresh_token_rotation_enabled": True, "smtp_pass": "[REDACTED]",
                                  "sms_messagebird_access_key": "[REDACTED]", "external_google_secret": "[REDACTED]", "site_url": "https://app",
                                  "nested": [{"api_key": "[REDACTED]", "mfa_max_enrolled_factors": 10}], "hook_secret": None})

    def test_error_messages_never_carry_the_dsn_password_or_tokens(self):
        snapshot = self.snapshot
        dsn = "postgresql://postgres.ref:S3nh%40Forte@aws-0.pooler.supabase.com:5432/postgres"
        with mock.patch.object(snapshot, "DB_URL", dsn), mock.patch.object(snapshot, "ACCESS_TOKEN", "sbp_tokenmgmt"), \
                mock.patch.dict(snapshot.os.environ, {"PGPASSWORD": "senhaPG"}), contextlib.redirect_stdout(io.StringIO()) as log:
            snapshot.ERRORS.clear()
            snapshot.record_error("pg_dump", f'missing "=" after "{dsn}" in connection info string')
            snapshot.record_error("gen_types", "failed: password S3nh@Forte rejected; token sbp_tokenmgmt; PGPASSWORD=senhaPG")
        rendered = json.dumps(snapshot.ERRORS) + log.getvalue()
        for secret in (dsn, "S3nh%40Forte", "S3nh@Forte", "sbp_tokenmgmt", "senhaPG"):
            self.assertNotIn(secret, rendered)
        snapshot.ERRORS.clear()


class FailureModeTests(base.SnapshotFixture):
    def run_main(self):
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr), contextlib.redirect_stdout(io.StringIO()):
            code = self.snapshot.main()
        return code, stderr.getvalue()

    def test_connection_failure_exits_1_without_traceback_or_dsn(self):
        snapshot = self.snapshot
        dsn = "postgre://postgres:SENHAsecreta123@127.0.0.1:55432/x"
        failure = OSError(f'missing "=" after "{dsn}" in connection info string')
        with mock.patch.object(snapshot, "DB_URL", dsn), mock.patch.object(snapshot.psycopg, "connect", side_effect=failure):
            code, stderr = self.run_main()
        self.assertEqual(code, 1)
        self.assertIn("Banco inacessível", stderr)
        self.assertNotIn("SENHAsecreta123", stderr)
        self.assertFalse((self.out / "snapshot.json").exists())  # nada foi escrito além do marcador
        self.assertEqual([p.name for p in self.out.iterdir()], [snapshot.OUTPUT_MARKER])

    def test_unusable_output_directory_exits_2_without_traceback(self):
        blocker = self.out.parent / "arquivo"
        blocker.write_text("x", encoding="utf-8")
        with mock.patch.object(self.snapshot, "OUT", blocker / "sub"):
            code, stderr = self.run_main()
        self.assertEqual(code, 2)
        self.assertIn("Configuração inválida", stderr)

    @unittest.skipIf(fcntl is None, "sem fcntl nesta plataforma")
    def test_second_collection_on_the_same_directory_is_refused(self):
        self.assertEqual(self.collect(), 0)
        before = {p.name: p.read_bytes() for p in self.out.iterdir() if p.is_file()}
        with open(self.out / self.snapshot.OUTPUT_MARKER, "a", encoding="utf-8") as other:
            fcntl.flock(other, fcntl.LOCK_EX)  # outra coleta em andamento
            with mock.patch.object(self.snapshot.psycopg, "connect", side_effect=AssertionError("não pode conectar")):
                code, stderr = self.run_main()
        self.assertEqual(code, 2)
        self.assertIn("outra coleta já está usando", stderr)
        self.assertEqual({p.name: p.read_bytes() for p in self.out.iterdir() if p.is_file()}, before)
        self.assertEqual(self.collect(), 0)  # trava liberada: a próxima coleta roda

    def test_previous_snapshot_with_unexpected_shape_does_not_block_every_future_run(self):
        self.assertEqual(self.collect(), 0)
        poison = {"format_version": 2, "db": {"tables": [{"schema": "public"}], "functions": [{"x": 1}]}, "api": {}}
        (self.out / "snapshot.json").write_text(json.dumps(poison), encoding="utf-8")
        self.assertEqual(self.collect(), 0)  # antes: KeyError e exit 1 para sempre
        self.assertIn("changelog", self.error_sections())
        self.assertEqual(self.collect(), 0)
        self.assertEqual(self.error_sections(), set())  # a coleta seguinte já está limpa

    def test_valid_json_that_is_not_a_snapshot_counts_as_first_collection(self):
        for content in ("[1, 2]", '{"format_version": 2, "db": [], "api": {}}', '{"format_version": 2, "db": {"functions": ['):
            with self.subTest(content):
                self.assertEqual(self.collect(), 0)
                (self.out / "snapshot.json").write_text(content, encoding="utf-8")
                (self.out / "CHANGELOG.md").unlink()
                self.assertEqual(self.collect(), 0)
                changelog = (self.out / "CHANGELOG.md").read_text(encoding="utf-8")
                self.assertIn("Snapshot inicial", changelog)
                self.assertNotIn("adicionado", changelog)  # sem "tudo foi adicionado" inventado

    def test_non_utf8_changelog_is_kept_readable_instead_of_crashing(self):
        self.assertEqual(self.collect(), 0)
        (self.out / "CHANGELOG.md").write_bytes(b"\xff\xfe# CHANGELOG\n")
        self.assertEqual(self.collect(functions=[base.function(value=2)]), 0)
        self.assertIn("functions", (self.out / "CHANGELOG.md").read_text(encoding="utf-8"))

    def test_writes_are_atomic_and_leave_no_temporary_files(self):
        snapshot = self.snapshot
        self.assertEqual(self.collect(), 0)
        self.assertEqual([p.name for p in self.out.rglob("*") if p.name.endswith(".tmp")], [])
        target = self.out / "snapshot.json"
        before = target.read_text(encoding="utf-8")
        with mock.patch.object(snapshot.os, "replace", side_effect=OSError("disco cheio")), self.assertRaises(OSError):
            snapshot.write(target, '{"versao": 2, "truncado":')
        self.assertEqual(target.read_text(encoding="utf-8"), before)  # o anterior continua íntegro e legível
        self.assertEqual([p.name for p in self.out.rglob("*") if p.name.endswith(".tmp")], [])
        self.assertEqual(self.collect(), 0)


if __name__ == "__main__":
    unittest.main()
