import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecretOrAuth, guardBody, jsonError, jsonOk } from "../_shared/auth.ts";
import { validate } from "../_shared/validate.ts";
import { deriveInterests, deriveKeywords, mergeUnique } from "./analysis.ts";

const MAX_INTERACTIONS = 200;
const MAX_ERROR_LENGTH = 500;
const CLIENT_ERROR = 'Falha ao sincronizar interesses';

interface InteractionTextRow {
  conteudo: string | null;
  content: string | null;
  assunto: string | null;
  resumo: string | null;
}

/** Relato real da interacao, juntando as colunas de texto que o CRM usa. */
function interactionText(row: InteractionTextRow): string {
  return [row.conteudo, row.content, row.assunto, row.resumo]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const guard = await requireCronSecretOrAuth(req);
  if (guard instanceof Response) return guard;

  const { body: rawBody, error: bodyError } = await guardBody(req, 32 * 1024);
  if (bodyError) return bodyError;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const vsi = validate(rawBody, {
    contactId: { type: 'string', required: true, maxLength: 36 },
    queueId:   { type: 'string', required: true, maxLength: 36 },
  });
  if (!vsi.ok) return jsonError(vsi.error, 400, req);
  const { contactId, queueId } = vsi.data as { contactId: string; queueId: string };

  // Erro de escrita nao pode passar em branco: a fila vira 'failed' com o motivo
  // guardado e a resposta sai 500 para o retry do cliente agir.
  const markFailed = async (internal: string): Promise<Response> => {
    await supabase.from('social_sync_queue')
      .update({ status: 'failed', error_log: internal.slice(0, MAX_ERROR_LENGTH), last_attempt: new Date().toISOString() })
      .eq('id', queueId);
    console.error('sync-social-interests failed:', internal);
    return jsonError(CLIENT_ERROR, 500, req);
  };

  try {
    await supabase.from('social_sync_queue')
      .update({ status: 'processing', last_attempt: new Date().toISOString() })
      .eq('id', queueId);

    const [contactResult, interactionsResult, analysisResult] = await Promise.all([
      supabase.from('contacts').select('id, user_id').eq('id', contactId).maybeSingle(),
      supabase.from('interactions')
        .select('conteudo, content, assunto, resumo')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(MAX_INTERACTIONS),
      supabase.from('social_behavior_analysis')
        .select('id, interests, keywords')
        .eq('contact_id', contactId)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (contactResult.error) return await markFailed(`Falha ao ler o contato: ${contactResult.error.message}`);
    if (!contactResult.data) return await markFailed('Contato nao encontrado');
    if (interactionsResult.error) return await markFailed(`Falha ao ler as interacoes: ${interactionsResult.error.message}`);
    if (analysisResult.error) return await markFailed(`Falha ao ler a analise atual: ${analysisResult.error.message}`);

    const texts = ((interactionsResult.data ?? []) as InteractionTextRow[])
      .map(interactionText)
      .filter((text) => text.length > 0);

    const previous = analysisResult.data as { id: string; interests: string[] | null; keywords: string[] | null } | null;
    const interests = mergeUnique(previous?.interests, deriveInterests(texts));
    const keywords = mergeUnique(previous?.keywords, deriveKeywords(texts));

    const analysisWrite = previous
      ? await supabase.from('social_behavior_analysis').update({ interests, keywords }).eq('id', previous.id)
      : await supabase.from('social_behavior_analysis').insert({
          contact_id: contactId,
          user_id: contactResult.data.user_id,
          interests,
          keywords,
        });
    if (analysisWrite.error) return await markFailed(`Falha ao gravar a analise: ${analysisWrite.error.message}`);

    const auditWrite = await supabase.from('psychographic_audit_log').insert({
      contact_id: contactId,
      changed_by: contactResult.data.user_id,
      change_type: previous ? 'refresh' : 'create',
      previous_values: previous ? { interests: previous.interests ?? [], keywords: previous.keywords ?? [] } : {},
      new_values: { interests, keywords, source_interactions: texts.length },
      changed_fields: ['interests', 'keywords'],
    });
    if (auditWrite.error) return await markFailed(`Falha ao gravar a auditoria: ${auditWrite.error.message}`);

    await supabase.from('social_sync_queue')
      .update({ status: 'completed', error_log: null, last_attempt: new Date().toISOString() })
      .eq('id', queueId);

    // Regeracao de ofertas e caminho nao critico: nao bloqueia a resposta.
    supabase.functions.invoke('generate-offer-suggestions', { body: { contactId } })
      .catch((err) => console.error('Error triggering offer regeneration:', err));

    return jsonOk({
      success: true,
      sourceInteractions: texts.length,
      interests: interests.length,
      keywords: keywords.length,
    }, req);
  } catch (error) {
    return await markFailed(error instanceof Error ? error.message : 'Erro inesperado');
  }
});