import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";
import { guardBody, scopedCorsHeaders } from "../_shared/auth.ts";

/**
 * MCP Server v1.2.0 (Streamable HTTP, JSON-RPC 2.0).
 * Auth: X-MCP-Token (connection_configs.mcp_claude.config.token).
 * Rate limit: 120 req/min por token. Log de cada tool call em mcp_tool_calls.
 */

const limiter = rateLimit({ windowMs: 60_000, max: 120, message: "Limite MCP atingido." });

const JsonRpcSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string().min(1).max(64),
  params: z.record(z.unknown()).optional(),
});

const ToolsCallSchema = z.object({
  name: z.string().min(1).max(64),
  arguments: z.record(z.unknown()).optional().default({}),
});

const TOOLS = [
  { name: "search_contacts", description: "Busca contatos por nome ou email", inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number", default: 10 } }, required: ["query"] } },
  { name: "search_companies", description: "Busca empresas por nome", inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "number", default: 10 } }, required: ["query"] } },
  { name: "list_deals", description: "Lista oportunidades em aberto", inputSchema: { type: "object", properties: { stage: { type: "string" }, limit: { type: "number", default: 20 } } } },
  { name: "create_contact", description: "Cria contato (first_name, last_name, email, phone)", inputSchema: { type: "object", properties: { first_name: { type: "string" }, last_name: { type: "string" }, email: { type: "string" }, phone: { type: "string" } }, required: ["first_name", "last_name"] } },
  { name: "update_deal_stage", description: "Atualiza estágio de uma oportunidade", inputSchema: { type: "object", properties: { deal_id: { type: "string" }, stage: { type: "string" } }, required: ["deal_id", "stage"] } },
  { name: "add_interaction", description: "Registra interação com contato", inputSchema: { type: "object", properties: { contact_id: { type: "string" }, type: { type: "string" }, summary: { type: "string" } }, required: ["contact_id", "type", "summary"] } },
  { name: "search_companies_by_intent", description: "Empresas com intent score acima do limiar", inputSchema: { type: "object", properties: { min_score: { type: "number", default: 70 }, limit: { type: "number", default: 10 } } } },
  { name: "get_pipeline_summary", description: "Resumo do pipeline (count e valor por estágio)", inputSchema: { type: "object", properties: {} } },
];

type Admin = ReturnType<typeof createClient>;

async function callTool(name: string, args: Record<string, unknown>, admin: Admin, ownerUserId: string) {
  const limit = Math.min(Number(args.limit ?? 10), 100);

  if (name === "search_contacts") {
    // Escape ilike wildcards AND PostgREST .or() syntax chars to prevent query manipulation
    const q = String(args.query ?? "").slice(0, 200)
      .replace(/%/g, "\\%").replace(/_/g, "\\_")
      .replace(/[(),]/g, "");
    const { data } = await admin.from("contacts")
      .select("id,first_name,last_name,email,phone")
      .eq("user_id", ownerUserId)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(limit);
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  }
  if (name === "search_companies") {
    const q = String(args.query ?? "").slice(0, 200)
      .replace(/%/g, "\\%").replace(/_/g, "\\_")
      .replace(/[(),]/g, "");
    const { data } = await admin.from("companies")
      .select("id,name,cnpj,industry")
      .eq("user_id", ownerUserId)
      .ilike("name", `%${q}%`)
      .limit(limit);
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  }
  if (name === "list_deals") {
    const stage = args.stage ? String(args.stage).slice(0, 64) : null;
    let q = admin.from("deals").select("id,title,value,stage,company_id")
      .eq("user_id", ownerUserId)
      .limit(limit);
    if (stage) q = q.eq("stage", stage);
    const { data } = await q;
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  }
  if (name === "create_contact") {
    const payload = {
      first_name: String(args.first_name ?? "").slice(0, 100),
      last_name: String(args.last_name ?? "").slice(0, 100),
      email: args.email ? String(args.email).slice(0, 200) : null,
      phone: args.phone ? String(args.phone).slice(0, 50) : null,
      user_id: ownerUserId,
    };
    const { data, error } = await admin.from("contacts").insert(payload).select("id,first_name,last_name").maybeSingle();
    if (error) throw new Error(error.message);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
  if (name === "update_deal_stage") {
    const { data, error } = await admin.from("deals")
      .update({ stage: String(args.stage).slice(0, 64) })
      .eq("id", String(args.deal_id))
      .eq("user_id", ownerUserId) // prevent cross-tenant mutation
      .select("id,stage").maybeSingle();
    if (error) throw new Error(error.message);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
  if (name === "add_interaction") {
    const contactId = String(args.contact_id);
    // Verify contact ownership to prevent cross-tenant interaction writes
    const { data: ownedContact } = await admin.from("contacts")
      .select("id").eq("id", contactId).eq("user_id", ownerUserId).maybeSingle();
    if (!ownedContact) throw new Error("Contact not found or access denied");
    const payload = {
      contact_id: contactId,
      type: String(args.type).slice(0, 32),
      content: String(args.summary).slice(0, 4000),
      user_id: ownerUserId,
    };
    const { data, error } = await admin.from("interactions").insert(payload).select("id,type").maybeSingle();
    if (error) throw new Error(error.message);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
  if (name === "search_companies_by_intent") {
    const min = Math.min(Math.max(Number(args.min_score ?? 70), 0), 100);
    const { data, error } = await admin.from("companies")
      .select("id,name,industry,intent_score")
      .eq("user_id", ownerUserId)
      .gte("intent_score", min)
      .limit(limit).order("intent_score", { ascending: false });
    if (error) throw new Error(error.message);
    return { content: [{ type: "text", text: JSON.stringify({ min_score: min, results: data ?? [] }, null, 2) }] };
  }
  if (name === "get_pipeline_summary") {
    const { data } = await admin.from("deals").select("stage,value").eq("user_id", ownerUserId);
    const summary: Record<string, { count: number; total_value: number }> = {};
    for (const d of (data ?? []) as { stage: string; value: number | null }[]) {
      const s = d.stage ?? "unknown";
      summary[s] = summary[s] ?? { count: 0, total_value: 0 };
      summary[s].count += 1;
      summary[s].total_value += Number(d.value ?? 0);
    }
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
  throw new Error(`Tool desconhecida: ${name}`);
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const token = req.headers.get("x-mcp-token");
  if (!token) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Missing X-MCP-Token" }, id: null }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const limited = limiter.check(`mcp:${token}`, req);
  if (limited) return limited;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: conn } = await admin
    .from("connection_configs")
    .select("id,is_active,config,created_by")
    .eq("connection_type", "mcp_claude")
    .eq("is_active", true)
    .filter("config->>token", "eq", token)
    .maybeSingle();

  if (!conn) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Token MCP inválido" }, id: null }), {
      status: 403, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Null guard: created_by must exist — system-created configs without an owner cannot execute tools
  if (!conn.created_by) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Token configuration invalid" }, id: null }), {
      status: 403, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Optional per-connection tool allowlist from config (null = all tools permitted)
  const allowedTools: string[] | null = Array.isArray(conn.config?.allowed_tools) ? conn.config.allowed_tools as string[] : null;

  const { body: rawBody, error: bodyError } = await guardBody(req, 128 * 1024);
  if (bodyError) return bodyError;

  const parsed = JsonRpcSchema.safeParse(rawBody);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      jsonrpc: "2.0", id: null,
      error: { code: -32600, message: "Invalid Request", data: parsed.error.flatten() },
    }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
  const body = parsed.data;

  try {
    let result: unknown;
    switch (body.method) {
      case "initialize":
        result = { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "singu-crm-mcp", version: "1.2.0" } };
        break;
      case "tools/list":
        result = { tools: TOOLS };
        break;
      case "tools/call": {
        const callParsed = ToolsCallSchema.safeParse(body.params ?? {});
        if (!callParsed.success) {
          return new Response(JSON.stringify({
            jsonrpc: "2.0", id: body.id ?? null,
            error: { code: -32602, message: "Invalid params", data: callParsed.error.flatten() },
          }), { headers: { ...cors, "Content-Type": "application/json" } });
        }
        // Enforce per-connection tool allowlist
        if (allowedTools !== null && !allowedTools.includes(callParsed.data.name)) {
          return new Response(JSON.stringify({
            jsonrpc: "2.0", id: body.id ?? null,
            error: { code: -32601, message: "Tool not permitted for this connection" },
          }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
        }
        const startedAt = Date.now();
        try {
          result = await callTool(callParsed.data.name, callParsed.data.arguments, admin, conn.created_by);
          await admin.from("mcp_tool_calls").insert({
            connection_id: conn.id,
            tool_name: callParsed.data.name,
            arguments_summary: { keys: Object.keys(callParsed.data.arguments) },
            status: "success",
            latency_ms: Date.now() - startedAt,
          });
        } catch (toolErr) {
          const message = toolErr instanceof Error ? toolErr.message : "Erro";
          await admin.from("mcp_tool_calls").insert({
            connection_id: conn.id,
            tool_name: callParsed.data.name,
            arguments_summary: { keys: Object.keys(callParsed.data.arguments) },
            status: "error",
            error_message: message.slice(0, 500),
            latency_ms: Date.now() - startedAt,
          });
          throw toolErr;
        }
        break;
      }
      case "ping":
        result = {};
        break;
      default:
        return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32601, message: `Método ${body.method} não suportado` }, id: body.id ?? null }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
    }
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id ?? null, result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id ?? null, error: { code: -32000, message } }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
