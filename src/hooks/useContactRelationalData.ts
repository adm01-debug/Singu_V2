import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

// ─── External DB Types ────────────────────────────────────────

export interface ExternalPhone {
  id: string;
  contact_id: string;
  phone_type: string;
  numero: string;
  numero_normalizado?: string;
  numero_e164?: string;
  is_primary?: boolean;
  is_whatsapp?: boolean;
  is_verified?: boolean;
  confiabilidade?: number;
  contexto?: string;
  fonte?: string;
  observacao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalEmail {
  id: string;
  contact_id: string;
  email_type: string;
  email: string;
  email_normalizado?: string;
  is_primary?: boolean;
  is_verified?: boolean;
  confiabilidade?: number;
  contexto?: string;
  fonte?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalAddress {
  id: string;
  contact_id: string;
  tipo?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  pais?: string;
  cidade_ibge?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  google_place_id?: string;
  tipo_logradouro?: string;
  ponto_referencia?: string;
  is_primary?: boolean;
  fonte?: string;
  origem?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalSocialMedia {
  id: string;
  contact_id: string;
  plataforma: string;
  handle?: string;
  url?: string;
  nome_perfil?: string;
  is_verified?: boolean;
  is_active?: boolean;
  confiabilidade?: number;
  contexto?: string;
  fonte?: string;
  origem?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContactRelationalData {
  phones: ExternalPhone[];
  emails: ExternalEmail[];
  addresses: ExternalAddress[];
  socials: ExternalSocialMedia[];
  relatives: Tables<'contact_relatives'>[];
  cadence: Tables<'contact_cadence'> | null;
  preferences: Tables<'contact_preferences'> | null;
  commPreferences: Tables<'communication_preferences'> | null;
  timeAnalysis: Tables<'contact_time_analysis'>[];
}

// ─── Main Hook ────────────────────────────────────────────────

export function useContactRelationalData(contactId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contact-relational-data', contactId, user?.id],
    queryFn: async (): Promise<ContactRelationalData> => {
      if (!contactId) throw new Error('No contact ID');

      const contactFilter = [{ type: 'eq' as const, column: 'contact_id', value: contactId }];

      const [phonesRes, emailsRes, addrRes, socialRes] = await Promise.all([
        queryExternalData<ExternalPhone>({ table: 'contact_phones', filters: contactFilter, order: { column: 'is_primary', ascending: false }, range: { from: 0, to: 49 } }),
        queryExternalData<ExternalEmail>({ table: 'contact_emails', filters: contactFilter, order: { column: 'is_primary', ascending: false }, range: { from: 0, to: 49 } }),
        queryExternalData<ExternalAddress>({ table: 'contact_addresses', filters: contactFilter, range: { from: 0, to: 49 } }),
        queryExternalData<ExternalSocialMedia>({ table: 'contact_social_media', filters: contactFilter, range: { from: 0, to: 49 } }),
      ]);

      let relatives: Tables<'contact_relatives'>[] = [];
      let cadence: Tables<'contact_cadence'> | null = null;
      let preferences: Tables<'contact_preferences'> | null = null;
      let commPreferences: Tables<'communication_preferences'> | null = null;
      let timeAnalysis: Tables<'contact_time_analysis'>[] = [];

      if (user) {
        const [relRes, cadRes, prefRes, commPrefRes, timeRes] = await Promise.all([
          supabase.from('contact_relatives').select('*').eq('contact_id', contactId).eq('user_id', user.id).order('name'),
          supabase.from('contact_cadence').select('*').eq('contact_id', contactId).eq('user_id', user.id).maybeSingle(),
          supabase.from('contact_preferences').select('*').eq('contact_id', contactId).eq('user_id', user.id).maybeSingle(),
          supabase.from('communication_preferences').select('*').eq('contact_id', contactId).eq('user_id', user.id).maybeSingle(),
          supabase.from('contact_time_analysis').select('*').eq('contact_id', contactId).eq('user_id', user.id).limit(100),
        ]);
        relatives = relRes.data || [];
        cadence = cadRes.data;
        preferences = prefRes.data;
        commPreferences = commPrefRes.data;
        timeAnalysis = timeRes.data || [];
      }

      return {
        phones: phonesRes.data || [],
        emails: emailsRes.data || [],
        addresses: addrRes.data || [],
        socials: socialRes.data || [],
        relatives,
        cadence,
        preferences,
        commPreferences,
        timeAnalysis,
      };
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
  });
}

// ─── Relatives CRUD Mutations ─────────────────────────────────

export function useRelativeMutations(contactId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['contact-relational-data', contactId] });
  };

  const addRelative = useMutation({
    mutationFn: async (data: {
      name: string;
      relationship_type: string;
      age?: number;
      birthday?: string;
      phone?: string;
      email?: string;
      occupation?: string;
      company?: string;
      notes?: string;
      is_decision_influencer?: boolean;
    }) => {
      if (!user || !contactId) throw new Error('Missing user or contact');
      const { error } = await supabase.from('contact_relatives').insert({
        ...data,
        contact_id: contactId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Relacionado adicionado');
      invalidate();
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const updateRelative = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tables<'contact_relatives'>> }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('contact_relatives').update(updates).eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-relational-data', contactId] });
    },
    onError: (e) => toast.error(`Erro ao atualizar: ${e.message}`),
  });

  const deleteRelative = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('contact_relatives').delete().eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Relacionado removido');
      invalidate();
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  return { addRelative, updateRelative, deleteRelative };
}

// ─── Cadence Upsert Mutation ──────────────────────────────────

export function useCadenceMutation(contactId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { cadence_days: number; priority: string; auto_remind: boolean; notes: string | null }) => {
      if (!user || !contactId) throw new Error('Missing user or contact');
      const { error } = await supabase.from('contact_cadence').upsert({
        ...data,
        contact_id: contactId,
        user_id: user.id,
      }, { onConflict: 'contact_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cadência salva');
      queryClient.invalidateQueries({ queryKey: ['contact-relational-data', contactId] });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}

// ─── Contact Preferences Upsert Mutation ──────────────────────

export function usePreferencesMutation(contactId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      preferred_channel?: string | null;
      preferred_days?: string[] | null;
      preferred_times?: string[] | null;
      avoid_days?: string[] | null;
      avoid_times?: string[] | null;
      communication_tips?: string | null;
      personal_notes?: string | null;
      restrictions?: string | null;
    }) => {
      if (!user || !contactId) throw new Error('Missing user or contact');
      const { error } = await supabase.from('contact_preferences').upsert({
        ...data,
        contact_id: contactId,
        user_id: user.id,
      }, { onConflict: 'contact_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preferências salvas');
      queryClient.invalidateQueries({ queryKey: ['contact-relational-data', contactId] });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}
