import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";
import { parseApiError } from '@/lib/errorMessages';
import type { Json } from '@/integrations/supabase/types';

// ===================== TYPES =====================

export type TriggerType =
  | 'interaction_created'
  | 'contact_stage_changed'
  | 'score_changed'
  | 'tag_added'
  | 'no_contact_days'
  | 'sentiment_changed'
  | 'follow_up_due';

export type ActionType =
  | 'create_alert'
  | 'create_task'
  | 'update_stage'
  | 'add_tag'
  | 'send_notification'
  | 'update_score'
  | 'enroll_in_sequence';

export interface AutomationCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: string | number | boolean;
}

export interface AutomationAction {
  type: ActionType;
  config: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  execution_count: number;
  last_executed_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  user_id: string;
  rule_id: string;
  trigger_entity_type: string;
  trigger_entity_id: string;
  actions_executed: AutomationAction[];
  success: boolean;
  error_message: string | null;
  executed_at: string;
}

export type CreateRuleData = Pick<AutomationRule, 'name' | 'description' | 'trigger_type' | 'trigger_config' | 'conditions' | 'actions'>;

// ===================== TRIGGER / ACTION METADATA =====================

export const TRIGGER_OPTIONS: { value: TriggerType; label: string; description: string; icon: string }[] = [
  { value: 'interaction_created', label: 'Nova Interação', description: 'Disparado quando uma interação é registrada', icon: '💬' },
  { value: 'contact_stage_changed', label: 'Estágio Alterado', description: 'Quando o estágio do relacionamento muda', icon: '🔄' },
  { value: 'score_changed', label: 'Score Alterado', description: 'Quando o score de relacionamento muda', icon: '📊' },
  { value: 'tag_added', label: 'Tag Adicionada', description: 'Quando uma tag é adicionada ao contato', icon: '🏷️' },
  { value: 'no_contact_days', label: 'Sem Contato', description: 'Quando X dias se passam sem contato', icon: '⏰' },
  { value: 'sentiment_changed', label: 'Sentimento Mudou', description: 'Quando o sentimento do contato muda', icon: '😊' },
  { value: 'follow_up_due', label: 'Follow-up Devido', description: 'Quando um follow-up está vencido', icon: '📋' },
];

export const ACTION_OPTIONS: { value: ActionType; label: string; description: string; icon: string }[] = [
  { value: 'create_alert', label: 'Criar Alerta', description: 'Gera um alerta no sistema', icon: '🔔' },
  { value: 'create_task', label: 'Criar Tarefa', description: 'Cria uma tarefa de follow-up', icon: '✅' },
  { value: 'update_stage', label: 'Atualizar Estágio', description: 'Muda o estágio do relacionamento', icon: '📈' },
  { value: 'add_tag', label: 'Adicionar Tag', description: 'Adiciona uma tag ao contato', icon: '🏷️' },
  { value: 'send_notification', label: 'Enviar Notificação', description: 'Envia uma notificação push', icon: '📲' },
  { value: 'update_score', label: 'Atualizar Score', description: 'Modifica o score de relacionamento', icon: '⭐' },
  { value: 'enroll_in_sequence', label: 'Inscrever em Sequência', description: 'Adiciona o contato a uma sequência multi-canal', icon: '📨' },
];

// ===================== HOOK =====================

export function useAutomationRules() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (signal?.cancelled) return;
      if (error) throw error;
      setRules((data ?? []) as unknown as AutomationRule[]);
    } catch (e: unknown) {
      if (!signal?.cancelled) logger.error('Error fetching automation rules:', e);
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [user]);

  const fetchLogs = useCallback(async (ruleId?: string) => {
    if (!user) return;
    try {
      let query = supabase
        .from('automation_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(50);
      if (ruleId) query = query.eq('rule_id', ruleId);
      const { data, error } = await query;
      if (error) throw error;
      setLogs((data ?? []) as unknown as AutomationLog[]);
    } catch (e: unknown) {
      logger.error('Error fetching automation logs:', e);
    }
  }, [user]);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchRules(signal);
    return () => { signal.cancelled = true; };
  }, [fetchRules]);

  const createRule = useCallback(async (data: CreateRuleData) => {
    if (!user) return null;
    try {
      const { data: created, error } = await supabase
        .from('automation_rules')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          trigger_type: data.trigger_type,
          trigger_config: data.trigger_config as Json,
          conditions: data.conditions as unknown as Json,
          actions: data.actions as unknown as Json,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!created) throw new Error("Falha ao criar automação");
      setRules(prev => [created as unknown as AutomationRule, ...prev]);
      toast.success('Automação criada com sucesso!');
      return created;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro ao criar automação: ' + message);
      return null;
    }
  }, [user]);

  const updateRule = useCallback(async (id: string, data: Partial<CreateRuleData> & { is_active?: boolean }) => {
    if (!user) return false;

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.trigger_type !== undefined) updateData.trigger_type = data.trigger_type;
    if (data.trigger_config !== undefined) updateData.trigger_config = data.trigger_config;
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.actions !== undefined) updateData.actions = data.actions;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const previousRules = rules;
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updateData } : r));

    try {
      const { error } = await supabase
        .from('automation_rules')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Automação atualizada!');
      return true;
    } catch (e: unknown) {
      setRules(previousRules);
      toast.error('Erro ao atualizar: ' + parseApiError(e));
      return false;
    }
  }, [user, rules]);

  const deleteRule = useCallback(async (id: string) => {
    if (!user) return false;

    const previousRules = rules;
    setRules(prev => prev.filter(r => r.id !== id));

    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Automação removida.');
      return true;
    } catch (e: unknown) {
      setRules(previousRules);
      toast.error('Erro ao remover: ' + parseApiError(e));
      return false;
    }
  }, [user, rules]);

  const toggleRule = useCallback(async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    await updateRule(id, { is_active: !rule.is_active });
  }, [rules, updateRule]);

  return {
    rules,
    logs,
    loading,
    fetchRules,
    fetchLogs,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}
