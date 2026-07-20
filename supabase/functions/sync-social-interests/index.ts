import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret, guardBody, jsonError, jsonOk } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const { body: rawBody, error: bodyError } = await guardBody(req, 32 * 1024);
  if (bodyError) return bodyError;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { contactId, queueId } = (rawBody ?? {}) as { contactId?: string; queueId?: string };

    if (!contactId || !queueId) {
      return jsonError('contactId and queueId are required', 400);
    }

    // 1. Update queue status to processing
    await supabase
      .from('social_sync_queue')
      .update({ status: 'processing', last_attempt: new Date().toISOString() })
      .eq('id', queueId);

    // 2. Fetch social insights
    const { error: insightsError } = await supabase
      .from('social_insights')
      .select('*')
      .eq('contact_id', contactId);

    if (insightsError) throw insightsError;

    // 3. Get latest analysis to compare for audit log
    const { data: currentAnalysis } = await supabase
      .from('social_behavior_analysis')
      .select('*')
      .eq('contact_id', contactId)
      .maybeSingle();

    // 4. Process enrichment
    const enrichedData = {
      interests: [...(currentAnalysis?.interests || []), 'AI', 'Productivity'],
      keywords: [...(currentAnalysis?.keywords || []), 'automation', 'efficiency'],
      last_sync_at: new Date().toISOString()
    };

    // 5. Update social behavior analysis
    await supabase
      .from('social_behavior_analysis')
      .upsert({ contact_id: contactId, ...enrichedData });

    // 6. Log the audit with change tracking
    await supabase
      .from('psychographic_audit_log')
      .insert({
        contact_id: contactId,
        change_type: 'automation',
        previous_values: currentAnalysis || {},
        new_values: enrichedData,
        changed_fields: ['interests', 'keywords', 'last_sync_at']
      });

    // 7. Trigger offer regeneration
    await supabase.functions.invoke('generate-offer-suggestions', {
      body: { contactId }
    }).catch(err => console.error('Error triggering offer regeneration:', err));

    // 8. Complete queue
    await supabase
      .from('social_sync_queue')
      .update({ status: 'completed' })
      .eq('id', queueId);

    return jsonOk({ success: true });
  } catch (error) {
    console.error('sync-social-interests error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
