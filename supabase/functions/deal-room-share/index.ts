import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validate } from "../_shared/validate.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

Deno.serve(async (req) => {
  const pre = handleCorsAndMethod(req);
  if (pre) return pre;

  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth as string;

  const rl = limiter.check(userId, req);
  if (rl) return rl;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  const v = validate(rawBody, {
    room_id: { type: 'string', required: true, maxLength: 36 },
    enabled:  { type: 'boolean' },
    rotate:   { type: 'boolean' },
  });
  if (!v.ok) return jsonError(v.error, 400, req);
  const { room_id, enabled, rotate } = v.data as { room_id: string; enabled?: boolean; rotate?: boolean };

  try {

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: room, error: rErr } = await supabase
      .from("deal_rooms").select("id,user_id,share_token,share_enabled")
      .eq("id", room_id).maybeSingle();
    if (rErr || !room || room.user_id !== userId) return jsonError("Not found", 404, req);

    const update: Record<string, unknown> = {};
    if (typeof enabled === "boolean") update.share_enabled = enabled;
    if (rotate) update.share_token = crypto.randomUUID().replace(/-/g, "");

    let token = room.share_token;
    let shareEnabled = room.share_enabled;
    if (Object.keys(update).length > 0) {
      const { data: upd, error: uErr } = await supabase
        .from("deal_rooms").update(update).eq("id", room_id)
        .select("share_token,share_enabled").single();
      if (uErr) { console.error("deal-room-share update error:", uErr); return jsonError("Internal server error", 500, req); }
      token = upd.share_token;
      shareEnabled = upd.share_enabled;
    }

    return jsonOk({ token, share_enabled: shareEnabled }, req);
  } catch (e) {
    console.error("deal-room-share error:", e);
    return jsonError("Internal server error", 500, req);
  }
});
