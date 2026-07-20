import { createClient } from "npm:@supabase/supabase-js@2";
import { requireWebhookSecret, scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 50 });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  // Reject unauthenticated requests before touching any data
  const authCheck = await requireWebhookSecret(req, 'LUX_WEBHOOK_SECRET', 'x-lux-secret');
  if (authCheck) return authCheck;

  const { body: rawBody, error: bodyError } = await guardBody(req, 2 * 1024 * 1024); // 2 MB — enrichment payloads
  if (bodyError) return bodyError;

  try {
    const payload = rawBody as Record<string, unknown>;
    const {
      luxRecordId,
      status,
      socialProfiles,
      socialAnalysis,
      fiscalData,
      stakeholders,
      audienceAnalysis,
      personalProfile,
      aiReport,
      aiSummary,
      fieldsUpdated,
      n8nExecutionId,
      errorMessage,
      // Fields to update on the entity itself
      entityUpdates,
    } = payload;

    if (!luxRecordId) {
      return new Response(JSON.stringify({ error: 'luxRecordId is required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, key);

    // Update the lux_intelligence record
    const updateData: Record<string, unknown> = {
      status: status || 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (socialProfiles) updateData.social_profiles = socialProfiles;
    if (socialAnalysis) updateData.social_analysis = socialAnalysis;
    if (fiscalData) updateData.fiscal_data = fiscalData;
    if (stakeholders) updateData.stakeholders = stakeholders;
    if (audienceAnalysis) updateData.audience_analysis = audienceAnalysis;
    if (personalProfile) updateData.personal_profile = personalProfile;
    if (aiReport) updateData.ai_report = aiReport;
    if (aiSummary) updateData.ai_summary = aiSummary;
    if (fieldsUpdated) updateData.fields_updated = fieldsUpdated;
    if (n8nExecutionId) updateData.n8n_execution_id = n8nExecutionId;
    if (errorMessage) updateData.error_message = errorMessage;

    const { error: updateError } = await supabase
      .from('lux_intelligence')
      .update(updateData)
      .eq('id', luxRecordId);

    if (updateError) {
      console.error('Error updating lux record:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update record' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Single pre-fetch for both entityUpdates and stakeholders blocks (eliminates duplicate read)
    const needsLuxRecord = !!(entityUpdates || (stakeholders && Array.isArray(stakeholders) && stakeholders.length > 0));
    let luxRecord: { entity_type: string; entity_id: string; user_id: string } | null = null;
    if (needsLuxRecord) {
      const { data } = await supabase
        .from('lux_intelligence')
        .select('entity_type, entity_id, user_id')
        .eq('id', luxRecordId)
        .single();
      luxRecord = data as typeof luxRecord;
    }

    // If there are entity updates, apply them
    if (entityUpdates && luxRecord) {
      const table = luxRecord.entity_type === 'company' ? 'companies' : 'contacts';
      await supabase
        .from(table)
        .update(entityUpdates)
        .eq('id', luxRecord.entity_id);
    }

    // If stakeholders were found, auto-create contacts
    if (stakeholders && Array.isArray(stakeholders) && stakeholders.length > 0 && luxRecord) {
      const contactRows = stakeholders.map((stakeholder: Record<string, unknown>) => ({
        user_id: luxRecord!.user_id,
        company_id: luxRecord!.entity_id,
        first_name: stakeholder.first_name || (stakeholder.name as string)?.split(' ')[0] || 'Unknown',
        last_name: stakeholder.last_name || (stakeholder.name as string)?.split(' ').slice(1).join(' ') || '',
        role_title: stakeholder.role_title || stakeholder.position || null,
        email: stakeholder.email || null,
        phone: stakeholder.phone || null,
        linkedin: stakeholder.linkedin || null,
      }));
      supabase.from('contacts').insert(contactRows)
        .catch((e: unknown) => console.error('Error creating stakeholder contacts:', e));
    }

    console.log(`Lux record ${luxRecordId} updated successfully`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in lux-webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
