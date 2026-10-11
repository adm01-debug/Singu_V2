import { supabase } from '@/integrations/supabase/client';
import { mapCompany, type Company } from '@/hooks/useCompanies';
import { fetchCompanyRelationshipScores } from './relationshipScores';

const PAGE_SIZE = 500;

export async function fetchMapCompanies(userId: string) {
  if (!userId) throw new Error('Usuário não autenticado');
  const companies: Company[] = [];
  let cursor: string | undefined;
  for (;;) {
    let query = supabase.from('companies')
      .select('id,nome_crm,nome_fantasia,razao_social,ramo_atividade,status,cnpj,website,extra_data_rf,version,company_addresses(id,is_primary,logradouro,numero,cidade,estado,latitude,longitude),company_emails(id,is_primary,email),company_phones(id,is_primary,numero)')
      .eq('user_id', userId).is('deleted_at', null).order('id', { ascending: true }).limit(PAGE_SIZE);
    if (cursor) query = query.gt('id', cursor);
    const { data, error } = await query;
    if (error) throw error;
    if (!data) throw new Error('Resposta inválida ao consultar empresas');
    companies.push(...data.map(mapCompany));
    if (data.length < PAGE_SIZE) break;
    const nextCursor = data[data.length - 1].id;
    if (cursor && nextCursor <= cursor) throw new Error('A paginação das empresas não avançou');
    cursor = nextCursor;
  }
  const scores = await fetchCompanyRelationshipScores(companies.map(company => company.id), userId);
  return companies.map(company => ({ ...company, relationship_score: scores.get(company.id) ?? null }));
}
