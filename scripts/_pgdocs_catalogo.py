"""Leitura do catálogo (pg_catalog) e utilitários Mermaid compartilhados pelos geradores de docs.

Usa pg_catalog (não information_schema) para enxergar todos os objetos mesmo com role restrita.
A sessão fixa `search_path = pg_catalog`: tipos e defaults fora do pg_catalog saem SEMPRE com o
schema (ex.: `public.meu_enum`), igual para qualquer role — com o schema no search_path a
qualificação mudava conforme a role tivesse ou não USAGE nele.
"""

from __future__ import annotations

import re
import unicodedata

import _pgdocs

SQL_CATALOGO = r"""
SET LOCAL search_path = pg_catalog;
WITH ns AS (
  SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = :'esquema'
), rel AS (
  SELECT c.oid, c.relname, c.relkind, c.relrowsecurity,
         pg_catalog.obj_description(c.oid, 'pg_class') AS comentario
    FROM pg_catalog.pg_class c JOIN ns ON ns.oid = c.relnamespace
   WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f') AND NOT c.relispartition
), chaves AS (
  SELECT i.indrelid, i.indisprimary,
         (SELECT pg_catalog.jsonb_agg(a.attname ORDER BY k.ord)
            FROM pg_catalog.unnest(i.indkey::int2[]) WITH ORDINALITY AS k(attnum, ord)
            JOIN pg_catalog.pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
           WHERE k.ord <= i.indnkeyatts) AS colunas
    FROM pg_catalog.pg_index i JOIN rel ON rel.oid = i.indrelid
   WHERE i.indisunique AND i.indisvalid AND i.indpred IS NULL AND i.indexprs IS NULL
), enums AS (
  SELECT t.oid, pg_catalog.format_type(t.oid, NULL) AS nome,
         (SELECT pg_catalog.jsonb_agg(e.enumlabel ORDER BY e.enumsortorder)
            FROM pg_catalog.pg_enum e WHERE e.enumtypid = t.oid) AS valores
    FROM pg_catalog.pg_type t
   WHERE t.typtype = 'e'
     AND (t.typnamespace = (SELECT oid FROM ns)
          OR EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a JOIN rel ON rel.oid = a.attrelid
                      JOIN pg_catalog.pg_type ta ON ta.oid = a.atttypid
                     WHERE a.attnum > 0 AND NOT a.attisdropped AND t.oid IN (ta.oid, ta.typelem)))
)
SELECT pg_catalog.jsonb_build_object(
  'esquema_existe', EXISTS (SELECT 1 FROM ns),
  'relacoes', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'nome', rel.relname, 'tipo', rel.relkind, 'rls', rel.relrowsecurity, 'comentario', rel.comentario,
      'pk', (SELECT c.colunas FROM chaves c WHERE c.indrelid = rel.oid AND c.indisprimary),
      'unicas', COALESCE((SELECT pg_catalog.jsonb_agg(c.colunas ORDER BY c.colunas::text COLLATE "C")
                            FROM chaves c WHERE c.indrelid = rel.oid), '[]'::jsonb),
      'colunas', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
          'nome', a.attname, 'tipo', pg_catalog.format_type(a.atttypid, a.atttypmod),
          'nao_nulo', a.attnotnull, 'padrao', pg_catalog.pg_get_expr(d.adbin, d.adrelid),
          'identidade', a.attidentity, 'gerada', a.attgenerated,
          'comentario', pg_catalog.col_description(a.attrelid, a.attnum)) ORDER BY a.attnum)
        FROM pg_catalog.pg_attribute a
        LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
       WHERE a.attrelid = rel.oid AND a.attnum > 0 AND NOT a.attisdropped), '[]'::jsonb)
    ) ORDER BY rel.relname) FROM rel), '[]'::jsonb),
  'fks', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'nome', con.conname, 'tabela', filho.relname,
      'colunas', (SELECT pg_catalog.jsonb_agg(a.attname ORDER BY k.ord)
                    FROM pg_catalog.unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
                    JOIN pg_catalog.pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum),
      'ref_esquema', pn.nspname, 'ref_tabela', pai.relname,
      'ref_colunas', (SELECT pg_catalog.jsonb_agg(a.attname ORDER BY k.ord)
                        FROM pg_catalog.unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
                        JOIN pg_catalog.pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum),
      'ao_excluir', con.confdeltype, 'ao_atualizar', con.confupdtype
    ) ORDER BY filho.relname, con.conname)
    FROM pg_catalog.pg_constraint con
    JOIN rel filho ON filho.oid = con.conrelid
    JOIN pg_catalog.pg_class pai ON pai.oid = con.confrelid
    JOIN pg_catalog.pg_namespace pn ON pn.oid = pai.relnamespace
   WHERE con.contype = 'f' AND con.conparentid = 0), '[]'::jsonb),
  'enums', COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'nome', nome, 'valores', valores) ORDER BY nome COLLATE "C") FROM enums), '[]'::jsonb)
)
"""

TIPOS_RELACAO = {"r": "tabela", "p": "tabela particionada", "v": "view", "m": "view materializada",
                 "f": "tabela externa"}
ACOES_FK = {"a": "NO ACTION", "r": "RESTRICT", "c": "CASCADE", "n": "SET NULL", "d": "SET DEFAULT"}


def carregar_catalogo(esquema: str, amb: dict[str, str], timeout_s: int = 60) -> dict:
    """Lê o catálogo do schema. Schema inexistente é erro (nunca documento vazio por engano)."""
    if not esquema or "\x00" in esquema or "\n" in esquema:
        raise _pgdocs.ErroUso("--schema inválido.")
    dados = _pgdocs.consultar_json(SQL_CATALOGO, amb, {"esquema": esquema}, timeout_consulta_s=timeout_s,
                                   limite_s=timeout_s + 60)
    if not isinstance(dados, dict) or "relacoes" not in dados:
        raise _pgdocs.ErroBanco("catálogo devolveu estrutura inesperada; nada foi gerado.")
    if not dados.get("esquema_existe"):
        raise _pgdocs.ErroUso(f"o schema {esquema!r} não existe neste banco. Nada foi gerado.")
    return dados


def tabelas(dados: dict) -> list[dict]:
    """Só tabelas de verdade (comuns e particionadas), já ordenadas por nome."""
    return [r for r in dados["relacoes"] if r["tipo"] in ("r", "p")]


def fk_obrigatoria(fk: dict, por_nome: dict[str, dict]) -> bool:
    colunas = {c["nome"]: c for c in por_nome[fk["tabela"]]["colunas"]}
    return all(colunas[c]["nao_nulo"] for c in fk["colunas"])


def fk_unica(fk: dict, por_nome: dict[str, dict]) -> bool:
    """True quando as colunas da FK formam chave única (relação 1:1)."""
    alvo = sorted(fk["colunas"])
    return any(sorted(u) == alvo for u in por_nome[fk["tabela"]]["unicas"])


# --------------------------------------------------------------------------- #
# Mermaid (erDiagram)
# --------------------------------------------------------------------------- #

_RESERVADAS = {"erdiagram", "title", "acctitle", "accdescr", "direction", "tb", "bt", "lr", "rl", "classdef",
               "class", "style", "default", "one", "many", "zero", "only", "or", "more", "to", "optionally",
               "u", "pk", "fk", "uk"}


def _ascii(nome: str) -> str:
    base = unicodedata.normalize("NFKD", nome)
    base = "".join(ch for ch in base if not unicodedata.combining(ch))
    return re.sub(r"[^A-Za-z0-9_]", "_", base)


class NomesMermaid:
    """Mapa determinístico nome real -> identificador aceito pelo Mermaid, sem colisão."""

    def __init__(self, nomes: list[str]):
        self.mapa: dict[str, str] = {}
        unicos = sorted(set(nomes))
        # Quem já é um identificador válido mantém o próprio nome; os demais se adaptam em volta.
        validos = [n for n in unicos if re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", n) and n.lower() not in _RESERVADAS]
        usados: set[str] = set(validos)
        self.mapa.update({n: n for n in validos})
        for nome in unicos:
            if nome in self.mapa:
                continue
            ident = _ascii(nome) or "t"
            if not ident[0].isalpha():
                ident = f"t_{ident}"
            if ident.lower() in _RESERVADAS:
                ident = f"{ident}_t"
            candidato, n = ident, 1
            while candidato in usados:
                n += 1
                candidato = f"{ident}_{n}"
            usados.add(candidato)
            self.mapa[nome] = candidato

    def __getitem__(self, nome: str) -> str:
        return self.mapa[nome]

    def adaptados(self) -> list[tuple[str, str]]:
        return [(real, ident) for real, ident in sorted(self.mapa.items()) if real != ident]


def chave_entidade(esquema: str, esquema_ref: str, tabela: str) -> str:
    """Nome lógico da entidade: tabelas de outro schema ganham o prefixo `schema.`."""
    return tabela if esquema_ref == esquema else f"{esquema_ref}.{tabela}"


def mermaid_rotulo(texto: str) -> str:
    """Rótulo entre aspas: sem aspas duplas, quebras de linha nem crases."""
    limpo = re.sub(r"\s+", " ", re.sub(r"[\x00-\x1f\x7f]", " ", texto)).strip()
    return '"' + limpo.replace('"', "'").replace("`", "'") + '"'


def mermaid_palavra(texto: str) -> str:
    """Tipo/nome de atributo: começa por letra e só usa letras, dígitos, `_`, `()` e `[]`."""
    limpo = re.sub(r"[^A-Za-z0-9_()\[\]]", "_", _ascii_preservando(texto))
    limpo = re.sub(r"_+", "_", limpo).strip("_") or "x"
    return limpo if limpo[0].isalpha() else f"c_{limpo}"


def _ascii_preservando(texto: str) -> str:
    base = unicodedata.normalize("NFKD", texto)
    return "".join(ch for ch in base if not unicodedata.combining(ch))


def cardinalidade(obrigatoria: bool, unica: bool) -> str:
    """Pai à esquerda, filho à direita: `||` exatamente um · `|o` zero ou um · `o{` zero ou muitos."""
    return ("||" if obrigatoria else "|o") + "--" + ("o|" if unica else "o{")


def fatiar(itens: list, tamanho: int) -> list[list]:
    return [itens[i:i + tamanho] for i in range(0, len(itens), tamanho)] or [[]]


def legenda_adaptados(nomes: NomesMermaid) -> list[str]:
    adaptados = nomes.adaptados()
    if not adaptados:
        return []
    linhas = ["Nomes adaptados para o Mermaid (o diagrama só aceita letras, dígitos e `_`):", "",
              "| Nome no banco | Nome no diagrama |", "| :--- | :--- |"]
    linhas += [f"| {_pgdocs.md_codigo(real)} | {_pgdocs.md_codigo(ident)} |" for real, ident in adaptados]
    return linhas + [""]
