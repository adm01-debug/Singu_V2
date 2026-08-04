import { motion } from 'framer-motion';
import { Calendar, Users, Lightbulb, Mail, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface NotificationSettings {
  followUps: boolean;
  birthdays: boolean;
  insights: boolean;
  weeklyDigest: boolean;
  relationshipDecay: boolean;
}

interface NotificationSettingsSectionProps {
  settings: NotificationSettings;
  isSubscribed: boolean;
  onSettingChange: (key: keyof NotificationSettings) => void;
}

const SETTING_ITEMS = [
  { key: 'followUps' as const, icon: Calendar, label: 'Follow-ups', description: 'Lembretes de acompanhamento agendados', colorClass: 'bg-info/10 text-info' },
  { key: 'birthdays' as const, icon: Users, label: 'Aniversários', description: 'Alertas de aniversário de contatos', colorClass: 'bg-warning/10 text-warning' },
  { key: 'insights' as const, icon: Lightbulb, label: 'Insights', description: 'Novos insights gerados pela IA', colorClass: 'bg-primary/10 text-primary' },
  { key: 'relationshipDecay' as const, icon: Thermometer, label: 'Relacionamentos Esfriando', description: 'Alertas quando relacionamentos perdem força', colorClass: 'bg-destructive/10 text-destructive' },
  { key: 'weeklyDigest' as const, icon: Mail, label: 'Resumo Semanal', description: 'Relatório semanal de atividades', colorClass: 'bg-success/10 text-success' },
];

export function NotificationSettingsSection({ settings, isSubscribed, onSettingChange }: NotificationSettingsSectionProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
          <CardDescription>Escolha quais alertas deseja receber</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SETTING_ITEMS.map(({ key, icon: Icon, label, description, colorClass }) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch checked={settings[key]} onCheckedChange={() => onSettingChange(key)} disabled={!isSubscribed} />
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
