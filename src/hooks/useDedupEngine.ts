import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { detectDuplicates, type DedupRecord, type DuplicatePair } from '@/lib/fuzzyDedup';

export type DedupEntity = 'contacts' | 'companies';

export async function fetchCompanyDedupRelations(ids: string[], userId: string) {
  const emails = new Map<string, Pick<Tables<'company_emails'>, 'email' | 'is_primary'>>();
  const phones = new Map<string, Pick<Tables<'company_phones'>, 'numero' | 'is_primary'>>();
  for (let offset = 0; offset < ids.length; offset += 100) {
    const batch = ids.slice(offset, offset + 100);
    await Promise.all([
      (async () => {
        let cursor: string | undefined;
        for (;;) {
          let query = supabase.from('company_emails')
            .select('id, company_id, email, is_primary, companies!inner(user_id)')
            .eq('companies.user_id', userId).in('company_id', batch)
            .order('id', { ascending: true }).limit(500);
          if (cursor) query = query.gt('id', cursor);
          const { data, error } = await query;
          if (error) throw error;
          if (!data) throw new Error('Resposta inválida ao consultar emails de empresas.');
          for (const row of data) {
            const current = emails.get(row.company_id);
            if (!current || (!current.is_primary && row.is_primary)) emails.set(row.company_id, row);
          }
          if (data.length < 500) break;
          const nextCursor = data[data.length - 1].id;
          if (cursor && nextCursor <= cursor) throw new Error('A paginação dos emails não avançou.');
          cursor = nextCursor;
        }
      })(),
      (async () => {
        let cursor: string | undefined;
        for (;;) {
          let query = supabase.from('company_phones')
            .select('id, company_id, numero, is_primary, companies!inner(user_id)')
            .eq('companies.user_id', userId).in('company_id', batch)
            .order('id', { ascending: true }).limit(500);
          if (cursor) query = query.gt('id', cursor);
          const { data, error } = await query;
          if (error) throw error;
          if (!data) throw new Error('Resposta inválida ao consultar telefones de empresas.');
          for (const row of data) {
            const current = phones.get(row.company_id);
            if (!current || (!current.is_primary && row.is_primary)) phones.set(row.company_id, row);
          }
          if (data.length < 500) break;
          const nextCursor = data[data.length - 1].id;
          if (cursor && nextCursor <= cursor) throw new Error('A paginação dos telefones não avançou.');
          cursor = nextCursor;
        }
      })(),
    ]);
  }
  return { emails, phones };
}

async function fetchContacts(userId: string): Promise<DedupRecord[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, whatsapp, company_id')
    .eq('user_id', userId)
    .limit(2000);
  if (error) throw error;
  return (data ?? []).map(c => ({
    id: c.id,
    name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || null,
    email: c.email,
    phone: c.phone || c.whatsapp,
    company_id: c.company_id,
  }));
}

async function fetchCompanies(userId: string): Promise<DedupRecord[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, nome_crm, cnpj')
    .eq('user_id', userId)
    .limit(2000);
  if (error) throw error;
  if (!data?.length) return [];
  const ids = data.map(c => c.id);
  const { emails, phones } = await fetchCompanyDedupRelations(ids, userId);
  return data.map(c => ({
    id: c.id,
    name: c.nome_crm,
    email: emails.get(c.id)?.email ?? null,
    phone: phones.get(c.id)?.numero ?? null,
    cnpj: c.cnpj,
  }));
}

export function useDedupEngine(entity: DedupEntity, threshold = 0.82) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['dedup-source', entity, user?.id],
    queryFn: () => (entity === 'contacts' ? fetchContacts(user!.id) : fetchCompanies(user!.id)),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const pairs: DuplicatePair[] = useMemo(() => {
    if (!query.data) return [];
    return detectDuplicates(query.data, { threshold });
  }, [query.data, threshold]);

  return {
    ...query,
    pairs,
    totalScanned: query.data?.length ?? 0,
  };
}
