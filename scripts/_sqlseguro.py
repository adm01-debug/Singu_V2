"""Divisão e validação de SQL somente-leitura para o run_explain_analyze.py.

`dividir(texto)` separa um arquivo em comandos respeitando strings ('..', E'..', $tag$..$tag$),
identificadores entre aspas e comentários (`--` e `/* */` aninhado) — um `;` dentro deles não
divide nada. `validar_leitura(sql)` só aceita UM comando SELECT ou WITH … SELECT: recusa escrita
(INSERT/UPDATE/DELETE/MERGE, inclusive dentro de CTE), SELECT … INTO, travas FOR UPDATE/SHARE e
funções com efeito colateral conhecido. É uma trava contra engano; a garantia final é a transação
READ ONLY com ROLLBACK em que o EXPLAIN roda.
"""

from __future__ import annotations

import re
from dataclasses import dataclass


class SqlInvalido(ValueError):
    """Comando recusado (mensagem em PT-BR pronta para o usuário)."""


@dataclass(frozen=True)
class Comando:
    nome: str | None  # vindo de um comentário `-- nome: ...` logo antes do comando
    sql: str          # texto a executar (sem `;` final nem comentários iniciais)
    esqueleto: str    # só o código: strings viram '', identificadores citados viram "", sem comentários


_ID = "A-Za-z0-9_\u0080-￿"
_ABRE_DOLAR = re.compile(r"\$([A-Za-z_\u0080-￿][A-Za-z0-9_\u0080-￿]*)?\$")
_NOME = re.compile(r"^\s*(?:nome|name|t[ií]tulo)\s*:\s*(.+?)\s*$", re.IGNORECASE)


def _ler(texto: str):
    """Gera (tipo, trecho) com tipo em: codigo, espaco, comentario, texto, citado, ponto_virgula."""
    i, n = 0, len(texto)
    while i < n:
        ch = texto[i]
        prox = texto[i + 1] if i + 1 < n else ""
        if ch.isspace():
            j = i + 1
            while j < n and texto[j].isspace():
                j += 1
            yield "espaco", texto[i:j]
        elif ch == "-" and prox == "-":
            j = texto.find("\n", i)
            j = n if j < 0 else j
            yield "comentario", texto[i:j]
        elif ch == "/" and prox == "*":
            nivel, j = 1, i + 2
            while j < n and nivel:
                if texto.startswith("/*", j):
                    nivel, j = nivel + 1, j + 2
                elif texto.startswith("*/", j):
                    nivel, j = nivel - 1, j + 2
                else:
                    j += 1
            if nivel:
                raise SqlInvalido("comentário /* … */ sem fechamento.")
            yield "comentario", texto[i:j]
        elif ch == "'":
            # E'..' aceita escape com barra; a sessão força standard_conforming_strings=on para o resto.
            anterior = texto[i - 1] if i else ""
            antes = texto[i - 2] if i > 1 else ""
            com_escape = anterior in ("e", "E") and not re.match(f"[{_ID}$]", antes or " ")
            j = i + 1
            while True:
                if j >= n:
                    raise SqlInvalido("string '…' sem fechamento.")
                if com_escape and texto[j] == "\\":
                    j += 2
                elif texto[j] == "'":
                    if j + 1 < n and texto[j + 1] == "'":
                        j += 2
                    else:
                        break
                else:
                    j += 1
            j += 1
            yield "texto", texto[i:j]
        elif ch == '"':
            j = i + 1
            while True:
                if j >= n:
                    raise SqlInvalido('identificador "…" sem fechamento.')
                if texto[j] == '"':
                    if j + 1 < n and texto[j + 1] == '"':
                        j += 2
                    else:
                        break
                else:
                    j += 1
            j += 1
            yield "citado", texto[i:j]
        elif ch == "$" and not (i and re.match(f"[{_ID}$]", texto[i - 1])) and _ABRE_DOLAR.match(texto, i):
            marca = _ABRE_DOLAR.match(texto, i).group(0)
            fim = texto.find(marca, i + len(marca))
            if fim < 0:
                raise SqlInvalido(f"bloco {marca}…{marca} sem fechamento.")
            j = fim + len(marca)
            yield "texto", texto[i:j]
        elif ch == ";":
            j = i + 1
            yield "ponto_virgula", ";"
        else:
            j = i + 1
            while j < n and not texto[j].isspace() and texto[j] not in "'\";$" \
                    and not texto.startswith("--", j) and not texto.startswith("/*", j):
                j += 1
            yield "codigo", texto[i:j]
        i = j


def dividir(texto: str) -> list[Comando]:
    """Separa o texto em comandos (ignora comandos vazios). Levanta SqlInvalido se malformado."""
    if "\x00" in texto:
        raise SqlInvalido("o SQL contém byte nulo.")
    comandos: list[Comando] = []
    partes: list[tuple[str, str]] = []

    def fechar():
        nome = None
        while partes and partes[0][0] in ("espaco", "comentario"):
            tipo, trecho = partes.pop(0)
            if tipo == "comentario" and trecho.startswith("--") and nome is None:
                achado = _NOME.match(trecho[2:])
                nome = achado.group(1) if achado else None
        while partes and partes[-1][0] == "espaco":
            partes.pop()
        if any(tipo not in ("espaco", "comentario") for tipo, _ in partes):
            sql = "".join(trecho for _, trecho in partes).strip()
            esqueleto = "".join(
                "''" if tipo == "texto" else '""' if tipo == "citado" else " " if tipo in ("espaco", "comentario")
                else trecho for tipo, trecho in partes)
            comandos.append(Comando(nome, sql, re.sub(r"\s+", " ", esqueleto).strip()))
        partes.clear()

    for tipo, trecho in _ler(texto):
        if tipo == "ponto_virgula":
            fechar()
        else:
            partes.append((tipo, trecho))
    fechar()
    return comandos


_ESCRITA = ("INSERT", "UPDATE", "DELETE", "MERGE", "INTO")
_TRAVA = re.compile(r"\bFOR\s+(?:NO\s+KEY\s+UPDATE|KEY\s+SHARE|UPDATE|SHARE)\b", re.IGNORECASE)
# Funções nativas/de extensão com efeito colateral mesmo em transação somente-leitura.
_FUNCOES_PERIGOSAS = re.compile(
    r"\b(pg_terminate_backend|pg_cancel_backend|pg_sleep\w*|pg_reload_conf|pg_rotate_logfile|pg_switch_wal|"
    r"pg_create_restore_point|pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_reset\w*|"
    r"pg_stat_statements_reset|pg_advisory\w*lock\w*|pg_try_advisory\w*|pg_notify|pg_logical_emit_message|"
    r"pg_promote|pg_\w*replication_slot\w*|lo_import|lo_export|lo_unlink|lo_create|lowrite|"
    r"dblink\w*|set_config|nextval|setval|query_to_xml\w*|table_to_xml\w*|cursor_to_xml\w*|"
    r"database_to_xml\w*|schema_to_xml\w*|http|http_(?:get|post|put|patch|delete|head)|"
    r"http_collect_response|copy_from\w*)\s*\(", re.IGNORECASE)


def validar_leitura(comando: Comando) -> None:
    """Levanta SqlInvalido se o comando não for um SELECT / WITH … SELECT puro."""
    esqueleto = comando.esqueleto
    if "\\" in esqueleto:
        raise SqlInvalido("barra invertida fora de string não é SQL válido aqui (meta-comando do psql?).")
    inicio = re.match(r"[\s(]*([A-Za-z_]+)", esqueleto)
    primeira = inicio.group(1).upper() if inicio else ""
    if primeira not in ("SELECT", "WITH"):
        raise SqlInvalido(f"só SELECT ou WITH … SELECT são aceitos (o comando começa com {primeira or '?'!r}).")
    palavras = {p.upper() for p in re.findall(r"[A-Za-z_][A-Za-z0-9_]*", esqueleto)}
    proibidas = [p for p in _ESCRITA if p in palavras]
    if proibidas:
        raise SqlInvalido(f"comando com escrita recusado ({', '.join(proibidas)}). Se for nome de coluna, "
                          "coloque-o entre aspas duplas.")
    if _TRAVA.search(esqueleto):
        raise SqlInvalido("SELECT … FOR UPDATE/SHARE recusado (trava linhas).")
    funcao = _FUNCOES_PERIGOSAS.search(esqueleto)
    if funcao:
        raise SqlInvalido(f"função com efeito colateral recusada: {funcao.group(1)}().")


def carregar(texto: str) -> list[Comando]:
    """Divide e valida; devolve só comandos aceitos ou levanta SqlInvalido citando o comando."""
    comandos = dividir(texto)
    for i, comando in enumerate(comandos, start=1):
        try:
            validar_leitura(comando)
        except SqlInvalido as exc:
            raise SqlInvalido(f"comando {i}: {exc}") from None
    return comandos
