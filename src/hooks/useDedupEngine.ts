import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { detectDuplicates, type DedupRecord, type DuplicatePair } from '@/lib/fuzzyDedup';

export type DedupEntity = 'contacts' | 'companies';

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
  const [{ data: emails, error: emailError }, { data: phones, error: phoneError }] = await Promise.all([
    supabase.from('company_emails').select('company_id, email, is_primary').in('company_id', ids).order('is_primary', { ascending: false, nullsFirst: false }),
    supabase.from('company_phones').select('company_id, numero, is_primary').in('company_id', ids).order('is_primary', { ascending: false, nullsFirst: false }),
  ]);
  if (emailError) throw emailError;
  if (phoneError) throw phoneError;
  return data.map(c => ({
    id: c.id,
    name: c.nome_crm,
    email: emails?.find(email => email.company_id === c.id)?.email ?? null,
    phone: phones?.find(phone => phone.company_id === c.id)?.numero ?? null,
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
