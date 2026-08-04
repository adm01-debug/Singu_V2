import { OnboardingTour, useOnboardingTour } from './OnboardingTour';

/**
 * Wrapper autônomo para OnboardingTour.
 * O tour não deve abrir sozinho no dashboard para não bloquear a interface.
 */
export function OnboardingTourWrapper() {
  const { isOpen, completeTour, skipTour } = useOnboardingTour('main');

  return (
    <OnboardingTour
      isOpen={isOpen}
      onComplete={completeTour}
      onSkip={skipTour}
    />
  );
}

export default OnboardingTourWrapper;
