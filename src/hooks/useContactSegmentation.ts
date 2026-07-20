import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SegmentFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in' | 'is_null' | 'is_not_null';
  value: string;
}

export interface SegmentDefinition {
  name: string;
  filters: SegmentFilter[];
  logic: 'and' | 'or';
}

interface ContactBehaviorRow {
  disc_primary: string | null;
  vak_primary: string | null;
  motivation_primary: string | null;
  preferred_channel: string | null;
  formality_level: number | null;
}

interface RawContactRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  whatsapp: string | null;
  phone: string | null;
  relationship_score: number | null;
  sentiment: string | null;
  relationship_stage: string | null;
  tags: string[] | null;
  company_id: string | null;
  birthday: string | null;
  contact_behavior: ContactBehaviorRow[] | null;
}

type FlattenedContact = Omit<RawContactRow, 'contact_behavior'> & ContactBehaviorRow;

 const AVAILABLE_FIELDS = [
   { key: 'relationship_score', label: 'Score de Relacionamento', type: 'number' },
   { key: 'sentiment', label: 'Sentimento', type: 'select', options: ['positive', 'neutral', 'negative'] },
   { key: 'relationship_stage', label: 'Estágio', type: 'select', options: ['lead', 'prospect', 'customer', 'partner', 'churned'] },
   { key: 'tags', label: 'Tags', type: 'array' },
   { key: 'company_id', label: 'Tem Empresa', type: 'exists' },
   { key: 'email', label: 'Tem Email', type: 'exists' },
   { key: 'whatsapp', label: 'Tem WhatsApp', type: 'exists' },
   { key: 'birthday', label: 'Tem Aniversário', type: 'exists' },
   // Behavioral fields (from contact_behavior table)
   { key: 'disc_primary', label: 'DISC Primário', type: 'select', options: ['D', 'I', 'S', 'C'] },
   { key: 'vak_primary', label: 'VAK Primário', type: 'select', options: ['visual', 'auditivo', 'cinestesico'] },
   { key: 'motivation_primary', label: 'Motivação Primária', type: 'text' },
   { key: 'preferred_channel', label: 'Canal Preferido', type: 'text' },
   { key: 'formality_level', label: 'Nível de Formalidade', type: 'number' },
 ];

export function useContactSegmentation() {
  const { user } = useAuth();
  const [segment, setSegment] = useState<SegmentDefinition>({ name: '', filters: [], logic: 'and' });

   const { data: allContacts = [] } = useQuery({
     queryKey: ['contacts-for-segmentation', user?.id],
     enabled: !!user,
     queryFn: async () => {
       if (!user) return [];
       
       // Join with contact_behavior to get behavioral data
       const { data, error } = await supabase
         .from('contacts')
         .select(`
           id, first_name, last_name, email, whatsapp, phone, relationship_score, sentiment, relationship_stage, tags, company_id, birthday,
           contact_behavior (
             disc_primary, vak_primary, motivation_primary, preferred_channel, formality_level
           )
         `)
         .eq('user_id', user.id)
         .limit(1000);

       if (error) {
         throw error;
       }
       
       // Flatten the data for easier filtering
        return ((data || []) as RawContactRow[]).map((c): FlattenedContact => ({
         ...c,
         disc_primary: c.contact_behavior?.[0]?.disc_primary || null,
         vak_primary: c.contact_behavior?.[0]?.vak_primary || null,
         motivation_primary: c.contact_behavior?.[0]?.motivation_primary || null,
         preferred_channel: c.contact_behavior?.[0]?.preferred_channel || null,
         formality_level: c.contact_behavior?.[0]?.formality_level || null,
       }));
     },
     staleTime: 5 * 60_000,
   });

  const matchesFilter = useCallback((contact: FlattenedContact, filter: SegmentFilter): boolean => {
    const val = (contact as unknown as Record<string, unknown>)[filter.field];
    switch (filter.operator) {
      case 'eq': return String(val) === filter.value;
      case 'neq': return String(val) !== filter.value;
      case 'gt': return Number(val) > Number(filter.value);
      case 'lt': return Number(val) < Number(filter.value);
      case 'contains': return Array.isArray(val)
        ? val.some((v) => String(v).toLowerCase().includes(filter.value.toLowerCase()))
        : String(val ?? '').toLowerCase().includes(filter.value.toLowerCase());
      case 'in': return filter.value.split(',').map(s => s.trim()).includes(String(val));
      case 'is_null': return val === null || val === undefined || val === '';
      case 'is_not_null': return val !== null && val !== undefined && val !== '';
      default: return true;
    }
  }, []);

  const filteredContacts = useMemo(() => {
    if (segment.filters.length === 0) return allContacts;
    return allContacts.filter(contact => {
      if (segment.logic === 'and') return segment.filters.every(f => matchesFilter(contact, f));
      return segment.filters.some(f => matchesFilter(contact, f));
    });
  }, [allContacts, segment, matchesFilter]);

  const addFilter = (filter: SegmentFilter) => setSegment(s => ({ ...s, filters: [...s.filters, filter] }));
  const removeFilter = (idx: number) => setSegment(s => ({ ...s, filters: s.filters.filter((_, i) => i !== idx) }));
  const setLogic = (logic: 'and' | 'or') => setSegment(s => ({ ...s, logic }));
  const clearFilters = () => setSegment(s => ({ ...s, filters: [] }));

  return {
    segment, setSegment, addFilter, removeFilter, setLogic, clearFilters,
    filteredContacts, totalContacts: allContacts.length,
    availableFields: AVAILABLE_FIELDS,
  };
}
