#!/usr/bin/env node
// Gera src/integrations/supabase/types.ts a partir do OpenAPI do PostgREST.
// Usa https nativo para evitar bug de DNS do c-ares no Node 24 dentro do sandbox.
//
// Uso: SUPABASE_SERVICE_ROLE_KEY=... node scripts/gen-supabase-types.mjs [--out <arquivo>] [--stdout] [--force]
//
//   SUPABASE_SERVICE_ROLE_KEY  obrigatória. Vai só nos cabeçalhos da requisição; nunca é impressa.
//   SUPABASE_HOST              host do projeto (padrão: pgxfvjmuubtbowutlide.supabase.co).
//   SUPABASE_REST_URL          só para teste: base http(s) em 127.0.0.1/localhost no lugar do host real.
//   --out <arquivo>            destino (padrão: src/integrations/supabase/types.ts; também GEN_TYPES_OUT).
//   --stdout                   imprime o types.ts em vez de gravar.
//   --force                    permite sobrescrever um arquivo que NÃO foi gerado por este script.
//
// MODO SEGURO: o types.ts versionado hoje vem do `supabase gen types` (tem Functions, Enums,
// Relationships e Constants). O que sai daqui é mais pobre — o OpenAPI do PostgREST não traz nada
// disso — e sobrescrevê-lo quebra o typecheck do app. Por isso, sem --force, o script se recusa a
// gravar por cima de arquivo que não tenha a marca "Generated from PostgREST OpenAPI".
//
// Exit: 0 = gerado · 1 = falha de rede/HTTP/JSON · 2 = uso inválido, chave ausente, OpenAPI sem
// tabelas ou destino protegido.
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import dns from "node:dns/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

export const MARCA = "// Generated from PostgREST OpenAPI";
const HOST_PADRAO = "pgxfvjmuubtbowutlide.supabase.co";
const SAIDA_PADRAO = fileURLToPath(new URL("../src/integrations/supabase/types.ts", import.meta.url));
// GEN_TYPES_TIMEOUT_MS só existe para o teste não esperar 60 s.
const TIMEOUT_MS = Number(process.env.GEN_TYPES_TIMEOUT_MS) > 0 ? Number(process.env.GEN_TYPES_TIMEOUT_MS) : 60_000;

class ErroDeUso extends Error {}

function getJson({ modulo, opcoes }) {
  return new Promise((resolve, reject) => {
    const req = modulo.request({ ...opcoes, method: "GET" }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        // Nunca repassa o corpo do erro: pode ecoar cabeçalho ou parte da requisição.
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`o PostgREST respondeu HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`a resposta não é JSON válido (${e.message})`));
        }
      });
    });
    req.setTimeout(TIMEOUT_MS, () => req.destroy(Object.assign(new Error("timeout"), { code: `sem resposta em ${TIMEOUT_MS / 1000}s` })));
    req.on("error", (e) => reject(new Error(`falha de rede: ${e.code ?? e.message}`)));
    req.end();
  });
}

/** Tipo TypeScript de um schema do OpenAPI (Swagger 2.0) do PostgREST. */
export function jsonSchemaToTs(schema) {
  if (!schema || typeof schema !== "object") return "unknown";
  if (schema.$ref) return "unknown"; // o tipo referenciado não é emitido neste arquivo
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum.map((e) => JSON.stringify(e)).join(" | ");
  if (/^jsonb?$/i.test(schema.format ?? "")) return "Json";
  if (Array.isArray(schema.type)) return [...new Set(schema.type.map((type) => jsonSchemaToTs({ ...schema, type })))].join(" | ");
  if (schema.type === "array") return `(${jsonSchemaToTs(schema.items)})[]`;
  if (schema.type === "object" || schema.properties) {
    const required = new Set(schema.required || []);
    const campos = Object.entries(schema.properties || {})
      .map(([k, v]) => `${JSON.stringify(k)}${required.has(k) ? "" : "?"}: ${jsonSchemaToTs(v)}`);
    return campos.length ? `{ ${campos.join("; ")} }` : "Record<string, unknown>";
  }
  switch (schema.type) {
    case "string": return "string";
    case "integer":
    case "number": return "number";
    case "boolean": return "boolean";
    case "null": return "null";
    default: return "unknown";
  }
}

/** Nome utilizável como chave de objeto em TS: sem aspas quando é identificador. */
export const chaveTs = (nome) => (/^[A-Za-z_$][\w$]*$/.test(nome) ? nome : JSON.stringify(nome));

function extractColumnTypes(def) {
  const required = new Set(def.required || []);
  const out = [];
  for (const [col, schema] of Object.entries(def.properties || {})) {
    let t = jsonSchemaToTs(schema);
    if (!required.has(col) && !/(^|\| )null$/.test(t)) t = `${t} | null`;
    out.push([chaveTs(col), t]);
  }
  return out;
}

const ehView = (nome) => nome.startsWith("vw_") || nome.startsWith("mv_");
const porNome = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);

/** Monta o texto do types.ts a partir do OpenAPI. Função pura: mesma entrada, mesmos bytes. */
export function gerarTypes(openapi) {
  const definitions = openapi && typeof openapi === "object" ? openapi.definitions : null;
  const validas = Object.entries(definitions && typeof definitions === "object" ? definitions : {})
    .filter(([, def]) => def && typeof def === "object" && def.properties && typeof def.properties === "object");
  if (validas.length === 0) {
    throw new ErroDeUso("o OpenAPI não trouxe nenhuma tabela em `definitions` (chave sem acesso ao schema?); nada foi gravado.");
  }
  const tables = validas.filter(([name]) => !ehView(name)).sort(porNome);
  const views = validas.filter(([name]) => ehView(name)).sort(porNome);

  const out = [];
  out.push("export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]");
  out.push("");
  out.push("export interface Database {");
  out.push("  public: {");
  out.push("    Tables: {");
  for (const [name, def] of tables) {
    const cols = extractColumnTypes(def);
    out.push(`      ${chaveTs(name)}: {`);
    out.push(`        Row: {`);
    for (const [c, t] of cols) out.push(`          ${c}: ${t};`);
    out.push(`        };`);
    out.push(`        Insert: {`);
    for (const [c, t] of cols) out.push(`          ${c}?: ${t};`);
    out.push(`        };`);
    out.push(`        Update: {`);
    for (const [c, t] of cols) out.push(`          ${c}?: ${t};`);
    out.push(`        };`);
    out.push(`        Relationships: [];`);
    out.push(`      };`);
  }
  out.push("    };");
  out.push("    Views: {");
  for (const [name, def] of views) {
    const cols = extractColumnTypes(def);
    out.push(`      ${chaveTs(name)}: {`);
    out.push(`        Row: {`);
    for (const [c, t] of cols) out.push(`          ${c}: ${t};`);
    out.push(`        };`);
    out.push(`        Relationships: [];`);
    out.push(`      };`);
  }
  out.push("    };");
  out.push("    Functions: {");
  out.push("      _postgrest_anon_placeholder: { Args: Record<string, never>; Returns: never; };");
  out.push("    };");
  out.push("    Enums: { [_ in never]: never; };");
  out.push("    CompositeTypes: { [_ in never]: never; };");
  out.push("  };");
  out.push("}");
  out.push("");
  out.push(`${MARCA} (scripts/gen-supabase-types.mjs)`);
  return { texto: out.join("\n") + "\n", tabelas: tables.length, views: views.length };
}

/** De onde ler: o host real (IP pré-resolvido + Host/SNI) ou, em teste, um servidor local. */
async function destino(env) {
  if (env.SUPABASE_REST_URL) {
    let url;
    try { url = new URL(env.SUPABASE_REST_URL); } catch { throw new ErroDeUso("SUPABASE_REST_URL não é uma URL válida."); }
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || !/^https?:$/.test(url.protocol)) {
      throw new ErroDeUso("SUPABASE_REST_URL só aceita http(s) em 127.0.0.1/localhost (é para teste); para o projeto real use SUPABASE_HOST.");
    }
    return {
      modulo: url.protocol === "https:" ? https : http,
      opcoes: { hostname: url.hostname.replace(/^\[|\]$/g, ""), port: url.port || undefined, path: `${url.pathname.replace(/\/$/, "")}/rest/v1/` },
    };
  }
  const host = (env.SUPABASE_HOST || HOST_PADRAO).trim();
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i.test(host)) {
    throw new ErroDeUso("SUPABASE_HOST deve ser só o nome do host (sem https://, barra ou porta).");
  }
  // Pré-resolve o IP (necessário pq Node24 c-ares tem bug com fetch)
  let ip;
  try { ip = (await dns.lookup(host)).address; } catch (e) { throw new Error(`não consegui resolver ${host} (${e.code ?? e.message})`); }
  return { modulo: https, opcoes: { hostname: ip, port: 443, path: "/rest/v1/", servername: host, headers: { Host: host } } };
}

function argumentos(argv, env) {
  const iOut = argv.indexOf("--out");
  if (iOut !== -1 && (!argv[iOut + 1] || argv[iOut + 1].startsWith("--"))) throw new ErroDeUso("--out exige o caminho do arquivo.");
  return {
    saida: iOut !== -1 ? argv[iOut + 1] : (env.GEN_TYPES_OUT || SAIDA_PADRAO),
    stdout: argv.includes("--stdout"),
    force: argv.includes("--force"),
  };
}

export async function main(argv, env = process.env) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log("Uso: SUPABASE_SERVICE_ROLE_KEY=... node scripts/gen-supabase-types.mjs [--out <arquivo>] [--stdout] [--force]\n"
      + "Gera um types.ts simplificado a partir do OpenAPI do PostgREST. Sem --force não sobrescreve arquivo de outra origem.");
    return 0;
  }
  const { saida, stdout, force } = argumentos(argv, env);
  const chave = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!chave) throw new ErroDeUso("Defina SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar.");
  if (!stdout && !force && existsSync(saida) && !readFileSync(saida, "utf8").includes(MARCA)) {
    throw new ErroDeUso(`${saida} não foi gerado por este script (vem do \`supabase gen types\`, mais completo); `
      + "sobrescrever quebra o typecheck. Use --out <outro arquivo>, --stdout ou, se for mesmo a intenção, --force.");
  }
  const alvo = await destino(env);
  alvo.opcoes.headers = { ...alvo.opcoes.headers, apikey: chave, Authorization: `Bearer ${chave}` };
  const { texto, tabelas, views } = gerarTypes(await getJson(alvo));
  if (stdout) {
    process.stdout.write(texto);
    return 0;
  }
  console.log(`Tables: ${tabelas}  Views: ${views}`);
  await writeFile(saida, texto);
  console.log(`Escrito ${saida}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((codigo) => process.exit(codigo), (e) => {
    console.error(`ERRO: ${e.message}`);
    process.exit(e instanceof ErroDeUso ? 2 : 1);
  });
}
