import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, ArrowRight, ArrowLeft, Check, Sparkles,
  User, Building2, Upload, Settings, PartyPopper
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import WelcomeStep from './steps/WelcomeStep';
import ProfileStep from './steps/ProfileStep';
import ImportStep from './steps/ImportStep';
import PreferencesStep from './steps/PreferencesStep';
import CompletionStep from './steps/CompletionStep';
import { logger } from "@/lib/logger";

export interface OnboardingData {
  profile: {
    firstName: string;
    lastName: string;
    companyName: string;
    roleTitle: string;
    phone: string;
  };
  preferences: {
    emailNotifications: boolean;
    weeklyDigest: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  importedContacts: number;
}

const STEPS = [
  { id: 'welcome', title: 'Bem-vindo', icon: Sparkles, description: 'Conheça o SINGU' },
  { id: 'profile', title: 'Seu Perfil', icon: User, description: 'Configure seu perfil' },
  { id: 'import', title: 'Importar', icon: Upload, description: 'Traga seus dados' },
  { id: 'preferences', title: 'Preferências', icon: Settings, description: 'Personalize sua experiência' },
  { id: 'complete', title: 'Pronto!', icon: PartyPopper, description: 'Tudo configurado' },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    profile: {
      firstName: '',
      lastName: '',
      companyName: '',
      roleTitle: '',
      phone: '',
    },
    preferences: {
      emailNotifications: true,
      weeklyDigest: true,
      theme: 'system',
      language: 'pt-BR',
    },
    importedContacts: 0,
  });

  // Load user data from auth metadata
  useEffect(() => {
    if (user?.user_metadata) {
      setData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          firstName: user.user_metadata.first_name || '',
          lastName: user.user_metadata.last_name || '',
        }
      }));
    }
  }, [user]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateData = <K extends keyof OnboardingData>(
    section: K, 
    updates: Partial<OnboardingData[K]>
  ) => {
    setData(prev => ({
      ...prev,
      [section]: { ...(prev[section] as object), ...(updates as object) }
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Save profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: data.profile.firstName,
          last_name: data.profile.lastName,
          company_name: data.profile.companyName,
          role_title: data.profile.roleTitle,
          phone: data.profile.phone,
          preferences: {
            emailNotifications: data.preferences.emailNotifications,
            weeklyDigest: data.preferences.weeklyDigest,
            theme: data.preferences.theme,
            language: data.preferences.language,
            onboardingCompleted: true,
            onboardingCompletedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      toast.success('🎉 Onboarding concluído! Bem-vindo ao SINGU!');
      onComplete();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error completing onboarding:', { error: msg });
      toast.error('Erro ao salvar configurações. Tente novamente.', { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} />;
      case 'profile':
        return (
          <ProfileStep 
            data={data.profile} 
            onUpdate={(updates) => updateData('profile', updates)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 'import':
        return (
          <ImportStep 
            onImport={(count) => setData(prev => ({ ...prev, importedContacts: count }))}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 'preferences':
        return (
          <PreferencesStep 
            data={data.preferences}
            onUpdate={(updates) => updateData('preferences', updates)}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 'complete':
        return (
          <CompletionStep 
            data={data}
            onComplete={handleComplete}
            onBack={prevStep}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar - Progress */}
      <div className="hidden lg:flex lg:w-80 bg-gradient-to-b from-sidebar-background to-sidebar-background/95 p-8 flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">SINGU</h1>
            <p className="text-xs text-sidebar-foreground/70">Setup Wizard</p>
          </div>
        </div>

        {/* Steps list */}
        <div className="flex-1 space-y-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <motion.div
                key={step.id}
                initial={false}
                animate={{
                  backgroundColor: isActive ? 'hsl(var(--sidebar-accent))' : 'transparent',
                }}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-sidebar-accent' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-success text-success-foreground' 
                    : isActive 
                      ? 'bg-gradient-primary text-primary-foreground shadow-glow' 
                      : 'bg-sidebar-accent text-sidebar-foreground/50'
                }`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isActive ? 'text-sidebar-accent-foreground' : isCompleted ? 'text-sidebar-foreground' : 'text-sidebar-foreground/50'
                  }`}>
                    {step.title}
                  </p>
                  <p className={`text-xs truncate ${
                    isActive ? 'text-sidebar-foreground/70' : 'text-sidebar-foreground/40'
                  }`}>
                    {step.description}
                  </p>
                </div>
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-success"
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div className="mt-8">
          <div className="flex items-center justify-between text-xs text-sidebar-foreground/70 mb-2">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-sidebar-accent" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">SINGU</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
