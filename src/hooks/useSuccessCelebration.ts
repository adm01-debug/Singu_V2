import { useCallback } from 'react';
import confetti from 'canvas-confetti';

type CelebrationType = 'confetti' | 'fireworks' | 'subtle';

/**
 * Hook that provides celebration effects for key milestones.
 * Uses canvas-confetti (already installed) for visual delight.
 */
export function useSuccessCelebration() {
  const celebrate = useCallback((type: CelebrationType = 'confetti') => {
    switch (type) {
      case 'confetti':
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b'],
          disableForReducedMotion: true,
        });
        break;

      case 'fireworks': {
        const duration = 1500;
        const end = Date.now() + duration;
        const interval = setInterval(() => {
          if (Date.now() > end) return clearInterval(interval);
          confetti({
            particleCount: 30,
            startVelocity: 30,
            spread: 360,
            origin: {
              // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
              x: Math.random(),
              // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
              y: Math.random() * 0.4,
            },
            colors: ['#4f46e5', '#7c3aed', '#f59e0b'],
            disableForReducedMotion: true,
          });
        }, 250);
        break;
      }

      case 'subtle':
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.8 },
          gravity: 1.2,
          scalar: 0.8,
          colors: ['#4f46e5', '#7c3aed'],
          disableForReducedMotion: true,
        });
        break;
    }
  }, []);

  return { celebrate };
}
