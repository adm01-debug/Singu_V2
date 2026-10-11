import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const relationshipScoreSchema = z.number().int().min(0).max(100).nullable();
const PAGE_SIZE = 500;

/** Usa a medição mais recente da empresa; ausência de medição não equivale a zero. */
export async function fetchCompanyRelationshipScores(companyIds: string[], userId: string): Promise<Map<string, number | null>> {
  if (!userId) throw new Error('Usuário não autenticado');
  const scores = new Map<string, number | null>();
  const ids = [...new Set(companyIds)];
  for (let start = 0; start < ids.length; start += PAGE_SIZE) {
    const batch = ids.slice(start, start + PAGE_SIZE);
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase.from('customer_health_scores')
        .select('id, company_id, relationship_score, score_date, created_at, companies!inner(user_id)')
        .eq('companies.user_id', userId)
        .in('company_id', batch)
        .order('score_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data) throw new Error('Resposta inválida ao consultar scores de relacionamento');
      for (const row of data) {
        if (!row.company_id || !batch.includes(row.company_id)) throw new Error('Score sem vínculo com a empresa consultada');
        if (!scores.has(row.company_id)) scores.set(row.company_id, relationshipScoreSchema.parse(row.relationship_score));
      }
      if (data.length < PAGE_SIZE || batch.every(id => scores.has(id))) break;
    }
  }
  return scores;
}
