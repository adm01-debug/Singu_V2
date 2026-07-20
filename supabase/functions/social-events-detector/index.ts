import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret } from "../_shared/auth.ts";
import { fetchScrape } from "../_shared/fetch-utils.ts";

interface ScrapeResult {
  contactId: string;
  platform: string;
  success: boolean;
  error?: string;
  eventsDetected?: number;
}

interface LifeEvent {
  contact_id: string;
  user_id: string;
  platform: string;
  event_type: string;
  event_title: string;
  event_description: string;
  previous_value?: string;
  new_value?: string;
  confidence: number;
  event_date: string;
  metadata?: Record<string, unknown>;
}

// Esta função processa todos os contatos agendados e detecta eventos
// eslint-disable-next-line sonarjs/cognitive-complexity
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  // 🔒 Cron secret validation
  const cronError = await requireCronSecret(req);
  if (cronError) return cronError;

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    // Usar service role para acesso administrativo
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar schedules que precisam ser executados
    const now = new Date().toISOString();
    const { data: pendingSchedules, error: scheduleError } = await supabaseAdmin
      .from('social_scraping_schedule')
      .select(`
        *,
        contacts (
          id,
          first_name,
          last_name,
          linkedin,
          twitter,
          instagram
        )
      `)
      .eq('enabled', true)
      .lt('next_run_at', now)
      .lt('consecutive_failures', 3)
      .order('priority', { ascending: false })
      .limit(10);

    if (scheduleError) {
      throw scheduleError;
    }

    if (!pendingSchedules || pendingSchedules.length === 0) {
      return new Response(JSON.stringify({
        message: "No pending scrapes",
        processed: 0
      }), {
        headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Pre-fetch all existing social profiles for all schedules in one query
    const contactIds = [...new Set(pendingSchedules.map(s => s.contact_id))];
    const { data: existingProfilesData } = await supabaseAdmin
      .from('social_profiles')
      .select('*')
      .in('contact_id', contactIds);

    // Build Map: `${contact_id}:${platform}` -> profile for O(1) lookup
    const profileMap = new Map<string, Record<string, unknown>>();
    for (const p of existingProfilesData ?? []) {
      profileMap.set(`${p.contact_id}:${p.platform}`, p);
    }

    const results: ScrapeResult[] = [];

    // Accumulators — all DB writes flushed after the loop
    type ProfileRow = Record<string, unknown>;
    type ScheduleRow = Record<string, unknown>;
    const profileUpserts: ProfileRow[] = [];
    const allLifeEvents: LifeEvent[] = [];
    const allNotifications: Record<string, unknown>[] = [];
    const successScheduleRows: ScheduleRow[] = [];
    const failureScheduleRows: ScheduleRow[] = [];

    for (const schedule of pendingSchedules) {
      try {
        console.log(`Processing ${schedule.platform} for contact ${schedule.contact_id}`);

        // Fazer scraping
        const scrapeResponse = await fetchScrape('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: schedule.profile_url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          failureScheduleRows.push({
            id: schedule.id,
            last_run_at: now,
            consecutive_failures: schedule.consecutive_failures + 1,
            last_error: `HTTP ${scrapeResponse.status}`,
          });

          results.push({
            contactId: schedule.contact_id,
            platform: schedule.platform,
            success: false,
            error: `HTTP ${scrapeResponse.status}`,
          });
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
        const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

        // Look up existing profile from pre-fetched Map (no DB call per schedule)
        const existingProfile = profileMap.get(`${schedule.contact_id}:${schedule.platform}`);

        // Detectar eventos baseado na plataforma
        const lifeEvents: LifeEvent[] = [];

        if (schedule.platform === 'linkedin') {
          // Detectar mudanças no headline/título
          const headlineMatch = markdown.match(/^#\s*(.+)/m);
          const newHeadline = headlineMatch ? headlineMatch[1].trim() : '';

          if (existingProfile?.headline && newHeadline &&
              existingProfile.headline !== newHeadline) {

            // Detectar se é promoção
            const promotionKeywords = ['senior', 'lead', 'head', 'director', 'vp', 'chief', 'manager', 'principal'];
            const wasPromoted = promotionKeywords.some(kw =>
              newHeadline.toLowerCase().includes(kw) &&
              !(existingProfile.headline as string).toLowerCase().includes(kw)
            );

            if (wasPromoted) {
              lifeEvents.push({
                contact_id: schedule.contact_id,
                user_id: schedule.user_id,
                platform: schedule.platform,
                event_type: 'promotion',
                event_title: '🎉 Promoção Detectada!',
                event_description: `${schedule.contacts?.first_name} parece ter sido promovido(a). Título anterior: "${existingProfile.headline}". Novo título: "${newHeadline}"`,
                previous_value: existingProfile.headline as string,
                new_value: newHeadline,
                confidence: 0.85,
                event_date: now,
                metadata: {
                  contact_name: `${schedule.contacts?.first_name} ${schedule.contacts?.last_name}`,
                },
              });
            }
          }

          // Detectar menção a novo emprego no conteúdo
          const newJobIndicators = [
            /excited to (?:announce|share|join)/i,
            /starting a new/i,
            /thrilled to be joining/i,
            /new chapter/i,
            /novo desafio/i,
            /começando uma nova/i,
            /feliz em anunciar/i,
          ];

          for (const indicator of newJobIndicators) {
            if (indicator.test(markdown) && !indicator.test((existingProfile?.profile_data as Record<string, unknown>)?.markdown as string || '')) {
              lifeEvents.push({
                contact_id: schedule.contact_id,
                user_id: schedule.user_id,
                platform: schedule.platform,
                event_type: 'new_job',
                event_title: '💼 Novo Emprego Detectado',
                event_description: `${schedule.contacts?.first_name} pode ter começado em um novo emprego. Verificar perfil para detalhes.`,
                confidence: 0.75,
                event_date: now,
                metadata: {
                  contact_name: `${schedule.contacts?.first_name} ${schedule.contacts?.last_name}`,
                  indicator: indicator.source,
                },
              });
              break;
            }
          }

          // Detectar aniversário de empresa
          // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
          const anniversaryMatch = markdown.match(/(\d+)\s*(?:years?|anos?)\s+(?:at|em|@)/i);
          if (anniversaryMatch) {
            const years = parseInt(anniversaryMatch[1]);
            const existingMarkdown = (existingProfile?.profile_data as Record<string, unknown>)?.markdown as string || '';
            // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
            const existingYears = existingMarkdown.match(/(\d+)\s*(?:years?|anos?)\s+(?:at|em|@)/i);

            if (!existingYears || parseInt(existingYears[1]) !== years) {
              lifeEvents.push({
                contact_id: schedule.contact_id,
                user_id: schedule.user_id,
                platform: schedule.platform,
                event_type: 'anniversary',
                event_title: `🎂 ${years} Anos de Empresa`,
                event_description: `${schedule.contacts?.first_name} completou ${years} anos na empresa atual. Ótima oportunidade para parabenizar!`,
                new_value: `${years} anos`,
                confidence: 0.9,
                event_date: now,
                metadata: {
                  contact_name: `${schedule.contacts?.first_name} ${schedule.contacts?.last_name}`,
                  years,
                },
              });
            }
          }
        }

        // Detectar post viral (Twitter/LinkedIn)
        if (schedule.platform === 'twitter' || schedule.platform === 'linkedin') {
          // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
          const engagementMatch = markdown.match(/(\d+(?:[,.\s]\d+)*)\s*(?:likes?|curtidas?|reactions?|reações?)/i);
          if (engagementMatch) {
            const likes = parseInt(engagementMatch[1].replace(/[,.\s]/g, ''));
            const previousLikes = (existingProfile?.engagement_metrics as Record<string, unknown>)?.max_likes as number || 0;

            if (likes > 1000 && likes > previousLikes * 2) {
              lifeEvents.push({
                contact_id: schedule.contact_id,
                user_id: schedule.user_id,
                platform: schedule.platform,
                event_type: 'post_viral',
                event_title: '🔥 Post Viral!',
                event_description: `${schedule.contacts?.first_name} teve um post com alto engajamento (${likes.toLocaleString()} curtidas). Ótima oportunidade para interagir!`,
                new_value: `${likes} likes`,
                confidence: 0.95,
                event_date: now,
                metadata: {
                  contact_name: `${schedule.contacts?.first_name} ${schedule.contacts?.last_name}`,
                  likes,
                },
              });
            }
          }
        }

        // Accumulate profile upsert
        profileUpserts.push({
          contact_id: schedule.contact_id,
          user_id: schedule.user_id,
          platform: schedule.platform,
          profile_url: schedule.profile_url,
          profile_data: { markdown, metadata },
          last_scraped_at: now,
        });

        // Accumulate life events
        allLifeEvents.push(...lifeEvents);

        // Accumulate notifications for each detected event
        for (const event of lifeEvents) {
          allNotifications.push({
            user_id: schedule.user_id,
            title: event.event_title,
            message: event.event_description,
            type: 'social_event',
            action_url: `/contato/${schedule.contact_id}`,
            metadata: {
              event_type: event.event_type,
              contact_id: schedule.contact_id,
              platform: schedule.platform,
            },
          });
        }

        // Accumulate schedule success update
        const nextRun = new Date(Date.now() + schedule.frequency_days * 24 * 60 * 60 * 1000);
        successScheduleRows.push({
          id: schedule.id,
          last_run_at: now,
          next_run_at: nextRun.toISOString(),
          consecutive_failures: 0,
          last_error: null,
        });

        results.push({
          contactId: schedule.contact_id,
          platform: schedule.platform,
          success: true,
          eventsDetected: lifeEvents.length,
        });

      } catch (err) {
        console.error(`Error processing ${schedule.platform} for ${schedule.contact_id}:`, err);

        failureScheduleRows.push({
          id: schedule.id,
          last_run_at: now,
          consecutive_failures: schedule.consecutive_failures + 1,
          last_error: err instanceof Error ? err.message : 'Unknown error',
        });

        results.push({
          contactId: schedule.contact_id,
          platform: schedule.platform,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Bulk-flush all accumulated DB writes in parallel
    await Promise.all([
      profileUpserts.length > 0
        ? supabaseAdmin.from('social_profiles').upsert(profileUpserts, { onConflict: 'contact_id,platform' })
        : Promise.resolve(),
      allLifeEvents.length > 0
        ? supabaseAdmin.from('social_life_events').insert(allLifeEvents)
        : Promise.resolve(),
      allNotifications.length > 0
        ? supabaseAdmin.from('notifications').insert(allNotifications)
        : Promise.resolve(),
    ]);

    // Flush schedule updates (success + failure) in a single upsert
    const allScheduleRows = [...successScheduleRows, ...failureScheduleRows];
    if (allScheduleRows.length > 0) {
      await supabaseAdmin
        .from('social_scraping_schedule')
        .upsert(allScheduleRows, { onConflict: 'id' });
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results,
    }), {
      headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("social-events-detector error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
