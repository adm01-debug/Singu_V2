"""Apoio dos testes Python que precisam de Postgres (test_generate_docs.py, test_run_explain_analyze.py).

Usa o servidor de PGHOST/PGPORT/PGUSER (PGPASSWORD se houver). Sem banco acessível devolve o motivo
para o teste se pular. Cada classe de teste cria o próprio banco descartável (prefixo g3_) e o remove.
"""

from __future__ import annotations

import os
import pathlib
import shutil
import subprocess
import sys
import time

SCRIPTS = pathlib.Path(__file__).resolve().parent
RAIZ = SCRIPTS.parent

# Schema de fixture: FK composta, enum, defaults e comentários "difíceis", nomes com maiúscula/aspas,
# FK para outro schema, auto-relacionamento, 1:1, particionada, view, tabela solta e schema vazio.
FIXTURE = r"""
CREATE SCHEMA app; CREATE SCHEMA vazio; CREATE SCHEMA outro;
CREATE TYPE app.status_negocio AS ENUM ('aberto', 'ganho', 'perdido | cancelado');
CREATE TABLE outro.usuarios (id uuid PRIMARY KEY);
CREATE TABLE app.empresas (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, cnpj text UNIQUE);
COMMENT ON TABLE app.empresas IS E'Empresas (PJ) | clientes\ne `prospects` <b>*ativos*</b>';
COMMENT ON COLUMN app.empresas.nome IS E'Razão social | fantasia\nsegunda linha com `crase` e "aspas"';
CREATE TABLE app.contatos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  empresa_id uuid REFERENCES app.empresas(id) ON DELETE SET NULL,
  dono_id uuid NOT NULL REFERENCES outro.usuarios(id) ON DELETE CASCADE,
  criado_por uuid REFERENCES outro.usuarios(id),
  apelido text DEFAULT E'a|b `c` "d"\n''e''',
  status app.status_negocio NOT NULL DEFAULT 'aberto',
  etiquetas text[] DEFAULT '{}'::text[],
  valor numeric(12,2) DEFAULT 0,
  nome_completo text GENERATED ALWAYS AS (apelido || ' x') STORED,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE app."Tabela Mista" ("Id Estranho" int, "sub id" int, "col|pipe" text, PRIMARY KEY ("Id Estranho", "sub id"));
COMMENT ON TABLE app."Tabela Mista" IS 'Nome com maiúscula e espaço';
CREATE TABLE app.itens (
  id serial PRIMARY KEY, mista_id int NOT NULL, mista_sub int NOT NULL,
  contato_id bigint UNIQUE REFERENCES app.contatos(id),
  pai_id int REFERENCES app.itens(id),
  CONSTRAINT itens_mista_fk FOREIGN KEY (mista_id, mista_sub)
    REFERENCES app."Tabela Mista"("Id Estranho", "sub id") ON UPDATE CASCADE
);
CREATE TABLE app.solta (x int);
CREATE TABLE app."class" (id int PRIMARY KEY);
CREATE TABLE app.tabela_mista (id int PRIMARY KEY, c int REFERENCES app."class"(id));
CREATE TABLE app.medidas (id int, dia date NOT NULL, PRIMARY KEY (id, dia)) PARTITION BY RANGE (dia);
CREATE TABLE app.medidas_2026 PARTITION OF app.medidas FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE app.leituras (id int PRIMARY KEY, m_id int, m_dia date,
  FOREIGN KEY (m_id, m_dia) REFERENCES app.medidas(id, dia));
CREATE VIEW app.vw_contatos AS SELECT id, apelido FROM app.contatos;
COMMENT ON VIEW app.vw_contatos IS 'View de apoio';
ALTER TABLE app.contatos ENABLE ROW LEVEL SECURITY;
"""


def _ambiente(banco: str | None = None, extra: dict[str, str] | None = None) -> dict[str, str]:
    amb = dict(os.environ)
    amb.pop("SUPABASE_DB_URL", None)
    amb.setdefault("PGCONNECT_TIMEOUT", "10")
    if banco:
        amb["PGDATABASE"] = banco
    amb.update(extra or {})
    return amb


def psql(sql: str, banco: str = "postgres", extra: dict[str, str] | None = None) -> str:
    proc = subprocess.run(["psql", "-X", "-q", "-w", "-At", "-v", "ON_ERROR_STOP=1", "-f", "-"], input=sql,
                          env=_ambiente(banco, extra), capture_output=True, text=True, timeout=120, check=False)
    if proc.returncode != 0:
        raise RuntimeError(f"SQL de cenário falhou: {proc.stderr.strip()}")
    return proc.stdout.strip()


def motivo_indisponivel() -> str | None:
    """None se há Postgres de teste; senão, o motivo para pular."""
    if not os.environ.get("PGHOST"):
        return "PGHOST não definido (sem Postgres de teste)"
    if not shutil.which("psql"):
        return "psql não instalado"
    try:
        psql("select 1")
    except (RuntimeError, subprocess.TimeoutExpired) as exc:
        return f"Postgres inacessível: {str(exc).splitlines()[-1]}"
    return None


def criar_banco(rotulo: str, fixture: str = "") -> str:
    nome = f"g3_{rotulo}_{os.getpid()}_{int(time.time() * 1000) % 10_000_000}"
    psql(f"CREATE DATABASE {nome} TEMPLATE template0")
    if fixture:
        psql(fixture, nome)
    return nome


def remover_banco(nome: str) -> None:
    try:
        psql(f"DROP DATABASE IF EXISTS {nome} WITH (FORCE)")
    except RuntimeError:
        pass


def rodar(script: str, *args: str, banco: str | None = None, extra: dict[str, str] | None = None,
          cwd: str | os.PathLike | None = None, limpar: tuple[str, ...] = ()) -> subprocess.CompletedProcess:
    """Roda um script de scripts/ como o usuário rodaria (processo separado)."""
    amb = _ambiente(banco, extra)
    for var in limpar:
        amb.pop(var, None)
    return subprocess.run([sys.executable, str(SCRIPTS / script), *args], env=amb, cwd=cwd,
                          capture_output=True, text=True, timeout=180, check=False)
