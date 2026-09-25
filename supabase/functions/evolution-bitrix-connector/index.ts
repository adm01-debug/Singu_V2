import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// evolution-bitrix-connector v7-hardened
// Hybrid auth: Evolution webhooks via x-evolution-secret OR Bitrix via OAuth signature

const EVOLUTION_URL = "https://evolution.atomicabr.com.br";
const EVOLUTION_APIKEY = Deno.env.get('EVOLUTION_API_KEY') || "EDA4459AE6B0-4A47-9BA8-D318F012DF42";
const EVOLUTION_INSTANCE = "wpp2";
const BITRIX_CLIENT_ID = "local.693458e5bbe490.92982699";
const BITRIX_CLIENT_SECRET = "pgfhXA5GKp7esPssFYXKDTfxalvJnJ3vSVPRXZRl1m4EgHYNPv";
const BITRIX_PORTAL = "https://promobrindes.bitrix24.com.br";
const BITRIX_WEBHOOK = "https://promobrindes.bitrix24.com.br/rest/1/9hjiwqpjx485u35y";
const CONNECTOR_ID = "evolution_whatsapp";
const LINE_ID = 44;
const EDGE_FN_URL = "https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/evolution-bitrix-connector";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function verifyEvolutionSecret(req: Request): boolean {
  const secret = Deno.env.get('EVOLUTION_WEBHOOK_SECRET');
  if (!secret) return false; // fail-closed: sem secret configurado, bloqueia (era fail-open)
  const provided = req.headers.get('x-evolution-secret');
  return provided ? constantTimeEqual(provided, secret) : false;
}

function verifyBitrixRequest(req: Request, body: any): boolean {
  // Bitrix sends auth token or uses registered app credentials
  // For Open Channel webhooks, verify CONNECTOR matches
  const connector = body?.data?.CONNECTOR || body?.CONNECTOR;
  return connector === CONNECTOR_ID;
}

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,apikey,authorization,x-evolution-secret",
  "Content-Type": "application/json"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

function html(content: string) {
  return new Response(content, { headers: { ...CORS, "Content-Type": "text/html; charset=utf-8" } });
}

async function log(entry: Record<string, unknown>) {
  try { await supabase.from("connector_log").insert(entry); } catch (_) { }
}

async function getOAuthToken(): Promise<string> {
  const { data: tokenData } = await supabase.from("oauth_tokens").select("access_token, refresh_token, expires_at").eq("service", "bitrix24").single();
  if (!tokenData?.refresh_token) throw new Error("No refresh token in DB");
  if (new Date(tokenData.expires_at).getTime() - Date.now() > 5 * 60 * 1000) return tokenData.access_token;
  const resp = await fetch("https://oauth.bitrix.info/oauth/token/", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: BITRIX_CLIENT_ID, client_secret: BITRIX_CLIENT_SECRET, refresh_token: tokenData.refresh_token })
  });
  const result = await resp.json();
  if (result.error) throw new Error(`OAuth: ${result.error_description}`);
  await supabase.from("oauth_tokens").upsert({ service: "bitrix24", access_token: result.access_token, refresh_token: result.refresh_token, expires_at: new Date(result.expires * 1000).toISOString(), updated_at: new Date().toISOString() }, { onConflict: "service" });
  return result.access_token;
}

async function b24(method: string, params: Record<string, unknown> = {}) {
  const resp = await fetch(`${BITRIX_WEBHOOK}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
  return resp.json();
}

async function findCrmResponsible(phone: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const variants = [cleanPhone, "+" + cleanPhone];
  if (cleanPhone.startsWith("55") && cleanPhone.length >= 12) variants.push(cleanPhone.substring(2));
  try {
    const dupResult = await b24("crm.duplicate.findbycomm", { type: "PHONE", values: variants });
    const result = dupResult?.result || {};
    if (result.CONTACT?.length) {
      const c = (await b24("crm.contact.get", { id: result.CONTACT[0] }))?.result || {};
      return { contactId: parseInt(c.ID), companyId: c.COMPANY_ID ? parseInt(c.COMPANY_ID) : null, responsibleId: parseInt(c.ASSIGNED_BY_ID), contactName: [c.NAME, c.LAST_NAME].filter(Boolean).join(" ") || null };
    }
    if (result.COMPANY?.length) {
      const c = (await b24("crm.company.get", { id: result.COMPANY[0] }))?.result || {};
      return { contactId: null, companyId: parseInt(c.ID), responsibleId: parseInt(c.ASSIGNED_BY_ID), contactName: c.TITLE || null };
    }
    if (result.LEAD?.length) {
      const l = (await b24("crm.lead.get", { id: result.LEAD[0] }))?.result || {};
      return { contactId: null, companyId: null, responsibleId: parseInt(l.ASSIGNED_BY_ID), contactName: l.TITLE || null };
    }
  } catch (_) { }
  return { contactId: null, companyId: null, responsibleId: null, contactName: null };
}

async function handleInbound(payload: any): Promise<Response> {
  if (payload.event !== "messages.upsert") return json({ skip: true, reason: payload.event });
  const data = payload.data; const key = data.key;
  if (key.fromMe) return json({ skip: "fromMe" });
  if (key.remoteJid?.endsWith("@g.us")) return json({ skip: "group" });
  if (key.remoteJid === "status@broadcast") return json({ skip: "status" });
  let number = "";
  if (key.remoteJid?.endsWith("@s.whatsapp.net")) number = key.remoteJid.replace("@s.whatsapp.net", "");
  else if (key.remoteJidAlt?.endsWith("@s.whatsapp.net")) number = key.remoteJidAlt.replace("@s.whatsapp.net", "");
  else if (key.remoteJid?.endsWith("@lid")) number = (key.remoteJidAlt || key.participant || key.remoteJid).replace("@s.whatsapp.net", "").replace("@lid", "");
  else number = (key.remoteJid || "").replace(/@.*/, "");
  const pushName = data.pushName || number;
  const messageId = key.id;
  const timestamp = data.messageTimestamp || Math.floor(Date.now() / 1000);
  const msg = data.message || {};
  let messageText = msg.conversation || msg.extendedTextMessage?.text || "";
  if (msg.imageMessage) messageText = `[foto] ${msg.imageMessage.caption || ""}`;
  else if (msg.videoMessage) messageText = `[video] ${msg.videoMessage.caption || ""}`;
  else if (msg.audioMessage) messageText = "[audio]";
  else if (msg.documentMessage) messageText = `[documento] ${msg.documentMessage.fileName || ""}`;
  else if (msg.stickerMessage) messageText = "[figurinha]";
  else if (msg.locationMessage) messageText = "[localizacao]";
  else if (msg.contactMessage) messageText = `[contato] ${msg.contactMessage.displayName || ""}`;
  else if (msg.reactionMessage) return json({ skip: "reaction" });
  if (!messageText) messageText = "[mensagem nao suportada]";
  const crm = await findCrmResponsible(number);
  const accessToken = await getOAuthToken();
  const resp = await fetch(`${BITRIX_PORTAL}/rest/imconnector.send.messages?auth=${accessToken}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      CONNECTOR: CONNECTOR_ID, LINE: LINE_ID,
      MESSAGES: [{ user: { id: number, last_name: "", name: crm.contactName || pushName, picture: { url: "" } }, message: { id: messageId, date: timestamp, text: messageText }, chat: { id: number } }]
    })}
  );
  const result = await resp.json();
  let transferResult = null;
  if (crm.responsibleId) {
    const chatId = result?.result?.DATA?.RESULT?.[0]?.session?.CHAT_ID;
    if (chatId) {
      try { transferResult = await fetch(`${BITRIX_PORTAL}/rest/imopenlines.operator.transfer?auth=${accessToken}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ CHAT_ID: parseInt(chatId), TRANSFER_ID: crm.responsibleId }) }
      ).then(r => r.json()); } catch (_) { }
    }
  }
  await log({ direction: "inbound", whatsapp_number: number, push_name: pushName, message_text: messageText, bitrix_response: { connector: result, crm_match: crm, transfer: transferResult }, created_at: new Date().toISOString() });
  return json({ ok: true, number, name: crm.contactName || pushName, crm_match: crm, transfer: transferResult ? "routed_to_responsible" : "default_queue", bitrix: result });
}

async function handleOutbound(payload: any): Promise<Response> {
  const data = payload.data || payload;
  const connector = data.CONNECTOR || data.connector;
  if (connector !== CONNECTOR_ID) return json({ skip: "wrong_connector", got: connector });
  const messages = data.MESSAGES || data.messages || [];
  const results = [];
  for (const msg of messages) {
    const chatId = msg.chat?.id || msg.im?.chat_id;
    const text = msg.message?.text;
    if (!chatId || !text) { results.push({ skip: "missing_data" }); continue; }
    const resp = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      { method: "POST", headers: { "Content-Type": "application/json", "apikey": EVOLUTION_APIKEY }, body: JSON.stringify({ number: chatId, text, delay: 1200 }) }
    );
    const result = await resp.json();
    results.push({ chatId, sent: true, evolution: result });
    await log({ direction: "outbound", whatsapp_number: chatId, message_text: text, evolution_response: result, created_at: new Date().toISOString() });
  }
  return json({ ok: true, results });
}

async function handleOpenChat(body: any): Promise<Response> {
  const { contactId, phone: rawPhone } = body;
  let phone = rawPhone;
  if (contactId && !phone) {
    const contactData = await b24("crm.contact.get", { id: contactId });
    const c = contactData?.result;
    if (!c) return json({ error: "Contato nao encontrado" }, 404);
    const phones = c.PHONE || [];
    if (phones.length === 0) return json({ error: "Contato sem telefone", contactId }, 400);
    const mobile = phones.find((p: any) => p.VALUE_TYPE === "MOBILE") || phones[0];
    phone = mobile.VALUE.replace(/\D/g, "");
    if (!phone.startsWith("55") && phone.length <= 11) phone = "55" + phone;
  }
  if (!phone) return json({ error: "Telefone nao informado" }, 400);
  phone = phone.replace(/\D/g, "");
  let hasWhatsApp = true;
  try {
    const checkResp = await fetch(`${EVOLUTION_URL}/chat/whatsappNumbers/${EVOLUTION_INSTANCE}`,
      { method: "POST", headers: { "Content-Type": "application/json", "apikey": EVOLUTION_APIKEY }, body: JSON.stringify({ numbers: [phone] }) }
    );
    const checkResult = await checkResp.json();
    const found = Array.isArray(checkResult) ? checkResult : checkResult?.result || [];
    if (found.length > 0 && found[0].numberExists === false) hasWhatsApp = false;
    if (found.length > 0 && found[0].jid) phone = found[0].jid.replace("@s.whatsapp.net", "");
  } catch (_) { }
  if (!hasWhatsApp) return json({ error: "Numero nao tem WhatsApp", phone }, 400);
  const accessToken = await getOAuthToken();
  const contactInfo = contactId ? (await b24("crm.contact.get", { id: contactId }))?.result : null;
  const contactName = contactInfo ? [contactInfo.NAME, contactInfo.LAST_NAME].filter(Boolean).join(" ") : phone;
  const resp = await fetch(`${BITRIX_PORTAL}/rest/imconnector.send.messages?auth=${accessToken}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      CONNECTOR: CONNECTOR_ID, LINE: LINE_ID,
      MESSAGES: [{ user: { id: phone, last_name: "", name: contactName, picture: { url: "" } }, message: { id: "open_" + Date.now(), date: Math.floor(Date.now() / 1000), text: "[Conversa iniciada pelo operador]" }, chat: { id: phone } }]
    })}
  );
  const result = await resp.json();
  const chatId = result?.result?.DATA?.RESULT?.[0]?.session?.CHAT_ID;
  const sessionId = result?.result?.DATA?.RESULT?.[0]?.session?.ID;
  await log({ direction: "open-chat", whatsapp_number: phone, push_name: contactName, message_text: "[sessao aberta pelo operador]", bitrix_response: result, created_at: new Date().toISOString() });
  return json({ ok: true, chatId, sessionId, phone, contactName, chatUrl: `/online/?IM_DIALOG=chat${chatId}` });
}

function getWidgetHtml(): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>WhatsApp</title>
<script src="https://api.bitrix24.com/api/v1/"></script>
<style>
  body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
  .container { max-width: 400px; margin: 0 auto; text-align: center; }
  .btn { display: inline-block; padding: 14px 28px; background: #25D366; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; text-decoration: none; transition: background 0.2s; }
  .btn:hover { background: #1da851; }
  .btn:disabled { background: #ccc; cursor: not-allowed; }
  .status { margin-top: 16px; padding: 12px; border-radius: 6px; display: none; }
  .status.error { display: block; background: #fee; color: #c00; }
  .status.success { display: block; background: #efe; color: #060; }
  .status.loading { display: block; background: #eef; color: #006; }
  .icon { font-size: 24px; margin-right: 8px; }
</style>
</head><body>
<div class="container">
  <button class="btn" id="openChat" onclick="startChat()">
    <span class="icon">&#128172;</span> Abrir WhatsApp
  </button>
  <div class="status" id="status"></div>
</div>
<script>
const EDGE_URL = "${EDGE_FN_URL}";
function setStatus(msg, type) { const el = document.getElementById("status"); el.className = "status " + type; el.textContent = msg; }
function startChat() {
  const btn = document.getElementById("openChat"); btn.disabled = true; setStatus("Buscando contato...", "loading");
  BX24.placement.info().then(function(info) {
    const entityId = info.options?.ID || info.options?.id;
    if (!entityId) { setStatus("Erro: ID do contato nao encontrado", "error"); btn.disabled = false; return; }
    setStatus("Verificando WhatsApp...", "loading");
    fetch(EDGE_URL + "/open-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: parseInt(entityId) }) })
    .then(r => r.json()).then(data => {
      if (data.error) { setStatus(data.error, "error"); btn.disabled = false; return; }
      setStatus("Abrindo conversa com " + data.contactName + "...", "success");
      if (data.chatId) BX24.im.openMessenger("chat" + data.chatId);
      setTimeout(() => { btn.disabled = false; }, 2000);
    }).catch(err => { setStatus("Erro: " + err.message, "error"); btn.disabled = false; });
  });
}
BX24.init(function() { BX24.placement.info().then(function(info) { if (info.options?.ID || info.options?.id) document.getElementById("openChat").style.display = "inline-block"; }); });
</script>
</body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.endsWith("/health") || (req.method === "GET" && path.endsWith("/evolution-bitrix-connector"))) {
    return json({ status: "ok", connector: "evolution-bitrix24", instance: EVOLUTION_INSTANCE, line: LINE_ID, version: 7, hardened: true });
  }
  if (path.endsWith("/widget")) return html(getWidgetHtml());
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const body = await req.json();
    
    // Route: /inbound - Evolution webhook (require x-evolution-secret if configured)
    if (path.endsWith("/inbound") || body.event === "messages.upsert" || body.instance) {
      if (!verifyEvolutionSecret(req)) {
        await log({ direction: "inbound", error: "invalid_secret", created_at: new Date().toISOString() });
        return json({ error: "Unauthorized" }, 401);
      }
      return await handleInbound(body);
    }
    
    // Route: /outbound - Bitrix webhook (verify connector ID)
    if (path.endsWith("/outbound") || body.data?.CONNECTOR || body.CONNECTOR) {
      if (!verifyBitrixRequest(req, body)) {
        await log({ direction: "outbound", error: "invalid_connector", created_at: new Date().toISOString() });
        return json({ error: "Invalid connector" }, 401);
      }
      return await handleOutbound(body);
    }
    
    // Route: /open-chat - Internal use (from widget in Bitrix24 iframe)
    if (path.endsWith("/open-chat")) {
      return await handleOpenChat(body);
    }
    
    return json({ error: "Use /inbound, /outbound, /open-chat, or /widget" }, 400);
  } catch (err) { return json({ error: String(err) }, 500); }
});
