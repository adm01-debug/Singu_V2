// _pg_teste.ts — apoio de TESTE para os scripts que falam Postgres direto.
// Lê PGHOST/PGPORT/PGUSER do ambiente; sem PGHOST os testes se PULAM (não falham).
// Cria/derruba bancos com prefixo g7_ no Postgres local. Nunca aponta para produção.
const dec = new TextDecoder();
export const PG = { host: Deno.env.get("PGHOST") ?? "", port: Deno.env.get("PGPORT") ?? "5432", user: Deno.env.get("PGUSER") ?? "postgres" };
export const temPg = PG.host !== "";
export const motivoPulo = "PGHOST não definido — teste de Postgres pulado";
export const urlDe = (db: string) => `postgres://${PG.user}@${PG.host}:${PG.port}/${db}`;

export async function psql(db: string, args: string[], stdin?: string): Promise<{ code: number; out: string; err: string }> {
  const p = new Deno.Command("psql", {
    args: ["-X", "-q", "-h", PG.host, "-p", PG.port, "-U", PG.user, "-d", db, ...args],
    stdin: stdin === undefined ? "null" : "piped", stdout: "piped", stderr: "piped",
  }).spawn();
  if (stdin !== undefined) { const w = p.stdin.getWriter(); await w.write(new TextEncoder().encode(stdin)); await w.close(); }
  const r = await p.output();
  return { code: r.code, out: dec.decode(r.stdout), err: dec.decode(r.stderr) };
}
/** Executa SQL e lança se falhar. */
export async function sql(db: string, texto: string): Promise<string> {
  const r = await psql(db, ["-v", "ON_ERROR_STOP=1", "-At"], texto);
  if (r.code !== 0) throw new Error(`psql falhou em ${db}: ${r.err}`);
  return r.out.trim();
}
export async function recriar(db: string): Promise<void> {
  if (!/^g7_[a-z0-9_]+$/.test(db)) throw new Error("banco de teste precisa do prefixo g7_");
  await sql("postgres", `DROP DATABASE IF EXISTS ${db} WITH (FORCE);`);
  await sql("postgres", `CREATE DATABASE ${db};`);
}
export async function derrubar(...dbs: string[]): Promise<void> {
  for (const db of dbs) if (/^g7_[a-z0-9_]+$/.test(db)) await sql("postgres", `DROP DATABASE IF EXISTS ${db} WITH (FORCE);`);
}
