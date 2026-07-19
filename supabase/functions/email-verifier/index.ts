import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";
import { verifyEmail } from "../_shared/email-verify.ts";
import { scopedCorsHeaders } from "../_shared/auth.ts";


const BodySchema = z.object({
  email: z.string().email().max(255),
  contactId: z.string().uuid().optional().nullable(),
  persist: z.boolean().optional().default(true),
});

const limiter = rateLimit({ windowMs: 60_000, max: 60 });


Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    const { email, contactId, persist } = parsed.data;
    const result = await verifyEmail(email);

    if (persist) {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await admin.from("email_verifications").insert({
        user_id: userData.user.id,
        contact_id: contactId ?? null,
        email,
        ...result,
        provider: "internal",
        raw: result,
      });
    }

    return new Response(JSON.stringify({ email, ...result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
