import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { contactId, queueId } = await req.json()

    // 1. Update queue status to processing
    await supabaseClient
      .from('social_sync_queue')
      .update({ status: 'processing', last_attempt: new Date().toISOString() })
      .eq('id', queueId)

    // 2. Fetch social insights (mocking external social api call)
    const { data: insights, error: insightsError } = await supabaseClient
      .from('social_insights')
      .select('*')
      .eq('contact_id', contactId)

    if (insightsError) throw insightsError

    // 3. Get latest analysis to compare for audit log
    const { data: currentAnalysis } = await supabaseClient
      .from('social_behavior_analysis')
      .select('*')
      .eq('contact_id', contactId)
      .maybeSingle();

    // 4. Simulate processing/enrichment logic (In a real scenario, call Firecrawl/LinkedIn API)
    const enrichedData = { 
      interests: [...(currentAnalysis?.interests || []), 'AI', 'Productivity'],
      keywords: [...(currentAnalysis?.keywords || []), 'automation', 'efficiency'],
      last_sync_at: new Date().toISOString()
    };

    // 5. Update social behavior analysis
    await supabaseClient
      .from('social_behavior_analysis')
      .upsert({
        contact_id: contactId,
        ...enrichedData
      });

    // 6. Log the audit with change tracking
    await supabaseClient
      .from('psychographic_audit_log')
      .insert({
        contact_id: contactId,
        change_type: 'automation',
        previous_values: currentAnalysis || {},
        new_values: enrichedData,
        changed_fields: ['interests', 'keywords', 'last_sync_at']
      });

    // 7. Trigger offer regeneration to use new social data
    // We use service role key for the invoke if possible, or just call it
    const { error: invokeError } = await supabaseClient.functions.invoke('generate-offer-suggestions', {
      body: { contactId }
    });

    if (invokeError) console.error('Error triggering offer regeneration:', invokeError);

    // 6. Complete queue
    await supabaseClient
      .from('social_sync_queue')
      .update({ status: 'completed' })
      .eq('id', queueId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
