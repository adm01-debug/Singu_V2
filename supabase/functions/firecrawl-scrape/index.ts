import { withAuth, jsonError, jsonOk, scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { fetchScrape } from "../_shared/fetch-utils.ts";
import { z } from "npm:zod@3.23.8";

const bodySchema = z.object({
  url:     z.string().url().max(2048),
  options: z.object({
    formats:         z.array(z.enum(["markdown","html","rawHtml","screenshot"])).optional(),
    onlyMainContent: z.boolean().optional(),
    waitFor:         z.number().int().min(0).max(30000).optional(),
    location:        z.string().max(100).optional(),
  }).optional(),
});

const limiter = rateLimit({ windowMs: 60_000, max: 15 });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  // ── Auth guard ──
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { body: rawBody, error: bodyError } = await guardBody(req);
    if (bodyError) return bodyError;

    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid request body", 400);
    }
    const { url, options } = parsed.data;

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return jsonError('Firecrawl connector not configured', 500);
    }

    const response = await fetchScrape('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: options?.formats || ['markdown', 'html'],
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor || 3000,
        location: options?.location,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return jsonError(data.error || `Request failed with status ${response.status}`, response.status);
    }

    return jsonOk(data);
  } catch (error) {
    console.error('Error scraping:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to scrape', 500);
  }
});