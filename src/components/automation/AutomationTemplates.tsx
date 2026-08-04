import { Zap, Clock, TrendingDown, UserCheck, Star, MessageSquare, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CreateRuleData } from '@/hooks/useAutomationRules';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  data: CreateRuleData;
}

const templates: Template[] = [
  {
    id: 'inactivity-alert',
    name: 'Alerta de Inatividade',
    description: 'Quando um contato fica sem interação por 14+ dias, cria um alerta e sugere follow-up.',
    icon: <Clock className="w-5 h-5" />,
    category: 'Retenção',
    data: {
      name: 'Alerta de Inatividade (14 dias)',
      description: 'Cria alerta quando contato fica inativo por 14 dias',
      trigger_type: 'no_contact_days',
      trigger_config: { min_days: 14 },
      conditions: [],
      actions: [
        { type: 'create_alert', config: { title: 'Contato inativo há 14 dias', priority: 'medium' } },
        { type: 'create_task', config: { title: 'Follow-up de reativação' } },
      ],
    },
  },
  {
    id: 'score-drop',
    name: 'Queda de Score',
    description: 'Quando o score de relacionamento cai, atualiza o estágio e gera alerta urgente.',
    icon: <TrendingDown className="w-5 h-5" />,
    category: 'Risco',
    data: {
      name: 'Score em Queda',
      description: 'Alerta quando score de relacionamento diminui',
      trigger_type: 'score_changed',
      trigger_config: { direction: 'decrease', threshold: 10 },
      conditions: [],
      actions: [
        { type: 'create_alert', config: { title: 'Score em queda!', priority: 'high' } },
        { type: 'update_stage', config: { stage: 'at_risk' } },
      ],
    },
  },
  {
    id: 'new-interaction-tag',
    name: 'Tag Pós-Interação',
    description: 'Ao registrar interação, adiciona tag "engajado" e atualiza o score.',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'Engajamento',
    data: {
      name: 'Tag Pós-Interação',
      description: 'Marca contato como engajado após nova interação',
      trigger_type: 'interaction_created',
      trigger_config: {},
      conditions: [],
      actions: [
        { type: 'add_tag', config: { tag: 'engajado' } },
        { type: 'update_score', config: { delta: 5 } },
      ],
    },
  },
  {
    id: 'stage-promotion',
    name: 'Promoção de Estágio',
    description: 'Quando score atinge 80+, promove automaticamente o estágio e envia notificação.',
    icon: <Star className="w-5 h-5" />,
    category: 'Crescimento',
    data: {
      name: 'Promoção por Score Alto',
      description: 'Promove estágio quando score atinge 80+',
      trigger_type: 'score_changed',
      trigger_config: { direction: 'increase', threshold: 80 },
      conditions: [],
      actions: [
        { type: 'update_stage', config: { stage: 'advocate' } },
        { type: 'send_notification', config: { message: 'Contato promovido a Advocate!' } },
      ],
    },
  },
  {
    id: 'sentiment-negative',
    name: 'Sentimento Negativo',
    description: 'Quando o sentimento muda para negativo, cria tarefa urgente de recuperação.',
    icon: <UserCheck className="w-5 h-5" />,
    category: 'Risco',
    data: {
      name: 'Recuperação de Sentimento',
      description: 'Ação imediata quando sentimento se torna negativo',
      trigger_type: 'sentiment_changed',
      trigger_config: { to: 'negative' },
      conditions: [],
      actions: [
        { type: 'create_alert', config: { title: 'Sentimento negativo detectado!', priority: 'high' } },
        { type: 'create_task', config: { title: 'Ligar para entender insatisfação' } },
      ],
    },
  },
  {
    id: 'follow-up-overdue',
    name: 'Follow-up Atrasado',
    description: 'Quando follow-up vence, cria alerta e notificação push.',
    icon: <Zap className="w-5 h-5" />,
    category: 'Produtividade',
    data: {
      name: 'Follow-up Atrasado',
      description: 'Alerta automático para follow-ups vencidos',
      trigger_type: 'follow_up_due',
      trigger_config: {},
      conditions: [],
      actions: [
        { type: 'create_alert', config: { title: 'Follow-up atrasado!', priority: 'high' } },
        { type: 'send_notification', config: { message: 'Você tem um follow-up vencido' } },
      ],
    },
  },
  {
    id: 'auto-enroll-new-lead',
    name: 'Inscrever Novo Lead',
    description: 'Quando um lead é criado/marcado com tag, inscreve automaticamente em uma sequência de nutrição.',
    icon: <Send className="w-5 h-5" />,
    category: 'Engajamento',
    data: {
      name: 'Auto-inscrição de Novos Leads',
      description: 'Adiciona contatos novos a uma sequência de nutrição',
      trigger_type: 'tag_added',
      trigger_config: { tag: 'novo-lead' },
      conditions: [],
      actions: [
        { type: 'enroll_in_sequence', config: { sequence_id: '', sequence_name: 'Configure a sequência ao salvar' } },
      ],
    },
  },
];

const categoryColors: Record<string, string> = {
  'Retenção': 'bg-warning/10 text-warning dark:text-warning',
  'Risco': 'bg-destructive/10 text-destructive',
  'Engajamento': 'bg-primary/10 text-primary',
  'Crescimento': 'bg-success/10 text-success dark:text-success',
  'Produtividade': 'bg-secondary/10 text-secondary dark:text-secondary',
};

interface AutomationTemplatesProps {
  onUseTemplate: (data: CreateRuleData) => void;
}

export function AutomationTemplates({ onUseTemplate }: AutomationTemplatesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {templates.map(template => (
        <Card key={template.id} className="hover:border-primary/40 transition-colors group cursor-pointer">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {template.icon}
              </div>
              <Badge variant="secondary" className={categoryColors[template.category] || ''}>
                {template.category}
              </Badge>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">{template.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onUseTemplate(template.data)}
            >
              Usar Template
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
