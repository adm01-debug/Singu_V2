import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";

// EnrichLayer returns the profile data directly
interface EnrichLayerProfile {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  headline?: string;
  summary?: string;
  occupation?: string;
  location_str?: string;
  city?: string;
  state?: string;
  country?: string;
  country_full_name?: string;
  industry?: string;
  connections?: number;
  profile_pic_url?: string;
  background_cover_image_url?: string;
  public_identifier?: string;
  experiences?: Array<{
    title?: string;
    company?: string;
    company_linkedin_profile_url?: string;
    location?: string;
    starts_at?: { year?: number; month?: number; day?: number };
    ends_at?: { year?: number; month?: number; day?: number };
    description?: string;
    logo_url?: string;
  }>;
  education?: Array<{
    school?: string;
    degree_name?: string;
    field_of_study?: string;
    starts_at?: { year?: number; month?: number; day?: number };
    ends_at?: { year?: number; month?: number; day?: number };
    description?: string;
    logo_url?: string;
    school_linkedin_profile_url?: string;
  }>;
  certifications?: Array<{
    name?: string;
    authority?: string;
    starts_at?: { year?: number; month?: number; day?: number };
    ends_at?: { year?: number; month?: number; day?: number };
  }>;
  languages?: string[];
  activities?: Array<{ title?: string; link?: string; activity_status?: string }>;
  groups?: Array<{ name?: string; url?: string }>;
  recommendations?: string[];
  accomplishment_projects?: Array<{ title?: string; description?: string; url?: string }>;
  volunteer_work?: Array<{ title?: string; company?: string; description?: string }>;
}

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  // 🔒 Authenticate — userId from JWT
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const InputSchema = z.object({
      linkedinUrl: z.string().url("LinkedIn URL inválida").min(1),
      contactId: z.string().uuid("contactId deve ser UUID válido").optional(),
    });
    const parsed = InputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(`Entrada inválida: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400, req);
    }
    const { linkedinUrl, contactId } = parsed.data;

    const apiKey = Deno.env.get("ENRICHLAYER_API_KEY");
    if (!apiKey) {
      console.error("ENRICHLAYER_API_KEY not configured");
      return jsonError("EnrichLayer API key not configured", 500, req);
    }

    // Enriching LinkedIn profile

    const apiUrl = `https://enrichlayer.com/api/v2/profile?url=${encodeURIComponent(linkedinUrl)}`;
    
    const enrichResponse = await fetchAPI(apiUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const responseText = await enrichResponse.text();
    // EnrichLayer responded

    if (!enrichResponse.ok) {
      console.error("EnrichLayer API error:", enrichResponse.status, responseText);
      return jsonError(`EnrichLayer API error: ${enrichResponse.status}`, enrichResponse.status, req);
    }

    let profile: EnrichLayerProfile;
    try {
      profile = JSON.parse(responseText);
    } catch {
      return jsonError("Failed to parse API response", 500, req);
    }

    // If contactId provided, save to social_profiles table using JWT-scoped client
    if (contactId) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
      );

      const profileData = {
        contact_id: contactId,
        user_id: userId,
        platform: "linkedin",
        profile_url: linkedinUrl,
        profile_data: profile,
        headline: profile.headline,
        current_company: profile.experiences?.[0]?.company,
        current_position: profile.experiences?.[0]?.title,
        location: profile.location_str || `${profile.city || ""} ${profile.state || ""} ${profile.country || ""}`.trim(),
        skills: [],
        certifications: profile.certifications?.map(c => c.name).filter(Boolean) || [],
        education: profile.education || [],
        experience: profile.experiences || [],
        last_scraped_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabaseClient
        .from("social_profiles")
        .upsert(profileData, { onConflict: "contact_id,platform" });
      if (profileError) throw profileError;
    }

    return jsonOk({
      success: true,
      data: profile,
      profile: {
        name: profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
        firstName: profile.first_name,
        lastName: profile.last_name,
        headline: profile.headline,
        summary: profile.summary,
        occupation: profile.occupation,
        location: profile.location_str || `${profile.city || ""} ${profile.state || ""}`.trim(),
        country: profile.country_full_name || profile.country,
        industry: profile.industry,
        profilePicUrl: profile.profile_pic_url,
        connections: profile.connections,
        currentPosition: profile.experiences?.[0]?.title,
        currentCompany: profile.experiences?.[0]?.company,
        experiences: profile.experiences || [],
        education: profile.education || [],
        certifications: profile.certifications || [],
        languages: profile.languages || [],
        recommendations: profile.recommendations || [],
        experienceCount: profile.experiences?.length || 0,
        educationCount: profile.education?.length || 0,
      },
    }, req);
  } catch (error) {
    console.error("enrichlayer-linkedin error:", error);
    return jsonError("Internal server error", 500, req);
  }
});
