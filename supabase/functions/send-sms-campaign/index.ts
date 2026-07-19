import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";


const TWILIO_GATEWAY = "https://connector-gateway.lovable.dev/twilio";

interface Body { campaignId: string }

function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("55")) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { campaignId } = (await req.json()) as Body;
    if (!campaignId) {
      return new Response(JSON.stringify({ error: "campaignId required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: campaign, error: cErr } = await admin
      .from("sms_campaigns").select("*").eq("id", campaignId).eq("user_id", user.id).single();
    if (cErr || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (campaign.status === "sent" || campaign.status === "sending") {
      return new Response(JSON.stringify({ error: "Campaign already processed" }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Materialize recipients from contacts with phone, excluding opt-outs
    const { data: contacts } = await admin
      .from("contacts")
      .select("id, first_name, last_name, phone, whatsapp")
      .eq("user_id", user.id);

    const { data: optOuts } = await admin
      .from("sms_opt_outs").select("phone").eq("user_id", user.id);
    const optedOut = new Set((optOuts || []).map(o => o.phone));

    const recipientRows: Array<{ campaign_id: string; contact_id: string; phone: string; status: string }> = [];
    const renderedByContact = new Map<string, string>();

    for (const c of contacts || []) {
      const raw = c.phone || c.whatsapp;
      if (!raw) continue;
      const phone = normalizePhone(raw);
      if (!phone || optedOut.has(phone)) continue;
      recipientRows.push({ campaign_id: campaignId, contact_id: c.id, phone, status: "pending" });
      renderedByContact.set(c.id, renderTemplate(campaign.message, {
        first_name: c.first_name || "",
        last_name: c.last_name || "",
        full_name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
      }));
    }

    if (recipientRows.length === 0) {
      await admin.from("sms_campaigns").update({ status: "failed", total_recipients: 0 }).eq("id", campaignId);
      return new Response(JSON.stringify({ error: "No valid recipients" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    await admin.from("sms_campaign_recipients").upsert(recipientRows, { onConflict: "campaign_id,contact_id", ignoreDuplicates: true });
    await admin.from("sms_campaigns").update({
      status: "sending",
      total_recipients: recipientRows.length,
      cost_estimate_cents: recipientRows.length * 5, // ~ R$ 0,05 estimativa
    }).eq("id", campaignId);

    // Try Twilio gateway send (best-effort)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const fromNumber = campaign.sender_id;

    const canSend = !!(LOVABLE_API_KEY && TWILIO_API_KEY && fromNumber);
    let sent = 0, failed = 0;

    const { data: storedRecipients } = await admin
      .from("sms_campaign_recipients").select("id, contact_id, phone").eq("campaign_id", campaignId);

    for (const r of storedRecipients || []) {
      const body = renderedByContact.get(r.contact_id) || campaign.message;
      if (!canSend) {
        // Mark as failed with explanation; admin must connect Twilio + sender
        await admin.from("sms_campaign_recipients").update({
          status: "failed",
          error_message: "SMS provider not configured (Twilio connector + sender_id required)",
          failed_at: new Date().toISOString(),
        }).eq("id", r.id);
        failed++;
        continue;
      }
      try {
        const resp = await fetch(`${TWILIO_GATEWAY}/Messages.json`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: r.phone, From: fromNumber, Body: body }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          await admin.from("sms_campaign_recipients").update({
            status: "failed",
            error_message: data?.message || `HTTP ${resp.status}`,
            failed_at: new Date().toISOString(),
          }).eq("id", r.id);
          failed++;
        } else {
          await admin.from("sms_campaign_recipients").update({
            status: "sent",
            provider_message_id: data?.sid || null,
            sent_at: new Date().toISOString(),
          }).eq("id", r.id);
          sent++;
        }
      } catch (err) {
        await admin.from("sms_campaign_recipients").update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "send error",
          failed_at: new Date().toISOString(),
        }).eq("id", r.id);
        failed++;
      }
    }

    const finalStatus = sent > 0 ? "sent" : "failed";
    await admin.from("sms_campaigns").update({
      status: finalStatus,
      total_sent: sent,
      total_failed: failed,
      sent_at: new Date().toISOString(),
    }).eq("id", campaignId);

    return new Response(JSON.stringify({ success: true, sent, failed, total: recipientRows.length, providerConfigured: canSend }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-sms-campaign error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
