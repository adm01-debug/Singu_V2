// Dual-write proxy — espelha writes críticos no banco LEGADO durante bake.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { z } from "npm:zod@3.23.8";
import {
  guardBody,
  handleCorsAndMethod,
  jsonError,
  jsonOk,
  requireWebhookSecret,
} from "../_shared/auth.ts";

const LEGACY_URL = Deno.env.get("LEGACY_SUPABASE_URL");
const LEGACY_KEY = Deno.env.get("LEGACY_SERVICE_ROLE_KEY");
const WHITELIST = (Deno.env.get("DUAL_WRITE_TABLES") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const dualWriteSchema = z.object({
  table: z.string().min(1).max(100),
  op: z.enum(["insert", "update", "upsert", "delete"]),
  row: z.record(z.unknown()).optional(),
  match: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
}).superRefine((body, ctx) => {
  if ((body.op === "insert" || body.op === "upsert") && !body.row) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "row é obrigatório para insert/upsert" });
  }
  if ((body.op === "update" || body.op === "delete") && (!body.match || Object.keys(body.match).length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "match é obrigatório para update/delete" });
  }
  if (body.op === "update" && !body.row) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "row é obrigatório para update" });
  }
});

Deno.serve(async (req) => {
  const corsResponse = handleCorsAndMethod(req);
  if (corsResponse) return corsResponse;

  const authError = await requireWebhookSecret(req, "DUAL_WRITE_SECRET", "x-dual-write-secret");
  if (authError) return authError;

  if (!LEGACY_URL || !LEGACY_KEY) {
    return jsonError("Dual-write não configurado", 503, req);
  }

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;
  const parsed = dualWriteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Payload inválido", 400, req);
  }
  const body = parsed.data;
  if (!WHITELIST.includes(body.table)) {
    return jsonError("Tabela não autorizada", 403, req);
  }

  try {
    const legacy = createClient(LEGACY_URL, LEGACY_KEY, { auth: { persistSession: false } });
    let error: { message: string } | null = null;
    if (body.op === "insert") {
      ({ error } = await legacy.from(body.table).insert(body.row!));
    } else if (body.op === "upsert") {
      ({ error } = await legacy.from(body.table).upsert(body.row!));
    } else if (body.op === "update") {
      let query = legacy.from(body.table).update(body.row!);
      for (const [column, value] of Object.entries(body.match!)) query = query.eq(column, value);
      ({ error } = await query);
    } else {
      let query = legacy.from(body.table).delete();
      for (const [column, value] of Object.entries(body.match!)) query = query.eq(column, value);
      ({ error } = await query);
    }
    if (error) {
      console.error(`[dual-write] table=${body.table} op=${body.op} err=${error.message}`);
      return jsonError("Falha ao gravar no banco legado", 502, req);
    }
    return jsonOk({ ok: true }, req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dual-write] fatal", msg);
    return jsonError("Falha inesperada no dual-write", 500, req);
  }
});