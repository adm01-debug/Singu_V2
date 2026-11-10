// Replay idempotente e EM ORDEM do WAL capturado pelo wal2json (format-version=2, como
// cdc/drain.sh grava; format-version=1 em uma linha também é aceito) no destino.
// Uso: deno run --allow-env --allow-net --allow-read cdc/replay.ts [--dry-run]
// Requer: DEST_SUPABASE_URL + DEST_SERVICE_ROLE_KEY; CDC_OUT_DIR (padrão cdc/out/, arquivos *.json).
// Pré-requisito no destino: cdc/checkpoint.sql (tabela public._migration_cdc_checkpoint).
//
// Garantias:
//   - unidade = transação (B…C); só entra no checkpoint depois de TODAS as mudanças aplicadas;
//   - marca d'água = maior LSN válido do checkpoint: transação com LSN <= marca é pulada
//     (re-execução aplica 0); transação nova com LSN menor que uma já aplicada = fora de ordem → aborta;
//   - qualquer erro (linha corrompida no meio, falha ao aplicar/gravar checkpoint, TRUNCATE,
//     DELETE sem chave) PARA o replay com saída 1 — nunca "pula e segue";
//   - números grandes/decimais passam sem perda; json/jsonb e bytea são reconvertidos.
// Limites: só schema public; tabela sem PK no destino duplica em re-execução de INSERT;
//   transação incompleta no fim do arquivo (drain interrompido) não é aplicada (aviso).
// --dry-run (ou DRY_RUN=1): lê, valida e conta; não escreve nada. Saída: 0 ok · 1 erro · 2 configuração.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { cmpLsn, parseLsn } from "./order-guard.ts";

type Linha = Record<string, unknown>;
export interface Mudanca { acao: "I" | "U" | "D"; schema: string; tabela: string; linha: Linha; chave: Linha | null }
export interface Unidade { lsn: string; mudancas: Mudanca[]; origem: string }
export interface Destino {
  lsnsAplicados(): Promise<string[]>;
  marcar(lsn: string): Promise<void>;
  upsert(tabela: string, linha: Linha): Promise<void>;
  /** UPDATE pela chave antiga; devolve quantas linhas casaram. */
  atualizar(tabela: string, chave: Linha, linha: Linha): Promise<number>;
  remover(tabela: string, chave: Linha): Promise<void>;
}
export interface Resumo { total: number; applied: number; skipped: number; ignoradas: number; incompletas: number; mudancas: number }

interface JsonComBruto { rawJSON(texto: string): unknown; isRawJSON(v: unknown): v is { rawJSON: string } }
const J = JSON as unknown as JsonComBruto;

/** JSON.parse que preserva dígito a dígito números que o double não representa (bigint, numeric). */
export function parseSemPerda(texto: string): unknown {
  const reviver = (_k: string, v: unknown, ctx?: { source?: string }) =>
    typeof v === "number" && ctx?.source !== undefined && String(v) !== ctx.source ? J.rawJSON(ctx.source) : v;
  return JSON.parse(texto, reviver as Parameters<typeof JSON.parse>[1]);
}
/** Valor para filtro de URL (número preservado vira o texto original). */
export const paraFiltro = (v: unknown): string => (J.isRawJSON(v) ? v.rawJSON : String(v));

function converter(tipo: string, valor: unknown): unknown {
  if (typeof valor !== "string") return valor;
  if (/^jsonb?$/.test(tipo)) return parseSemPerda(valor);
  if (tipo === "bytea" && !valor.startsWith("\\x")) return `\\x${valor}`;
  return valor;
}
interface ColV2 { name: string; type?: string; value: unknown }
const deColunas = (cols: ColV2[] | undefined): Linha => Object.fromEntries((cols ?? []).map((c) => [c.name, converter(c.type ?? "", c.value)]));
const deListas = (nomes: string[] = [], tipos: string[] = [], valores: unknown[] = []): Linha =>
  Object.fromEntries(nomes.map((n, i) => [n, converter(tipos[i] ?? "", valores[i])]));

/** Agrupa linhas do wal2json em unidades atômicas (transações), na ordem do arquivo. */
export class Agrupador {
  private aberta: { lsnB?: string; mudancas: Mudanca[]; ultimoLsn?: string } | null = null;
  incompletas = 0;

  /** Processa uma linha; devolve as unidades fechadas por ela. Linha inválida lança. */
  push(texto: string, origem: string): Unidade[] {
    const m = parseSemPerda(texto) as Record<string, unknown>;
    if (m === null || typeof m !== "object") throw new Error("linha não é objeto JSON");
    if (Array.isArray(m.change)) { // format-version=1: a linha inteira é uma transação
      const lsn = (m.lsn ?? m.nextlsn) as string | undefined;
      if (!lsn) throw new Error("transação v1 sem lsn/nextlsn (drene com include-lsn=true)");
      const mud = (m.change as Record<string, unknown>[]).map((c) => {
        const ok = c.oldkeys as { keynames?: string[]; keytypes?: string[]; keyvalues?: unknown[] } | undefined;
        return this.mudanca(String(c.kind), c.schema, c.table,
          deListas(c.columnnames as string[], c.columntypes as string[], c.columnvalues as unknown[]),
          ok ? deListas(ok.keynames, ok.keytypes, ok.keyvalues) : null);
      });
      return [{ lsn, mudancas: mud, origem }];
    }
    const acao = String(m.action ?? "");
    const lsn = typeof m.lsn === "string" ? m.lsn : undefined;
    if (acao === "B") {
      if (this.aberta) this.incompletas++; // B sem C anterior: transação cortada, será reenviada pelo slot
      this.aberta = { lsnB: lsn, mudancas: [] };
      return [];
    }
    if (acao === "C") {
      const a = this.aberta;
      this.aberta = null;
      if (!a) return []; // C órfão (início do arquivo cortado): o B correspondente já foi aplicado ou virá de novo
      const final = lsn ?? a.lsnB ?? a.ultimoLsn;
      if (!final) throw new Error("transação sem LSN (drene com include-lsn=true)");
      return [{ lsn: final, mudancas: a.mudancas, origem }];
    }
    if (acao === "M") return []; // mensagem lógica: nada a aplicar
    const mud = this.mudanca(acao, m.schema, m.table, deColunas(m.columns as ColV2[]), m.identity ? deColunas(m.identity as ColV2[]) : null);
    if (this.aberta) { this.aberta.mudancas.push(mud); this.aberta.ultimoLsn = lsn; return []; }
    if (!lsn) throw new Error("mudança sem LSN fora de transação (drene com include-lsn=true)");
    return [{ lsn, mudancas: [mud], origem }];
  }
  /** Fim da entrada: transação ainda aberta não foi confirmada → não aplica. */
  fim(): void { if (this.aberta) { this.incompletas++; this.aberta = null; } }

  private mudanca(acao: string, schema: unknown, tabela: unknown, linha: Linha, chave: Linha | null): Mudanca {
    const a = ({ insert: "I", update: "U", delete: "D", I: "I", U: "U", D: "D" } as Record<string, Mudanca["acao"]>)[acao];
    if (acao === "T" || acao === "truncate") throw new Error(`TRUNCATE em ${schema}.${tabela} não é reproduzível via API — trate manualmente e remova a linha`);
    if (!a) throw new Error(`ação desconhecida "${acao}"`);
    if (typeof schema !== "string" || typeof tabela !== "string") throw new Error("mudança sem schema/table");
    return { acao: a, schema, tabela, linha, chave };
  }
}

async function aplicar(d: Destino, m: Mudanca): Promise<void> {
  if (m.acao === "D") {
    if (!m.chave || Object.keys(m.chave).length === 0) throw new Error(`DELETE em ${m.tabela} sem chave (REPLICA IDENTITY ausente) — recusado para não apagar a tabela inteira`);
    return await d.remover(m.tabela, m.chave);
  }
  const chaveMudou = m.acao === "U" && m.chave !== null && Object.entries(m.chave).some(([k, v]) => k in m.linha && paraFiltro(m.linha[k]) !== paraFiltro(v));
  if (chaveMudou && await d.atualizar(m.tabela, m.chave!, m.linha) > 0) return;
  await d.upsert(m.tabela, m.linha);
}

export interface EntradaLinha { texto: string; origem: string; ultimaSemQuebra: boolean }

/** Núcleo: consome linhas em ordem e aplica no destino com marca d'água. */
export async function reproduzir(linhas: AsyncIterable<EntradaLinha>, destino: Destino, op: { dryRun?: boolean; aviso?: (m: string) => void } = {}): Promise<Resumo> {
  const aviso = op.aviso ?? ((m: string) => console.error(`⚠ ${m}`));
  const validos = (await destino.lsnsAplicados()).filter((l) => {
    const ok = parseLsn(l) !== null;
    if (!ok) aviso(`checkpoint com LSN inválido ignorado: "${l.slice(0, 40)}"`);
    return ok;
  });
  const aplicados = new Set(validos.map((l) => parseLsn(l)!));
  let marca = validos.reduce<string | null>((mx, l) => (mx === null || cmpLsn(l, mx) > 0 ? l : mx), null);
  const r: Resumo = { total: 0, applied: 0, skipped: 0, ignoradas: 0, incompletas: 0, mudancas: 0 };
  const grupo = new Agrupador();
  for await (const e of linhas) {
    if (!e.texto.trim()) continue;
    let unidades: Unidade[];
    try {
      unidades = grupo.push(e.texto, e.origem);
    } catch (err) {
      if (err instanceof SyntaxError && e.ultimaSemQuebra) { aviso(`${e.origem}: última linha truncada (drain interrompido) — ignorada`); continue; }
      throw new Error(`${e.origem}: ${err instanceof SyntaxError ? "linha JSON corrompida" : (err as Error).message} — replay interrompido para não pular evento`);
    }
    for (const u of unidades) {
      r.total++;
      const n = parseLsn(u.lsn);
      if (n === null) throw new Error(`${u.origem}: LSN inválido "${u.lsn}"`);
      if (aplicados.has(n)) { r.skipped++; continue; }
      if (marca !== null && cmpLsn(u.lsn, marca) < 0) {
        throw new Error(`${u.origem}: transação ${u.lsn} fora de ordem (já existe aplicação até ${marca} e esta não consta no checkpoint) — arquivo antigo adicionado depois ou arquivos fora de sequência; aplicar agora regrediria dados`);
      }
      const publicas = u.mudancas.filter((m) => m.schema === "public" && m.tabela !== "_migration_cdc_checkpoint");
      r.ignoradas += u.mudancas.length - publicas.length;
      if (!op.dryRun) {
        for (const m of publicas) {
          try { await aplicar(destino, m); } catch (err) { throw new Error(`falha ao aplicar ${m.acao} em ${m.tabela} (lsn ${u.lsn}): ${(err as Error).message}`); }
        }
        await destino.marcar(u.lsn);
      }
      r.mudancas += publicas.length;
      aplicados.add(n);
      marca = u.lsn;
      r.applied++;
    }
  }
  grupo.fim();
  r.incompletas = grupo.incompletas;
  if (r.incompletas) aviso(`${r.incompletas} transação(ões) incompleta(s) não aplicada(s) — o slot as reenviará no próximo drain`);
  return r;
}

/** Lê os *.json do diretório linha a linha (stream), ordenados pelo primeiro LSN de cada arquivo. */
export async function* lerDiretorio(dir: string): AsyncGenerator<EntradaLinha> {
  const base = dir.replace(/\/+$/, "");
  const arquivos: { nome: string; lsn: bigint }[] = [];
  for await (const e of Deno.readDir(base)) {
    if (!e.isFile || !e.name.endsWith(".json")) continue;
    let primeiro: bigint | null = null;
    let lidas = 0;
    for await (const l of linhasDe(`${base}/${e.name}`, e.name)) {
      primeiro = parseLsn(/"(?:lsn|nextlsn)"\s*:\s*"([0-9A-Fa-f/]+)"/.exec(l.texto)?.[1]);
      if (primeiro !== null || ++lidas >= 50) break;
    }
    arquivos.push({ nome: e.name, lsn: primeiro ?? -1n });
  }
  arquivos.sort((a, b) => (a.lsn < b.lsn ? -1 : a.lsn > b.lsn ? 1 : a.nome < b.nome ? -1 : 1));
  for (const a of arquivos) yield* linhasDe(`${base}/${a.nome}`, a.nome);
}
async function* linhasDe(caminho: string, nome: string): AsyncGenerator<EntradaLinha> {
  const f = await Deno.open(caminho, { read: true });
  let resto = "";
  let n = 0;
  for await (const pedaco of f.readable.pipeThrough(new TextDecoderStream())) {
    const partes = (resto + pedaco).split("\n");
    resto = partes.pop() ?? "";
    for (const p of partes) yield { texto: p, origem: `${nome}:${++n}`, ultimaSemQuebra: false };
  }
  if (resto) yield { texto: resto, origem: `${nome}:${++n}`, ultimaSemQuebra: true };
}

/** Destino real via PostgREST (supabase-js, service role). Todo erro vira exceção. */
export function destinoSupabase(url: string, chave: string): Destino {
  const sb = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  const CK = "_migration_cdc_checkpoint";
  const filtro = <Q extends { eq(c: string, v: string): Q; is(c: string, v: null): Q }>(q: Q, chave: Linha): Q => {
    for (const [k, v] of Object.entries(chave)) q = v === null ? q.is(k, null) : q.eq(k, paraFiltro(v));
    return q;
  };
  return {
    async lsnsAplicados() {
      const todos: string[] = [];
      for (let de = 0; ; de += 1000) { // PostgREST corta em db-max-rows: pagina até vir vazio
        const { data, error } = await sb.from(CK).select("lsn").order("lsn").range(de, de + 999);
        if (error) throw new Error(`ler checkpoint: ${error.message} (rodou cdc/checkpoint.sql no destino?)`);
        if (!data || data.length === 0) return todos;
        todos.push(...data.map((l) => String((l as { lsn: unknown }).lsn)));
      }
    },
    async marcar(lsn) {
      const { error } = await sb.from(CK).upsert({ lsn }, { onConflict: "lsn" });
      if (error) throw new Error(`gravar checkpoint ${lsn}: ${error.message}`);
    },
    async upsert(tabela, linha) {
      const { error } = await sb.from(tabela).upsert(linha);
      if (error) throw new Error(error.message);
    },
    async atualizar(tabela, chave, linha) {
      const { data, error } = await filtro(sb.from(tabela).update(linha), chave).select(Object.keys(chave)[0]);
      if (error) throw new Error(error.message);
      return data?.length ?? 0;
    },
    async remover(tabela, chave) {
      const { error } = await filtro(sb.from(tabela).delete(), chave);
      if (error) throw new Error(error.message);
    },
  };
}

if (import.meta.main) {
  const DEST_URL = Deno.env.get("DEST_SUPABASE_URL");
  const DEST_KEY = Deno.env.get("DEST_SERVICE_ROLE_KEY");
  const CDC_DIR = Deno.env.get("CDC_OUT_DIR") ?? new URL("./out/", import.meta.url).pathname;
  if (!DEST_URL || !DEST_KEY) { console.error("faltando DEST_SUPABASE_URL/DEST_SERVICE_ROLE_KEY"); Deno.exit(2); }
  const dryRun = Deno.args.includes("--dry-run") || Deno.env.get("DRY_RUN") === "1";
  try {
    await Deno.stat(CDC_DIR);
  } catch { console.error(`CDC_OUT_DIR não existe: ${CDC_DIR}`); Deno.exit(2); }
  try {
    const r = await reproduzir(lerDiretorio(CDC_DIR), destinoSupabase(DEST_URL, DEST_KEY), { dryRun });
    console.log(`total=${r.total} applied=${r.applied} skipped=${r.skipped} mudancas=${r.mudancas} ignoradas=${r.ignoradas} incompletas=${r.incompletas}${dryRun ? " [DRY_RUN: nada foi escrito]" : ""}`);
  } catch (e) {
    console.error(`✖ ${e instanceof Error ? e.message : String(e)}`);
    Deno.exit(1);
  }
}
