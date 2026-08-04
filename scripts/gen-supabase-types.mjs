// Gera src/integrations/supabase/types.ts a partir do OpenAPI do PostgREST.
// Usa https nativo para evitar bug de DNS do c-ares no Node 24 dentro do sandbox.
import { writeFile } from "node:fs/promises";
import https from "node:https";
import dns from "node:dns/promises";

const HOST = process.env.SUPABASE_HOST || "pgxfvjmuubtbowutlide.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  console.error("Defina SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar.");
  process.exit(2);
}

const OUT_PATH = new URL("../src/integrations/supabase/types.ts", import.meta.url);

function httpsGetJson(hostname, path, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, port: 443, path, method: "GET", headers },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`JSON parse falhou: ${e.message}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function jsonSchemaToTs(schema) {
  if (!schema) return "unknown";
  if (schema.$ref) return schema.$ref.split("/").pop();
  if (schema.enum) return schema.enum.map((e) => JSON.stringify(e)).join(" | ");
  if (schema.type === "array") return `(${jsonSchemaToTs(schema.items)})[]`;
  if (schema.type === "object" || schema.properties) {
    const props = schema.properties || {};
    const required = new Set(schema.required || []);
    const lines = Object.entries(props).map(([k, v]) => {
      const opt = required.has(k) ? "" : ": ";
      return `${JSON.stringify(k)}${opt}${jsonSchemaToTs(v)}`;
    });
    return `{ ${lines.join("; ")} }`;
  }
  switch (schema.type) {
    case "string":
    case "integer":
    case "number":
    case "boolean":
    case "null":
      return schema.type === "null" ? "null" : schema.type;
    default:
      if (Array.isArray(schema.type)) return schema.type.join(" | ");
      return "unknown";
  }
}

function extractColumnTypes(def) {
  const props = def.properties || {};
  const required = new Set(def.required || []);
  const out = {};
  for (const [col, schema] of Object.entries(props)) {
    let t = jsonSchemaToTs(schema);
    if (!required.has(col)) t = `${t} | null`;
    out[col] = t;
  }
  return out;
}

async function main() {
  // Pré-resolve o IP (necessário pq Node24 c-ares tem bug com fetch)
  const ip = (await dns.lookup(HOST)).address;
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Host: HOST,
  };
  const json = await httpsGetJson(ip, "/rest/v1/", headers);
  const definitions = json.definitions || {};

  const tables = Object.entries(definitions)
    .filter(([, def]) => def && def.properties)
    .filter(([name]) => !name.startsWith("vw_") && !name.startsWith("mv_"))
    .sort(([a], [b]) => a.localeCompare(b));
  const views = Object.entries(definitions)
    .filter(([name]) => name.startsWith("vw_") || name.startsWith("mv_"))
    .sort(([a], [b]) => a.localeCompare(b));

  console.log(`Tables: ${tables.length}  Views: ${views.length}`);

  const out = [];
  out.push("export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]");
  out.push("");
  out.push("export interface Database {");
  out.push("  public: {");
  out.push("    Tables: {");
  for (const [name, def] of tables) {
    const cols = extractColumnTypes(def);
    out.push(`      ${name}: {`);
    out.push(`        Row: {`);
    for (const [c, t] of Object.entries(cols)) out.push(`          ${c}: ${t};`);
    out.push(`        };`);
    out.push(`        Insert: {`);
    for (const [c, t] of Object.entries(cols)) out.push(`          ${c}?: ${t};`);
    out.push(`        };`);
    out.push(`        Update: {`);
    for (const [c, t] of Object.entries(cols)) out.push(`          ${c}?: ${t};`);
    out.push(`        };`);
    out.push(`        Relationships: [];`);
    out.push(`      };`);
  }
  out.push("    };");
  out.push("    Views: {");
  for (const [name, def] of views) {
    const cols = extractColumnTypes(def);
    out.push(`      ${name}: {`);
    out.push(`        Row: {`);
    for (const [c, t] of Object.entries(cols)) out.push(`          ${c}: ${t};`);
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
  out.push("// Generated from PostgREST OpenAPI on " + new Date().toISOString());

  await writeFile(OUT_PATH, out.join("\n"));
  console.log(`Escrito ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
