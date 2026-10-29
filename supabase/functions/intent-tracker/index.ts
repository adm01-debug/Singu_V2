import { bestEffortWrite } from "../_shared/best-effort-write.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { guardBody, scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 60 });

const SIGNAL_TYPES = [
  "page_view", "email_open", "email_click", "form_submit", "content_download",
  "pricing_view", "demo_request", "social_engagement", "search_query", "competitor_mention",
] as const;

const SIGNAL_WEIGHTS: Record<string, number> = {
  page_view: 1,
  email_open: 2,
  email_click: 4,
  form_submit: 7,
  content_download: 5,
  pricing_view: 8,
  demo_request: 10,
  social_engagement: 3,
  search_query: 4,
  competitor_mention: 6,
};

const PayloadSchema = z.object({
  pixel_key: z.string().min(8).max(128),
  signal_type: z.enum(SIGNAL_TYPES),
  url: z.string().url().optional(),
  referrer: z.string().max(2048).optional().nullable(),
  contact_email: z.string().email().max(255).optional().nullable(),
  external_company_id: z.string().max(128).optional().nullable(),
  utm: z.record(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const body = rawBody;
    const parsed = PayloadSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const data = parsed.data;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate pixel
    const { data: pixel, error: pixelErr } = await admin
      .from("intent_tracking_pixels")
      .select("user_id, domain, active")
      .eq("pixel_key", data.pixel_key)
      .maybeSingle();

    if (pixelErr || !pixel || !pixel.active) {
      return new Response(JSON.stringify({ error: "Invalid pixel" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Resolve contact_id by email when provided
    let contact_id: string | null = null;
    if (data.contact_email) {
      const { data: contact } = await admin
        .from("contacts")
        .select("id, company_id")
        .eq("user_id", pixel.user_id)
        .eq("email", data.contact_email)
        .maybeSingle();
      if (contact) contact_id = contact.id;
    }

    const weight = SIGNAL_WEIGHTS[data.signal_type] ?? 1;

    const { error: insErr } = await admin.from("intent_signals").insert({
      user_id: pixel.user_id,
      contact_id,
      external_company_id: data.external_company_id ?? null,
      signal_type: data.signal_type,
      signal_source: pixel.domain,
      weight,
      signal_value: {
        url: data.url ?? null,
        referrer: data.referrer ?? null,
        utm: data.utm ?? {},
        metadata: data.metadata ?? {},
        contact_email: data.contact_email ?? null,
      },
    });

    if (insErr) {
      console.error("intent-tracker insert error", insErr);
      return new Response(JSON.stringify({ error: "Insert failed" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Update pixel stats (best-effort)
    await bestEffortWrite(admin
      .from("intent_tracking_pixels")
      .update({ last_signal_at: new Date().toISOString() })
      .eq("pixel_key", data.pixel_key), "intent_tracking_pixels update error:");

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("intent-tracker fatal", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
