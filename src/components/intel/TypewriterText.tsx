import { useEffect, useRef, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  charsPerFrame?: number;
  className?: string;
}

/**
 * Efeito typewriter usando requestAnimationFrame.
 * Pula a animação se o usuário tem prefers-reduced-motion.
 */
export const TypewriterText = ({ text, charsPerFrame = 2, className }: TypewriterTextProps) => {
  const [shown, setShown] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setShown(text.length);
      return;
    }

    setShown(0);
    let i = 0;
    const tick = () => {
      i = Math.min(text.length, i + charsPerFrame);
      setShown(i);
      if (i < text.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, charsPerFrame]);

  return (
    <span className={className}>
      {text.slice(0, shown)}
      {shown < text.length && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 bg-[hsl(var(--intel-accent))] align-middle animate-pulse"
          aria-hidden
        />
      )}
    </span>
  );
};
