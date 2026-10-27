import { bestEffortWrite } from "../_shared/best-effort-write.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";
import { scopedCorsHeaders, withAuth, guardBody } from "../_shared/auth.ts";


/**
 * connection-introspect
 * Descobre schema (tabelas/colunas) de uma conexão Supabase externa.
 * Auth: JWT do admin via Authorization header.
 * Persiste resultado em connection_configs.discovered_schema.
 */

const limiter = rateLimit({ windowMs: 60_000, max: 10, message: "Limite de introspections atingido." });

const BodySchema = z.object({
  connection_id: z.string().uuid(),
});

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
}
interface TableInfo {
  table_name: string;
  columns: ColumnInfo[];
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(`introspect:${ip}`, req);
  if (limited) return limited;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    // withAuth calls getUser() (server-side verification), not getClaims() (local decode)
    const authResult = await withAuth(req);
    if (authResult instanceof Response) return authResult;
    const userId = authResult;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleCheck } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Apenas admins" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: conn, error: connErr } = await admin
      .from("connection_configs")
      .select("id,connection_type,config")
      .eq("id", parsed.data.connection_id)
      .single();

    if (connErr || !conn) {
      return new Response(JSON.stringify({ error: "Conexão não encontrada" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (conn.connection_type !== "supabase_external") {
      return new Response(JSON.stringify({ error: "Apenas conexões supabase_external suportam introspection" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const config = (conn.config ?? {}) as Record<string, unknown>;
    const externalUrl = String(config.url ?? "");
    const externalKey = String(config.service_role_key ?? config.anon_key ?? "");

    if (!externalUrl || !externalKey) {
      return new Response(JSON.stringify({ error: "Credenciais incompletas (url + service_role_key)" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const externalClient = createClient(externalUrl, externalKey);
    // Tenta via RPC information_schema; fallback: lista limitada
    const tables: TableInfo[] = [];
    const { data: tablesData } = await externalClient
      .from("information_schema.tables" as never)
      .select("table_name")
      .eq("table_schema", "public")
      .limit(100);

    const tableList: string[] = Array.isArray(tablesData)
      ? tablesData.map((t: { table_name: string }) => t.table_name)
      : [];

    // Pre-fetch all columns for all tables in a single query (eliminate N+1)
    const targetTables = tableList.slice(0, 50);
    const { data: allCols } = await externalClient
      .from("information_schema.columns" as never)
      .select("table_name,column_name,data_type,is_nullable")
      .eq("table_schema", "public")
      .in("table_name" as never, targetTables)
      .limit(4000);

    const colsByTable = new Map<string, ColumnInfo[]>();
    for (const col of (Array.isArray(allCols) ? allCols : []) as Array<ColumnInfo & { table_name: string }>) {
      const arr = colsByTable.get(col.table_name) ?? [];
      arr.push({ column_name: col.column_name, data_type: col.data_type, is_nullable: col.is_nullable });
      colsByTable.set(col.table_name, arr);
    }

    for (const tableName of targetTables) {
      tables.push({
        table_name: tableName,
        columns: colsByTable.get(tableName) ?? [],
      });
    }

    const schemaJson = { tables, discovered_at: new Date().toISOString(), table_count: tables.length };

    await bestEffortWrite(admin
      .from("connection_configs")
      .update({ discovered_schema: schemaJson, discovered_at: new Date().toISOString() })
      .eq("id", conn.id), "connection_configs schema update error:");

    return new Response(JSON.stringify({ success: true, schema: schemaJson }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('connection-introspect error:', err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
