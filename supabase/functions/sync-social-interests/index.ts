import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret, guardBody, jsonError, jsonOk } from "../_shared/auth.ts";
import { validate } from "../_shared/validate.ts";

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
    const vsi = validate(rawBody, {
      contactId: { type: 'string', required: true, maxLength: 36 },
      queueId:   { type: 'string', required: true, maxLength: 36 },
    });
    if (!vsi.ok) return jsonError(vsi.error, 400, req);
    const { contactId, queueId } = vsi.data as { contactId: string; queueId: string };

    // Mark as processing + fetch current analysis concurrently (independent)
    const [, { data: currentAnalysis }] = await Promise.all([
      supabase.from('social_sync_queue')
        .update({ status: 'processing', last_attempt: new Date().toISOString() })
        .eq('id', queueId),
      supabase.from('social_behavior_analysis')
        .select('*')
        .eq('contact_id', contactId)
        .maybeSingle(),
    ]);

    // 4. Process enrichment
    const enrichedData = {
      interests: [...(currentAnalysis?.interests || []), 'AI', 'Productivity'],
      keywords: [...(currentAnalysis?.keywords || []), 'automation', 'efficiency'],
      last_sync_at: new Date().toISOString()
    };

    // Flush all writes in parallel: behavior analysis update, audit log, queue completion
    await Promise.all([
      supabase.from('social_behavior_analysis')
        .upsert({ contact_id: contactId, ...enrichedData }),
      supabase.from('psychographic_audit_log').insert({
        contact_id: contactId,
        change_type: 'automation',
        previous_values: currentAnalysis || {},
        new_values: enrichedData,
        changed_fields: ['interests', 'keywords', 'last_sync_at'],
      }),
      supabase.from('social_sync_queue').update({ status: 'completed' }).eq('id', queueId),
    ]);

    // Fire-and-forget offer regeneration (non-critical path)
    supabase.functions.invoke('generate-offer-suggestions', { body: { contactId } })
      .catch(err => console.error('Error triggering offer regeneration:', err));

    return jsonOk({ success: true }, req);
  } catch (error) {
    console.error('sync-social-interests error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
