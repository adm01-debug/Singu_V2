import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Rocket, Check, ArrowLeft, Users, Building2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingData } from '../OnboardingWizard';
import { useCelebration } from '@/components/celebrations/CelebrationProvider';

interface CompletionStepProps {
  data: OnboardingData;
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const CompletionStep = ({ data, onComplete, onBack, isLoading }: CompletionStepProps) => {
  const { celebrate } = useCelebration();

  useEffect(() => {
    // Trigger celebration when completing onboarding
    celebrate({
      type: 'goal-achieved',
      title: 'Configuração Completa! 🎯',
      subtitle: `Bem-vindo ao SINGU, ${data.profile.firstName}!`,
      duration: 4000,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryItems = [
    {
      icon: Users,
      label: 'Perfil',
      value: `${data.profile.firstName} ${data.profile.lastName}`,
      completed: true,
    },
    {
      icon: Building2,
      label: 'Empresa',
      value: data.profile.companyName || 'Não informada',
      completed: !!data.profile.companyName,
    },
    {
      icon: Users,
      label: 'Contatos Importados',
      value: data.importedContacts > 0 ? `${data.importedContacts} contatos` : 'Nenhum',
      completed: data.importedContacts > 0,
    },
    {
      icon: Settings,
      label: 'Preferências',
      value: `Tema ${data.preferences.theme === 'light' ? 'Claro' : data.preferences.theme === 'dark' ? 'Escuro' : 'Sistema'}`,
      completed: true,
    },
  ];

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6, bounce: 0.5 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-success to-success flex items-center justify-center mx-auto mb-8 shadow-sm">
          <PartyPopper className="w-12 h-12 text-success-foreground" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-warning flex items-center justify-center"
        >
          <span className="text-lg" role="img" aria-hidden="true">🎉</span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Tudo Pronto, {data.profile.firstName}!
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
          Sua conta está configurada e você está pronto para começar a 
          transformar relacionamentos em resultados.
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-md mx-auto mb-8"
      >
        <div className="bg-card border border-border rounded-2xl p-6 text-left">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">
            Resumo da Configuração
          </h3>
          <div className="space-y-4">
            {summaryItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.completed ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    {item.completed ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-between max-w-md mx-auto"
      >
        <Button variant="ghost" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={onComplete}
          size="lg"
          disabled={isLoading}
          className="bg-gradient-primary hover:opacity-90 shadow-glow px-8"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Finalizando...
            </span>
          ) : (
            <>
              <Rocket className="w-5 h-5 mr-2" />
              Começar a Usar
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default CompletionStep;
