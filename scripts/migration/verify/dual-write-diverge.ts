// Dual-Write Divergence Detector — compara linhas modificadas nos últimos N minutos
// entre banco LEGADO e DESTINO (nos DOIS sentidos). Se o mismatch passar do threshold,
// registra system_alerts e pausa o dual-write em feature_flags (name='dual_write_enabled').
//
// Uso: deno run --allow-env --allow-net verify/dual-write-diverge.ts [--dry-run]
// Env: LEGACY_SUPABASE_URL, LEGACY_SERVICE_ROLE_KEY,
//      DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY,
//      WINDOW_MIN (5), MISMATCH_PCT (0.1), TABLES (csv; padrão contacts,deals,interactions),
//      GRACE_SEC (30) — ignora escritas dos últimos N s (espelhamento ainda em voo)
// Coluna de tempo: updated_at; tabela sem ela (ex.: interactions) usa created_at.
// --dry-run (ou DRY_RUN=1): só mede; não grava alerta nem mexe na flag.
// Saída: 0 dentro do threshold · 1 divergência (kill-switch acionado, ou tentado e falhou)
//        · 2 configuração · 3 não foi possível LER alguma tabela (nada é pausado por erro de leitura).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.117.3";

export interface LinhaResumo { legacy: number; dest: number; mismatch: number; pct: number }
export type Leitor = (tabela: string) => Promise<Map<string, string>>;

/** Normaliza timestamptz para instante UTC com microssegundos (independe de fuso e de zeros à direita). */
export function normalizarTs(ts: string): string {
  const ms = Date.parse(ts);
  if (Number.isNaN(ms)) return ts;
  const frac = (/\.(\d+)/.exec(ts)?.[1] ?? "").padEnd(6, "0").slice(0, 6);
  return `${Math.floor(ms / 1000)}.${frac}`;
}

/** Compara nos dois sentidos: falta em qualquer lado ou updated_at diferente = mismatch. Função pura. */
export function comparar(L: Map<string, string>, D: Map<string, string>): LinhaResumo {
  let mismatch = 0;
  for (const [id, ts] of L) if (D.get(id) !== ts) mismatch++;
  for (const id of D.keys()) if (!L.has(id)) mismatch++;
  const total = new Set([...L.keys(), ...D.keys()]).size;
  const pct = total === 0 ? 0 : (mismatch / total) * 100;
  return { legacy: L.size, dest: D.size, mismatch, pct: Number(pct.toFixed(3)) };
}

/** Lê id + coluna de tempo da janela [since, until], paginando (PostgREST corta em db-max-rows). */
export async function lerRecentes(sb: SupabaseClient, tabela: string, since: string, until: string, maxLinhas = 500_000): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let col = "updated_at";
  for (let de = 0; ; ) {
    const { data, error } = await sb.from(tabela).select(`id, ${col}`).gte(col, since).lte(col, until).order("id").range(de, de + 999);
    if (error) {
      if (error.code === "42703" && col === "updated_at" && de === 0) { col = "created_at"; continue; }
      throw new Error(`${tabela}: ${error.message}`);
    }
    const linhas = (data ?? []) as unknown as Record<string, unknown>[];
    if (linhas.length === 0) return map;
    for (const r of linhas) map.set(String(r.id), normalizarTs(String(r[col])));
    de += linhas.length;
    if (map.size > maxLinhas) throw new Error(`${tabela}: mais de ${maxLinhas} linhas na janela — reduza WINDOW_MIN`);
  }
}

export interface Deteccao { summary: Record<string, LinhaResumo>; divergiu: boolean; erros: string[]; maiorPct: number }

export async function detectar(tabelas: string[], legado: Leitor, destino: Leitor, threshold: number, log: (m: string) => void = console.log): Promise<Deteccao> {
  const r: Deteccao = { summary: {}, divergiu: false, erros: [], maiorPct: 0 };
  for (const t of tabelas) {
    try {
      const [L, D] = await Promise.all([legado(t), destino(t)]);
      const s = comparar(L, D);
      r.summary[t] = s;
      r.maiorPct = Math.max(r.maiorPct, s.pct);
      log(`${t}: legacy=${s.legacy} dest=${s.dest} mismatch=${s.mismatch} (${s.pct.toFixed(3)}%)`);
      if (s.pct > threshold) r.divergiu = true;
    } catch (e) {
      r.erros.push(`${t}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return r;
}

/** Grava o alerta e desliga a flag. Lança se QUALQUER uma das duas escritas falhar. */
export async function acionarKillSwitch(dst: SupabaseClient, d: Deteccao, threshold: number, janelaMin: number): Promise<void> {
  const falhas: string[] = [];
  const a = await dst.from("system_alerts").insert({
    alert_type: "dual_write_divergence",
    severity: "critical",
    threshold_pct: threshold,
    consumed_pct: d.maiorPct,
    message: `Dual-write divergiu > ${threshold}% em ${janelaMin}min`,
    metadata: d.summary,
  });
  if (a.error) falhas.push(`system_alerts: ${a.error.message}`);
  const f = await dst.from("feature_flags").upsert(
    { name: "dual_write_enabled", enabled: false, updated_at: new Date().toISOString() },
    { onConflict: "name" },
  );
  if (f.error) falhas.push(`feature_flags: ${f.error.message}`);
  if (falhas.length) throw new Error(falhas.join(" | "));
}

if (import.meta.main) {
  const LEG_URL = Deno.env.get("LEGACY_SUPABASE_URL");
  const LEG_KEY = Deno.env.get("LEGACY_SERVICE_ROLE_KEY");
  const DST_URL = Deno.env.get("DEST_SUPABASE_URL");
  const DST_KEY = Deno.env.get("DEST_SERVICE_ROLE_KEY");
  if (!LEG_URL || !LEG_KEY || !DST_URL || !DST_KEY) {
    console.error("faltando LEGACY_/DEST_ SUPABASE_URL/SERVICE_ROLE_KEY");
    Deno.exit(2);
  }
  const num = (nome: string, padrao: string, min: number): number => {
    const v = Number(Deno.env.get(nome) ?? padrao);
    if (!Number.isFinite(v) || v < min) { console.error(`${nome} inválido: esperado número >= ${min}`); Deno.exit(2); }
    return v;
  };
  const WINDOW = num("WINDOW_MIN", "5", 0.01);
  const THRESHOLD = num("MISMATCH_PCT", "0.1", 0);
  const GRACE = num("GRACE_SEC", "30", 0);
  const TABLES = (Deno.env.get("TABLES") ?? "contacts,deals,interactions").split(",").map((s) => s.trim()).filter(Boolean);
  if (TABLES.length === 0 || TABLES.some((t) => !/^[a-z_][a-z0-9_]*$/i.test(t))) { console.error("TABLES inválido (csv de nomes de tabela)"); Deno.exit(2); }
  const dryRun = Deno.args.includes("--dry-run") || Deno.env.get("DRY_RUN") === "1";

  const leg = createClient(LEG_URL, LEG_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const dst = createClient(DST_URL, DST_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const agora = Date.now();
  const since = new Date(agora - WINDOW * 60_000).toISOString();
  const until = new Date(agora - GRACE * 1000).toISOString();

  const d = await detectar(TABLES, (t) => lerRecentes(leg, t, since, until), (t) => lerRecentes(dst, t, since, until), THRESHOLD);
  for (const e of d.erros) console.error(`ERRO de leitura — ${e}`);

  if (d.divergiu) {
    if (dryRun) { console.error("\n🚨 Divergência acima do threshold — [DRY_RUN] kill-switch NÃO acionado"); Deno.exit(1); }
    console.error("\n🚨 Divergência acima do threshold — pausando dual-write");
    try {
      await acionarKillSwitch(dst, d, THRESHOLD, WINDOW);
      console.error("   kill-switch acionado: alerta gravado e dual_write_enabled=false");
    } catch (e) {
      console.error(`   ✖ KILL-SWITCH NÃO ACIONADO POR COMPLETO: ${e instanceof Error ? e.message : String(e)} — pause o dual-write manualmente`);
    }
    Deno.exit(1);
  }
  if (d.erros.length) { console.error("\n✖ Verificação incompleta: houve erro de leitura (dual-write NÃO foi pausado)"); Deno.exit(3); }
  console.log("\n✔ Dual-write dentro do threshold");
}
