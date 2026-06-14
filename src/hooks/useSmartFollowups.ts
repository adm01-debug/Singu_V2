import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { parseISO } from 'date-fns';
import { useCreateTask } from './useTasks';

export interface SmartReminder {
  id: string;
  contact_id: string;
  contact_name: string;
  type: 'follow_up' | 'inactivity' | 'birthday' | 'custom';
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
  suggested_action: string;
}

export function useSmartFollowups() {
  const { user } = useAuth();
  const createTask = useCreateTask();

  // Buscar lembretes inteligentes
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['smart-reminders'],
    enabled: !!user,
    queryFn: async () => {
      // Usamos a tipagem do Database para garantir que as colunas existem
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, relationship_score, relationship_stage')
        .limit(100);
      
      if (error) throw error;

      // Como o linter reclamou de 'last_interaction_at' no hook anterior, 
      // vou assumir que essa coluna pode estar faltando ou ter outro nome.
      // Vou buscar a data da última interação da tabela de interações de forma otimizada.
      
      const { data: lastInteractions, error: intError } = await supabase
        .from('interactions')
        .select('contact_id, created_at')
        .order('created_at', { ascending: false });

      if (intError) throw intError;

      const latestInteractionMap = new Map<string, string>();
      lastInteractions?.forEach(i => {
        if (i.contact_id && !latestInteractionMap.has(i.contact_id)) {
          latestInteractionMap.set(i.contact_id, i.created_at);
        }
      });

      const results: SmartReminder[] = [];
      const now = new Date();

      contacts?.forEach(c => {
        const lastInteractionIso = latestInteractionMap.get(c.id);
        const lastDate = lastInteractionIso ? parseISO(lastInteractionIso) : new Date(0);
        const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Regra 1: Inatividade prolongada em contatos quentes
        if (c.relationship_score && c.relationship_score > 70 && daysSince > 15) {
          results.push({
            id: `inactivity-${c.id}`,
            contact_id: c.id,
            contact_name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            type: 'inactivity',
            due_date: new Date().toISOString(),
            priority: 'high',
            reason: `Sem contato há ${daysSince} dias. Relacionamento forte em risco.`,
            suggested_action: 'Enviar mensagem rápida no WhatsApp'
          });
        }

        // Regra 2: Follow-up padrão para negociações paradas
        if (c.relationship_stage === 'negotiation' && daysSince > 3) {
          results.push({
            id: `followup-${c.id}`,
            contact_id: c.id,
            contact_name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            type: 'follow_up',
            due_date: new Date().toISOString(),
            priority: 'medium',
            reason: 'Negociação ativa sem movimentação recente.',
            suggested_action: 'Agendar call de follow-up'
          });
        }
      });

      return results;
    }
  });

  // Agendar lembrete (usa o hook useCreateTask existente)
  const scheduleReminder = useMutation({
    mutationFn: async ({ contactId, date, title, notes }: { contactId: string, date: string, title: string, notes: string }) => {
      return createTask.mutateAsync({
        contact_id: contactId,
        title,
        description: notes,
        due_date: date,
        status: 'pending',
        priority: 'medium'
      });
    },
    onSuccess: () => {
      // Feedback já é dado pelo useCreateTask
    }
  });

  return {
    reminders,
    isLoading,
    scheduleReminder
  };
}
