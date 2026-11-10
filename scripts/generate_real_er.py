"""Diagrama ER — DETALHE das chaves estrangeiras (seção "Relacionamentos em detalhe" de docs/er-diagram.md).

Lê as FKs reais do banco (pg_constraint) — não depende mais de arquivo colado em /tmp — e gera:
  * a tabela de todas as FKs (colunas, referência, constraint, ON DELETE/UPDATE, obrigatória?);
  * diagramas Mermaid com as colunas-chave (PK/FK/UK) de cada tabela e uma linha por FK,
    fatiados (`--max-entidades`) para sempre renderizar no GitHub.
A visão geral (uma linha por par de tabelas) é a outra seção do mesmo arquivo, gerada por
scripts/generate_er_diagram.py — cada script só troca a própria seção.

Uso:
  SUPABASE_DB_URL=postgres://... python3 scripts/generate_real_er.py
  python3 scripts/generate_real_er.py --check                # CI: sai 1 se o arquivo está defasado
  python3 scripts/generate_real_er.py --schema public --out /tmp/er.md --max-entidades 15

Somente leitura: transação READ ONLY com statement_timeout, encerrada com ROLLBACK.
"""

from __future__ import annotations

import sys

import _pgdocs
import _pgdocs_catalogo as catalogo

SCRIPT = "generate_real_er.py"
SAIDA_PADRAO = "docs/er-diagram.md"
TITULO = "📊 Diagrama Entidade-Relacionamento (ER)"
SECAO = "detalhe-fks"
SECOES = [("visao-geral", "generate_er_diagram.py"), ("detalhe-fks", "generate_real_er.py")]


def colunas_chave(tabela: dict, fks_da_tabela: list[dict]) -> list[tuple[dict, list[str]]]:
    """Colunas que participam de PK, FK ou chave única, na ordem do banco, com seus marcadores."""
    pk = set(tabela["pk"] or [])
    em_fk = {c for fk in fks_da_tabela for c in fk["colunas"]}
    unica_simples = {u[0] for u in tabela["unicas"] if len(u) == 1} - pk
    saida = []
    for col in tabela["colunas"]:
        marcas = [m for m, grupo in (("PK", pk), ("FK", em_fk), ("UK", unica_simples)) if col["nome"] in grupo]
        if marcas:
            saida.append((col, marcas))
    return saida


def _bloco_entidade(ident: str, tabela: dict, fks_da_tabela: list[dict]) -> list[str]:
    chaves = colunas_chave(tabela, fks_da_tabela)
    if not chaves:
        return [f"    {ident}"]
    linhas = [f"    {ident} {{"]
    for col, marcas in chaves:
        atributo = catalogo.mermaid_palavra(col["nome"])
        nota = f" {catalogo.mermaid_rotulo(col['nome'])}" if atributo != col["nome"] else ""
        linhas.append(f"        {catalogo.mermaid_palavra(col['tipo'])} {atributo} {', '.join(marcas)}{nota}")
    return linhas + ["    }"]


def renderizar(dados: dict, esquema: str, data: str | None = None, max_entidades: int = 20) -> str:
    tabelas = catalogo.tabelas(dados)
    por_nome = {r["nome"]: r for r in dados["relacoes"]}
    fks = dados["fks"]
    pai_de = {id(fk): catalogo.chave_entidade(esquema, fk["ref_esquema"], fk["ref_tabela"]) for fk in fks}
    envolvidas = {fk["tabela"] for fk in fks} | set(pai_de.values())
    nomes = catalogo.NomesMermaid([t["nome"] for t in tabelas] + sorted(envolvidas))
    linhas = ["## 🔗 Relacionamentos em detalhe (FKs)", "", _pgdocs.linha_gerado(SCRIPT, data)]
    if not fks:
        vazio = "tabela" if not tabelas else "chave estrangeira"
        linhas.append(f"_Nenhuma {vazio} encontrada no schema {_pgdocs.md_codigo(esquema)}._")
        return "\n".join(linhas) + "\n"
    linhas += [
        f"Schema {_pgdocs.md_codigo(esquema)}: {len(fks)} chave(s) estrangeira(s).", "",
        ("| Tabela | Coluna(s) | Referencia | Coluna(s) referenciada(s) | Constraint | ON DELETE | ON UPDATE "
         "| Obrigatória | 1:1 |"),
        "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |",
    ]
    for fk in fks:
        linhas.append(
            f"| {_pgdocs.md_codigo(fk['tabela'])} | {', '.join(_pgdocs.md_codigo(c) for c in fk['colunas'])} | "
            f"{_pgdocs.md_codigo(pai_de[id(fk)])} | {', '.join(_pgdocs.md_codigo(c) for c in fk['ref_colunas'])} | "
            f"{_pgdocs.md_codigo(fk['nome'])} | {catalogo.ACOES_FK.get(fk['ao_excluir'], fk['ao_excluir'])} | "
            f"{catalogo.ACOES_FK.get(fk['ao_atualizar'], fk['ao_atualizar'])} | "
            f"{'sim' if catalogo.fk_obrigatoria(fk, por_nome) else 'não'} | "
            f"{'sim' if catalogo.fk_unica(fk, por_nome) else 'não'} |")
    linhas.append("")
    # Diagramas: cada parte traz o bloco das suas tabelas e as FKs que saem delas.
    com_fk = [t for t in tabelas if t["nome"] in envolvidas]
    partes = catalogo.fatiar(com_fk, max_entidades)
    for i, parte in enumerate(partes, start=1):
        sufixo = f" — parte {i} de {len(partes)}" if len(partes) > 1 else ""
        linhas += [f"### Diagrama com colunas-chave{sufixo}", ""]
        corpo = ["erDiagram"]
        for tabela in parte:
            proprias = [fk for fk in fks if fk["tabela"] == tabela["nome"]]
            corpo += _bloco_entidade(nomes[tabela["nome"]], tabela, proprias)
        for tabela in parte:
            for fk in (f for f in fks if f["tabela"] == tabela["nome"]):
                seta = catalogo.cardinalidade(catalogo.fk_obrigatoria(fk, por_nome), catalogo.fk_unica(fk, por_nome))
                rotulo = catalogo.mermaid_rotulo(f"{', '.join(fk['colunas'])} -> {', '.join(fk['ref_colunas'])}")
                corpo.append(f"    {nomes[pai_de[id(fk)]]} {seta} {nomes[fk['tabela']]} : {rotulo}")
        linhas += [_pgdocs.bloco_codigo("\n".join(corpo), "mermaid"), ""]
    linhas += catalogo.legenda_adaptados(nomes)
    return "\n".join(linhas).rstrip("\n") + "\n"


def principal(argv: list[str] | None = None) -> int:
    parser = _pgdocs.criar_parser(__doc__, SAIDA_PADRAO)
    parser.add_argument("--max-entidades", type=_pgdocs._inteiro_positivo, default=20, metavar="N",
                        help="máximo de tabelas por diagrama antes de fatiar (padrão: 20)")
    args = parser.parse_args(argv)
    amb = _pgdocs.ambiente_psql(aplicacao=SCRIPT)
    dados = catalogo.carregar_catalogo(args.schema, amb, args.timeout)
    destino = _pgdocs.destino_de(args)
    existente = destino.read_text(encoding="utf-8") if destino.is_file() else None
    corpo = renderizar(dados, args.schema, args.data, args.max_entidades)
    documento = _pgdocs.montar_documento(existente, TITULO, SECOES, SECAO, corpo)
    return _pgdocs.publicar(destino, documento, args.check)


if __name__ == "__main__":
    sys.exit(_pgdocs.executar(principal))
