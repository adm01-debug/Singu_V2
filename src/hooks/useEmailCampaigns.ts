import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface EmailCampaign {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  content_html: string | null;
  content_text: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  segment_filter: Record<string, unknown>;
  tags: string[];
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  created_at: string;
}

export function useEmailCampaigns() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['email-campaigns', user?.id];

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as EmailCampaign[];
    },
    staleTime: 2 * 60_000,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<EmailCampaign>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase.from('email_campaigns')
        .insert({ ...input, user_id: user.id } as never)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao criar campanha");
      return data as EmailCampaign;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Campanha criada!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailCampaign> & { id: string }) => {
      const { error } = await supabase.from('email_campaigns').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Campanha atualizada!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('email_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Campanha removida!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Materializa destinatários a partir dos contatos do usuário com email válido,
   * marca a campanha como "sending" e depois "sent". Simula o envio (não dispara emails reais —
   * a entrega real é responsabilidade da edge function de email já existente).
   */
  const sendCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!user) throw new Error('Não autenticado');

      // Buscar contatos elegíveis (com email)
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .eq('user_id', user.id)
        .not('email', 'is', null);
      if (contactsError) throw contactsError;

      const eligible = (contacts ?? []).filter(c => c.email && c.email.includes('@'));
      if (eligible.length === 0) throw new Error('Nenhum contato com email válido foi encontrado');

      // Marcar como enviando + buscar destinatários já existentes em paralelo
      const [, { data: existing }] = await Promise.all([
        supabase.from('email_campaigns').update({ status: 'sending' } as never).eq('id', campaignId),
        supabase.from('campaign_recipients').select('contact_id').eq('campaign_id', campaignId),
      ]);
      const existingIds = new Set((existing ?? []).map(r => r.contact_id));

      const toInsert = eligible
        .filter(c => !existingIds.has(c.id))
        .map(c => ({
          campaign_id: campaignId,
          contact_id: c.id,
          email: c.email!,
          status: 'sent',
          sent_at: new Date().toISOString(),
        }));

      const [{ error: insError }, { error: updError }] = await Promise.all([
        toInsert.length > 0
          ? supabase.from('campaign_recipients').insert(toInsert)
          : Promise.resolve({ error: null }),
        supabase.from('email_campaigns').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          total_recipients: eligible.length,
        } as never).eq('id', campaignId),
      ]);
      if (insError) throw insError;
      if (updError) throw updError;

      return { recipientsCount: eligible.length, newlyAdded: toInsert.length };
    },
    onSuccess: ({ recipientsCount, newlyAdded }) => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['campaign-recipients'] });
      toast.success(`Campanha enviada para ${recipientsCount} destinatários (${newlyAdded} novos)`);
    },
    onError: (e: Error) => {
      toast.error(`Falha ao enviar: ${e.message}`);
    },
  });

  const stats = {
    total: campaigns.length,
    drafts: campaigns.filter(c => c.status === 'draft').length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    totalRecipients: campaigns.reduce((s, c) => s + c.total_recipients, 0),
    totalOpened: campaigns.reduce((s, c) => s + c.total_opened, 0),
    avgOpenRate: campaigns.filter(c => c.total_recipients > 0).length > 0
      ? Math.round(campaigns.reduce((s, c) => s + (c.total_recipients > 0 ? (c.total_opened / c.total_recipients) * 100 : 0), 0) / (campaigns.filter(c => c.total_recipients > 0).length || 1))
      : 0,
  };

  return { campaigns, isLoading, create, update, remove, sendCampaign, stats };
}
