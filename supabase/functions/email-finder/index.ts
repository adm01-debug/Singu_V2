import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";
import { verifyEmail } from "../_shared/email-verify.ts";
import { scopedCorsHeaders } from "../_shared/auth.ts";


const BodySchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  domain: z.string().min(3).max(253),
  contactId: z.string().uuid().optional().nullable(),
});

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function permutations(first: string, last: string): string[] {
  const f = normalize(first);
  const l = normalize(last);
  const fi = f[0] || "";
  const li = l[0] || "";
  const set = new Set<string>([
    `${f}.${l}`, `${f}${l}`, `${f}_${l}`, `${f}-${l}`,
    `${f}`, `${l}`, `${fi}${l}`, `${fi}.${l}`,
    `${f}${li}`, `${f}.${li}`, `${l}.${f}`, `${l}${f}`,
  ].filter(Boolean));
  return Array.from(set);
}

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

    const { firstName, lastName, domain, contactId } = parsed.data;
    // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    const locals = permutations(firstName, lastName);

    const candidates = await Promise.all(
      locals.map(async (local) => {
        const email = `${local}@${cleanDomain}`;
        const v = await verifyEmail(email);
        return { email, ...v };
      })
    );
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("email_finder_results").insert({
      user_id: userData.user.id,
      contact_id: contactId ?? null,
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      domain: cleanDomain,
      candidates,
      best_email: best?.email ?? null,
      best_confidence: best?.score ?? 0,
      sources: [{ type: "permutation_heuristic" }],
    });

    return new Response(JSON.stringify({ best, candidates }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
