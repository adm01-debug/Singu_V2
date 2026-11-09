"""Índice único (indice.py): contrato com os manifests dos três produtores e cenários de falha.

Offline: monta uma branch `contexto` de mentira em pasta temporária. O índice nunca pode derrubar a
publicação por causa de um manifest ruim — ele tem de dizer "não verificável" e seguir.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

SCRIPT = Path(__file__).with_name("indice.py")
HEAD = "1fecfa69f5d6ce8ea22d580ea75c067f1bc7fe66"
FONTES = (("banco real", "docs/contexto/supabase"), ("código", "docs/contexto/codigo"), ("regras de negócio", "docs/contexto/regras"))


def stamp(minutes_ago: float = 1, fmt: str = "%Y-%m-%dT%H:%M:%SZ") -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)).strftime(fmt)


class IndiceCase(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="índice com espaço-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        # Formatos reais: snapshot.py (ISO Z), gerar.mjs (ISO com ms) e generate.py ("YYYY-MM-DD HH:MM UTC").
        self.source("docs/contexto/supabase", {"produtor": "supabase-snapshot", "gerado_em": stamp(), "entrada": "README.md", "erros": [], "carried": []},
                    {"README.md": "# snapshot\n", "errors.md": "# Erros da última coleta\n\n_nenhum_\n", "tables/public/t.md": "# t\n"})
        self.source("docs/contexto/codigo", {"format_version": 2, "gerado_em": stamp(fmt="%Y-%m-%dT%H:%M:%S.123Z"), "commit": HEAD, "erros": []},
                    {"INDEX.md": "# código\n", "rotas.json": "{}\n"})
        self.source("docs/contexto/regras", {"produtor": "ai-context-sync", "gerado_em": stamp(fmt="%Y-%m-%d %H:%M UTC"), "commit": HEAD,
                                             "entrada": "07-REGRAS-DE-NEGOCIO.md", "inconsistencias": 3, "lacunas": 2},
                    {"07-REGRAS-DE-NEGOCIO.md": "# regras\n", "manual/README.md": "# manual\n"})

    def source(self, path: str, manifest, files: dict[str, str] | None = None) -> Path:
        directory = self.root / path
        for name, text in (files or {}).items():
            (directory / name).parent.mkdir(parents=True, exist_ok=True)
            (directory / name).write_text(text, encoding="utf-8")
        directory.mkdir(parents=True, exist_ok=True)
        if isinstance(manifest, bytes):
            (directory / "manifest.json").write_bytes(manifest)
        elif manifest is not None:
            (directory / "manifest.json").write_text(manifest if isinstance(manifest, str) else json.dumps(manifest), encoding="utf-8")
        return directory

    def run_index(self, *extra: str, out: str = "docs/contexto/00-INDEX.md", fontes=FONTES, repo: Path | None = None):
        command = [sys.executable, str(SCRIPT), "--repo", str(repo or self.root), "--out", out, "--head", HEAD, "--remote", "dono/repo"]
        for nome, caminho in fontes:
            command += ["--fonte", f"{nome}={caminho}"]
        return subprocess.run(command + list(extra), capture_output=True, text=True, timeout=60, check=False, cwd=tempfile.gettempdir())

    def index(self) -> str:
        return (self.root / "docs/contexto/00-INDEX.md").read_text(encoding="utf-8")

    def row(self, nome: str) -> str:
        return next(line for line in self.index().splitlines() if f"| **{nome}** |" in line)


class ContractTests(IndiceCase):
    def test_reads_the_three_producer_manifests_and_points_to_their_entry_files(self):
        result = self.run_index()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("banco real=ok, código=ok, regras de negócio=ok", result.stderr)
        self.assertIn("`docs/contexto/supabase/README.md` | ok", self.row("banco real"))
        self.assertIn("`docs/contexto/codigo/INDEX.md` | ok", self.row("código"))
        self.assertIn("`docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md` | ok", self.row("regras de negócio"))
        self.assertIn("- `docs/contexto/supabase/tables/public/t.md`", self.index())
        self.assertNotIn(str(self.root), self.index())  # sem caminho absoluto

    def test_second_run_without_structural_change_does_not_rewrite(self):
        self.run_index()
        before = (self.root / "docs/contexto/00-INDEX.md").stat().st_mtime_ns
        result = self.run_index()
        self.assertEqual(result.returncode, 0)
        self.assertIn("sem mudança estrutural", result.stderr)
        self.assertEqual((self.root / "docs/contexto/00-INDEX.md").stat().st_mtime_ns, before)
        self.assertEqual([p.name for p in (self.root / "docs/contexto").iterdir() if p.name.endswith(".tmp")], [])

    def test_collection_errors_carried_sections_and_stale_sources_are_reported(self):
        self.source("docs/contexto/supabase", {"gerado_em": stamp(600), "erros": [{"section": "cron", "error": "x"}], "carried": ["cron"]},
                    {"errors.md": "# Erros\n\n| seção | erro |\n|---|---|\n| cron | permission denied |\n"})
        self.source("docs/contexto/codigo", {"gerado_em": stamp(600), "commit": "0" * 40})
        self.source("docs/contexto/regras", {"gerado_em": stamp(60 * 24 * 3), "commit": HEAD})  # antigo, mas do mesmo commit
        self.run_index()
        banco = self.row("banco real")
        self.assertIn("| parcial", banco)
        for expected in ("1 erro(s) de coleta no manifest (erros)", "seções reaproveitadas", "1 seção(ões) com erro em errors.md", "desatualizado há 10h00"):
            self.assertIn(expected, banco)
        self.assertIn("gerado no commit `0000000`, HEAD é `1fecfa6`", self.row("código"))
        self.assertIn("| ok · 72h atrás |", self.row("regras de negócio"))

    def test_missing_source_is_reported_not_invented(self):
        shutil.rmtree(self.root / "docs/contexto/supabase")
        result = self.run_index(fontes=FONTES[1:] + (("banco real", "docs/contexto/supabase"), ("extra", "docs/outra@outra-branch")))
        self.assertEqual(result.returncode, 0)
        self.assertIn("ainda não existe — o produtor não rodou", self.row("banco real"))
        self.assertIn("branch `outra-branch`", self.row("extra"))
        self.assertIn("raw.githubusercontent.com/dono/repo/outra-branch/docs/outra/", self.row("extra"))


class InvalidManifestTests(IndiceCase):
    def test_unreadable_manifests_become_nao_verificavel_and_never_fail_the_index(self):
        cases = {"truncado": '{"gerado_em": "2026-0', "lista": "[1, 2]", "nulo": "null", "vazio": "", "binário": b"\xff\xfe{\x00"}
        for label, content in cases.items():
            with self.subTest(label):
                self.source("docs/contexto/supabase", content)
                result = self.run_index()
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertNotIn("Traceback", result.stderr)
                self.assertIn("| não verificável", self.row("banco real"))
                self.assertIn("| ok", self.row("código"))  # as outras fontes seguem intactas

    def test_wrong_types_inside_a_valid_manifest_are_tolerated(self):
        self.source("docs/contexto/regras", {"gerado_em": 123, "commit": 99, "erros": "x", "carried": 1, "entrada": ["a"]})
        result = self.run_index()
        self.assertEqual(result.returncode, 0, result.stderr)
        row = self.row("regras de negócio")
        self.assertIn("| parcial", row)
        self.assertIn("`docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`", row)  # entrada inválida cai no arquivo conhecido

    def test_future_collection_date_is_not_reported_as_fresh(self):
        self.source("docs/contexto/supabase", {"gerado_em": "2099-01-01T00:00:00Z", "entrada": "README.md"})
        self.run_index()
        row = self.row("banco real")
        self.assertIn("| não verificável", row)
        self.assertIn("data da coleta no futuro (2099-01-01 00:00 UTC)", row)
        self.assertNotIn("min atrás", row)
        self.assertNotIn("-", row.split("| não verificável")[1].split("⚠️")[0])  # nenhuma idade negativa

    def test_manifest_entry_cannot_point_outside_the_source_directory(self):
        (self.root / "segredo.md").write_text("fora da fonte\n", encoding="utf-8")
        self.source("docs/contexto/codigo", {"gerado_em": stamp(), "commit": HEAD, "entrada": "../../../segredo.md"})
        self.run_index()
        self.assertIn("`docs/contexto/codigo/INDEX.md`", self.row("código"))
        self.assertNotIn("segredo.md", self.index())


class FailureModeTests(IndiceCase):
    def test_corrupt_previous_index_is_rewritten(self):
        target = self.root / "docs/contexto/00-INDEX.md"
        target.write_bytes(b"\xff\xfe\x00lixo")
        result = self.run_index()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(self.index().startswith("# CONTEXTO PARA AGENTES DE IA"))

    def test_bad_arguments_and_unwritable_output_exit_2_without_traceback(self):
        (self.root / "dir").mkdir()
        cases = {
            "fonte sem =": subprocess.run([sys.executable, str(SCRIPT), "--repo", str(self.root), "--fonte", "semigual"],
                                          capture_output=True, text=True, timeout=60, check=False),
            "repo inexistente": self.run_index(repo=self.root / "nao-existe"),
            "out é diretório": self.run_index(out="dir"),
            "pai do out é arquivo": self.run_index(out="docs/contexto/supabase/README.md/x.md"),
        }
        for label, result in cases.items():
            with self.subTest(label):
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertIn("[indice]", result.stderr)
                self.assertNotIn("Traceback", result.stderr)
        self.assertFalse((self.root / "nao-existe").exists())

    def test_output_directory_is_created_and_no_sources_is_still_valid(self):
        result = self.run_index(out="novo/sub/INDEX.md", fontes=())
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Regras do protocolo", (self.root / "novo/sub/INDEX.md").read_text(encoding="utf-8"))

    @unittest.skipUnless(shutil.which("git"), "git não está instalado")
    def test_repo_without_commits_shows_nd_instead_of_the_word_head(self):
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        command = [sys.executable, str(SCRIPT), "--repo", str(self.root), "--out", "docs/contexto/00-INDEX.md", "--remote", "dono/repo",
                   "--fonte", "banco real=docs/contexto/supabase"]
        result = subprocess.run(command, capture_output=True, text=True, timeout=60, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("HEAD `n/d`", self.index())


if __name__ == "__main__":
    unittest.main()
