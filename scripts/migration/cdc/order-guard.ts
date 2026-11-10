// CDC Event Ordering Guard — vigia, durante o replay: (1) que o LSN do slot na origem e o
// último LSN aplicado no destino nunca regridem e (2) que os relógios de origem e destino
// não divergem mais que SKEW_MAX_SEC. Somente leitura.
//
// Uso: deno run --allow-env --allow-net cdc/order-guard.ts [--once]
// Env: SRC_DB_URL, DEST_DB_URL (obrigatórias), CDC_SLOT (migration_slot),
//      SKEW_MAX_SEC (2), POLL_SEC (15), MAX_VIOLATIONS (3 ciclos CONSECUTIVOS com violação → aborta)
// --once (ou ONCE=1): um único ciclo; sai 0 se limpo, 1 se houve violação.
// Slot inexistente e falha de conexão contam como violação (antes: retry infinito em silêncio).
// Saída: 0 limpo (--once) · 1 violações · 2 configuração.
import postgres from "npm:postgres@3.4.4";

export function parseLsn(s: string | null | undefined): bigint | null {
  const m = /^([0-9A-Fa-f]{1,8})\/([0-9A-Fa-f]{1,8})$/.exec((s ?? "").trim());
  return m ? (BigInt(`0x${m[1]}`) << 32n) | BigInt(`0x${m[2]}`) : null;
}
/** Compara dois LSN válidos (<0, 0, >0). LSN inválido lança. */
export function cmpLsn(a: string, b: string): number {
  const x = parseLsn(a), y = parseLsn(b);
  if (x === null || y === null) throw new Error(`LSN inválido: "${x === null ? a : b}"`);
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Leitura do relógio de um banco: epoch do servidor (s) e instantes locais (ms) antes/depois da consulta. */
export interface Relogio { epoch: number; t0: number; t1: number }
export interface Ciclo {
  slotLsn?: string | null; // null = slot não existe
  destLsn?: string | null; // null = checkpoint vazio/inexistente (não é violação)
  src?: Relogio;
  dst?: Relogio;
  erroSrc?: string;
  erroDst?: string;
}
export interface Estado { ultimoLsn: string | null; ultimoDestLsn: string | null; consecutivas: number }
export const estadoInicial = (): Estado => ({ ultimoLsn: null, ultimoDestLsn: null, consecutivas: 0 });

/** Desvio do relógio do servidor em relação ao relógio local, com a incerteza da latência. */
export function desvio(r: Relogio): { offset: number; incerteza: number } {
  return { offset: r.epoch - (r.t0 + r.t1) / 2000, incerteza: (r.t1 - r.t0) / 2000 };
}

/** Avalia um ciclo. Função pura: devolve novo estado, violações e linha informativa. */
export function avaliar(e: Estado, c: Ciclo, skewMax: number): { estado: Estado; violacoes: string[]; info: string } {
  const v: string[] = [];
  const novo: Estado = { ...e };
  if (c.erroSrc) v.push(`origem inacessível: ${c.erroSrc}`);
  else if (c.slotLsn == null) v.push("slot de replicação não encontrado na origem");
  else if (parseLsn(c.slotLsn) === null) v.push(`LSN do slot ilegível: "${c.slotLsn}"`);
  else if (e.ultimoLsn !== null && cmpLsn(c.slotLsn, e.ultimoLsn) < 0) v.push(`LSN REGRESSION no slot: último=${e.ultimoLsn} agora=${c.slotLsn}`);
  else novo.ultimoLsn = c.slotLsn;

  if (c.erroDst) v.push(`destino inacessível: ${c.erroDst}`);
  else if (c.destLsn != null && parseLsn(c.destLsn) !== null) {
    if (e.ultimoDestLsn !== null && cmpLsn(c.destLsn, e.ultimoDestLsn) < 0) v.push(`LSN REGRESSION no checkpoint do destino: último=${e.ultimoDestLsn} agora=${c.destLsn}`);
    else novo.ultimoDestLsn = c.destLsn;
  }

  let skewTxt = "n/d";
  if (c.src && c.dst) {
    const a = desvio(c.src), b = desvio(c.dst);
    const skew = Math.abs(a.offset - b.offset);
    const margem = a.incerteza + b.incerteza; // latência de rede não é skew
    skewTxt = `${skew.toFixed(2)}s`;
    if (!Number.isFinite(skew)) v.push("CLOCK SKEW ilegível (relógio do banco não numérico)");
    else if (skew - margem > skewMax) v.push(`CLOCK SKEW=${skew.toFixed(2)}s (±${margem.toFixed(2)}s) > ${skewMax}s`);
  }
  novo.consecutivas = v.length ? e.consecutivas + 1 : 0;
  return { estado: novo, violacoes: v, info: `lsn=${c.slotLsn ?? "-"} destino=${c.destLsn ?? "-"} skew=${skewTxt}` };
}

export interface OpcoesVigia {
  skewMax: number; pollMs: number; maxViolacoes: number; once: boolean;
  log?: (m: string) => void; dormir?: (ms: number) => Promise<void>; maxCiclos?: number;
}

/** Laço principal; devolve o código de saída. `coletar` é injetável (teste). */
export async function vigiar(coletar: () => Promise<Ciclo>, op: OpcoesVigia): Promise<number> {
  const log = op.log ?? ((m: string) => console.log(`[order-guard ${new Date().toISOString()}] ${m}`));
  const dormir = op.dormir ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let estado = estadoInicial();
  for (let n = 1; ; n++) {
    const r = avaliar(estado, await coletar(), op.skewMax);
    estado = r.estado;
    if (r.violacoes.length === 0) log(`✔ ${r.info}`);
    else for (const m of r.violacoes) log(`🚨 ${m}`);
    if (op.once) return r.violacoes.length ? 1 : 0;
    if (estado.consecutivas >= op.maxViolacoes) {
      log(`🚨 ${op.maxViolacoes} ciclos consecutivos com violação — abortando (operador deve investigar)`);
      return 1;
    }
    if (op.maxCiclos && n >= op.maxCiclos) return estado.consecutivas ? 1 : 0;
    await dormir(op.pollMs);
  }
}

const curto = (e: unknown) => {
  const x = e as { code?: string; message?: string };
  return `${x.code ?? ""} ${(x.message ?? String(e)).replace(/:\/\/[^@\s]*@/g, "://…@")}`.trim().slice(0, 160);
};

/** Coletor real: duas conexões persistentes (a URL com senha nunca vai para argv nem para log). */
export function criarColetor(srcUrl: string, destUrl: string, slot: string): { coletar: () => Promise<Ciclo>; fechar: () => Promise<void> } {
  const op = { max: 1, connect_timeout: 10, onnotice: () => {} };
  const src = postgres(srcUrl, op), dst = postgres(destUrl, op);
  const coletar = async (): Promise<Ciclo> => {
    const c: Ciclo = {};
    await Promise.all([
      (async () => {
        try {
          const t0 = Date.now();
          const [l] = await src<{ lsn: string | null; epoch: number }[]>`
            SELECT (SELECT COALESCE(confirmed_flush_lsn, restart_lsn)::text FROM pg_replication_slots WHERE slot_name = ${slot}) AS lsn,
                   extract(epoch FROM clock_timestamp())::float8 AS epoch`;
          c.src = { epoch: Number(l.epoch), t0, t1: Date.now() };
          c.slotLsn = l.lsn;
        } catch (e) { c.erroSrc = curto(e); }
      })(),
      (async () => {
        try {
          const t0 = Date.now();
          const [l] = await dst<{ epoch: number; tem: boolean }[]>`
            SELECT extract(epoch FROM clock_timestamp())::float8 AS epoch,
                   to_regclass('public._migration_cdc_checkpoint') IS NOT NULL AS tem`;
          c.dst = { epoch: Number(l.epoch), t0, t1: Date.now() };
          c.destLsn = null;
          if (l.tem) {
            const [m] = await dst<{ lsn: string | null }[]>`
              SELECT max(lsn::pg_lsn)::text AS lsn FROM public._migration_cdc_checkpoint
              WHERE lsn ~ '^[0-9A-Fa-f]{1,8}/[0-9A-Fa-f]{1,8}$'`;
            c.destLsn = m.lsn;
          }
        } catch (e) { c.erroDst = curto(e); }
      })(),
    ]);
    return c;
  };
  return { coletar, fechar: async () => { await Promise.allSettled([src.end({ timeout: 5 }), dst.end({ timeout: 5 })]); } };
}

if (import.meta.main) {
  const SRC = Deno.env.get("SRC_DB_URL");
  const DST = Deno.env.get("DEST_DB_URL");
  if (!SRC || !DST) { console.error("SRC_DB_URL e DEST_DB_URL obrigatórios"); Deno.exit(2); }
  const num = (nome: string, padrao: string, min: number): number => {
    const v = Number(Deno.env.get(nome) ?? padrao);
    if (!Number.isFinite(v) || v < min) { console.error(`${nome} inválido: esperado número >= ${min}`); Deno.exit(2); }
    return v;
  };
  const SLOT = Deno.env.get("CDC_SLOT") ?? "migration_slot";
  const skewMax = num("SKEW_MAX_SEC", "2", 0);
  const poll = num("POLL_SEC", "15", 0.1);
  const maxViolacoes = Math.floor(num("MAX_VIOLATIONS", "3", 1));
  const once = Deno.args.includes("--once") || Deno.env.get("ONCE") === "1";
  console.log(`[order-guard ${new Date().toISOString()}] iniciado slot=${SLOT} skew_max=${skewMax}s poll=${poll}s${once ? " (--once)" : ""}`);
  const { coletar, fechar } = criarColetor(SRC, DST, SLOT);
  const codigo = await vigiar(coletar, { skewMax, pollMs: poll * 1000, maxViolacoes, once });
  await fechar();
  Deno.exit(codigo);
}
