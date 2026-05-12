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

    // 3. Simulate processing/enrichment logic
    // In a real scenario, this would call Firecrawl/LinkedIn API etc.
    const mockPreviousValues = { interests: ['tech', 'gadgets'] }
    const mockNewValues = { 
      interests: ['AI', 'Productivity', 'Sustainability'],
      keywords: ['automation', 'efficiency', 'ESG']
    }

    // 4. Log the audit
    await supabaseClient
      .from('psychographic_audit_log')
      .insert({
        contact_id: contactId,
        change_type: 'automation',
        previous_values: mockPreviousValues,
        new_values: mockNewValues,
        changed_fields: ['interests', 'keywords']
      })

    // 5. Update offers with Social Match metadata
    // Example: Update existing offers or generate new ones
    await supabaseClient
      .from('offer_suggestions')
      .update({ 
        metadata: { 
          sources: ['LinkedIn Profile', 'Recent Post'], 
          keywords: ['automation', 'productivity'] 
        } 
      })
      .eq('contact_id', contactId)
      .eq('offer_category', 'Software')

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
