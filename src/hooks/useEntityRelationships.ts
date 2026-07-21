import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type EntityType = 'company' | 'contact';
export type EntityRelationshipRole =
  | 'buyer' | 'manager' | 'owner' | 'decision_maker' | 'influencer'
  | 'user' | 'sponsor' | 'partner' | 'supplier'
  | 'subsidiary' | 'parent' | 'employee_of' | 'other';

export const ROLE_LABELS: Record<EntityRelationshipRole, string> = {
  buyer: 'Comprador',
  manager: 'Gerente',
  owner: 'Proprietário',
  decision_maker: 'Decisor',
  influencer: 'Influenciador',
  user: 'Usuário',
  sponsor: 'Patrocinador',
  partner: 'Parceiro',
  supplier: 'Fornecedor',
  subsidiary: 'Filial',
  parent: 'Matriz',
  employee_of: 'Funcionário',
  other: 'Outro',
};

export interface EntityRelationship {
  id: string;
  from_type: EntityType;
  from_id: string;
  to_type: EntityType;
  to_id: string;
  role: EntityRelationshipRole;
  is_primary: boolean;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface NewEntityRelationship {
  from_type: EntityType;
  from_id: string;
  to_type: EntityType;
  to_id: string;
  role: EntityRelationshipRole;
  is_primary?: boolean;
  started_at?: string | null;
  ended_at?: string | null;
  notes?: string | null;
}

function key(entityType?: EntityType, entityId?: string) {
  return ['entity-relationships', entityType ?? 'all', entityId ?? 'all'] as const;
}

export function useEntityRelationships(entityType?: EntityType, entityId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...key(entityType, entityId), user?.id],
    enabled: !!user && (!entityType || !!entityId),
    staleTime: 30_000,
    queryFn: async (): Promise<EntityRelationship[]> => {
      let q = supabase
        .from('entity_relationships')
        .select('*')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (entityType && entityId) {
        q = q.or(
          `and(from_type.eq.${entityType},from_id.eq.${entityId}),and(to_type.eq.${entityType},to_id.eq.${entityId})`
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EntityRelationship[];
    },
  });
}

export function useCreateEntityRelationship() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: NewEntityRelationship) => {
      if (!user?.id) throw new Error('Não autenticado');
      const payload = { ...input, created_by: user.id };
      const { data, error } = await supabase.from('entity_relationships').insert(payload).select('*').single();
      if (error) throw error;
      return data as EntityRelationship;
    },
    onSuccess: () => {
      toast.success('Vínculo criado');
      qc.invalidateQueries({ queryKey: ['entity-relationships'] });
    },
    onError: (e: Error) => toast.error(`Falha ao criar vínculo: ${e.message}`),
  });
}

export function useDeleteEntityRelationship() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('entity_relationships').delete().eq('created_by', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vínculo removido');
      qc.invalidateQueries({ queryKey: ['entity-relationships'] });
    },
    onError: (e: Error) => toast.error(`Falha ao remover vínculo: ${e.message}`),
  });
}