import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export type ConvEntity = 'contacts' | 'companies' | 'deals' | 'interactions';

export interface ConvFilters {
  cidade?: string;
  estado?: string;
  dias_sem_interacao?: number;
  tag?: string;
  relationship_stage?: string;
  min_score?: number;
  industry?: string;
  is_customer?: boolean;
  stage?: string;
  valor_min?: number;
  valor_max?: number;
  dias_max_idade?: number;
  tipo?: string;
  sentiment?: string;
  dias_recentes?: number;
}

export interface ConvResultItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  entity: ConvEntity;
}

export interface ConvInterpretation {
  intent: string | null;
  entity: ConvEntity | null;
  filters: ConvFilters;
  summary: string;
  cached: boolean;
}

const BASE_HISTORY_KEY = 'crm-conversational-history';
const MAX_HISTORY = 10;

function loadHistory(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

function saveHistory(storageKey: string, items: string[]) {
  try { localStorage.setItem(storageKey, JSON.stringify(items.slice(0, MAX_HISTORY))); } catch { /* noop */ }
}

function pushHistory(storageKey: string, q: string) {
  const cur = loadHistory(storageKey).filter(h => h.toLowerCase() !== q.toLowerCase());
  saveHistory(storageKey, [q, ...cur]);
}

interface InteractionRow {
  id: string;
  title: string | null;
  type: string;
  sentiment: string | null;
  created_at: string;
}

async function executeFilters(
  userId: string,
  entity: ConvEntity,
  filters: ConvFilters,
): Promise<ConvResultItem[]> {
  const limit = 25;
  const byLocation = !!(filters.cidade || filters.estado);

  if (entity === 'contacts') {
    const projection: string = 'id, first_name, last_name, email, role_title, relationship_score'
      + (byLocation ? ', companies!inner(company_addresses!inner(id))' : '');
    let q = supabase
      .from('contacts')
      .select(projection)
      .eq('user_id', userId)
      .order('relationship_score', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (byLocation) q = q.eq('companies.user_id', userId);
    if (filters.cidade) q = q.ilike('companies.company_addresses.cidade', `%${filters.cidade}%`);
    if (filters.estado) q = q.ilike('companies.company_addresses.estado', filters.estado);
    if (filters.tag) q = q.contains('tags', [filters.tag]);
    if (filters.relationship_stage) q = q.eq('relationship_stage', filters.relationship_stage);
    if (typeof filters.min_score === 'number') q = q.gte('relationship_score', filters.min_score);
    if (typeof filters.dias_sem_interacao === 'number') {
      const cutoff = new Date(Date.now() - filters.dias_sem_interacao * 86_400_000).toISOString();
      q = q.lt('updated_at', cutoff);
    }
    const { data, error } = await q;
    if (error) throw error;
    return z.array(z.object({ id: z.string(), first_name: z.string(), last_name: z.string(),
      email: z.string().nullable(), role_title: z.string().nullable(), relationship_score: z.number().nullable(),
    })).parse(data ?? []).map(r => ({
      id: r.id,
      entity: 'contacts',
      title: `${r.first_name} ${r.last_name}`.trim() || 'Contato',
      subtitle: r.role_title || r.email || undefined,
      meta: r.relationship_score != null ? `Score ${r.relationship_score}` : undefined,
    }));
  }

  if (entity === 'companies') {
    const projection: string = 'id, nome_crm, industry, is_customer, tags'
      + (byLocation ? ', company_addresses!inner(id)' : '');
    let q = supabase
      .from('companies')
      .select(projection)
      .eq('user_id', userId)
      .limit(limit);
    if (filters.cidade) q = q.ilike('company_addresses.cidade', `%${filters.cidade}%`);
    if (filters.estado) q = q.ilike('company_addresses.estado', filters.estado);
    if (filters.industry) q = q.ilike('industry', `%${filters.industry}%`);
    if (typeof filters.is_customer === 'boolean') q = q.eq('is_customer', filters.is_customer);
    if (filters.tag) q = q.contains('tags', [filters.tag]);
    const { data, error } = await q;
    if (error) throw error;
    const rows = z.array(z.object({ id: z.string(), nome_crm: z.string(), industry: z.string().nullable() })).parse(data ?? []);
    if (!rows.length) return [];
    const { data: addresses, error: addressError } = await supabase.from('company_addresses')
      .select('company_id, cidade, estado, is_primary').in('company_id', rows.map(r => r.id))
      .order('is_primary', { ascending: false, nullsFirst: false });
    if (addressError) throw addressError;
    return rows.map(r => {
      const address = addresses?.find(a => a.company_id === r.id);
      return {
        id: r.id,
        entity: 'companies',
        title: r.nome_crm,
        subtitle: r.industry || undefined,
        meta: address?.cidade && address.estado ? `${address.cidade}, ${address.estado}` : undefined,
      } satisfies ConvResultItem;
    });
  }

  if (entity === 'deals') {
    // Deals vivem em banco externo (vw_deals_full). Devolvemos interpretação
    // sem rows aqui — UI mostra link para o Pipeline com filtros aplicados.
    return [];
  }

  // interactions
  let q = supabase
    .from('interactions')
    .select('id, title, type, sentiment, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (filters.tipo) q = q.eq('type', filters.tipo);
  if (filters.sentiment) q = q.eq('sentiment', filters.sentiment);
  if (typeof filters.dias_recentes === 'number') {
    const cutoff = new Date(Date.now() - filters.dias_recentes * 86_400_000).toISOString();
    q = q.gte('created_at', cutoff);
  }
  const { data, error } = await q;
  if (error) throw error;
  return ((data || []) as InteractionRow[]).map(r => ({
    id: r.id,
    entity: 'interactions',
    title: r.title || 'Interação',
    subtitle: r.type,
    meta: new Date(r.created_at).toLocaleDateString('pt-BR'),
  }));
}

export function useConversationalSearch() {
  const { user } = useAuth();
  const historyKey = `${BASE_HISTORY_KEY}-${user?.id ?? 'anon'}`;
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<ConvInterpretation | null>(null);
  const [items, setItems] = useState<ConvResultItem[]>([]);
  const [history, setHistory] = useState<string[]>(() => loadHistory(historyKey));
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ask = useCallback(async (question: string, userId: string) => {
    const q = question.trim();
    if (!q || q.length < 3) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('conversational-search', {
        body: { query: q },
      });
      if (ctrl.signal.aborted) return;
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      const interp: ConvInterpretation = {
        intent: data.intent ?? null,
        entity: data.entity ?? null,
        filters: data.filters ?? {},
        summary: data.summary ?? '',
        cached: Boolean(data.cached),
      };
      setInterpretation(interp);

      if (interp.entity) {
        const rows = await executeFilters(userId, interp.entity, interp.filters);
        if (ctrl.signal.aborted) return;
        setItems(rows);
      } else {
        setItems([]);
      }

      pushHistory(historyKey, q);
      setHistory(loadHistory(historyKey));
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const msg = e instanceof Error ? e.message : 'Erro ao processar pergunta';
      logger.error('conversational search failed', e);
      setError(msg);
      toast.error(msg);
      setItems([]);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setItems([]);
    setInterpretation(null);
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    saveHistory(historyKey, []);
    setHistory([]);
  }, [historyKey]);

  return { ask, reset, clearHistory, loading, interpretation, items, history, error };
}
