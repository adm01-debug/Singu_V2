"""Testes do run_explain_analyze.py e do validador de SQL somente-leitura (_sqlseguro.py).

Os testes offline rodam sempre. Os de integração usam um Postgres de teste (PGHOST/PGPORT/PGUSER),
criam um banco descartável e se pulam se não houver banco.
  PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres python3 -m pytest scripts/test_run_explain_analyze.py
"""

from __future__ import annotations

import pathlib
import re
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import _pgteste
import _sqlseguro
import run_explain_analyze as explain

SCRIPT = "run_explain_analyze.py"
SEM_BANCO = ("PGHOST", "PGHOSTADDR", "PGDATABASE", "PGSERVICE", "PGPORT", "PGUSER", "PGPASSWORD", "SUPABASE_DB_URL")
BASE = """
CREATE TABLE public.contacts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), first_name text, user_id uuid);
CREATE TABLE public.deals(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, pipeline_stage text,
  updated_at timestamptz DEFAULT now());
CREATE TABLE public.interactions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), contact_id uuid,
  created_at timestamptz DEFAULT now());
CREATE INDEX ix_g3_timeline ON public.interactions(contact_id, created_at DESC);
INSERT INTO public.interactions(contact_id) SELECT gen_random_uuid() FROM generate_series(1, 3000);
CREATE TABLE public.auditoria(quando timestamptz DEFAULT now());
CREATE FUNCTION public.explode() RETURNS int LANGUAGE plpgsql VOLATILE AS $$ BEGIN RAISE EXCEPTION 'executou de verdade'; END $$;
CREATE FUNCTION public.grava() RETURNS int LANGUAGE plpgsql VOLATILE AS $$ BEGIN INSERT INTO public.auditoria DEFAULT VALUES; RETURN 1; END $$;
ANALYZE;
"""


class ValidadorSql(unittest.TestCase):
    def test_divide_respeitando_strings_dolar_e_comentarios(self):
        texto = """
        -- nome: Primeira; com ponto e vírgula no título
        SELECT 'a;b', "col;una", $$x;y$$, $tag$ ; $outra$ ; $tag$, E'it\\'s; ok' /* ; /* aninhado ; */ ; */ FROM t;
        -- comentário solto; sem comando
        ;
        /* bloco */ WITH c AS (SELECT 1) SELECT * FROM c -- fim; aqui
        """
        comandos = _sqlseguro.carregar(texto)
        self.assertEqual(len(comandos), 2)
        self.assertEqual(comandos[0].nome, "Primeira; com ponto e vírgula no título")
        self.assertTrue(comandos[0].sql.startswith("SELECT 'a;b'"))
        self.assertTrue(comandos[0].sql.endswith("FROM t"))
        self.assertIsNone(comandos[1].nome)
        self.assertTrue(comandos[1].sql.startswith("WITH c AS"))
        self.assertEqual(comandos[1].esqueleto, "WITH c AS (SELECT 1) SELECT * FROM c")
        self.assertEqual(_sqlseguro.carregar("  -- só comentário\n /* e outro */ ;; "), [])

    def test_aceita_leitura_legitima(self):
        for sql in ("select 1", "(SELECT 1) UNION ALL (SELECT 2)", "WITH RECURSIVE r AS (SELECT 1) SELECT * FROM r",
                    "SELECT updated_at, \"update\", 'DELETE FROM x', $$INSERT INTO$$ FROM t WHERE a = $1",
                    "SELECT x::text, arr[1:2] FROM t WHERE nome LIKE '%\\_%' ORDER BY 1 LIMIT 5",
                    "SELECT now() - interval '1 day', count(*) FILTER (WHERE ok) FROM deleted_items"):
            self.assertEqual(len(_sqlseguro.carregar(sql)), 1, sql)

    def test_recusa_tudo_que_nao_e_select_puro(self):
        recusados = {
            "DELETE FROM contacts": "começa com 'DELETE'",
            "SELECT 1; DROP TABLE contacts": "comando 2",
            "SELECT '\\'; DROP TABLE contacts; --'": "comando 2",  # barra não escapa aspas fora de E''
            "WITH d AS (DELETE FROM contacts RETURNING *) SELECT * FROM d": "DELETE",
            "WITH i AS (INSERT INTO t VALUES (1) RETURNING *) SELECT * FROM i": "INSERT",
            "SELECT * INTO copia FROM contacts": "INTO",
            "SELECT * FROM contacts FOR UPDATE": "UPDATE",
            "SELECT * FROM contacts FOR SHARE": "FOR UPDATE/SHARE",
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity": "pg_terminate_backend",
            "SELECT PG_SLEEP (10)": "PG_SLEEP",
            "select set_config('x','y',false)": "set_config",
            "SELECT http_get('http://exemplo.test')": "http_get",
            "SELECT 1 \\gexec": "barra invertida",
            "\\! touch /tmp/g3_invasao": "barra invertida",
            "EXPLAIN ANALYZE DELETE FROM t": "começa com 'EXPLAIN'",
            "COPY t TO '/tmp/x'": "começa com 'COPY'",
            "TABLE contacts": "começa com 'TABLE'",
            "/* SELECT */ UPDATE t SET a = 1": "começa com 'UPDATE'",
        }
        for sql, trecho in recusados.items():
            with self.assertRaises(_sqlseguro.SqlInvalido, msg=sql) as ctx:
                _sqlseguro.carregar(sql)
            self.assertIn(trecho, str(ctx.exception), sql)

    def test_sql_malformado_e_recusado(self):
        for sql in ("SELECT 'sem fim", 'SELECT "sem fim', "SELECT $a$ sem fim", "SELECT 1 /* sem fim", "SELECT 1\x00"):
            with self.assertRaises(_sqlseguro.SqlInvalido, msg=sql):
                _sqlseguro.carregar(sql)

    def test_consultas_embutidas_sao_validas_e_sem_dado_real(self):
        for esquema in ("public", 'Esq "X"'):
            comandos = _sqlseguro.carregar(explain.consultas_centrais(esquema))
            self.assertEqual(len(comandos), 3)
            self.assertTrue(all(c.nome for c in comandos))
        texto = explain.consultas_centrais("public")
        self.assertIn("FROM public.contacts", texto)
        self.assertIn('FROM "Esq ""X""".deals', explain.consultas_centrais('Esq "X"'))
        uuids = set(re.findall(r"[0-9a-f]{8}-[0-9a-f-]{27}", texto))
        self.assertEqual(uuids, {explain.UUID_NEUTRO})

    def test_arvore_reconstroi_o_plano(self):
        plano = {"Node Type": "Limit", "Startup Cost": 0.28, "Total Cost": 8.3, "Plan Rows": 1, "Plan Width": 40,
                 "Plans": [{"Node Type": "Index Scan", "Index Name": "ix", "Relation Name": "t", "Startup Cost": 0.28,
                            "Total Cost": 8.3, "Plan Rows": 1, "Plan Width": 40, "Index Cond": "(a = 1)",
                            "Actual Startup Time": 0.01, "Actual Total Time": 0.02, "Actual Rows": 0, "Actual Loops": 1}]}
        self.assertEqual(explain.arvore(plano), [
            "Limit  (cost=0.28..8.30 rows=1 width=40)",
            "  ->  Index Scan using ix on t  (cost=0.28..8.30 rows=1 width=40) (actual time=0.010..0.020 rows=0 loops=1)",
            "        Index Cond: (a = 1)"])


class SemBanco(unittest.TestCase):
    def test_sem_banco_erro_claro_e_nada_escrito(self):
        with tempfile.TemporaryDirectory() as tmp:
            r = _pgteste.rodar(SCRIPT, "--out", f"{tmp}/e.md", limpar=SEM_BANCO)
            self.assertEqual(r.returncode, 2)
            self.assertIn("Banco não configurado", r.stderr)
            fora = {"PGHOST": "127.0.0.1", "PGPORT": "1", "PGUSER": "x", "PGDATABASE": "x", "PGCONNECT_TIMEOUT": "3"}
            r = _pgteste.rodar(SCRIPT, "--out", f"{tmp}/e.md", extra=fora, limpar=("SUPABASE_DB_URL",))
            self.assertEqual(r.returncode, 3)
            self.assertIn("Nada foi gerado", r.stderr)
            self.assertEqual(list(pathlib.Path(tmp).iterdir()), [])

    def test_consulta_perigosa_e_recusada_antes_de_conectar(self):
        with tempfile.TemporaryDirectory() as tmp:
            arquivo = pathlib.Path(tmp) / "consultas perigosas.sql"
            for sql in ("SELECT 1; DROP TABLE contacts;", "DELETE FROM contacts;", "\\! touch " + tmp + "/invadiu"):
                arquivo.write_text(sql, encoding="utf-8")
                r = _pgteste.rodar(SCRIPT, "--query-file", str(arquivo), "--out", f"{tmp}/e.md", limpar=SEM_BANCO)
                self.assertEqual(r.returncode, 2, sql)
                self.assertIn("consulta recusada", r.stderr)
            arquivo.write_text("-- nada aqui\n", encoding="utf-8")
            self.assertIn("nenhuma consulta", _pgteste.rodar(SCRIPT, "--query-file", str(arquivo), limpar=SEM_BANCO).stderr)
            self.assertEqual(_pgteste.rodar(SCRIPT, "--query-file", f"{tmp}/nao-existe.sql", limpar=SEM_BANCO).returncode, 2)
            self.assertEqual(sorted(p.name for p in pathlib.Path(tmp).iterdir()), ["consultas perigosas.sql"])

    def test_check_nao_combina_com_medicoes_volateis(self):
        for extra in (["--analyze"], ["--top-queries"]):
            r = _pgteste.rodar(SCRIPT, "--check", *extra, limpar=SEM_BANCO)
            self.assertEqual(r.returncode, 2)
            self.assertIn("--check só vale no modo padrão", r.stderr)


MOTIVO = _pgteste.motivo_indisponivel()


@unittest.skipIf(MOTIVO, MOTIVO)
class ExplainComBanco(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.banco = _pgteste.criar_banco("explain", BASE)
        cls.tmp = tempfile.TemporaryDirectory()
        cls.dir = pathlib.Path(cls.tmp.name)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()
        _pgteste.remover_banco(cls.banco)

    def rodar(self, *args, **kw):
        return _pgteste.rodar(SCRIPT, *args, banco=self.banco, **kw)

    def consultas(self, nome, texto):
        arquivo = self.dir / nome
        arquivo.write_text(texto, encoding="utf-8")
        return str(arquivo)

    def test_modo_padrao_documenta_o_plano_real_sem_executar(self):
        saida = self.dir / "perf dir" / "explain.md"
        r = self.rodar("--out", str(saida), cwd="/")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("3 de 3 consulta(s) explicadas", r.stdout)
        texto = saida.read_text(encoding="utf-8")
        self.assertIn("as consultas NÃO foram executadas", texto)
        self.assertIn("Acessos a dados: `Index Scan using ix_g3_timeline on interactions`.", texto)  # índice REAL do banco
        self.assertIn("⚠️ Varredura sequencial (tabela lida inteira) em: `contacts`.", texto)
        self.assertRegex(texto, r"\| Custo estimado \(inicial\.\.total\) \| \d+\.\d\d\.\.\d+\.\d\d \|")
        self.assertRegex(texto, r"Servidor: PostgreSQL \d+\.")
        for fabricado in ("OTIMIZADO", "contacts_first_name_idx", "deals_stage_id_user_id_idx", "Tempo de execução", "actual time"):
            self.assertNotIn(fabricado, texto)
        self.assertNotRegex(texto, r"\d{4}-\d{2}-\d{2}")
        # estável: segunda execução não muda nada e --check passa
        self.assertIn("Sem mudança", self.rodar("--out", str(saida)).stdout)
        self.assertEqual(self.rodar("--out", str(saida), "--check").returncode, 0)
        _pgteste.psql("DROP INDEX public.ix_g3_timeline;", self.banco)
        try:
            desatualizado = self.rodar("--out", str(saida), "--check")
            self.assertEqual(desatualizado.returncode, 1)
            self.assertNotIn("Seq Scan on interactions", saida.read_text(encoding="utf-8"))
        finally:
            _pgteste.psql("CREATE INDEX ix_g3_timeline ON public.interactions(contact_id, created_at DESC);", self.banco)

    def test_analyze_mede_tempo_real_e_so_ele_executa_a_consulta(self):
        arquivo = self.consultas("explode.sql", "-- nome: Prova de execução\nSELECT public.explode();")
        saida = self.dir / "explode.md"
        sem_executar = self.rodar("--query-file", arquivo, "--out", str(saida))
        self.assertEqual(sem_executar.returncode, 0, sem_executar.stderr)  # EXPLAIN puro não chama a função
        self.assertIn("## 1. Prova de execução", saida.read_text(encoding="utf-8"))
        executando = self.rodar("--query-file", arquivo, "--out", str(self.dir / "explode2.md"), "--analyze")
        self.assertEqual(executando.returncode, 3)
        self.assertIn("executou de verdade", executando.stderr)
        self.assertFalse((self.dir / "explode2.md").exists())
        real = self.dir / "analyze.md"
        r = self.rodar("--analyze", "--out", str(real), "--data", "2026-11-09")
        self.assertEqual(r.returncode, 0, r.stderr)
        texto = real.read_text(encoding="utf-8")
        self.assertIn("cada consulta foi EXECUTADA em transação somente-leitura com ROLLBACK", texto)
        self.assertEqual(len(re.findall(r"\| Tempo de execução \(real\) \| \d+\.\d{3} ms \|", texto)), 3)
        self.assertRegex(texto, r"\(actual time=\d+\.\d{3}\.\.\d+\.\d{3} rows=0 loops=1\)")
        self.assertIn("em 2026-11-09 com EXPLAIN real no banco", texto)

    def test_analyze_roda_em_transacao_somente_leitura(self):
        arquivo = self.consultas("grava.sql", "SELECT public.grava();")
        r = self.rodar("--query-file", arquivo, "--analyze", "--out", str(self.dir / "grava.md"))
        self.assertEqual(r.returncode, 3)
        self.assertIn("read-only transaction", r.stderr)
        self.assertEqual(_pgteste.psql("SELECT count(*) FROM public.auditoria", self.banco), "0")

    def test_falha_parcial_nao_grava_e_tolerar_erros_registra_a_falha(self):
        arquivo = self.consultas("parcial.sql", """
            -- nome: Boa | com `crase`
            SELECT id FROM public.contacts WHERE first_name = 'a|b `c`';
            -- nome: Quebrada
            SELECT * FROM public.tabela_que_nao_existe;
            SELECT count(*) FROM public.deals;
        """)
        saida = self.dir / "parcial.md"
        r = self.rodar("--query-file", arquivo, "--out", str(saida))
        self.assertEqual(r.returncode, 3)
        self.assertIn("FALHOU [2] Quebrada", r.stderr)
        self.assertIn("1 de 3 consulta(s) falharam", r.stderr)
        self.assertFalse(saida.exists())
        r = self.rodar("--query-file", arquivo, "--out", str(saida), "--tolerar-erros")
        self.assertEqual(r.returncode, 0, r.stderr)
        texto = saida.read_text(encoding="utf-8")
        self.assertIn(r"## 1. Boa \| com \`crase\`", texto)
        self.assertIn("first_name = 'a|b `c`'", texto)
        self.assertRegex(texto, r'❌ \*\*Falhou — sem plano:\*\* ERROR:\s+relation "public\.tabela\\_que\\_nao\\_existe" does not exist')
        self.assertIn("## 3. Consulta 3", texto)
        self.assertIn("Origem: arquivo `parcial.sql`", texto)
        self.assertEqual(texto.count("| Nó raiz do plano |"), 2)

    def test_timeout_e_consulta_gigante_dao_erro_claro(self):
        lenta = self.consultas("lenta.sql", "SELECT count(*) FROM generate_series(1, 300000000);")
        r = self.rodar("--query-file", lenta, "--analyze", "--timeout", "1", "--out", str(self.dir / "lenta.md"))
        self.assertEqual(r.returncode, 3)
        self.assertIn("statement timeout", r.stderr)
        gigante = self.consultas("gigante.sql", "SELECT '" + "x" * 300_000 + "';")
        r = self.rodar("--query-file", gigante, "--out", str(self.dir / "gigante.md"))
        self.assertEqual(r.returncode, 3)
        self.assertIn("consulta grande demais", r.stderr)
        self.assertNotIn("Traceback", r.stderr)
        self.assertFalse((self.dir / "gigante.md").exists())

    def test_top_queries_sem_extensao_vira_aviso_e_com_extensao_vira_tabela(self):
        saida = self.dir / "top.md"
        r = self.rodar("--top-queries", "5", "--out", str(saida))
        self.assertEqual(r.returncode, 0, r.stderr)
        texto = saida.read_text(encoding="utf-8")
        self.assertIn("## Consultas mais caras (pg_stat_statements, top 5)", texto)
        carregada = "pg_stat_statements" in _pgteste.psql("SHOW shared_preload_libraries")
        if not carregada:
            self.assertIn("AVISO: pg_stat_statements indisponível", r.stderr)
            self.assertIn("_pg_stat_statements não está ativo neste banco; não há ranking para mostrar._", texto)
            return
        _pgteste.psql("CREATE EXTENSION IF NOT EXISTS pg_stat_statements; SELECT 31337 AS marcador_g3_py;", self.banco)
        r = self.rodar("--top-queries", "50", "--out", str(saida))
        self.assertEqual(r.returncode, 0, r.stderr)
        texto = saida.read_text(encoding="utf-8")
        self.assertIn("| short_query | total_time | calls | mean_time | percentage_of_load | queryid |", texto)
        self.assertIn("marcador_g3_py", texto)


if __name__ == "__main__":
    unittest.main()
