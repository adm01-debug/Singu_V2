import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { detectDuplicates, type DedupRecord, type DuplicatePair } from '@/lib/fuzzyDedup';

export type DedupEntity = 'contacts' | 'companies';

interface ContactRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  company_id: string | null;
}

interface CompanyRow {
  id: string;
  name: string;
  nome_crm: string | null;
  email: string | null;
  phone: string | null;
  cnpj: string | null;
}

async function fetchContacts(userId: string): Promise<DedupRecord[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, whatsapp, company_id')
    .eq('user_id', userId)
    .limit(2000);
  if (error) throw error;
  return (data as ContactRow[] | null ?? []).map(c => ({
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
    .select('id, name, nome_crm, email, phone, cnpj')
    .eq('user_id', userId)
    .limit(2000);
  if (error) throw error;
  return (data as CompanyRow[] | null ?? []).map(c => ({
    id: c.id,
    name: c.nome_crm || c.name,
    email: c.email,
    phone: c.phone,
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
