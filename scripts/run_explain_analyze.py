"""EXPLAIN real das consultas centrais -> docs/perf/explain-analyze.md.

Roda o EXPLAIN de verdade no banco e documenta o plano, o custo e (com --analyze) o tempo reais.
Nada é simulado: sem banco, ou se uma consulta falhar, o script sai com erro e não escreve nada.

  * Padrão: `EXPLAIN (FORMAT JSON)` — só o plano estimado; a consulta NÃO é executada.
  * `--analyze`: `EXPLAIN (ANALYZE, BUFFERS)` — EXECUTA a consulta (e as funções que ela chamar)
    para medir tempo e leituras. Use com critério em produção.
  * Sempre em transação READ ONLY, com statement_timeout, encerrada com ROLLBACK.
  * Só aceita SELECT / WITH … SELECT (escrita, SELECT INTO e FOR UPDATE são recusados antes de conectar).

Consultas: as 3 centrais embutidas (parâmetros neutros: UUID zerado e termo "teste", sem dado de
cliente) ou `--query-file arquivo.sql` (comandos separados por `;`, título opcional em um
comentário `-- nome: ...` antes de cada um). `--top-queries [N]` acrescenta as consultas mais
caras do pg_stat_statements (via scripts/explain-top-queries.sql), se a extensão estiver ativa.

Uso:
  SUPABASE_DB_URL=postgres://... python3 scripts/run_explain_analyze.py
  python3 scripts/run_explain_analyze.py --analyze --query-file minhas.sql --out /tmp/explain.md
  python3 scripts/run_explain_analyze.py --check     # só no modo padrão (tempos mudam a cada execução)
"""

from __future__ import annotations

import csv
import io
import json
import pathlib
import re
import sys

import _pgdocs
import _sqlseguro

SCRIPT = "run_explain_analyze.py"
SAIDA_PADRAO = "docs/perf/explain-analyze.md"
SQL_TOP = pathlib.Path(__file__).resolve().parent / "explain-top-queries.sql"
UUID_NEUTRO = "00000000-0000-0000-0000-000000000000"
AVISO_SEM_PGSS = "pg_stat_statements indisponivel"


def consultas_centrais(esquema: str) -> str:
    """As 3 consultas centrais do CRM, com parâmetros neutros (nenhum dado real de cliente)."""
    s = esquema if re.fullmatch(r"[a-z_][a-z0-9_]*", esquema) else '"' + esquema.replace('"', '""') + '"'
    return f"""
-- nome: Listagem de contatos (busca por nome)
SELECT * FROM {s}.contacts WHERE first_name ILIKE '%teste%' LIMIT 50;
-- nome: Pipeline Kanban (negócios de um usuário por estágio)
SELECT * FROM {s}.deals WHERE user_id = '{UUID_NEUTRO}'::uuid ORDER BY pipeline_stage, updated_at DESC LIMIT 200;
-- nome: Timeline de interações de um contato
SELECT * FROM {s}.interactions WHERE contact_id = '{UUID_NEUTRO}'::uuid ORDER BY created_at DESC LIMIT 50;
"""


def explicar(sql: str, amb: dict[str, str], analisar: bool, timeout_s: int) -> dict:
    """Roda o EXPLAIN de UM comando já validado e devolve o JSON do plano."""
    opcoes = "ANALYZE, BUFFERS, FORMAT JSON" if analisar else "FORMAT JSON"
    # -c envia o texto direto ao servidor: nenhum meta-comando ou variável do psql é interpretado.
    args = ["-At",
            "-c", "SET default_transaction_read_only = on",
            "-c", "BEGIN TRANSACTION READ ONLY",
            "-c", f"SET LOCAL statement_timeout = {timeout_s * 1000}",
            "-c", "SET LOCAL lock_timeout = 5000",
            "-c", "SET LOCAL standard_conforming_strings = on",
            "-c", f"EXPLAIN ({opcoes}) {sql}",
            "-c", "ROLLBACK"]
    saida = _pgdocs.executar_psql(args, amb, limite_s=timeout_s + 60)
    try:
        plano = json.loads(saida)[0]
        plano["Plan"]["Node Type"]
    except (ValueError, LookupError, TypeError):
        raise _pgdocs.ErroBanco("o EXPLAIN não devolveu um plano em JSON.") from None
    return plano


def _nos(no: dict):
    yield no
    for filho in no.get("Plans", []):
        yield from _nos(filho)


def _descricao(no: dict) -> str:
    texto = no["Node Type"]
    if no.get("Index Name"):
        texto += f" using {no['Index Name']}"
    if no.get("Relation Name"):
        texto += f" on {no['Relation Name']}"
    return texto


def arvore(no: dict, nivel: int = 0) -> list[str]:
    """Plano em texto, no formato do EXPLAIN do psql, reconstruído do JSON (determinístico)."""
    recuo = "" if nivel == 0 else " " * (6 * nivel - 4) + "->  "
    linha = (f"{recuo}{_descricao(no)}  (cost={no['Startup Cost']:.2f}..{no['Total Cost']:.2f} "
             f"rows={no['Plan Rows']} width={no.get('Plan Width', 0)})")
    if "Actual Total Time" in no:
        linha += (f" (actual time={no['Actual Startup Time']:.3f}..{no['Actual Total Time']:.3f} "
                  f"rows={no['Actual Rows']} loops={no['Actual Loops']})")
    linhas = [linha]
    margem = " " * (6 * nivel + 2)
    for chave in ("Index Cond", "Recheck Cond", "Hash Cond", "Merge Cond", "Join Filter", "Filter", "Sort Key"):
        if chave in no:
            valor = ", ".join(no[chave]) if isinstance(no[chave], list) else no[chave]
            linhas.append(f"{margem}{chave}: {valor}")
    if no.get("Rows Removed by Filter"):
        linhas.append(f"{margem}Rows Removed by Filter: {no['Rows Removed by Filter']}")
    for filho in no.get("Plans", []):
        linhas += arvore(filho, nivel + 1)
    return linhas


def secao_consulta(indice: int, titulo: str, sql: str, plano: dict | None, erro: str | None) -> list[str]:
    linhas = [f"## {indice}. {_pgdocs.md_texto(titulo)}", "", _pgdocs.bloco_codigo(sql, "sql"), ""]
    if plano is None:
        return linhas + [f"❌ **Falhou — sem plano:** {_pgdocs.md_texto(erro)}", ""]
    raiz = plano["Plan"]
    linhas += ["| Medida | Valor |", "| :--- | :--- |",
               f"| Nó raiz do plano | {_pgdocs.md_codigo(_descricao(raiz))} |",
               f"| Custo estimado (inicial..total) | {raiz['Startup Cost']:.2f}..{raiz['Total Cost']:.2f} |",
               f"| Linhas estimadas | {raiz['Plan Rows']} |"]
    if "Execution Time" in plano:
        linhas += [f"| Tempo de planejamento (real) | {plano['Planning Time']:.3f} ms |",
                   f"| Tempo de execução (real) | {plano['Execution Time']:.3f} ms |",
                   f"| Linhas devolvidas (real) | {raiz['Actual Rows']} |",
                   (f"| Blocos em cache / lidos do disco | {raiz.get('Shared Hit Blocks', 0)} / "
                    f"{raiz.get('Shared Read Blocks', 0)} |")]
    acessos = sorted({_descricao(no) for no in _nos(raiz) if no["Node Type"].endswith("Scan")})
    sequenciais = sorted({no["Relation Name"] for no in _nos(raiz)
                          if no["Node Type"] == "Seq Scan" and no.get("Relation Name")})
    linhas += ["", "Acessos a dados: " + (", ".join(_pgdocs.md_codigo(a) for a in acessos) or "nenhum") + "."]
    if sequenciais:
        linhas += ["", "⚠️ Varredura sequencial (tabela lida inteira) em: "
                   + ", ".join(_pgdocs.md_codigo(t) for t in sequenciais) + "."]
    return linhas + ["", _pgdocs.bloco_codigo("\n".join(arvore(raiz)), "text"), ""]


def top_consultas(amb: dict[str, str], quantidade: int, timeout_s: int) -> list[str]:
    """Seção com as consultas mais caras do pg_stat_statements; extensão ausente vira aviso."""
    linhas = [f"## Consultas mais caras (pg_stat_statements, top {quantidade})", ""]
    try:
        saida = _pgdocs.executar_psql(["--csv", "-v", f"top={quantidade}", "-f", str(SQL_TOP)], amb,
                                      limite_s=timeout_s + 60)
    except _pgdocs.ErroBanco as exc:
        if AVISO_SEM_PGSS not in str(exc):
            raise
        print("AVISO: pg_stat_statements indisponível neste banco; seção de top consultas omitida.",
              file=sys.stderr)
        return linhas + ["_pg_stat_statements não está ativo neste banco; não há ranking para mostrar._", ""]
    registros = list(csv.DictReader(io.StringIO(saida)))
    if not registros:
        return linhas + ["_pg_stat_statements está ativo, mas ainda sem consultas registradas._", ""]
    colunas = list(registros[0].keys())
    linhas += ["| " + " | ".join(colunas) + " |", "| " + " | ".join(":---" for _ in colunas) + " |"]
    for reg in registros:
        linhas.append("| " + " | ".join(
            _pgdocs.md_codigo(reg[c]) if c == "short_query" else _pgdocs.md_texto(reg[c]) for c in colunas) + " |")
    return linhas + [""]


def principal(argv: list[str] | None = None) -> int:
    parser = _pgdocs.criar_parser(__doc__, SAIDA_PADRAO)
    parser.add_argument("--analyze", action="store_true",
                        help="EXECUTA cada consulta com EXPLAIN (ANALYZE, BUFFERS) para medir tempo real")
    parser.add_argument("--query-file", metavar="ARQUIVO.sql",
                        help="consultas a explicar no lugar das 3 centrais embutidas")
    parser.add_argument("--top-queries", nargs="?", const=20, type=_pgdocs._inteiro_positivo, metavar="N",
                        help="inclui o top N (padrão 20) do pg_stat_statements, se disponível")
    parser.add_argument("--tolerar-erros", action="store_true",
                        help="grava o relatório mesmo se alguma consulta falhar (a falha fica registrada)")
    args = parser.parse_args(argv)
    if args.check and (args.analyze or args.top_queries):
        raise _pgdocs.ErroUso("--check só vale no modo padrão: tempos (--analyze) e ranking (--top-queries) "
                              "mudam a cada execução.")
    if args.query_file:
        try:
            texto = pathlib.Path(args.query_file).read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            raise _pgdocs.ErroUso(f"não foi possível ler --query-file: {exc}") from None
        origem = f"arquivo `{pathlib.Path(args.query_file).name}`"
    else:
        texto, origem = consultas_centrais(args.schema), "consultas centrais embutidas"
    try:
        comandos = _sqlseguro.carregar(texto)
    except _sqlseguro.SqlInvalido as exc:
        raise _pgdocs.ErroUso(f"consulta recusada — {exc}") from None
    if not comandos:
        raise _pgdocs.ErroUso("nenhuma consulta para explicar (arquivo vazio ou só comentários).")

    amb = _pgdocs.ambiente_psql(aplicacao=SCRIPT)
    versao = _pgdocs.executar_psql(
        ["-At", "-c", "SELECT current_setting('server_version_num')::int / 10000"], amb).strip()

    modo = ("`EXPLAIN (ANALYZE, BUFFERS)` — cada consulta foi EXECUTADA em transação somente-leitura com "
            "ROLLBACK; tempos e leituras são reais desta execução." if args.analyze else
            "`EXPLAIN (FORMAT JSON)` — plano e custo estimados pelo banco; as consultas NÃO foram executadas "
            "(rode com `--analyze` para medir tempo real).")
    linhas = ["# ⚡ EXPLAIN — consultas centrais", "", _pgdocs.linha_gerado(SCRIPT, args.data, "com EXPLAIN real no banco").rstrip("\n"),
              ">", f"> Modo: {modo}", ">", f"> Servidor: PostgreSQL {versao}. Origem: {origem}.", ""]
    falhas = 0
    for i, comando in enumerate(comandos, start=1):
        titulo = comando.nome or f"Consulta {i}"
        try:
            plano, erro = explicar(comando.sql, amb, args.analyze, args.timeout), None
        except _pgdocs.ErroBanco as exc:
            plano, erro, falhas = None, str(exc).splitlines()[0] if str(exc) else "erro desconhecido", falhas + 1
            print(f"FALHOU [{i}] {titulo}: {exc}", file=sys.stderr)
        linhas += secao_consulta(i, titulo, comando.sql, plano, erro)
    if args.top_queries:
        linhas += top_consultas(amb, args.top_queries, args.timeout)
    if falhas and not args.tolerar_erros:
        raise _pgdocs.ErroBanco(f"{falhas} de {len(comandos)} consulta(s) falharam. Corrija-as, ou use "
                                "--tolerar-erros para gravar o relatório com as falhas registradas.")
    codigo = _pgdocs.publicar(_pgdocs.destino_de(args), "\n".join(linhas).rstrip("\n") + "\n", args.check)
    print(f"{len(comandos) - falhas} de {len(comandos)} consulta(s) explicadas.")
    return codigo


if __name__ == "__main__":
    sys.exit(_pgdocs.executar(principal))
