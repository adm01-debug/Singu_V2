import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { startOfDay, addDays, isPast, parseISO } from 'date-fns';

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
  const queryClient = useQueryClient();

  // Buscar lembretes inteligentes (simulado via lógica local baseada em interações e contatos)
  // No futuro, isso pode vir de uma view SQL ou RPC dedicada
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['smart-reminders'],
    enabled: !!user,
    queryFn: async () => {
      // Exemplo de busca: buscamos contatos com score alto mas sem interação recente
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, last_interaction_at, relationship_score, relationship_stage')
        .limit(100);
      
      if (error) throw error;

      const results: SmartReminder[] = [];
      const now = new Date();

      contacts.forEach(c => {
        const lastDate = c.last_interaction_at ? parseISO(c.last_interaction_at) : new Date(0);
        const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Regra 1: Inatividade prolongada em contatos quentes
        if (c.relationship_score && c.relationship_score > 70 && daysSince > 15) {
          results.push({
            id: `inactivity-${c.id}`,
            contact_id: c.id,
            contact_name: `${c.first_name} ${c.last_name}`,
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
            contact_name: `${c.first_name} ${c.last_name}`,
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

  // Agendar lembrete (cria uma tarefa no sistema)
  const scheduleReminder = useMutation({
    mutationFn: async ({ contactId, date, title, notes }: { contactId: string, date: string, title: string, notes: string }) => {
      if (!user) throw new Error('Auth required');
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          title,
          description: notes,
          due_date: date,
          status: 'pending',
          priority: 'medium'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lembrete agendado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  return {
    reminders,
    isLoading,
    scheduleReminder
  };
}
