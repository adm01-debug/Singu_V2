import { useNavigate } from 'react-router-dom';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleComplete = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse">
            <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return <OnboardingWizard onComplete={handleComplete} />;
};

export default Onboarding;
