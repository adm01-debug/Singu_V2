import type { AutomationAction, AutomationTrigger } from '@/hooks/useScoreAutomations';

export interface AutomationTemplate {
  key: string;
  name: string;
  description: string;
  trigger_type: AutomationTrigger;
  grade_target?: 'A' | 'B' | 'C' | 'D';
  score_target?: number;
  action_type: AutomationAction;
  action_config: Record<string, unknown>;
  cooldown_hours: number;
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    key: 'a-grade-notify',
    name: 'Lead virou A → notificar AE',
    description: 'Quando um contato alcança a grade A, gera um alerta de prioridade alta para o AE.',
    trigger_type: 'grade_reached',
    grade_target: 'A',
    action_type: 'notify',
    action_config: { title: '🔥 Lead Hot atingiu Grade A', priority: 'high' },
    cooldown_hours: 48,
  },
  {
    key: 'drop-from-a',
    name: 'Caiu de A → criar tarefa de win-back',
    description: 'Lead que era A baixou de grade — cria tarefa de reativação.',
    trigger_type: 'grade_dropped',
    grade_target: 'A',
    action_type: 'create_task',
    action_config: { title: 'Win-back: lead esfriou', priority: 'high', due_in_hours: 48 },
    cooldown_hours: 72,
  },
  {
    key: 'score-80-vip',
    name: 'Score ≥ 80 → entrar em sequência VIP',
    description: 'Inscreve em sequência configurável quando o score cruza 80.',
    trigger_type: 'score_above',
    score_target: 80,
    action_type: 'enroll_sequence',
    action_config: { sequence_id: '' },
    cooldown_hours: 168,
  },
  {
    key: 'tag-hot',
    name: 'Score ≥ 70 → marcar com tag "hot"',
    description: 'Adiciona a tag hot ao contato para facilitar segmentação.',
    trigger_type: 'score_above',
    score_target: 70,
    action_type: 'tag',
    action_config: { tag: 'hot' },
    cooldown_hours: 720,
  },
];
