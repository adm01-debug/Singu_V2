import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

const BodySchema = z.object({
  kind: z.enum(["email", "phone", "both"]),
  statuses: z.array(z.enum(["valid", "invalid", "risky", "unknown", "never"])).min(1).max(5),
  olderThanDays: z.number().int().min(0).max(365),
  limit: z.number().int().min(1).max(2000),
  dryRun: z.boolean().default(false),
});

interface ContactRow {
  id: string;
  email: string | null;
  phone: string | null;
}

interface VerificationRow {
  contact_id: string;
  status: string;
  verified_at?: string | null;
  validated_at?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonRes({ error: "Missing Authorization" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonRes({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return jsonRes({ error: "Invalid body", details: parsed.error.flatten() }, 400);
    }
    const { kind, statuses, olderThanDays, limit, dryRun } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();

    const targetEmail = kind === "email" || kind === "both";
    const targetPhone = kind === "phone" || kind === "both";

    // Busca contatos do usuário (limite alto para filtrar localmente)
    const { data: contacts, error: cErr } = await admin
      .from("contacts")
      .select("id, email, phone")
      .eq("user_id", userId)
      .limit(5000);
    if (cErr) throw cErr;

    const contactList = (contacts ?? []) as ContactRow[];

    const emailItems: Array<{ contactId: string; value: string }> = [];
    const phoneItems: Array<{ contactId: string; value: string }> = [];

    if (targetEmail) {
      const withEmail = contactList.filter((c) => c.email && c.email.trim().length > 3);
      const ids = withEmail.map((c) => c.id);
      const verMap = await fetchLatest(admin, "email_verifications", ids, "verified_at");
      for (const c of withEmail) {
        const v = verMap.get(c.id);
        if (matchesFilter(v?.status ?? "never", v?.verified_at ?? null, statuses, cutoff)) {
          emailItems.push({ contactId: c.id, value: c.email! });
        }
      }
    }

    if (targetPhone) {
      const withPhone = contactList.filter((c) => c.phone && c.phone.trim().length >= 5);
      const ids = withPhone.map((c) => c.id);
      const verMap = await fetchLatest(admin, "phone_validations", ids, "validated_at");
      for (const c of withPhone) {
        const v = verMap.get(c.id);
        if (matchesFilter(v?.status ?? "never", v?.validated_at ?? null, statuses, cutoff)) {
          phoneItems.push({ contactId: c.id, value: c.phone! });
        }
      }
    }

    const allItems = [
      ...emailItems.slice(0, limit).map((i) => ({ ...i, kind: "email" as const })),
      ...phoneItems.slice(0, limit).map((i) => ({ ...i, kind: "phone" as const })),
    ].slice(0, limit);

    const totals = {
      emails: emailItems.length,
      phones: phoneItems.length,
      total: allItems.length,
      cappedAt: limit,
    };

    if (dryRun) {
      return jsonRes({ dryRun: true, ...totals });
    }

    if (allItems.length === 0) {
      return jsonRes({ enqueued: 0, ...totals });
    }

    // Insere em validation_queue
    const rows = allItems.map((i) => ({
      user_id: userId,
      contact_id: i.contactId,
      kind: i.kind,
      value: i.value,
      status: "pending",
      attempts: 0,
    }));

    const { error: insErr } = await admin.from("validation_queue").insert(rows);
    if (insErr) throw insErr;

    return jsonRes({ enqueued: rows.length, ...totals });
  } catch (err) {
    console.error("bulk-revalidate error", err);
    return jsonRes({ error: String(err) }, 500);
  }
});

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function matchesFilter(
  status: string,
  verifiedAt: string | null,
  allowed: string[],
  cutoffIso: string,
): boolean {
  const normalized = status === "never" || !status ? "never" : status;
  if (!allowed.includes(normalized)) return false;
  if (normalized === "never") return true;
  if (!verifiedAt) return true;
  return verifiedAt <= cutoffIso;
}

async function fetchLatest(
  admin: ReturnType<typeof createClient>,
  table: "email_verifications" | "phone_validations",
  contactIds: string[],
  dateCol: "verified_at" | "validated_at",
): Promise<Map<string, VerificationRow>> {
  const map = new Map<string, VerificationRow>();
  if (contactIds.length === 0) return map;

  // Pagina em chunks para evitar query enorme
  const chunkSize = 500;
  for (let i = 0; i < contactIds.length; i += chunkSize) {
    const chunk = contactIds.slice(i, i + chunkSize);
    const { data, error } = await admin
      .from(table)
      .select(`contact_id, status, ${dateCol}`)
      .in("contact_id", chunk)
      .order(dateCol, { ascending: false });
    if (error) throw error;
    for (const row of (data ?? []) as VerificationRow[]) {
      if (!map.has(row.contact_id)) map.set(row.contact_id, row);
    }
  }
  return map;
}
