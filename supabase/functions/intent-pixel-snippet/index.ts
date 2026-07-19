import { scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

Deno.serve((req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const url = new URL(req.url);
  const pixelKey = url.searchParams.get("k") ?? "";
  if (!pixelKey || pixelKey.length < 8) {
    return new Response("// invalid pixel key", {
      status: 400, headers: { ...cors, "Content-Type": "application/javascript" },
    });
  }

  const projectRef = Deno.env.get("SUPABASE_URL")?.replace("https://", "").split(".")[0] ?? "";
  const endpoint = `https://${projectRef}.supabase.co/functions/v1/intent-tracker`;

  const js = `(function(){var P=${JSON.stringify(pixelKey)},E=${JSON.stringify(endpoint)};
function s(t,m){try{fetch(E,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pixel_key:P,signal_type:t,url:location.href,referrer:document.referrer||null,metadata:m||{}}),keepalive:true})}catch(e){}}
window.SinguIntent={track:s,identify:function(email,company){window.__singuId={email:email,company:company}},pageView:function(){var d=window.__singuId||{};fetch(E,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pixel_key:P,signal_type:"page_view",url:location.href,referrer:document.referrer||null,contact_email:d.email||null,external_company_id:d.company||null}),keepalive:true})}};
window.SinguIntent.pageView();
document.addEventListener("submit",function(e){if(e.target&&e.target.tagName==="FORM")s("form_submit",{form:e.target.id||e.target.name||""})},true);
if(/pric|plan|valor/i.test(location.pathname))s("pricing_view");})();`;

  return new Response(js, {
    status: 200,
    headers: {
      ...cors,
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});
