import { supabase } from '@/integrations/supabase/client';

export interface BehavioralAuditLog {
  id: string;
  timestamp: string;
  user_email?: string;
  change_source?: string;
  field_name?: string;
  old_value?: unknown;
  new_value?: unknown;
  reason?: string;
  analysis_type?: string;
  analyzed_text?: string;
  is_validated?: boolean;
  user_feedback?: string;
}

export async function fetchContactBehaviorAudit(contactId: string, userId: string): Promise<BehavioralAuditLog[]> {
  const [changes, vak, metaprograms] = await Promise.all([
    supabase.from('crm_relationship_audit_logs')
      .select('id, created_at, change_source, field_name, old_value, new_value, reason')
      .eq('contact_id', contactId).eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(500),
    supabase.from('vak_analysis_history')
      .select('id, analyzed_at, created_at, analysis_source, analyzed_text, primary_modality, profile_summary, is_validated, user_feedback')
      .eq('contact_id', contactId).eq('user_id', userId)
      .order('analyzed_at', { ascending: false }).limit(500),
    supabase.from('metaprogram_analysis')
      .select('id, created_at, analyzed_text, is_validated, user_feedback')
      .eq('contact_id', contactId).eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(500),
  ]);
  for (const result of [changes, vak, metaprograms]) {
    if (result.error) throw result.error;
    if (!result.data) throw new Error('Resposta inválida ao carregar auditoria comportamental.');
  }
  return [
    ...(changes.data ?? []).map((row): BehavioralAuditLog => ({
      id: row.id, timestamp: row.created_at, change_source: row.change_source,
      field_name: row.field_name, old_value: row.old_value, new_value: row.new_value,
      reason: row.reason ?? undefined,
    })),
    ...(vak.data ?? []).map((row): BehavioralAuditLog => ({
      id: row.id, timestamp: row.analyzed_at ?? row.created_at, analysis_type: 'vak',
      change_source: row.analysis_source ?? undefined, analyzed_text: row.analyzed_text ?? undefined,
      new_value: row.primary_modality, reason: row.profile_summary ?? 'Análise VAK',
      is_validated: row.is_validated ?? false, user_feedback: row.user_feedback ?? undefined,
    })),
    ...(metaprograms.data ?? []).map((row): BehavioralAuditLog => ({
      id: row.id, timestamp: row.created_at, analysis_type: 'metaprogram',
      analyzed_text: row.analyzed_text ?? undefined, reason: 'Análise de metaprogramas',
      is_validated: row.is_validated ?? false, user_feedback: row.user_feedback ?? undefined,
    })),
  ].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}
