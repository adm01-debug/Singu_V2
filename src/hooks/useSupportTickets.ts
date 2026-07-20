import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  contact_id: string | null;
  company_id: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  category: string;
  assigned_to: string | null;
  sla_deadline: string | null;
  resolved_at: string | null;
  first_response_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export function useSupportTickets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['support-tickets', user?.id];

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SupportTicket[];
    },
    staleTime: 2 * 60_000,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<SupportTicket>) => {
      if (!user) throw new Error('Não autenticado');
      
      const insertData = {
        ...input,
        user_id: user.id,
      };
      
      // Remove metadata fields that Supabase handles automatically
      if ('id' in insertData) delete insertData.id;
      if ('created_at' in insertData) delete insertData.created_at;
      if ('updated_at' in insertData) delete insertData.updated_at;

      const { error } = await supabase.from('support_tickets').insert(insertData as never);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Ticket criado!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupportTicket> & { id: string }) => {
      const resolved = updates.status === 'resolved' || updates.status === 'closed';
      const updateData = {
        ...updates,
        ...(resolved ? { resolved_at: new Date().toISOString() } : {})
      };
      
      if ('created_at' in updateData) delete (updateData as Record<string, unknown>).created_at;
      
      const { error } = await supabase.from('support_tickets')
        .update(updateData as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Ticket atualizado!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('support_tickets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Ticket removido!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { tickets, isLoading, create, update, remove };
}

export function useTicketComments(ticketId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['ticket-comments', ticketId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at');
      if (error) throw error;
      return (data || []) as TicketComment[];
    },
    enabled: !!ticketId,
  });

  const addComment = useMutation({
    mutationFn: async ({ content, isInternal }: { content: string; isInternal?: boolean }) => {
      if (!ticketId) throw new Error('Ticket ID required');
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('ticket_comments').insert({
        ticket_id: ticketId,
        user_id: user.id,
        content,
        is_internal: isInternal || false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast.error(e.message),
  });

  return { comments, isLoading, addComment };
}
