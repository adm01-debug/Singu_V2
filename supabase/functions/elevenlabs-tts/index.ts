import {
  scopedCorsHeaders, handleCorsAndMethod,
  withAuth,
  jsonError,
  guardBody,
} from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";

const VOICE_ID_REGEX = /^[a-zA-Z0-9]{10,30}$/;

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

Deno.serve(async (req) => {
  const guard = handleCorsAndMethod(req);
  if (guard) return guard;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;


  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const body = rawBody as Record<string, unknown>;

    const { text, voiceId } = body as { text?: unknown; voiceId?: string };

    if (!text || typeof text !== "string" || text.trim().length === 0 || text.length > 5000) {
      return jsonError("Invalid text (required, max 5000 chars)", 400);
    }

    let selectedVoiceId = "4tRn1lSkEn13EVTuqb0g";
    if (voiceId && typeof voiceId === "string") {
      if (!VOICE_ID_REGEX.test(voiceId)) {
        return jsonError("Invalid voiceId format", 400);
      }
      selectedVoiceId = voiceId;
    }

    const response = await fetchAPI(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_22050_32`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            speed: 1.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);

      if (response.status === 429) {
        return jsonError("TTS rate limit exceeded. Try again shortly.", 429);
      }
      return jsonError(`TTS failed: ${response.status}`, 500);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...scopedCorsHeaders, "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: unknown) {
    console.error("TTS error:", error);
    return jsonError("Internal server error", 500);
  }
});
