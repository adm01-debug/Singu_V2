import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'url' | 'email' | 'phone';
export type EntityType = 'contact' | 'company' | 'deal';

export interface CustomField {
  id: string;
  user_id: string;
  entity_type: EntityType;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  field_options: string[];
  is_required: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;
  custom_field_id: string;
  entity_id: string;
  value: string | null;
}

export function useCustomFields(entityType: EntityType) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['custom-fields', entityType, user?.id];

  const { data: fields = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .order('display_order');
      if (error) throw error;
      return (data || []) as CustomField[];
    },
    staleTime: 5 * 60_000,
  });

  const createField = useMutation({
    mutationFn: async (input: Omit<CustomField, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('custom_fields')
        .insert({ ...input, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao criar campo personalizado');
      return data as CustomField;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success('Campo personalizado criado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateField = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomField> & { id: string }) => {
      const { error } = await supabase
        .from('custom_fields')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success('Campo atualizado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteField = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success('Campo removido!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { fields, isLoading, createField, updateField, deleteField };
}

export function useCustomFieldValues(entityType: EntityType, entityId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['custom-field-values', entityType, entityId];

  const { data: values = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!entityId) return [];
      if (!user) return [];

      const { data: fields } = await supabase
        .from('custom_fields')
        .select('id')
        .eq('user_id', user.id)
        .eq('entity_type', entityType);

      if (!fields?.length) return [];

      const fieldIds = fields.map(f => f.id);
      const { data, error } = await supabase
        .from('custom_field_values')
        .select('*')
        .eq('entity_id', entityId)
        .in('custom_field_id', fieldIds);

      if (error) throw error;
      return (data || []) as CustomFieldValue[];
    },
    enabled: !!entityId,
    staleTime: 5 * 60_000,
  });

  const saveValue = useMutation({
    mutationFn: async ({ fieldId, value }: { fieldId: string; value: string | null }) => {
      if (!entityId) throw new Error('Entity ID required');
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('custom_field_values')
        .upsert(
          { custom_field_id: fieldId, entity_id: entityId, user_id: user.id, value },
          { onConflict: 'custom_field_id,entity_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  return { values, isLoading, saveValue };
}
