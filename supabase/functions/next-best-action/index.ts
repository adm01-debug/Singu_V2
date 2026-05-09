import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { contactId } = await req.json();
    if (!contactId) return jsonError("contactId is required", 400);

    // Call the stored procedure to check at-risk contacts (logic is in DB for efficiency)
    const { error } = await supabase.rpc('check_at_risk_contacts');
    if (error) throw error;

    // Fetch suggested actions based on funnel stage
    const { data: contact } = await supabase
      .from('contacts')
      .select('relationship_stage, relationship_score')
      .eq('id', contactId)
      .single();

    let suggestions = [];
    if (contact?.relationship_stage === 'at_risk') {
      suggestions = [
        "Enviar mensagem personalizada de acompanhamento",
        "Oferecer um benefício ou desconto exclusivo",
        "Agendar uma breve ligação de alinhamento"
      ];
    } else if (contact?.relationship_stage === 'negotiation') {
      suggestions = [
        "Revisar proposta comercial",
        "Validar decisores envolvidos",
        "Enviar caso de sucesso similar"
      ];
    }

    return jsonOk({ success: true, suggestions });
  } catch (error) {
    return jsonError(error.message, 500);
  }
});
