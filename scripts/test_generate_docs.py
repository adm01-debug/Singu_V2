"""Testes dos geradores de documentação do schema: generate_data_dictionary.py, generate_real_dict.py,
generate_er_diagram.py e generate_real_er.py (e da base comum _pgdocs.py).

Os testes offline rodam sempre. Os de integração usam um Postgres de teste (PGHOST/PGPORT/PGUSER),
criam um banco descartável com o schema de fixture e se pulam se não houver banco.
  PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres python3 -m pytest scripts/test_generate_docs.py
"""

from __future__ import annotations

import contextlib
import io
import pathlib
import re
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import _pgdocs
import _pgdocs_catalogo as catalogo
import _pgteste

GERADORES = ["generate_data_dictionary.py", "generate_real_dict.py", "generate_er_diagram.py", "generate_real_er.py"]
DICIONARIO, ER = GERADORES[:2], GERADORES[2:]
SEM_BANCO = ("PGHOST", "PGHOSTADDR", "PGDATABASE", "PGSERVICE", "PGPORT", "PGUSER", "PGPASSWORD", "SUPABASE_DB_URL")
# Gramática aceita pelo Mermaid erDiagram (subconjunto que os geradores emitem).
_ID = r"[A-Za-z][A-Za-z0-9_]*"
_PALAVRA = r"[A-Za-z][A-Za-z0-9_()\[\]]*"
LINHAS_MERMAID = [
    re.compile(r"^erDiagram$"),
    re.compile(rf"^    {_ID}( \{{)?$"),
    re.compile(rf'^        {_PALAVRA} {_PALAVRA} (PK|FK|UK)(, (PK|FK|UK))*( "[^"`\n]*")?$'),
    re.compile(r"^    \}$"),
    re.compile(rf'^    {_ID} (\|\||\|o)--(o\{{|o\|) {_ID} : "[^"`\n]+"$'),
]


def celulas(linha: str) -> list[str]:
    """Divide uma linha de tabela GFM nos `|` não escapados."""
    return re.split(r"(?<!\\)\|", linha.strip())[1:-1]


def blocos_mermaid(texto: str) -> list[list[str]]:
    return [bloco.strip("\n").split("\n") for bloco in re.findall(r"```mermaid\n(.*?)\n```", texto, re.DOTALL)]


class BaseOffline(unittest.TestCase):
    def test_url_vira_variaveis_sem_vazar_senha(self):
        amb = _pgdocs.ambiente_psql({"SUPABASE_DB_URL": "postgresql://u%40x:s3nh%40%2F@db.exemplo.test:6543/meu%20db"
                                     "?sslmode=require&connect_timeout=5", "PGHOST": "errado", "PGSERVICE": "x"})
        self.assertEqual((amb["PGHOST"], amb["PGPORT"], amb["PGUSER"], amb["PGPASSWORD"], amb["PGDATABASE"]),
                         ("db.exemplo.test", "6543", "u@x", "s3nh@/", "meu db"))
        self.assertEqual((amb["PGSSLMODE"], amb["PGCONNECT_TIMEOUT"]), ("require", "5"))
        self.assertNotIn("PGSERVICE", amb)
        self.assertNotIn("SUPABASE_DB_URL", amb)

    def test_url_invalida_ou_ausente_e_erro_de_uso_sem_ecoar_a_url(self):
        for url in ("mysql://u:segredo123@h/db", "postgres://u:segredo123@h:porta/db", "postgres://u:segredo123@h/db?pgbouncer=true"):
            with self.assertRaises(_pgdocs.ErroUso) as ctx:
                _pgdocs.ambiente_psql({"SUPABASE_DB_URL": url})
            self.assertNotIn("segredo123", str(ctx.exception))
        with self.assertRaises(_pgdocs.ErroUso) as ctx:
            _pgdocs.ambiente_psql({"PATH": "/usr/bin", "PGPORT": "5432"})
        self.assertIn("Banco não configurado", str(ctx.exception))
        self.assertEqual(_pgdocs.ambiente_psql({"PGHOST": "h"})["PGCLIENTENCODING"], "UTF8")

    def test_erro_do_psql_tem_senha_mascarada(self):
        amb = {"PGPASSWORD": "s3nh@"}
        limpo = _pgdocs._limpar_erro('falha em postgres://u:s3nh%40@h/db com "s3nh@"\n\n', amb)
        self.assertNotIn("s3nh", limpo)

    def test_escape_de_markdown(self):
        self.assertEqual(_pgdocs.md_texto("a|b\nc `d` *e* _f_ <g> [h] & \\ #"),
                         r"a\|b<br>c \`d\` \*e\* \_f\_ &lt;g&gt; \[h\] &amp; \\ \#")
        self.assertEqual(_pgdocs.md_texto(None), "")
        self.assertEqual(_pgdocs.md_texto("x\r\ny\tz\x00"), "x<br>y z")
        self.assertEqual(_pgdocs.md_codigo("a|b"), r"`a\|b`")
        self.assertEqual(_pgdocs.md_codigo("a `b` c"), "``a `b` c``")
        self.assertEqual(_pgdocs.md_codigo("`x`"), "`` `x` ``")
        self.assertEqual(_pgdocs.md_codigo("l1\nl2"), "`l1⏎l2`")
        self.assertEqual(_pgdocs.md_codigo(""), "")
        self.assertEqual(_pgdocs.bloco_codigo("a ``` b", "sql"), "````sql\na ``` b\n````")

    def test_identificadores_mermaid_sem_colisao_e_sem_palavra_reservada(self):
        nomes = catalogo.NomesMermaid(["a-b", "a b", "a_b", "class", "1x", "ação", "Tabela", "tabela", ""])
        ids = list(nomes.mapa.values())
        self.assertEqual(len(ids), len(set(ids)))
        for ident in ids:
            self.assertRegex(ident, rf"^{_ID}$")
        self.assertEqual((nomes["class"], nomes["1x"], nomes["ação"], nomes["a_b"]), ("class_t", "t_1x", "acao", "a_b"))
        self.assertEqual(catalogo.NomesMermaid(["b", "a"]).mapa, catalogo.NomesMermaid(["a", "b"]).mapa)
        self.assertEqual(catalogo.mermaid_rotulo('a "b"\n`c`'), "\"a 'b' 'c'\"")
        self.assertEqual(catalogo.mermaid_palavra("numeric(12,2)"), "numeric(12_2)")
        self.assertEqual(catalogo.mermaid_palavra('outro."Tipo X"[]'), "outro_Tipo_X_[]")
        self.assertEqual(catalogo.cardinalidade(True, False), "||--o{")
        self.assertEqual(catalogo.cardinalidade(False, True), "|o--o|")

    def test_secoes_convivem_no_mesmo_arquivo(self):
        secoes = [("a", "gera_a.py"), ("b", "gera_b.py")]
        so_a = _pgdocs.montar_documento(None, "T", secoes, "a", "corpo A\n")
        self.assertIn("rode `python3 scripts/gera_b.py`", so_a)
        ab = _pgdocs.montar_documento(so_a, "T", secoes, "b", "corpo B\n| x | <!-- singu-docs:b:fim --> |\n")
        ba = _pgdocs.montar_documento(_pgdocs.montar_documento(None, "T", secoes, "b",
                                      "corpo B\n| x | <!-- singu-docs:b:fim --> |\n"), "T", secoes, "a", "corpo A\n")
        self.assertEqual(ab, ba)  # a ordem de execução não muda o arquivo
        novo_a = _pgdocs.montar_documento(ab, "T", secoes, "a", "A2\n")
        self.assertIn("A2", novo_a)
        self.assertNotIn("corpo A", novo_a)
        self.assertIn("| x | <!-- singu-docs:b:fim --> |", novo_a)  # marcador no meio de linha não corta a seção
        legado = _pgdocs.montar_documento("# velho\n\n> Gerado em 2026-05-13\n", "T", secoes, "a", "A\n")
        self.assertNotIn("velho", legado)

    def test_publicar_e_atomico_e_check_nao_escreve(self):
        with (tempfile.TemporaryDirectory() as tmp, contextlib.redirect_stdout(io.StringIO()),
              contextlib.redirect_stderr(io.StringIO())):
            destino = pathlib.Path(tmp) / "sub dir" / "saída é.md"
            self.assertEqual(_pgdocs.publicar(destino, "v1\n", so_checar=True), _pgdocs.SAIDA_DIFERENTE)
            self.assertFalse(destino.exists())
            self.assertEqual(_pgdocs.publicar(destino, "v1\n", so_checar=False), _pgdocs.SAIDA_OK)
            self.assertEqual(_pgdocs.publicar(destino, "v1\n", so_checar=True), _pgdocs.SAIDA_OK)
            self.assertEqual(_pgdocs.publicar(destino, "v2\n", so_checar=True), _pgdocs.SAIDA_DIFERENTE)
            self.assertEqual(destino.read_text(encoding="utf-8"), "v1\n")
            with mock.patch("os.replace", side_effect=KeyboardInterrupt), self.assertRaises(KeyboardInterrupt):
                _pgdocs.publicar(destino, "v2\n", so_checar=False)
            self.assertEqual(destino.read_text(encoding="utf-8"), "v1\n")
            self.assertEqual([p.name for p in destino.parent.iterdir()], [destino.name])  # sem temporário órfão
            with self.assertRaises(_pgdocs.ErroUso):
                _pgdocs.publicar(pathlib.Path(tmp), "x", so_checar=False)

    def test_envelope_traduz_excecoes_em_codigos(self):
        def falha(exc):
            def principal(_argv):
                raise exc
            return principal
        with mock.patch("sys.stderr"):
            self.assertEqual(_pgdocs.executar(falha(_pgdocs.ErroUso("x"))), 2)
            self.assertEqual(_pgdocs.executar(falha(_pgdocs.ErroBanco("x"))), 3)
            self.assertEqual(_pgdocs.executar(falha(KeyboardInterrupt())), 130)

    def test_saida_padrao_fica_em_docs_na_raiz_do_repo(self):
        esperado = {"generate_data_dictionary.py": "docs/data-dictionary.md", "generate_real_dict.py": "docs/data-dictionary.md",
                    "generate_er_diagram.py": "docs/er-diagram.md", "generate_real_er.py": "docs/er-diagram.md"}
        for script, caminho in esperado.items():
            modulo = __import__(script.removesuffix(".py"))
            args = _pgdocs.criar_parser("x", modulo.SAIDA_PADRAO).parse_args([])
            self.assertEqual(_pgdocs.destino_de(args), _pgteste.RAIZ / caminho)
            self.assertEqual(modulo.SCRIPT, script)

    def test_sem_banco_configurado_erro_claro_e_nada_escrito(self):
        with tempfile.TemporaryDirectory() as tmp:
            for script in GERADORES:
                r = _pgteste.rodar(script, "--out", f"{tmp}/x.md", limpar=SEM_BANCO)
                self.assertEqual(r.returncode, 2, r.stderr)
                self.assertIn("Banco não configurado", r.stderr)
            self.assertEqual(list(pathlib.Path(tmp).iterdir()), [])

    def test_banco_fora_do_ar_ou_sem_psql_nao_gera_nada(self):
        with tempfile.TemporaryDirectory() as tmp:
            fora = {"PGHOST": "127.0.0.1", "PGPORT": "1", "PGUSER": "x", "PGDATABASE": "x", "PGCONNECT_TIMEOUT": "3"}
            for script in GERADORES:
                r = _pgteste.rodar(script, "--out", f"{tmp}/x.md", extra=fora, limpar=("SUPABASE_DB_URL",))
                self.assertEqual(r.returncode, 3, r.stderr)
                self.assertIn("Nada foi gerado", r.stderr)
                self.assertNotIn("Traceback", r.stderr)
            r = _pgteste.rodar(GERADORES[0], "--out", f"{tmp}/x.md", extra={**fora, "PATH": tmp})
            self.assertEqual(r.returncode, 2)
            self.assertIn("psql", r.stderr)
            url = {"SUPABASE_DB_URL": "postgres://u:SenhaSuperSecreta9@127.0.0.1:1/x?connect_timeout=3"}
            r = _pgteste.rodar(GERADORES[1], "--out", f"{tmp}/x.md", extra=url)
            self.assertEqual(r.returncode, 3)
            self.assertNotIn("SenhaSuperSecreta9", r.stderr + r.stdout)
            self.assertEqual(list(pathlib.Path(tmp).iterdir()), [])

    def test_argumentos_invalidos(self):
        for args in (["--data", "13/05/2026"], ["--timeout", "0"], ["--nao-existe"]):
            r = _pgteste.rodar(GERADORES[0], *args, limpar=SEM_BANCO)
            self.assertEqual(r.returncode, 2, args)
        self.assertEqual(_pgteste.rodar(GERADORES[2], "--max-relacoes", "0", limpar=SEM_BANCO).returncode, 2)
        ajuda = _pgteste.rodar(GERADORES[3], "--help", limpar=SEM_BANCO)
        self.assertEqual(ajuda.returncode, 0)
        self.assertIn("--check", ajuda.stdout)


MOTIVO = _pgteste.motivo_indisponivel()


@unittest.skipIf(MOTIVO, MOTIVO)
class GeradoresComBanco(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.banco = _pgteste.criar_banco("docs", _pgteste.FIXTURE)
        cls.tmp = tempfile.TemporaryDirectory()
        cls.dir = pathlib.Path(cls.tmp.name)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()
        _pgteste.remover_banco(cls.banco)

    def gerar(self, script, saida, *args, esquema="app", ok=True, **kw):
        r = _pgteste.rodar(script, "--schema", esquema, "--out", str(saida), *args, banco=self.banco, **kw)
        if ok:
            self.assertEqual(r.returncode, 0, r.stderr)
        return r

    def test_dicionario_reflete_o_catalogo_com_escape_correto(self):
        saida = self.dir / "com espaço é" / "dicionário.md"
        for script in DICIONARIO:
            self.gerar(script, saida, cwd="/")  # cwd diferente da raiz + diretório novo com espaço/acento
        texto = saida.read_text(encoding="utf-8")
        self.assertIn("Schema `app`: 9 tabela(s) e 1 view(s); 7 sem descrição no banco", texto)
        self.assertIn(r"| `empresas` | tabela | 3 | `id` | não | Empresas (PJ) \| clientes<br>e \`prospects\` "
                      r"&lt;b&gt;\*ativos\*&lt;/b&gt; |", texto)
        self.assertIn("| `Tabela Mista` | tabela | 3 | `Id Estranho`, `sub id` | não | Nome com maiúscula e espaço |", texto)
        self.assertIn("| `contatos` | tabela | 10 | `id` | sim | — |", texto)
        self.assertIn("| `medidas` | tabela particionada | 2 | `id`, `dia` | não | — |", texto)
        self.assertIn("| `vw_contatos` | view | 2 | — | — | View de apoio |", texto)
        self.assertNotIn("medidas_2026", texto)  # partição filha não é listada
        self.assertIn("| `apelido` | `text` | YES | ``'a\\|b `c` \"d\"⏎''e'''::text`` |  |", texto)
        self.assertIn("| `id` | `bigint` | NO | `GENERATED ALWAYS AS IDENTITY` |  |", texto)
        self.assertIn(r"| `nome_completo` | `text` | YES | `GENERATED ALWAYS AS ((apelido \|\| ' x'::text)) STORED` |  |", texto)
        # tipos/defaults fora do pg_catalog saem sempre com o schema (igual para qualquer role)
        self.assertIn("| `status` | `app.status_negocio` | NO | `'aberto'::app.status_negocio` |  |", texto)
        self.assertIn("| `id` | `integer` | NO | `nextval('app.itens_id_seq'::regclass)` |  |", texto)
        self.assertIn(r'| `nome` | `text` | NO |  | Razão social \| fantasia<br>segunda linha com \`crase\` e "aspas" |', texto)
        self.assertIn(r"| `col\|pipe` | `text` | YES |  |  |", texto)
        self.assertIn(r"| `app.status_negocio` | `aberto`, `ganho`, `perdido \| cancelado` |", texto)
        self.assertNotRegex(texto, r"\d{4}-\d{2}-\d{2}")  # sem data volátil
        # toda linha de tabela tem o mesmo número de colunas do seu cabeçalho
        colunas = None
        for linha in texto.splitlines():
            if linha.startswith("|"):
                colunas = colunas or len(celulas(linha))
                self.assertEqual(len(celulas(linha)), colunas, linha)
            else:
                colunas = None

    def test_er_reflete_as_fks_e_o_mermaid_e_valido(self):
        saida = self.dir / "er.md"
        for script in ER:
            self.gerar(script, saida)
        texto = saida.read_text(encoding="utf-8")
        self.assertIn("9 tabela(s), 8 chave(s) estrangeira(s) em 7 par(es) de tabelas; 1 tabela(s) sem relacionamento", texto)
        for linha in ('    Tabela_Mista ||--o{ itens : "mista_id, mista_sub"',      # FK composta, pai com nome citado
                      '    outro_usuarios |o--o{ contatos : "criado_por / dono_id"',  # 2 FKs p/ o mesmo pai, outro schema
                      '    contatos |o--o| itens : "contato_id"',                    # 1:1 opcional (coluna UNIQUE)
                      '    itens |o--o{ itens : "pai_id"',                           # auto-relacionamento
                      '    class_t |o--o{ tabela_mista : "c"',                       # palavra reservada do Mermaid
                      '    outro_usuarios ||--o{ contatos : "dono_id -> id"',        # detalhe: FK obrigatória
                      '        integer Id_Estranho PK "Id Estranho"', '        bigint contato_id FK, UK'):
            self.assertIn(linha + "\n", texto)
        self.assertIn("| `itens` | `mista_id`, `mista_sub` | `Tabela Mista` | `Id Estranho`, `sub id` | `itens_mista_fk` "
                      "| NO ACTION | CASCADE | sim | não |", texto)
        self.assertIn("| `contatos` | `empresa_id` | `empresas` | `id` | `contatos_empresa_id_fkey` | SET NULL |", texto)
        self.assertIn("### Tabelas sem relacionamento\n\n`solta`\n", texto)
        self.assertIn("| `Tabela Mista` | `Tabela_Mista` |", texto)
        blocos = blocos_mermaid(texto)
        self.assertEqual(len(blocos), 2)
        for bloco in blocos:
            for linha in bloco:
                self.assertTrue(any(p.match(linha) for p in LINHAS_MERMAID), f"linha fora da gramática: {linha!r}")

    def test_deterministico_check_e_secoes_independentes(self):
        for par, nome in ((DICIONARIO, "d.md"), (ER, "e.md")):
            a, b = self.dir / f"a-{nome}", self.dir / f"b-{nome}"
            self.gerar(par[0], a)
            self.gerar(par[1], a)
            self.gerar(par[1], b)  # ordem inversa
            self.gerar(par[0], b)
            self.assertEqual(a.read_bytes(), b.read_bytes())
            antes = a.read_bytes()
            for script in par:
                self.assertIn("Sem mudança", self.gerar(script, a).stdout)
                self.assertEqual(self.gerar(script, a, "--check").returncode, 0)
            self.assertEqual(a.read_bytes(), antes)

    def test_check_detecta_mudanca_no_banco_sem_escrever(self):
        saidas = {s: self.dir / f"drift-{s}.md" for s in GERADORES}
        for script, saida in saidas.items():
            self.gerar(script, saida)
        _pgteste.psql("CREATE TABLE app.nova (id int PRIMARY KEY, e uuid REFERENCES app.empresas(id));", self.banco)
        try:
            for script, saida in saidas.items():
                antes = saida.read_bytes()
                r = self.gerar(script, saida, "--check", ok=False)
                self.assertEqual(r.returncode, 1, script)
                self.assertIn("DIFERENTE", r.stderr)
                self.assertIn("nova", r.stderr)
                self.assertEqual(saida.read_bytes(), antes)
                self.gerar(script, saida)
                self.assertEqual(self.gerar(script, saida, "--check").returncode, 0)
        finally:
            _pgteste.psql("DROP TABLE app.nova;", self.banco)
        ausente = self.gerar(GERADORES[0], self.dir / "nao-existe.md", "--check", ok=False)
        self.assertEqual(ausente.returncode, 1)
        self.assertFalse((self.dir / "nao-existe.md").exists())

    def test_schema_vazio_documenta_vazio_e_schema_inexistente_e_erro(self):
        for script in GERADORES:
            saida = self.dir / f"vazio-{script}.md"
            self.gerar(script, saida, esquema="vazio")
            self.assertRegex(saida.read_text(encoding="utf-8"), r"_Nenhuma (tabela|tabela ou view) encontrada no schema `vazio`\._")
            fantasma = self.dir / f"fantasma-{script}.md"
            r = self.gerar(script, fantasma, esquema="nao_existe; DROP SCHEMA app CASCADE", ok=False)
            self.assertEqual(r.returncode, 2)
            self.assertIn("não existe neste banco", r.stderr)
            self.assertFalse(fantasma.exists())
        self.assertEqual(_pgteste.psql("SELECT count(*) FROM pg_namespace WHERE nspname = 'app'", self.banco), "1")

    def test_data_injetavel_e_arquivo_legado_e_substituido(self):
        saida = self.dir / "legado.md"
        saida.write_text("# 📖 Dicionário de Dados — SINGU CRM\n\n> Gerado automaticamente em 2026-05-13\n\n## antigo\n", encoding="utf-8")
        self.assertEqual(self.gerar(DICIONARIO[1], saida, "--check", ok=False).returncode, 1)
        self.gerar(DICIONARIO[1], saida, "--data", "2026-11-09")
        texto = saida.read_text(encoding="utf-8")
        self.assertIn("> Gerado automaticamente por `scripts/generate_real_dict.py` em 2026-11-09 a partir", texto)
        self.assertNotIn("2026-05-13", texto)
        self.assertIn("rode `python3 scripts/generate_data_dictionary.py`", texto)
        self.assertEqual(self.gerar(DICIONARIO[1], saida, "--data", "2026-11-09", "--check").returncode, 0)

    def test_role_restrita_ve_o_mesmo_catalogo_e_a_sessao_e_somente_leitura(self):
        role = f"g3_ro_{self.banco[-10:]}"
        _pgteste.psql(f"CREATE ROLE {role} LOGIN;")
        try:
            for script in (DICIONARIO[1], ER[1]):
                dono, restrito = self.dir / f"dono-{script}.md", self.dir / f"restrito-{script}.md"
                self.gerar(script, dono)
                self.gerar(script, restrito, extra={"PGUSER": role})
                self.assertEqual(dono.read_bytes(), restrito.read_bytes())
        finally:
            _pgteste.psql(f"DROP ROLE {role};")
        amb = _pgdocs.ambiente_psql({**_pgteste._ambiente(self.banco)})
        self.assertEqual(_pgdocs.consultar_json("SELECT to_jsonb(current_setting('transaction_read_only'))", amb), "on")
        with self.assertRaisesRegex(_pgdocs.ErroBanco, "read-only transaction"):
            _pgdocs.consultar_json("CREATE TABLE app.invasora (x int)", amb)
        with self.assertRaisesRegex(_pgdocs.ErroBanco, "statement timeout"):
            _pgdocs.consultar_json("SELECT to_jsonb(count(*)) FROM generate_series(1, 200000000)", amb, timeout_consulta_s=1)
        self.assertEqual(_pgteste.psql("SELECT to_regclass('app.invasora') IS NULL", self.banco), "t")

    def test_schema_grande_e_fatiado_em_diagramas_validos(self):
        ddl = ["CREATE SCHEMA grande; CREATE TABLE grande.raiz (id int PRIMARY KEY);"]
        ddl += [f"CREATE TABLE grande.t{i:03d} (id int PRIMARY KEY, raiz_id int NOT NULL REFERENCES grande.raiz(id)"
                + (f", ant int REFERENCES grande.t{i - 1:03d}(id)" if i else "") + ");" for i in range(300)]
        _pgteste.psql("\n".join(ddl), self.banco)
        try:
            geral, detalhe = self.dir / "grande-geral.md", self.dir / "grande-detalhe.md"
            self.gerar(ER[0], geral, "--max-relacoes", "100", esquema="grande")
            self.gerar(ER[1], detalhe, esquema="grande")
            blocos = blocos_mermaid(geral.read_text(encoding="utf-8"))
            self.assertEqual([len(b) - 1 for b in blocos], [100] * 5 + [99])  # 599 pares em 6 partes
            self.assertIn("### Parte 6 de 6", geral.read_text(encoding="utf-8"))
            blocos_det = blocos_mermaid(detalhe.read_text(encoding="utf-8"))
            self.assertEqual(len(blocos_det), 16)  # 301 tabelas / 20 por diagrama
            for bloco in blocos + blocos_det:
                self.assertLess(len("\n".join(bloco)), 50_000)  # limite de texto do Mermaid
                for linha in bloco:
                    self.assertTrue(any(p.match(linha) for p in LINHAS_MERMAID), linha)
            self.gerar(DICIONARIO[1], self.dir / "grande-dic.md", esquema="grande")
            self.assertEqual((self.dir / "grande-dic.md").read_text(encoding="utf-8").count("## 📋 Tabela:"), 301)
        finally:
            _pgteste.psql("DROP SCHEMA grande CASCADE;", self.banco)


if __name__ == "__main__":
    unittest.main()
