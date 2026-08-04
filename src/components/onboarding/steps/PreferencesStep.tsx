import { motion } from 'framer-motion';
import { Settings, Sun, Moon, Monitor, Bell, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PreferencesStepProps {
  data: {
    emailNotifications: boolean;
    weeklyDigest: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  onUpdate: (updates: Partial<PreferencesStepProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const themeOptions = [
  { value: 'light', label: 'Claro', icon: Sun, description: 'Tema claro para melhor visibilidade' },
  { value: 'dark', label: 'Escuro', icon: Moon, description: 'Tema escuro para menos cansaço visual' },
  { value: 'system', label: 'Sistema', icon: Monitor, description: 'Segue as configurações do seu dispositivo' },
] as const;

const PreferencesStep = ({ data, onUpdate, onNext, onBack }: PreferencesStepProps) => {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Personalize sua Experiência</h2>
        <p className="text-muted-foreground">
          Ajuste as configurações de acordo com suas preferências
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-8 max-w-md mx-auto"
      >
        {/* Theme selection */}
        <div>
          <Label className="text-sm font-medium mb-4 block">Tema da Interface</Label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = data.theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => onUpdate({ theme: option.value })}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                    isSelected ? 'bg-gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {option.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Notificações</Label>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Notificações por Email</p>
                  <p className="text-xs text-muted-foreground">Receba alertas importantes por email</p>
                </div>
              </div>
              <Switch
                checked={data.emailNotifications}
                onCheckedChange={(checked) => onUpdate({ emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Resumo Semanal</p>
                  <p className="text-xs text-muted-foreground">Receba um resumo das atividades toda semana</p>
                </div>
              </div>
              <Switch
                checked={data.weeklyDigest}
                onCheckedChange={(checked) => onUpdate({ weeklyDigest: checked })}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between mt-10 max-w-md mx-auto"
      >
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={onNext}
          className="bg-gradient-primary hover:opacity-90"
        >
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};

export default PreferencesStep;
