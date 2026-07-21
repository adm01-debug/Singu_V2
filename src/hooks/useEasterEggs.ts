import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface EasterEgg {
  id: string;
  sequence: string[];
  action: () => void;
  description: string;
  discovered: boolean;
}

const STORAGE_KEY = 'discovered-easter-eggs';

export function useEasterEggs() {
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [discoveredEggs, setDiscoveredEggs] = useState<Set<string>>(new Set());

  // Load discovered eggs from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDiscoveredEggs(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save discovered eggs
  const saveDiscoveredEgg = useCallback((eggId: string) => {
    setDiscoveredEggs(prev => {
      const next = new Set(prev);
      next.add(eggId);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* quota/private */ }
      return next;
    });
  }, []);

  // Konami code confetti explosion
  const konamiAction = useCallback(() => {
    toast.success('🎮 Konami Code Ativado!', {
      description: 'Você descobriu um segredo!',
    });
    
    // Big confetti explosion
    const duration = 3000;
    const end = Date.now() + duration;
    
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
    saveDiscoveredEgg('konami');
  }, [saveDiscoveredEgg]);

  // Love hearts animation
  const loveAction = useCallback(() => {
    toast('❤️ Love Mode Ativado!', {
      description: 'Obrigado por usar o SINGU!',
      icon: '💕',
    });
    
    // Heart-shaped confetti
    const heartShape = confetti.shapeFromPath({
      path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    });
    
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.6 },
      shapes: [heartShape],
      colors: ['#ff0000', '#ff69b4', '#ff1493'],
    });
    
    saveDiscoveredEgg('love');
  }, [saveDiscoveredEgg]);

  // Matrix rain effect
  const matrixAction = useCallback(() => {
    toast('🔴 Matrix Mode!', {
      description: 'Follow the white rabbit...',
    });
    
    // Green confetti falling like Matrix rain
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 30,
          angle: 270,
          spread: 180,
          // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
          origin: { x: Math.random(), y: 0 },
          colors: ['#00ff00'],
          gravity: 0.5,
          scalar: 0.8,
        });
      }, i * 200);
    }
    
    saveDiscoveredEgg('matrix');
  }, [saveDiscoveredEgg]);

  // Developer mode
  const devAction = useCallback(() => {
    if (import.meta.env.DEV) {
      logger.log('Developer Mode Activated! Welcome, fellow developer! 👨‍💻');
    }
    
    toast.success('🛠️ Dev Mode Ativado!', {
      description: 'Confira o console para mais informações.',
    });
    
    saveDiscoveredEgg('dev');
  }, [saveDiscoveredEgg]);

  // Party mode
  const partyAction = useCallback(() => {
    toast('🎉 Party Mode!', {
      description: 'Let\'s celebrate!',
    });
    
    // Rainbow explosion
    const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
    
    confetti({
      particleCount: 100,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      colors,
      startVelocity: 45,
      gravity: 1,
      scalar: 1.2,
    });
    
    saveDiscoveredEgg('party');
  }, [saveDiscoveredEgg]);

  // Define easter eggs (stable reference — only recreate when actions or discovery state change)
  const easterEggs = useMemo<EasterEgg[]>(() => [
    {
      id: 'konami',
      sequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
      action: konamiAction,
      description: 'Konami Code',
      discovered: discoveredEggs.has('konami'),
    },
    {
      id: 'love',
      sequence: ['l', 'o', 'v', 'e'],
      action: loveAction,
      description: 'Love Mode',
      discovered: discoveredEggs.has('love'),
    },
    {
      id: 'matrix',
      sequence: ['m', 'a', 't', 'r', 'i', 'x'],
      action: matrixAction,
      description: 'Matrix Mode',
      discovered: discoveredEggs.has('matrix'),
    },
    {
      id: 'dev',
      sequence: ['d', 'e', 'v', 'm', 'o', 'd', 'e'],
      action: devAction,
      description: 'Developer Mode',
      discovered: discoveredEggs.has('dev'),
    },
    {
      id: 'party',
      sequence: ['p', 'a', 'r', 't', 'y'],
      action: partyAction,
      description: 'Party Mode',
      discovered: discoveredEggs.has('party'),
    },
  ], [konamiAction, loveAction, matrixAction, devAction, partyAction, discoveredEggs]);

  // Listen for key sequence
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      setKeySequence(prev => {
        const next = [...prev, e.key].slice(-10); // Keep last 10 keys
        
        // Check each easter egg
        for (const egg of easterEggs) {
          const sequenceStr = next.join(',');
          const eggSequenceStr = egg.sequence.join(',');
          
          if (sequenceStr.endsWith(eggSequenceStr)) {
            setTimeout(egg.action, 0);
            return [];
          }
        }
        
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [easterEggs]);

  // Clear sequence after inactivity
  useEffect(() => {
    if (keySequence.length === 0) return;
    
    const timer = setTimeout(() => setKeySequence([]), 2000);
    return () => clearTimeout(timer);
  }, [keySequence]);

  return {
    discoveredEggs,
    totalEggs: easterEggs.length,
    discoveredCount: discoveredEggs.size,
  };
}
