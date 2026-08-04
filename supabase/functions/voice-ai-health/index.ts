import { scopedCorsHeaders, withAuth } from "../_shared/auth.ts";
import { fetchAPI, fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });

interface ServiceCheck {
  service: string;
  status: "ok" | "error";
  latency_ms: number;
  error?: string;
}

async function checkElevenLabsSTT(): Promise<ServiceCheck> {
  const start = Date.now();
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) {
    return { service: "elevenlabs_stt", status: "error", latency_ms: 0, error: "ELEVENLABS_API_KEY not configured" };
  }

  try {
    const res = await fetchAPI("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
      method: "POST",
      headers: { "xi-api-key": key },
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      return { service: "elevenlabs_stt", status: "error", latency_ms: latency, error: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    return {
      service: "elevenlabs_stt",
      status: data.token ? "ok" : "error",
      latency_ms: latency,
      error: data.token ? undefined : "No token returned",
    };
  } catch (err) {
    return { service: "elevenlabs_stt", status: "error", latency_ms: Date.now() - start, error: String(err) };
  }
}

async function checkElevenLabsTTS(): Promise<ServiceCheck> {
  const start = Date.now();
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) {
    return { service: "elevenlabs_tts", status: "error", latency_ms: 0, error: "ELEVENLABS_API_KEY not configured" };
  }

  try {
    const voiceId = "JBFqnCBsd6RMkjVDRZzb";
    const res = await fetchAPI(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Teste de conexão.",
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );
    const latency = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      return { service: "elevenlabs_tts", status: "error", latency_ms: latency, error: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }

    const buf = await res.arrayBuffer();
    return {
      service: "elevenlabs_tts",
      status: buf.byteLength > 0 ? "ok" : "error",
      latency_ms: latency,
      error: buf.byteLength > 0 ? undefined : "Empty audio response",
    };
  } catch (err) {
    return { service: "elevenlabs_tts", status: "error", latency_ms: Date.now() - start, error: String(err) };
  }
}

async function checkGeminiNLU(): Promise<ServiceCheck> {
  const start = Date.now();
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return { service: "gemini_nlu", status: "error", latency_ms: 0, error: "LOVABLE_API_KEY not configured" };
  }

  try {
    const res = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Respond with exactly: OK" },
          { role: "user", content: "Health check" },
        ],
      }),
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      return { service: "gemini_nlu", status: "error", latency_ms: latency, error: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return {
      service: "gemini_nlu",
      status: content ? "ok" : "error",
      latency_ms: latency,
      error: content ? undefined : "No content in response",
    };
  } catch (err) {
    return { service: "gemini_nlu", status: "error", latency_ms: Date.now() - start, error: String(err) };
  }
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  const limited = limiter.check(authResult, req);
  if (limited) return limited;

  try {
    const [stt, tts, nlu] = await Promise.all([
      checkElevenLabsSTT(),
      checkElevenLabsTTS(),
      checkGeminiNLU(),
    ]);

    const checks = [stt, tts, nlu];
    const allOk = checks.every((c) => c.status === "ok");
    const anyError = checks.some((c) => c.status === "error");

    const overall = allOk ? "healthy" : anyError ? "degraded" : "healthy";

    return new Response(
      JSON.stringify({
        status: overall,
        checked_at: new Date().toISOString(),
        services: checks,
        total_latency_ms: checks.reduce((s, c) => s + c.latency_ms, 0),
      }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("voice-ai-health error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
