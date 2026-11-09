"""Dicionário de dados — RESUMO por tabela (seção "Resumo por tabela" de docs/data-dictionary.md).

Uma linha por tabela/view do schema, lida do catálogo real do banco: tipo, nº de colunas,
chave primária, RLS e a descrição registrada com COMMENT ON. Tabela sem comentário aparece
como "—" (nada é inventado). O detalhe coluna a coluna é a outra seção do mesmo arquivo,
gerada por scripts/generate_real_dict.py — cada script só troca a própria seção.

Uso:
  SUPABASE_DB_URL=postgres://... python3 scripts/generate_data_dictionary.py
  python3 scripts/generate_data_dictionary.py --check        # CI: sai 1 se o arquivo está defasado
  python3 scripts/generate_data_dictionary.py --schema public --out /tmp/dicionario.md

Somente leitura: transação READ ONLY com statement_timeout, encerrada com ROLLBACK.
"""

from __future__ import annotations

import sys

import _pgdocs
import _pgdocs_catalogo as catalogo

SCRIPT = "generate_data_dictionary.py"
SAIDA_PADRAO = "docs/data-dictionary.md"
TITULO = "📖 Dicionário de Dados — SINGU CRM"
SECAO = "resumo"
SECOES = [("resumo", "generate_data_dictionary.py"), ("detalhe", "generate_real_dict.py")]


def renderizar(dados: dict, esquema: str, data: str | None = None) -> str:
    relacoes = dados["relacoes"]
    n_tabelas = sum(1 for r in relacoes if r["tipo"] in ("r", "p", "f"))
    n_views = len(relacoes) - n_tabelas
    sem_comentario = sum(1 for r in relacoes if not (r["comentario"] or "").strip())
    linhas = ["## 📚 Resumo por tabela", "", _pgdocs.linha_gerado(SCRIPT, data)]
    if not relacoes:
        linhas.append(f"_Nenhuma tabela ou view encontrada no schema {_pgdocs.md_codigo(esquema)}._")
        return "\n".join(linhas) + "\n"
    linhas += [
        (f"Schema {_pgdocs.md_codigo(esquema)}: {n_tabelas} tabela(s) e {n_views} view(s); "
         f"{sem_comentario} sem descrição no banco (`COMMENT ON`)."),
        "",
        "| Tabela | Tipo | Colunas | Chave primária | RLS | Descrição |",
        "| :--- | :--- | ---: | :--- | :---: | :--- |",
    ]
    for rel in relacoes:
        pk = ", ".join(_pgdocs.md_codigo(c) for c in (rel["pk"] or [])) or "—"
        rls = ("sim" if rel["rls"] else "não") if rel["tipo"] in ("r", "p") else "—"
        linhas.append(
            f"| {_pgdocs.md_codigo(rel['nome'])} | {catalogo.TIPOS_RELACAO[rel['tipo']]} | "
            f"{len(rel['colunas'])} | {pk} | {rls} | {_pgdocs.md_texto(rel['comentario']) or '—'} |")
    return "\n".join(linhas) + "\n"


def principal(argv: list[str] | None = None) -> int:
    args = _pgdocs.criar_parser(__doc__, SAIDA_PADRAO).parse_args(argv)
    amb = _pgdocs.ambiente_psql(aplicacao=SCRIPT)
    dados = catalogo.carregar_catalogo(args.schema, amb, args.timeout)
    destino = _pgdocs.destino_de(args)
    existente = destino.read_text(encoding="utf-8") if destino.is_file() else None
    corpo = renderizar(dados, args.schema, args.data)
    documento = _pgdocs.montar_documento(existente, TITULO, SECOES, SECAO, corpo)
    return _pgdocs.publicar(destino, documento, args.check)


if __name__ == "__main__":
    sys.exit(_pgdocs.executar(principal))
