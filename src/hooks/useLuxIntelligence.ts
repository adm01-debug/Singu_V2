 import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

export interface LuxSocialProfile {
  platform?: string;
  username?: string;
  url?: string;
  followers?: number | string;
  bio?: string;
}

export interface LuxStakeholder {
  name?: string;
  first_name?: string;
  last_name?: string;
  role_title?: string;
  position?: string;
  email?: string;
  linkedin?: string;
  phone?: string;
}

export interface LuxFiscalData {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  situacao_cadastral?: string;
  data_abertura?: string;
  capital_social?: number;
  natureza_juridica?: string;
  porte?: string;
  atividade_principal?: string;
  filiais?: LuxFilial[];
  [key: string]: unknown;
}

export interface LuxFilial {
  cnpj?: string;
  nome_fantasia?: string;
  nome?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  situacao?: string;
  [key: string]: unknown;
}

export interface LuxPersonalProfile {
  education?: LuxEducation[];
  bio?: string;
  skills?: string[];
  [key: string]: unknown;
}

export interface LuxEducation {
  institution?: string;
  degree?: string;
  field?: string;
  year?: string | number;
}

export interface LuxIntelligenceRecord {
  id: string;
  user_id: string;
  entity_type: 'contact' | 'company';
  entity_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  request_type: string;
  social_profiles: LuxSocialProfile[];
  social_analysis: Record<string, unknown> | null;
  fiscal_data: LuxFiscalData | null;
  stakeholders: LuxStakeholder[];
  audience_analysis: Record<string, unknown> | null;
  personal_profile: LuxPersonalProfile | null;
  ai_report: string | null;
  ai_summary: string | null;
  fields_updated: Record<string, unknown>[];
  error_message: string | null;
  n8n_execution_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useLuxIntelligence(entityType: 'contact' | 'company', entityId?: string) {
  const { user } = useAuth();
  const [records, setRecords] = useState<LuxIntelligenceRecord[]>([]);
  const [latestRecord, setLatestRecord] = useState<LuxIntelligenceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!user || !entityId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lux_intelligence')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const typed = (data || []) as unknown as LuxIntelligenceRecord[];
      setRecords(typed);
      setLatestRecord(typed[0] || null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error fetching lux records:', { error: msg });
    } finally {
      setLoading(false);
    }
  }, [user, entityType, entityId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Poll for updates when there's a processing record
  useEffect(() => {
    if (!latestRecord || latestRecord.status !== 'processing') return;
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, [latestRecord?.status, fetchRecords]);

  const triggerLux = useCallback(async (entityData: Record<string, unknown>) => {
    if (!user || !entityId) return null;
    setTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('lux-trigger', {
        body: { entityType, entityId, entityData },
      });

      if (error) throw error;

      // Handle "not configured" response
      if (data?.error === 'not_configured') {
        toast.error('Webhook Lux não configurado. Contate o administrador.');
        return null;
      }

      if (data?.success) {
        if (data.webhookStatus === 'failed') {
          toast.warning('🔮 Scan criado, mas o webhook falhou. Dados do último scan serão mantidos.');
        } else {
          toast.success('🔮 Lux Intelligence ativado! Varredura em andamento...');
        }
        await fetchRecords();
        return data.luxRecordId;
      } else {
        throw new Error(data?.error || 'Falha ao iniciar varredura');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error triggering Lux:', { error: msg });
      toast.error('Enriquecimento temporariamente indisponível', { description: msg });
      return null;
    } finally {
      setTriggering(false);
    }
  }, [user, entityType, entityId, fetchRecords]);

  return {
    records,
    latestRecord,
    loading,
    triggering,
     triggerLux,
     createStakeholderContact: async (stakeholder: LuxStakeholder, companyId?: string) => {
       if (!user) return null;
       try {
         const names = stakeholder.name?.split(' ') || [];
         const firstName = stakeholder.first_name || names[0] || 'Unknown';
         const lastName = stakeholder.last_name || names.slice(1).join(' ') || 'Unknown';
 
         const { data, error } = await supabase
           .from('contacts')
           .insert({
             user_id: user.id,
             company_id: companyId || (entityType === 'company' ? entityId : undefined),
             first_name: firstName,
             last_name: lastName,
             email: stakeholder.email,
             phone: stakeholder.phone,
             linkedin: stakeholder.linkedin,
             role_title: stakeholder.role_title || stakeholder.position,
             notes: `Adicionado via Lux Intelligence`,
             relationship_stage: 'prospect',
             relationship_score: 10,
           })
           .select()
           .single();
 
         if (error) throw error;
         toast.success(`Contato ${firstName} adicionado com sucesso!`);
         return data;
       } catch (err) {
         const msg = err instanceof Error ? err.message : 'Unknown error';
         logger.error('Error creating stakeholder contact:', { error: msg });
         toast.error('Erro ao adicionar contato');
         return null;
       }
     },
     refresh: fetchRecords,
     isProcessing: latestRecord?.status === 'processing',
   };
 }
}
