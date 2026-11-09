// Compara ORIGEM × DESTINO objeto a objeto (nome, tamanho, ETag, content-type) e
// confirma por HEAD uma amostra. Somente leitura nos dois projetos.
// Uso: deno run --allow-env --allow-net --allow-write storage/verify-counts.ts
// Variáveis (além das de _lib.ts): VERIFY_SAMPLE (20 HEADs por bucket),
//   VERIFY_REPORT (padrão: storage/verify-report.json).
// Saída: 0 paridade · 1 divergência ou falha · 2 configuração.
import {
  etagEhMd5, etagLimpo, filtrarBuckets, fmtBytes, headObjeto, intEnv, iterObjects, listBuckets, loadEnv, sairComErro,
  type Env, type Fetch, type StorageObject,
} from "./_lib.ts";

export interface Report {
  bucket: string; src_count: number; dest_count: number; src_bytes: number; dest_bytes: number;
  missing: number; extra: number; mismatches: number;
  sample_mismatches: string[]; // até MAX_DETALHES linhas legíveis (faltando/sobrando/divergente/HEAD)
  ok: boolean;
}
export interface Diferenca { missing: string[]; extra: string[]; divergentes: string[] }

const MAX_DETALHES = 100;

/** Compara as duas listagens completas. Função pura. */
export function compararListagens(src: StorageObject[], dest: StorageObject[]): Diferenca {
  const d = new Map(dest.map((o) => [o.name, o]));
  const vistos = new Set<string>();
  const out: Diferenca = { missing: [], extra: [], divergentes: [] };
  for (const s of src) {
    vistos.add(s.name);
    const o = d.get(s.name);
    if (!o) { out.missing.push(s.name); continue; }
    const motivos: string[] = [];
    const ts = s.metadata?.size, td = o.metadata?.size;
    if (ts !== td) motivos.push(`size ${ts}≠${td}`);
    const es = etagLimpo(s.metadata?.eTag), ed = etagLimpo(o.metadata?.eTag);
    if (etagEhMd5(es) && etagEhMd5(ed) && es !== ed) motivos.push(`etag ${es.slice(0, 8)}≠${ed.slice(0, 8)}`);
    const ms = s.metadata?.mimetype, md = o.metadata?.mimetype;
    if (ms && md && ms !== md) motivos.push(`mimetype ${ms}≠${md}`);
    if (motivos.length) out.divergentes.push(`${s.name} (${motivos.join(", ")})`);
  }
  for (const o of dest) if (!vistos.has(o.name)) out.extra.push(o.name);
  return out;
}

/** Amostra determinística dado o gerador (Fisher–Yates parcial). */
export function amostrar<T>(itens: T[], n: number, rng: () => number = Math.random): T[] {
  const a = itens.slice();
  const k = Math.min(n, a.length);
  for (let i = 0; i < k; i++) {
    // eslint-disable-next-line sonarjs/pseudo-random -- amostragem estatística de verificação, não requer CSPRNG (ADR-020)
    const j = i + Math.floor(rng() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

async function listarTudo(base: string, key: string, bucket: string, fetchFn?: Fetch): Promise<StorageObject[]> {
  const todos: StorageObject[] = [];
  for await (const o of iterObjects(base, key, bucket, "", fetchFn)) todos.push(o);
  return todos;
}
const soma = (l: StorageObject[]) => l.reduce((t, o) => t + (o.metadata?.size ?? 0), 0);

export async function verificar(env: Env, op: { fetchFn?: Fetch; amostra?: number; rng?: () => number } = {}): Promise<Report[]> {
  const src = filtrarBuckets(await listBuckets(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, op.fetchFn), env.ONLY_BUCKET);
  const destIds = new Set((await listBuckets(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY, op.fetchFn)).map((b) => b.id));
  const report: Report[] = [];
  for (const b of src) {
    if (!destIds.has(b.id)) {
      console.error(`✖ bucket ${b.id} não existe no destino`);
      report.push({ bucket: b.id, src_count: -1, dest_count: -1, src_bytes: 0, dest_bytes: 0, missing: 0, extra: 0, mismatches: 0, sample_mismatches: ["bucket-missing"], ok: false });
      continue;
    }
    const srcObjs = await listarTudo(env.SRC_SUPABASE_URL, env.SRC_SERVICE_ROLE_KEY, b.id, op.fetchFn);
    const destObjs = await listarTudo(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY, b.id, op.fetchFn);
    const dif = compararListagens(srcObjs, destObjs);
    const detalhes = [
      ...dif.missing.map((n) => `${n} (faltando no destino)`),
      ...dif.extra.map((n) => `${n} (sobrando no destino)`),
      ...dif.divergentes,
    ];
    // HEAD numa amostra do que a listagem deu como igual: prova que o objeto é servido de fato.
    const ruins = new Set([...dif.missing, ...dif.divergentes.map((d) => d.replace(/ \([^()]*\)$/, ""))]);
    let headFalhas = 0;
    for (const o of amostrar(srcObjs.filter((x) => !ruins.has(x.name)), op.amostra ?? 20, op.rng)) {
      const h = await headObjeto(env.DEST_SUPABASE_URL, env.DEST_SERVICE_ROLE_KEY, b.id, o.name, op.fetchFn);
      if (!h.ok) { headFalhas++; detalhes.push(`${o.name} (HEAD ${h.status})`); }
      else if ((o.metadata?.size ?? 0) !== h.size) { headFalhas++; detalhes.push(`${o.name} (size ${o.metadata?.size}≠${h.size})`); }
    }
    const srcBytes = soma(srcObjs), destBytes = soma(destObjs);
    const ok = dif.missing.length + dif.extra.length + dif.divergentes.length + headFalhas === 0 && srcBytes === destBytes;
    report.push({
      bucket: b.id,
      src_count: srcObjs.length, dest_count: destObjs.length,
      src_bytes: srcBytes, dest_bytes: destBytes,
      missing: dif.missing.length, extra: dif.extra.length, mismatches: dif.divergentes.length + headFalhas,
      sample_mismatches: detalhes.slice(0, MAX_DETALHES), ok,
    });
    console.log(`${ok ? "✔" : "✖"} ${b.id}: src=${srcObjs.length}(${fmtBytes(srcBytes)}) dest=${destObjs.length}(${fmtBytes(destBytes)}) faltando=${dif.missing.length} sobrando=${dif.extra.length} divergentes=${dif.divergentes.length + headFalhas}`);
    for (const m of detalhes.slice(0, MAX_DETALHES)) console.log(`    - ${m}`);
    if (detalhes.length > MAX_DETALHES) console.log(`    … e mais ${detalhes.length - MAX_DETALHES}`);
  }
  return report;
}

if (import.meta.main) {
  try {
    const env = loadEnv();
    const report = await verificar(env, { amostra: intEnv((k) => Deno.env.get(k), "VERIFY_SAMPLE", 20, 0) });
    const destino = Deno.env.get("VERIFY_REPORT") || new URL("./verify-report.json", import.meta.url).pathname;
    await Deno.writeTextFile(destino, JSON.stringify(report, null, 2));
    console.log(`\nRelatório: ${destino}`);
    if (report.length === 0 || report.some((r) => !r.ok)) {
      console.error(report.length === 0 ? "\n✖ Nenhum bucket na origem — nada foi verificado." : "\n✖ Divergências detectadas.");
      Deno.exit(1);
    }
    console.log("\n✔ Paridade completa.");
  } catch (e) {
    sairComErro(e);
  }
}
