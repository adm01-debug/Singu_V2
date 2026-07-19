import { withAuth, jsonError, jsonOk, scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

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
    const { url, options } = await req.json();

    if (!url) {
      return jsonError('URL is required', 400);
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return jsonError('Firecrawl connector not configured', 500);
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
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