import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export interface AlertSettings {
  enabled: boolean;
  threshold: number;
  emailNotifications: boolean;
  onlyImportantContacts: boolean;
  importantMinScore: number;
}

interface Props {
  settings: AlertSettings;
  onChange: (settings: AlertSettings) => void;
  onClose: () => void;
}

export function DISCCompatibilityAlertSettings({ settings, onChange, onClose }: Props) {
  const update = (partial: Partial<AlertSettings>) => onChange({ ...settings, ...partial });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-muted/30 rounded-lg p-4 space-y-4"
    >
      <h4 className="font-medium flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Configurações de Alertas
      </h4>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enabled">Alertas ativos</Label>
          <Switch id="enabled" checked={settings.enabled} onCheckedChange={(enabled) => update({ enabled })} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Limiar de compatibilidade</Label>
            <span className="text-sm font-mono">{settings.threshold}%</span>
          </div>
          <Slider value={[settings.threshold]} onValueChange={([threshold]) => update({ threshold })} min={20} max={80} step={5} />
          <p className="text-xs text-muted-foreground">
            Alertas para contatos com compatibilidade abaixo de {settings.threshold}%
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="important">Apenas contatos importantes</Label>
          <Switch id="important" checked={settings.onlyImportantContacts} onCheckedChange={(onlyImportantContacts) => update({ onlyImportantContacts })} />
        </div>

        {settings.onlyImportantContacts && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Score mínimo de relacionamento</Label>
              <span className="text-sm font-mono">{settings.importantMinScore}</span>
            </div>
            <Slider value={[settings.importantMinScore]} onValueChange={([importantMinScore]) => update({ importantMinScore })} min={50} max={90} step={5} />
          </div>
        )}
      </div>

      <Separator />

      <Button variant="outline" size="sm" onClick={onClose} className="w-full">
        Fechar Configurações
      </Button>
    </motion.div>
  );
}
