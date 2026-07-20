import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText, Calendar, Mail, Check, BarChart3,
  AlertTriangle, TrendingUp, Cake, Target, Send
} from 'lucide-react';

interface LocalSettings {
  enabled: boolean;
  send_day: string;
  send_time: string;
  email_address: string;
  include_portfolio_summary: boolean;
  include_at_risk_clients: boolean;
  include_health_alerts: boolean;
  include_upcoming_dates: boolean;
  include_recommendations: boolean;
  include_performance_metrics: boolean;
}

interface WeeklyReportSettingsTabProps {
  localSettings: LocalSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<LocalSettings>>;
  dayOptions: readonly { readonly value: string; readonly label: string }[];
  onSave: () => void;
  onSendTest: () => void;
}

export function WeeklyReportSettingsTab({
  localSettings,
  setLocalSettings,
  dayOptions,
  onSave,
  onSendTest,
}: WeeklyReportSettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
        <div>
          <Label className="font-medium">Relatório Semanal Automático</Label>
          <p className="text-sm text-muted-foreground">
            Receba um resumo completo toda semana
          </p>
        </div>
        <Switch
          checked={localSettings.enabled}
          onCheckedChange={(checked) =>
            setLocalSettings((prev) => ({ ...prev, enabled: checked }))
          }
        />
      </div>

      <AnimatePresence>
        {localSettings.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Schedule */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Agendamento
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dia da Semana</Label>
                  <Select
                    value={localSettings.send_day}
                    onValueChange={(value) =>
                      setLocalSettings((prev) => ({ ...prev, send_day: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={localSettings.send_time}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({ ...prev, send_time: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </h4>
              <div className="space-y-2">
                <Label>Enviar para</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={localSettings.email_address}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({ ...prev, email_address: e.target.value }))
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon" aria-label="Enviar"
                    onClick={onSendTest}
                    disabled={!localSettings.email_address}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para ver apenas no app
                </p>
              </div>
            </div>

            {/* Content Selection */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Conteúdo do Relatório
              </h4>
              <div className="space-y-3">
                <ContentToggle
                  icon={<BarChart3 className="h-4 w-4" />}
                  label="Resumo do Portfólio"
                  description="Visão geral de contatos, empresas e interações"
                  checked={localSettings.include_portfolio_summary}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, include_portfolio_summary: checked }))
                  }
                />
                <ContentToggle
                  icon={<AlertTriangle className="h-4 w-4" />}
                  label="Clientes em Risco"
                  description="Lista de clientes que precisam de atenção"
                  checked={localSettings.include_at_risk_clients}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, include_at_risk_clients: checked }))
                  }
                />
                <ContentToggle
                  icon={<Cake className="h-4 w-4" />}
                  label="Datas Importantes"
                  description="Aniversários e eventos próximos"
                  checked={localSettings.include_upcoming_dates}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, include_upcoming_dates: checked }))
                  }
                />
                <ContentToggle
                  icon={<Target className="h-4 w-4" />}
                  label="Recomendações"
                  description="Ações sugeridas baseadas em análise"
                  checked={localSettings.include_recommendations}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, include_recommendations: checked }))
                  }
                />
                <ContentToggle
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Métricas de Performance"
                  description="Comparativo com semanas anteriores"
                  checked={localSettings.include_performance_metrics}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, include_performance_metrics: checked }))
                  }
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button onClick={onSave} className="w-full">
        <Check className="h-4 w-4 mr-2" />
        Salvar Configurações
      </Button>
    </div>
  );
}

interface ContentToggleProps {
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ContentToggle({ icon, label, description, checked, onCheckedChange }: ContentToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
