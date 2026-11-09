"""Base comum dos geradores de documentação do banco (scripts/generate_*.py e run_explain_analyze.py).

Regras que este módulo garante para todos eles:
  * conexão só por ambiente: SUPABASE_DB_URL (preferida) ou variáveis PG* do libpq;
  * a senha nunca vai para a linha de comando nem para mensagens (a URL é quebrada em PG*);
  * tudo roda via `psql` (sem dependência Python), em transação somente-leitura com
    statement_timeout/lock_timeout e ROLLBACK no fim;
  * sem banco configurado ou com falha de consulta: erro claro e saída != 0 — nunca conteúdo inventado;
  * escrita atômica e `--check` (compara com o disco, não escreve).

Códigos de saída: 0 ok · 1 `--check` encontrou diferença · 2 uso/configuração · 3 banco/psql.
"""

from __future__ import annotations

import argparse
import difflib
import errno
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse

SAIDA_OK, SAIDA_DIFERENTE, SAIDA_USO, SAIDA_BANCO = 0, 1, 2, 3
RAIZ = pathlib.Path(__file__).resolve().parent.parent
PREFIXO_MARCA = "singu-docs"

# Parâmetros de URL aceitos -> variável de ambiente do libpq.
_PARAMETROS_URL = {
    "host": "PGHOST", "port": "PGPORT", "user": "PGUSER", "password": "PGPASSWORD", "dbname": "PGDATABASE",
    "sslmode": "PGSSLMODE", "sslrootcert": "PGSSLROOTCERT", "sslcert": "PGSSLCERT", "sslkey": "PGSSLKEY",
    "application_name": "PGAPPNAME", "connect_timeout": "PGCONNECT_TIMEOUT", "options": "PGOPTIONS",
    "target_session_attrs": "PGTARGETSESSIONATTRS", "channel_binding": "PGCHANNELBINDING",
    "gssencmode": "PGGSSENCMODE",
}
_VARS_DESTINO = ("PGHOST", "PGHOSTADDR", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE", "PGSERVICE")


class ErroUso(Exception):
    """Configuração ou argumento inválido (saída 2)."""


class ErroBanco(Exception):
    """Falha de conexão/consulta (saída 3)."""


# --------------------------------------------------------------------------- #
# Conexão
# --------------------------------------------------------------------------- #

def _ambiente_da_url(url: str) -> dict[str, str]:
    """Converte postgres://... em variáveis PG*, sem nunca ecoar a URL em erro."""
    try:
        partes = urllib.parse.urlsplit(url)
        porta = partes.port
        consulta = urllib.parse.parse_qsl(partes.query, keep_blank_values=True, strict_parsing=bool(partes.query))
    except ValueError:
        raise ErroUso("SUPABASE_DB_URL malformada (porta ou parâmetros inválidos).") from None
    if partes.scheme not in ("postgres", "postgresql"):
        raise ErroUso("SUPABASE_DB_URL deve começar com postgres:// ou postgresql://.")
    amb: dict[str, str] = {}
    if partes.hostname:
        amb["PGHOST"] = partes.hostname
    if porta:
        amb["PGPORT"] = str(porta)
    if partes.username:
        amb["PGUSER"] = urllib.parse.unquote(partes.username)
    if partes.password is not None:
        amb["PGPASSWORD"] = urllib.parse.unquote(partes.password)
    banco = urllib.parse.unquote(partes.path.lstrip("/"))
    if banco:
        amb["PGDATABASE"] = banco
    for chave, valor in consulta:
        if chave not in _PARAMETROS_URL:
            raise ErroUso(f"SUPABASE_DB_URL tem parâmetro não suportado: {chave!r} "
                          f"(aceitos: {', '.join(sorted(_PARAMETROS_URL))}).")
        amb[_PARAMETROS_URL[chave]] = valor
    return amb


def ambiente_psql(origem: dict[str, str] | None = None, aplicacao: str = "singu-docs") -> dict[str, str]:
    """Ambiente do processo psql. Levanta ErroUso se não houver banco configurado."""
    amb = dict(os.environ if origem is None else origem)
    url = amb.pop("SUPABASE_DB_URL", "").strip()
    if url:
        for var in _VARS_DESTINO:
            amb.pop(var, None)
        amb.update(_ambiente_da_url(url))
    elif not any(amb.get(v, "").strip() for v in ("PGHOST", "PGHOSTADDR", "PGDATABASE", "PGSERVICE")):
        raise ErroUso("Banco não configurado: defina SUPABASE_DB_URL (postgres://...) ou as variáveis "
                      "PGHOST/PGPORT/PGUSER/PGDATABASE. Nada foi gerado.")
    amb.setdefault("PGCONNECT_TIMEOUT", "15")
    amb.setdefault("PGAPPNAME", aplicacao)
    amb["PGCLIENTENCODING"] = "UTF8"
    return amb


def _limpar_erro(texto: str, amb: dict[str, str]) -> str:
    """Remove a senha (se houver) e reduz o stderr do psql às linhas úteis."""
    senha = amb.get("PGPASSWORD", "")
    if senha:
        texto = texto.replace(senha, "***").replace(urllib.parse.quote(senha, safe=""), "***")
    texto = re.sub(r"(postgres(?:ql)?://[^:/@\s]+):[^@\s]+@", r"\1:***@", texto)
    linhas = [ln.rstrip() for ln in texto.splitlines() if ln.strip()]
    return "\n".join(linhas[:12])


def executar_psql(argumentos: list[str], amb: dict[str, str], entrada: str | None = None,
                  limite_s: float = 120.0) -> str:
    """Roda psql (-X, sem prompt de senha, ON_ERROR_STOP) e devolve o stdout; erro -> ErroBanco."""
    psql = shutil.which("psql", path=amb.get("PATH"))
    if not psql:
        raise ErroUso("`psql` não encontrado no PATH (instale o cliente PostgreSQL).")
    comando = [psql, "-X", "-q", "-w", "-v", "ON_ERROR_STOP=1", *argumentos]
    try:
        proc = subprocess.run(comando, input=entrada, env=amb, capture_output=True, text=True,
                              encoding="utf-8", errors="replace", timeout=limite_s, check=False)
    except subprocess.TimeoutExpired:
        raise ErroBanco(f"psql não respondeu em {limite_s:.0f}s (rede/banco indisponível).") from None
    except OSError as exc:
        if exc.errno == errno.E2BIG:
            raise ErroBanco("consulta grande demais para enviar ao psql (limite de ~128 KB por comando).") from None
        raise ErroBanco(f"não foi possível executar o psql: {exc.strerror or exc}.") from None
    if proc.returncode != 0:
        detalhe = _limpar_erro(proc.stderr, amb) or f"psql saiu com código {proc.returncode}"
        raise ErroBanco(detalhe)
    return proc.stdout


def consultar_json(sql: str, amb: dict[str, str], variaveis: dict[str, str] | None = None,
                   timeout_consulta_s: int = 60, limite_s: float = 120.0):
    """Executa UMA consulta que devolve um único valor JSON, em transação somente-leitura."""
    roteiro = (
        "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;\n"
        f"SET LOCAL statement_timeout = {int(timeout_consulta_s) * 1000};\n"
        "SET LOCAL lock_timeout = 5000;\n"
        f"{sql.rstrip().rstrip(';')};\n"
        "ROLLBACK;\n"
    )
    args = ["-At", "-f", "-"]
    for nome, valor in (variaveis or {}).items():
        args += ["-v", f"{nome}={valor}"]
    saida = executar_psql(args, amb, entrada=roteiro, limite_s=limite_s).strip()
    try:
        return json.loads(saida)
    except json.JSONDecodeError:
        raise ErroBanco("resposta inesperada do banco (não é JSON); nada foi gerado.") from None


# --------------------------------------------------------------------------- #
# Markdown
# --------------------------------------------------------------------------- #

_CONTROLE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_ESPECIAIS_MD = re.compile(r"([\\`*_\[\]|~#])")


def md_texto(valor: str | None) -> str:
    """Texto livre (comentário do catálogo) seguro em célula de tabela ou parágrafo Markdown."""
    if not valor:
        return ""
    texto = _CONTROLE.sub(" ", str(valor)).replace("\t", " ")
    texto = texto.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    texto = _ESPECIAIS_MD.sub(r"\\\1", texto)
    return "<br>".join(parte.strip() for parte in re.split(r"\r\n|\r|\n", texto.strip()))


def md_codigo(valor: str | None) -> str:
    """Trecho de código inline (nome, tipo, default) seguro em célula de tabela GFM."""
    if valor is None or valor == "":
        return ""
    # Código inline não aceita quebra de linha: ela vira "⏎" para não sumir em silêncio.
    texto = re.sub(r"\r\n|\r|\n", "⏎", _CONTROLE.sub(" ", str(valor)))
    texto = re.sub(r"\s+", " ", texto).strip()
    if not texto:
        return ""
    maior = max((len(m) for m in re.findall(r"`+", texto)), default=0)
    cerca = "`" * (maior + 1)
    folga = " " if texto.startswith("`") or texto.endswith("`") else ""
    # Em tabela GFM o `|` precisa de escape mesmo dentro de código (a barra é consumida).
    return f"{cerca}{folga}{texto.replace('|', chr(92) + '|')}{folga}{cerca}"


def bloco_codigo(conteudo: str, linguagem: str = "") -> str:
    """Bloco cercado cuja cerca é sempre maior que qualquer sequência de crases do conteúdo."""
    maior = max((len(m) for m in re.findall(r"`+", conteudo)), default=0)
    cerca = "`" * max(3, maior + 1)
    return f"{cerca}{linguagem}\n{conteudo.rstrip()}\n{cerca}"


# --------------------------------------------------------------------------- #
# Documento com seções gerenciadas (dois geradores podem dividir o mesmo arquivo)
# --------------------------------------------------------------------------- #

def _marcas(nome: str) -> tuple[str, str]:
    return f"<!-- {PREFIXO_MARCA}:{nome}:inicio -->", f"<!-- {PREFIXO_MARCA}:{nome}:fim -->"


def _secao_existente(texto: str, nome: str) -> str | None:
    inicio, fim = _marcas(nome)
    achado = re.search(rf"^{re.escape(inicio)}\n(.*?)^{re.escape(fim)}$", texto, re.DOTALL | re.MULTILINE)
    return achado.group(1) if achado else None


def montar_documento(existente: str | None, titulo: str, secoes: list[tuple[str, str]],
                     nome: str, corpo: str) -> str:
    """Devolve o documento inteiro, trocando só a seção `nome` e preservando as demais.

    `secoes` = [(nome, script que a gera)] na ordem fixa do arquivo. Seção ainda não gerada
    recebe um aviso explícito (nunca conteúdo inventado).
    """
    partes = [f"# {titulo}\n"]
    for nome_secao, script in secoes:
        if nome_secao == nome:
            conteudo = corpo.strip("\n") + "\n"
        else:
            conteudo = _secao_existente(existente or "", nome_secao)
            if conteudo is None:
                conteudo = f"_Seção ainda não gerada — rode `python3 scripts/{script}`._\n"
        inicio, fim = _marcas(nome_secao)
        partes.append(f"{inicio}\n{conteudo}{fim}\n")
    return "\n".join(partes)


def publicar(destino: pathlib.Path, conteudo: str, so_checar: bool) -> int:
    """Grava de forma atômica, ou (com --check) só compara com o disco. Devolve o código de saída."""
    atual = destino.read_text(encoding="utf-8") if destino.is_file() else None
    if so_checar:
        if atual == conteudo:
            print(f"OK: {destino} está em dia com o banco.")
            return SAIDA_OK
        motivo = "não existe" if atual is None else "difere do que o banco gera hoje"
        print(f"DIFERENTE: {destino} {motivo}. Rode sem --check para atualizar.", file=sys.stderr)
        diff = difflib.unified_diff((atual or "").splitlines(), conteudo.splitlines(),
                                    "em disco", "gerado", lineterm="", n=1)
        for i, linha in enumerate(diff):
            if i >= 40:
                print("... (diferença truncada)", file=sys.stderr)
                break
            print(linha, file=sys.stderr)
        return SAIDA_DIFERENTE
    if destino.is_dir():
        raise ErroUso(f"--out aponta para um diretório: {destino}")
    try:
        destino.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=destino.parent, prefix=f".{destino.name}.", suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as arq:
                arq.write(conteudo)
            if atual is not None:
                shutil.copymode(destino, tmp)
            else:
                os.chmod(tmp, 0o644)
            os.replace(tmp, destino)
        except BaseException:
            pathlib.Path(tmp).unlink(missing_ok=True)
            raise
    except OSError as exc:
        raise ErroUso(f"não foi possível gravar {destino}: {exc.strerror or exc}") from None
    print(f"{'Atualizado' if atual != conteudo else 'Sem mudança'}: {destino}")
    return SAIDA_OK


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #

def _data_iso(valor: str) -> str:
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", valor):
        raise argparse.ArgumentTypeError("use AAAA-MM-DD")
    return valor


def _inteiro_positivo(valor: str) -> int:
    try:
        numero = int(valor)
    except ValueError:
        numero = 0
    if numero < 1:
        raise argparse.ArgumentTypeError("use um inteiro >= 1")
    return numero


def criar_parser(descricao: str, saida_padrao: str, com_schema: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=descricao, formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Conexão: SUPABASE_DB_URL=postgres://... ou PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE.\n"
               "Saída: 0 ok · 1 --check com diferença · 2 uso/configuração · 3 banco/psql.")
    parser.add_argument("--out", default=None, metavar="ARQUIVO",
                        help=f"arquivo de saída (padrão: {saida_padrao}, relativo à raiz do repositório)")
    if com_schema:
        parser.add_argument("--schema", default="public", help="schema a documentar (padrão: public)")
    parser.add_argument("--check", action="store_true",
                        help="não escreve; sai com 1 se o arquivo em disco difere do que seria gerado")
    parser.add_argument("--data", type=_data_iso, default=None, metavar="AAAA-MM-DD",
                        help="carimba 'Gerado em' com esta data (padrão: sem data, saída estável)")
    parser.add_argument("--timeout", type=_inteiro_positivo, default=60, metavar="SEGUNDOS",
                        help="statement_timeout de cada consulta (padrão: 60)")
    parser.set_defaults(saida_padrao=saida_padrao)
    return parser


def destino_de(args: argparse.Namespace) -> pathlib.Path:
    """--out é relativo ao diretório atual; o padrão é relativo à raiz do repositório."""
    if args.out:
        return pathlib.Path(args.out).expanduser().resolve()
    return RAIZ / args.saida_padrao


def linha_gerado(script: str, data: str | None, fonte: str = "a partir do catálogo do banco") -> str:
    sufixo = f" em {data}" if data else ""
    return f"> Gerado automaticamente por `scripts/{script}`{sufixo} {fonte}. Não edite à mão.\n"


def executar(principal, argv: list[str] | None = None) -> int:
    """Envelope dos scripts: traduz exceções em mensagem PT-BR + código de saída."""
    try:
        return int(principal(argv))
    except ErroUso as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        return SAIDA_USO
    except ErroBanco as exc:
        print(f"ERRO de banco: {exc}\nNada foi gerado.", file=sys.stderr)
        return SAIDA_BANCO
    except KeyboardInterrupt:
        print("Interrompido; nenhum arquivo foi alterado.", file=sys.stderr)
        return 130
