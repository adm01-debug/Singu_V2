import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { fetchScrape } from "../_shared/fetch-utils.ts";

interface ScrapeRequest {
  contactId: string;
  platform: "linkedin" | "twitter" | "instagram";
  profileUrl: string;
}

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- scraped web metadata shape not typed
function parseLinkedInProfile(markdown: string, metadata: any) {
  // deno-lint-ignore no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- profile shape varies by platform
  const profile: any = {
    headline: "", current_company: "", current_position: "",
    location: "", skills: [], certifications: [], experience: [], education: [],
  };

  const headlineMatch = markdown.match(/^#\s*(.+)/m);
  if (headlineMatch) profile.headline = headlineMatch[1].trim();

  const experienceSection = markdown.match(/(?:Experience|Experiência)[\s\S]*?(?=(?:Education|Educação|Skills|Competências|$))/i);
  if (experienceSection) {
    const jobs = experienceSection[0].match(/(?:\*\*|##)\s*([^*\n]+)/g);
    if (jobs) {
      profile.experience = jobs.slice(0, 5).map((job: string) => ({ title: job.replace(/[*#]/g, "").trim() }));
      if (profile.experience.length > 0) {
        const firstJob = profile.experience[0].title;
        // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
        const atMatch = firstJob.match(/(.+?)\s+(?:at|@|em)\s+(.+)/i);
        if (atMatch) {
          profile.current_position = atMatch[1].trim();
          profile.current_company = atMatch[2].trim();
        } else {
          profile.current_position = firstJob;
        }
      }
    }
  }

  const skillsSection = markdown.match(/(?:Skills|Competências|Habilidades)[\s\S]*?(?=(?:Education|Experiência|Experience|$))/i);
  if (skillsSection) {
    const skills = skillsSection[0].match(/[-•]\s*([^\n]+)/g);
    if (skills) profile.skills = skills.slice(0, 20).map((s: string) => s.replace(/[-•]\s*/, "").trim());
  }

  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const locationMatch = markdown.match(/(?:Location|Localização|📍)\s*:?\s*([^\n]+)/i);
  if (locationMatch) profile.location = locationMatch[1].trim();

  if (metadata) {
    if (metadata.title && !profile.headline) profile.headline = metadata.title;
    if (metadata.description) {
      // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
      const descMatch = metadata.description.match(/(.+?)\s+[-–|]\s+(.+)/);
      if (descMatch && !profile.current_position) {
        profile.current_position = descMatch[1].trim();
        profile.current_company = descMatch[2].trim();
      }
    }
  }
  return profile;
}

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- scraped web metadata shape not typed
function parseTwitterProfile(markdown: string, metadata: any) {
  // deno-lint-ignore no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- profile shape varies by platform
  const profile: any = { headline: "", followers_count: 0, following_count: 0, recent_posts: [] };
  const bioMatch = markdown.match(/(?:Bio|Sobre)[\s\S]*?([^\n]+)/i);
  if (bioMatch) profile.headline = bioMatch[1].trim();
  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const followersMatch = markdown.match(/(\d+(?:[,.\s]\d+)*)\s*(?:followers|seguidores)/i);
  if (followersMatch) profile.followers_count = parseInt(followersMatch[1].replace(/[,.\s]/g, ""));
  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const followingMatch = markdown.match(/(\d+(?:[,.\s]\d+)*)\s*(?:following|seguindo)/i);
  if (followingMatch) profile.following_count = parseInt(followingMatch[1].replace(/[,.\s]/g, ""));
  const tweets = markdown.match(/(?:^|\n)(?:>|[-•])\s*([^\n]{20,280})/g);
  if (tweets) {
    profile.recent_posts = tweets.slice(0, 10).map((t: string) => ({
      content: t.replace(/^[>\-•\s]+/, "").trim(), timestamp: new Date().toISOString(),
    }));
  }
  if (metadata?.title) profile.headline = profile.headline || metadata.title;
  return profile;
}

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- scraped web metadata shape not typed
function parseInstagramProfile(markdown: string, metadata: any) {
  // deno-lint-ignore no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- profile shape varies by platform
  const profile: any = { headline: "", followers_count: 0, following_count: 0, posts_count: 0, recent_posts: [] };
  const bioMatch = markdown.match(/(?:Bio|Sobre)[\s\S]*?([^\n]+)/i);
  if (bioMatch) profile.headline = bioMatch[1].trim();
  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const followersMatch = markdown.match(/(\d+(?:[,.\s]\d+)*)\s*(?:followers|seguidores)/i);
  if (followersMatch) profile.followers_count = parseInt(followersMatch[1].replace(/[,.\s]/g, ""));
  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const followingMatch = markdown.match(/(\d+(?:[,.\s]\d+)*)\s*(?:following|seguindo)/i);
  if (followingMatch) profile.following_count = parseInt(followingMatch[1].replace(/[,.\s]/g, ""));
  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const postsMatch = markdown.match(/(\d+(?:[,.\s]\d+)*)\s*(?:posts|publicações)/i);
  if (postsMatch) profile.posts_count = parseInt(postsMatch[1].replace(/[,.\s]/g, ""));
  if (metadata?.title) profile.headline = profile.headline || metadata.title;
  return profile;
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

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { contactId, platform, profileUrl }: ScrapeRequest = await req.json();

    if (!contactId || !platform || !profileUrl) {
      return jsonError("Missing required fields", 400);
    }

    console.log(`Scraping ${platform} profile: ${profileUrl}`);

    const scrapeResponse = await fetchScrape("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: profileUrl, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("Firecrawl error:", errorText);
      await supabaseClient
        .from("social_scraping_schedule")
        .update({ last_run_at: new Date().toISOString(), consecutive_failures: 1, last_error: `Firecrawl error: ${scrapeResponse.status}` })
        .eq("contact_id", contactId).eq("platform", platform);
      return jsonError("Failed to scrape profile", 500);
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    // deno-lint-ignore no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parsed profile shape depends on platform
    let parsedProfile: any;
    switch (platform) {
      case "linkedin": parsedProfile = parseLinkedInProfile(markdown, metadata); break;
      case "twitter": parsedProfile = parseTwitterProfile(markdown, metadata); break;
      case "instagram": parsedProfile = parseInstagramProfile(markdown, metadata); break;
      default: parsedProfile = { headline: metadata.title || "" };
    }

    const { data: existingProfile } = await supabaseClient
      .from("social_profiles").select("*").eq("contact_id", contactId).eq("platform", platform).maybeSingle();

    // deno-lint-ignore no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- life event shape depends on dynamic parsedProfile
    const lifeEvents: any[] = [];
    if (existingProfile && platform === "linkedin") {
      if (existingProfile.current_company && parsedProfile.current_company &&
          existingProfile.current_company !== parsedProfile.current_company) {
        lifeEvents.push({
          contact_id: contactId, user_id: userId, platform,
          event_type: "company_change", event_title: "Mudança de Empresa",
          event_description: `Mudou de ${existingProfile.current_company} para ${parsedProfile.current_company}`,
          previous_value: existingProfile.current_company, new_value: parsedProfile.current_company,
          confidence: 0.9, event_date: new Date().toISOString(),
        });
      }
      if (existingProfile.current_position && parsedProfile.current_position &&
          existingProfile.current_position !== parsedProfile.current_position &&
          existingProfile.current_company === parsedProfile.current_company) {
        lifeEvents.push({
          contact_id: contactId, user_id: userId, platform,
          event_type: "promotion", event_title: "Possível Promoção",
          event_description: `Cargo mudou de "${existingProfile.current_position}" para "${parsedProfile.current_position}"`,
          previous_value: existingProfile.current_position, new_value: parsedProfile.current_position,
          confidence: 0.8, event_date: new Date().toISOString(),
        });
      }
    }

    // Save/update profile
    const { error: upsertError } = await supabaseClient.from("social_profiles").upsert({
      contact_id: contactId, user_id: userId, platform, profile_url: profileUrl,
      profile_data: { markdown, metadata, parsed: parsedProfile },
      headline: parsedProfile.headline, current_company: parsedProfile.current_company,
      current_position: parsedProfile.current_position, location: parsedProfile.location,
      skills: parsedProfile.skills || [], followers_count: parsedProfile.followers_count,
      following_count: parsedProfile.following_count, recent_posts: parsedProfile.recent_posts,
      last_scraped_at: new Date().toISOString(),
    }, { onConflict: "contact_id,platform" });
    if (upsertError) console.error("Error saving profile:", upsertError);

    // Suggest hobbies and interests based on social profile (AI Enrichment)
    const suggestedIntel = [];
    
    // Suggest interests from skills
    if (parsedProfile.skills && parsedProfile.skills.length > 0) {
      for (const skill of parsedProfile.skills.slice(0, 5)) {
        suggestedIntel.push({
          contact_id: contactId,
          user_id: userId,
          type: "interest",
          value: skill,
          source: platform,
          status: "pending"
        });
      }
    }

    // Try to extract hobbies from headline/bio
    const textToAnalyze = `${parsedProfile.headline} ${markdown}`.toLowerCase();
    const commonHobbies = ["futebol", "surf", "beach tennis", "viagem", "leitura", "vinhos", "gastronomia", "pets", "cachorros", "corrida", "academia", "yoga", "meditação"];
    
    for (const hobby of commonHobbies) {
      if (textToAnalyze.includes(hobby)) {
        suggestedIntel.push({
          contact_id: contactId,
          user_id: userId,
          type: "hobby",
          value: hobby.charAt(0).toUpperCase() + hobby.slice(1),
          source: platform,
          status: "pending"
        });
      }
    }

    if (suggestedIntel.length > 0) {
      const { error: suggestError } = await supabaseClient
        .from("suggested_rapport_intel")
        .upsert(suggestedIntel, { onConflict: "contact_id,type,value" });
      
      if (suggestError) console.error("Error saving suggested intel:", suggestError);
    }

    if (lifeEvents.length > 0) {
      const { error: eventsError } = await supabaseClient.from("social_life_events").insert(lifeEvents);
      if (eventsError) console.error("Error saving life events:", eventsError);
    }

    await supabaseClient.from("social_scraping_schedule").update({
      last_run_at: new Date().toISOString(), consecutive_failures: 0, last_error: null,
      next_run_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq("contact_id", contactId).eq("platform", platform);

    return jsonOk({ success: true, platform, profile: parsedProfile, lifeEvents: lifeEvents.length });
  } catch (error) {
    console.error("social-profile-scraper error:", error);
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
});
