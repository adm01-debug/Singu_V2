// Amostra N linhas por tabela e compara hash origem×destino (+ contagem total).
// Passo 1 (gera SQL):  deno run --allow-env --allow-read --allow-write verify/row-diff.ts
// Passo 2 (nos 2 bancos): psql -X -v ON_ERROR_STOP=1 "$SRC_DB_URL"  -f verify/row-diff.sql > verify/row-diff-out/src.json
//                         psql -X -v ON_ERROR_STOP=1 "$DEST_DB_URL" -f verify/row-diff.sql > verify/row-diff-out/dest.json
// Passo 3 (compara):   deno run --allow-env --allow-read --allow-write verify/row-diff.ts --compare
//
// Tabelas e chaves primárias vêm de ddl/02_tables.sql (TABLES_DDL troca o arquivo), menos as de
// skip-tables.txt (dados não migrados; INCLUDE_SKIPPED=1 inclui). Envs: SAMPLE_SIZE (200), ONLY_TABLE,
// ROW_DIFF_BASE (diretório de saída; padrão: verify/).
// O hash usa to_jsonb(linha) com TimeZone=UTC: não depende de ordem de colunas/chaves JSON nem do fuso
// da sessão; NULL ≠ ausente e 1.0 ≠ 1.00 continuam sendo diferença.
// Saída: 0 íntegro · 1 divergência · 2 configuração/entrada inválida (ex.: nenhuma tabela, JSON ausente).

export interface Tabela { nome: string; pk: string[] }
export interface Amostra { n: number | null; s: { pk: string; h: string }[] }
export interface ResultadoTabela { ok: number; missing: number; mismatch: number; extra: number; count_src: number | null; count_dst: number | null; falha: string | null }
export class ErroEntrada extends Error {}

const ident = (s: string) => (s.startsWith('"') ? s.slice(1, -1).replace(/""/g, '"') : s);
const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** Extrai tabelas public.* e suas PKs de um dump no formato de ddl/02_tables.sql. */
export function parseTabelas(ddl: string): Tabela[] {
  const out: Tabela[] = [];
  const re = /^CREATE TABLE (?:IF NOT EXISTS )?public\.("(?:[^"]|"")+"|[a-z_][a-z0-9_$]*) \(\n([\s\S]*?)\n\)/gm;
  for (const m of ddl.matchAll(re)) {
    const pk = /CONSTRAINT \S+ PRIMARY KEY \(([^)]+)\)/.exec(m[2]);
    out.push({ nome: ident(m[1]), pk: pk ? pk[1].split(",").map((c) => ident(c.trim())) : [] });
  }
  return out;
}

/** Padrões de skip-tables.txt (um por linha, # comenta, glob com * e ?). */
export function parseSkip(texto: string): RegExp[] {
  return texto.split(/\r?\n/).map((l) => l.replace(/#.*$/, "").trim()).filter(Boolean)
    .map((g) => new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$"));
}

export function selecionar(tabelas: Tabela[], skip: RegExp[], only: string): Tabela[] {
  const alvo = only ? tabelas.filter((t) => t.nome === only) : tabelas.filter((t) => !skip.some((r) => r.test(t.nome)));
  if (only && alvo.length === 0) throw new ErroEntrada(`ONLY_TABLE="${only}" não existe no DDL`);
  if (alvo.length === 0) throw new ErroEntrada("nenhuma tabela encontrada no DDL — nada a verificar (confira TABLES_DDL)");
  return alvo;
}

export interface OpcoesSql { modo: "amostra" | "profundo"; amostra?: number; head?: number; tail?: number; pct?: number }

/** Gera o SQL único (somente leitura) que devolve {tabela: {n, s:[{pk,h}]}}. */
export function gerarSql(tabelas: Tabela[], op: OpcoesSql): string {
  const hash = op.modo === "profundo"
    ? "encode(sha256(convert_to(to_jsonb(x)::text, 'UTF8')), 'hex')"
    : "md5(to_jsonb(x)::text)";
  const partes = tabelas.map((t) => {
    const rel = `public.${q(t.nome)}`;
    const cols = t.pk.map((c) => `x.${q(c)}`);
    // Sem PK: a própria linha (hash) é a chave — compara como conjunto.
    const pk = cols.length === 0 ? hash : cols.length === 1 ? `${cols[0]}::text` : `jsonb_build_array(${cols.join(", ")})::text`;
    const ord = (dir: string) => (cols.length ? cols.map((c) => `${c} ${dir}`).join(", ") : `1 ${dir}`);
    const sel = `SELECT ${pk} AS pk, ${hash} AS h FROM ${rel} x`;
    let amostra: string;
    if (op.modo === "profundo") {
      const corte = Math.max(0, Math.min(10000, Math.round((op.pct ?? 1) * 100)));
      amostra = `(${sel} ORDER BY ${ord("ASC")} LIMIT ${op.head ?? 100})
      UNION (${sel} ORDER BY ${ord("DESC")} LIMIT ${op.tail ?? 100})
      UNION (${sel} WHERE (('x' || substr(md5(${pk}), 1, 7))::bit(28)::int % 10000) < ${corte})`;
    } else {
      amostra = `${sel} ORDER BY ${ord("ASC")} LIMIT ${op.amostra ?? 200}`;
    }
    return `  SELECT ${lit(t.nome)} AS t, json_build_object('n', (SELECT count(*) FROM ${rel}),
    's', COALESCE((SELECT json_agg(json_build_object('pk', pk, 'h', h) ORDER BY pk) FROM (
      ${amostra}
    ) s), '[]'::json)) AS samples`;
  });
  return [
    `-- gerado por ${op.modo === "profundo" ? "row-diff-deep.ts" : "row-diff.ts"} — rode em ORIGEM e DESTINO, salve como src.json / dest.json`,
    "\\set QUIET on",
    "\\pset format unaligned",
    "\\pset tuples_only on",
    "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;",
    "SET LOCAL TimeZone = 'UTC';",
    "SET LOCAL extra_float_digits = 1;",
    "SET LOCAL bytea_output = 'hex';",
    "SET LOCAL IntervalStyle = 'postgres';",
    "SELECT json_object_agg(t, samples) FROM (",
    partes.join("\n  UNION ALL\n"),
    ") q;",
    "COMMIT;",
    "",
  ].join("\n");
}

/** Lê a saída do psql (última linha que é um objeto JSON). */
export function parseSaida(texto: string, rotulo: string): Record<string, Amostra> {
  const linha = texto.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("{")).pop();
  if (!linha) throw new ErroEntrada(`${rotulo}: nenhum JSON encontrado — o psql falhou? (rode com -v ON_ERROR_STOP=1 e veja o erro)`);
  let bruto: Record<string, unknown>;
  try { bruto = JSON.parse(linha); } catch { throw new ErroEntrada(`${rotulo}: JSON inválido/truncado`); }
  const out: Record<string, Amostra> = {};
  for (const [t, v] of Object.entries(bruto)) {
    out[t] = Array.isArray(v) ? { n: null, s: v as Amostra["s"] } : v as Amostra;
  }
  return out;
}

/** Compara as duas amostras. Função pura. */
export function comparar(src: Record<string, Amostra>, dst: Record<string, Amostra>): Record<string, ResultadoTabela> {
  const rel: Record<string, ResultadoTabela> = {};
  for (const t of [...new Set([...Object.keys(src), ...Object.keys(dst)])].sort()) {
    const a = src[t], b = dst[t];
    const r: ResultadoTabela = { ok: 0, missing: 0, mismatch: 0, extra: 0, count_src: a?.n ?? null, count_dst: b?.n ?? null, falha: null };
    rel[t] = r;
    if (!a || !b) { r.falha = `tabela ausente na saída ${a ? "do destino" : "da origem"}`; continue; }
    const dmap = new Map(b.s.map((x) => [x.pk, x.h]));
    const vistos = new Set<string>();
    for (const x of a.s) {
      vistos.add(x.pk);
      const h = dmap.get(x.pk);
      if (h === undefined) r.missing++;
      else if (h !== x.h) r.mismatch++;
      else r.ok++;
    }
    // "Sobrando no destino" só é confiável quando a amostra da origem cobre a tabela inteira.
    if (a.n !== null && new Set(a.s.map((x) => x.pk)).size >= a.n) for (const x of b.s) if (!vistos.has(x.pk)) r.extra++;
    if (a.n !== null && b.n !== null && a.n !== b.n) r.falha = `contagem difere: origem=${a.n} destino=${b.n}`;
  }
  return rel;
}

export const tabelaOk = (r: ResultadoTabela) => r.falha === null && r.missing + r.mismatch + r.extra === 0;

export interface Caminhos { base: URL; ddl: URL; skip: URL }
export function caminhos(): Caminhos {
  const aqui = new URL("./", import.meta.url);
  const dir = Deno.env.get("ROW_DIFF_BASE");
  const ddl = Deno.env.get("TABLES_DDL");
  return {
    base: dir ? new URL(`file://${dir.replace(/\/+$/, "")}/`) : aqui,
    ddl: ddl ? new URL(`file://${ddl}`) : new URL("../ddl/02_tables.sql", aqui),
    skip: new URL("../skip-tables.txt", aqui),
  };
}

export async function carregarTabelas(c: Caminhos): Promise<Tabela[]> {
  const ddl = await Deno.readTextFile(c.ddl).catch(() => { throw new ErroEntrada(`não consegui ler o DDL de tabelas em ${c.ddl.pathname}`); });
  const skip = Deno.env.get("INCLUDE_SKIPPED") === "1" ? [] : parseSkip(await Deno.readTextFile(c.skip).catch(() => ""));
  return selecionar(parseTabelas(ddl), skip, Deno.env.get("ONLY_TABLE") ?? "");
}

export function inteiro(nome: string, padrao: number, min = 1): number {
  const v = Number(Deno.env.get(nome) ?? padrao);
  if (!Number.isInteger(v) || v < min) throw new ErroEntrada(`${nome} inválido: esperado inteiro >= ${min}`);
  return v;
}

export async function lerAmostras(dirOut: URL): Promise<[Record<string, Amostra>, Record<string, Amostra>]> {
  const ler = async (nome: string) => parseSaida(
    await Deno.readTextFile(new URL(nome, dirOut)).catch(() => { throw new ErroEntrada(`${nome} não encontrado em ${dirOut.pathname} — rode o SQL gerado nos dois bancos primeiro`); }),
    nome,
  );
  const par: [Record<string, Amostra>, Record<string, Amostra>] = [await ler("src.json"), await ler("dest.json")];
  if (Object.keys(par[0]).length === 0) throw new ErroEntrada("src.json não contém nenhuma tabela — nada foi verificado");
  return par;
}

export function sair(e: unknown): never {
  console.error(`✖ ${e instanceof Error ? e.message : String(e)}`);
  Deno.exit(e instanceof ErroEntrada ? 2 : 1);
}

if (import.meta.main) {
  try {
    const c = caminhos();
    const outDir = new URL("./row-diff-out/", c.base);
    if (Deno.args.includes("--compare")) {
      const [src, dst] = await lerAmostras(outDir);
      const report = comparar(src, dst);
      let hardFail = false;
      for (const [t, r] of Object.entries(report)) {
        const ok = tabelaOk(r);
        if (!ok) hardFail = true;
        console.log(`${ok ? "✔" : "✖"} ${t}: ok=${r.ok} missing=${r.missing} mismatch=${r.mismatch} extra=${r.extra}${r.falha ? ` — ${r.falha}` : ""}`);
      }
      await Deno.writeTextFile(new URL("./report.json", outDir), JSON.stringify(report, null, 2));
      if (hardFail) { console.error("\n✖ Divergências detectadas."); Deno.exit(1); }
      console.log(`\n✔ Amostragem íntegra em todas as ${Object.keys(report).length} tabelas.`);
    } else {
      const tabelas = await carregarTabelas(c);
      await Deno.mkdir(outDir, { recursive: true });
      const sqlPath = new URL("./row-diff.sql", c.base);
      await Deno.writeTextFile(sqlPath, gerarSql(tabelas, { modo: "amostra", amostra: inteiro("SAMPLE_SIZE", 200) }));
      console.log(`✔ SQL gerado: ${sqlPath.pathname} (${tabelas.length} tabelas)`);
      console.log(`Rode em ORIGEM:  psql -X -v ON_ERROR_STOP=1 "$SRC_DB_URL" -f ${sqlPath.pathname} > ${outDir.pathname}src.json`);
      console.log(`Rode em DESTINO: psql -X -v ON_ERROR_STOP=1 "$DEST_DB_URL" -f ${sqlPath.pathname} > ${outDir.pathname}dest.json`);
      console.log(`Depois: deno run --allow-env --allow-read --allow-write verify/row-diff.ts --compare`);
    }
  } catch (e) {
    sair(e);
  }
}
