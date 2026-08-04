import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export type SemanticEntity = 'contacts' | 'companies' | 'interactions' | 'products';

export interface SemanticContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  company_id: string | null;
  similarity: number;
}

export interface SemanticCompanyRow {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  state: string | null;
  similarity: number;
}

export interface SemanticInteractionRow {
  id: string;
  title: string;
  type: string;
  created_at: string;
  contact_id: string | null;
  similarity: number;
}

export interface SemanticProductRow {
  id: string;
  external_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  price: number | null;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface SemanticSearchResults {
  contacts: SemanticContactRow[];
  companies: SemanticCompanyRow[];
  interactions: SemanticInteractionRow[];
  products: SemanticProductRow[];
}

const EMPTY: SemanticSearchResults = {
  contacts: [],
  companies: [],
  interactions: [],
  products: [],
};

interface SearchOpts {
  entities?: SemanticEntity[];
  limit?: number;
  useAI?: boolean;
  silent?: boolean;
}

export function useSemanticSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SemanticSearchResults>(EMPTY);
  const [cached, setCached] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (query: string, opts: SearchOpts = {}) => {
      if (!query || query.trim().length < 2) {
        setResults(EMPTY);
        setError(null);
        return EMPTY;
      }

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke('semantic-search', {
          body: {
            query: query.trim(),
            entities: opts.entities ?? ['contacts', 'companies', 'interactions'],
            limit: opts.limit ?? 8,
            useAI: opts.useAI ?? true,
          },
        });
        if (ctrl.signal.aborted) return EMPTY;
        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        const merged: SemanticSearchResults = { ...EMPTY, ...(data?.results ?? {}) };
        setResults(merged);
        setCached(Boolean(data?.cached));
        setVariations(data?.variations ?? []);
        return merged;
      } catch (e) {
        if (ctrl.signal.aborted) return EMPTY;
        const msg = e instanceof Error ? e.message : 'Erro na busca semântica';
        logger.error('Semantic search failed', e);
        setError(msg);
        if (!opts.silent) toast.error(msg);
        return EMPTY;
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setResults(EMPTY);
    setCached(false);
    setVariations([]);
    setError(null);
  }, []);

  return { search, results, loading, cached, variations, error, reset };
}
