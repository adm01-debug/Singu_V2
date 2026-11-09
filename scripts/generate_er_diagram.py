"""Diagrama ER — VISÃO GERAL (seção "Visão geral" de docs/er-diagram.md).

Mapa enxuto do schema, lido das chaves estrangeiras reais do banco: uma linha por par de
tabelas relacionadas (sem colunas), mais a lista das tabelas sem relacionamento. O diagrama é
fatiado em partes (`--max-relacoes`) para sempre renderizar no GitHub. O detalhe FK a FK, com
as colunas-chave, é a outra seção do mesmo arquivo, gerada por scripts/generate_real_er.py —
cada script só troca a própria seção.

Uso:
  SUPABASE_DB_URL=postgres://... python3 scripts/generate_er_diagram.py
  python3 scripts/generate_er_diagram.py --check             # CI: sai 1 se o arquivo está defasado
  python3 scripts/generate_er_diagram.py --schema public --out /tmp/er.md --max-relacoes 80

Somente leitura: transação READ ONLY com statement_timeout, encerrada com ROLLBACK.
"""

from __future__ import annotations

import sys

import _pgdocs
import _pgdocs_catalogo as catalogo

SCRIPT = "generate_er_diagram.py"
SAIDA_PADRAO = "docs/er-diagram.md"
TITULO = "📊 Diagrama Entidade-Relacionamento (ER)"
SECAO = "visao-geral"
SECOES = [("visao-geral", "generate_er_diagram.py"), ("detalhe-fks", "generate_real_er.py")]


def pares_relacionados(dados: dict, esquema: str) -> list[dict]:
    """Agrupa as FKs por par (pai, filho): uma linha por par, sem perder nenhuma FK no rótulo."""
    por_nome = {r["nome"]: r for r in dados["relacoes"]}
    pares: dict[tuple[str, str], dict] = {}
    for fk in dados["fks"]:
        pai = catalogo.chave_entidade(esquema, fk["ref_esquema"], fk["ref_tabela"])
        par = pares.setdefault((pai, fk["tabela"]), {"pai": pai, "filho": fk["tabela"], "rotulos": [],
                                                    "obrigatoria": True, "unica": True})
        par["rotulos"].append(", ".join(fk["colunas"]))
        par["obrigatoria"] &= catalogo.fk_obrigatoria(fk, por_nome)
        par["unica"] &= catalogo.fk_unica(fk, por_nome)
    return [pares[chave] for chave in sorted(pares)]


def renderizar(dados: dict, esquema: str, data: str | None = None, max_relacoes: int = 120) -> str:
    tabelas = catalogo.tabelas(dados)
    pares = pares_relacionados(dados, esquema)
    envolvidas = {p["pai"] for p in pares} | {p["filho"] for p in pares}
    nomes = catalogo.NomesMermaid([t["nome"] for t in tabelas] + sorted(envolvidas))
    isoladas = [t["nome"] for t in tabelas if t["nome"] not in envolvidas]
    linhas = ["## 🗺️ Visão geral", "", _pgdocs.linha_gerado(SCRIPT, data)]
    if not tabelas:
        linhas.append(f"_Nenhuma tabela encontrada no schema {_pgdocs.md_codigo(esquema)}._")
        return "\n".join(linhas) + "\n"
    linhas += [
        (f"Schema {_pgdocs.md_codigo(esquema)}: {len(tabelas)} tabela(s), {len(dados['fks'])} chave(s) "
         f"estrangeira(s) em {len(pares)} par(es) de tabelas; {len(isoladas)} tabela(s) sem relacionamento."),
        "",
        ("Como ler: `A ||--o{ B` = cada linha de B aponta para exatamente uma de A; `|o` = a referência "
         "é opcional (coluna aceita nulo); `o|` = no máximo uma linha de B por linha de A (1:1). "
         "O rótulo traz a(s) coluna(s) de B que formam a chave."),
        "",
    ]
    if not pares:
        linhas += ["_Nenhuma chave estrangeira encontrada: não há relacionamento para desenhar._", ""]
    partes = catalogo.fatiar(pares, max_relacoes) if pares else []
    for i, parte in enumerate(partes, start=1):
        if len(partes) > 1:
            linhas += [f"### Parte {i} de {len(partes)}", ""]
        corpo = ["erDiagram"]
        for par in parte:
            rotulo = catalogo.mermaid_rotulo(" / ".join(par["rotulos"]))
            corpo.append(f"    {nomes[par['pai']]} {catalogo.cardinalidade(par['obrigatoria'], par['unica'])} "
                         f"{nomes[par['filho']]} : {rotulo}")
        linhas += [_pgdocs.bloco_codigo("\n".join(corpo), "mermaid"), ""]
    linhas += catalogo.legenda_adaptados(nomes)
    if isoladas:
        linhas += ["### Tabelas sem relacionamento", "",
                   ", ".join(_pgdocs.md_codigo(nome) for nome in isoladas)]
    return "\n".join(linhas).rstrip("\n") + "\n"


def principal(argv: list[str] | None = None) -> int:
    parser = _pgdocs.criar_parser(__doc__, SAIDA_PADRAO)
    parser.add_argument("--max-relacoes", type=_pgdocs._inteiro_positivo, default=120, metavar="N",
                        help="máximo de relacionamentos por diagrama antes de fatiar (padrão: 120)")
    args = parser.parse_args(argv)
    amb = _pgdocs.ambiente_psql(aplicacao=SCRIPT)
    dados = catalogo.carregar_catalogo(args.schema, amb, args.timeout)
    destino = _pgdocs.destino_de(args)
    existente = destino.read_text(encoding="utf-8") if destino.is_file() else None
    corpo = renderizar(dados, args.schema, args.data, args.max_relacoes)
    documento = _pgdocs.montar_documento(existente, TITULO, SECOES, SECAO, corpo)
    return _pgdocs.publicar(destino, documento, args.check)


if __name__ == "__main__":
    sys.exit(_pgdocs.executar(principal))
