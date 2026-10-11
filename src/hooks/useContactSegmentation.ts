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
}

type FlattenedContact = RawContactRow & ContactBehaviorRow;

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
 ] satisfies Array<{ key: keyof FlattenedContact; label: string; type: string; options?: string[] }>;

export function useContactSegmentation() {
  const { user } = useAuth();
  const [segment, setSegment] = useState<SegmentDefinition>({ name: '', filters: [], logic: 'and' });

   const { data: allContacts = [] } = useQuery({
     queryKey: ['contacts-for-segmentation', user?.id],
     enabled: !!user,
     queryFn: async () => {
       if (!user) return [];
       
       // Resolver os perfis separadamente evita inferência recursiva nas relações canônicas.
       const { data, error } = await supabase
         .from('contacts')
         .select('id, first_name, last_name, email, whatsapp, phone, relationship_score, sentiment, relationship_stage, tags, company_id, birthday')
         .eq('user_id', user.id);

       if (error) {
         throw error;
       }
       
       if (!data?.length) return [];
       const byContact = new Map<string | null, ContactBehaviorRow>();
       for (let offset = 0; offset < data.length; offset += 100) {
         const { data: behaviors, error: behaviorError } = await supabase.from('contact_behavior')
           .select('contact_id, disc_primary, vak_primary, motivation_primary, preferred_channel, formality_level')
           .in('contact_id', data.slice(offset, offset + 100).map(contact => contact.id));
         if (behaviorError) throw behaviorError;
         for (const behavior of behaviors ?? []) byContact.set(behavior.contact_id, behavior);
       }
       return data.map((c): FlattenedContact => {
         const behavior = byContact.get(c.id);
         return {
           ...c,
           disc_primary: behavior?.disc_primary ?? null,
           vak_primary: behavior?.vak_primary ?? null,
           motivation_primary: behavior?.motivation_primary ?? null,
           preferred_channel: behavior?.preferred_channel ?? null,
           formality_level: behavior?.formality_level ?? null,
         };
       });
     },
     staleTime: 5 * 60_000,
     refetchOnWindowFocus: false,
   });

  const matchesFilter = useCallback((contact: FlattenedContact, filter: SegmentFilter): boolean => {
    const field = AVAILABLE_FIELDS.find(item => item.key === filter.field);
    if (!field) throw new Error(`Campo de segmentação inválido: ${filter.field}`);
    const val = contact[field.key];
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
