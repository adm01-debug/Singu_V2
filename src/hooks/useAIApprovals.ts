import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface AIApproval {
  id: string;
  contact_id: string;
  user_id: string;
  content: string;
  channel: string;
  status: 'pending' | 'approved' | 'rejected';
  scheduled_at: string | null;
  created_at: string;
  contact_name?: string;
}

export function useAIApprovals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['ai-approvals'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_up_approvals_v2' as any)
        .select(`
          *,
          contacts:contact_id (first_name, last_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        contact_name: item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}` : 'Contato Desconhecido'
      })) as AIApproval[];
    }
  });

  const updateApproval = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('follow_up_approvals_v2' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return { id, status };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ai-approvals'] });
      toast.success(data.status === 'approved' ? 'Follow-up aprovado para envio!' : 'Follow-up rejeitado.');
    },
    onError: (err) => {
      toast.error('Erro ao processar aprovação.');
      console.error(err);
    }
  });

  return { approvals, isLoading, updateApproval };
}
