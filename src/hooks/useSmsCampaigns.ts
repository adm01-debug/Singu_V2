import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SmsCampaign {
  id: string;
  user_id: string;
  name: string;
  message: string;
  sender_id: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed';
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_replies: number;
  total_opt_outs: number;
  cost_estimate_cents: number;
  created_at: string;
  updated_at: string;
}

export interface SmsCampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  phone: string;
  status: string;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  replied_at: string | null;
  cost_cents: number | null;
  created_at: string;
}

export interface SmsTemplate {
  id: string;
  user_id: string;
  name: string;
  body: string;
  category: string | null;
  variables: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSmsCampaignInput {
  name: string;
  message: string;
  sender_id?: string;
  scheduled_at?: string | null;
}

export function useSmsCampaigns() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['sms-campaigns', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('sms_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SmsCampaign[];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const createCampaign = useMutation({
    mutationFn: async (input: CreateSmsCampaignInput) => {
      if (!userId) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('sms_campaigns')
        .insert({ ...input, user_id: userId })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao criar campanha SMS');
      return data as SmsCampaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sms-campaigns'] });
      toast.success('Campanha SMS criada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-sms-campaign', {
        body: { campaignId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sms-campaigns'] });
      qc.invalidateQueries({ queryKey: ['sms-recipients'] });
      if (data?.providerConfigured === false) {
        toast.warning(`${data.total} destinatários materializados — configure o provedor (Twilio + sender) para envio real.`);
      } else {
        toast.success(`${data?.sent || 0} mensagens enviadas, ${data?.failed || 0} falhas`);
      }
    },
    onError: (e: Error) => toast.error(`Erro ao enviar: ${e.message}`),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sms_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sms-campaigns'] });
      toast.success('Campanha removida');
    },
  });

  return {
    campaigns,
    loading: isLoading,
    createCampaign: createCampaign.mutateAsync,
    sendCampaign: sendCampaign.mutateAsync,
    deleteCampaign: deleteCampaign.mutateAsync,
    creating: createCampaign.isPending,
    sending: sendCampaign.isPending,
  };
}

export function useSmsCampaignRecipients(campaignId: string | null) {
  return useQuery({
    queryKey: ['sms-recipients', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('sms_campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as SmsCampaignRecipient[];
    },
    enabled: !!campaignId,
  });
}

export function useSmsTemplates() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['sms-templates', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((t) => ({
        ...t,
        variables: Array.isArray(t.variables) ? (t.variables as string[]) : [],
      })) as SmsTemplate[];
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: { name: string; body: string; category?: string }) => {
      if (!userId) throw new Error('Não autenticado');
      // Auto-extract variables {{var}}
      const variables = Array.from(new Set([...input.body.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1])));
      const { data, error } = await supabase
        .from('sms_templates')
        .insert({ ...input, variables, user_id: userId })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao criar template SMS');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sms-templates'] });
      toast.success('Template criado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sms_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sms-templates'] });
      toast.success('Template removido');
    },
  });

  return {
    templates,
    loading: isLoading,
    createTemplate: createTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutateAsync,
  };
}
