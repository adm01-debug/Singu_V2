/**
 * Celebrações sutis para marcos do CRM (deal fechado, meta batida, NPS alto, etc.)
 * Implementação CSS-only (sem dependências externas) + integração com sonner.
 */
import { toast } from 'sonner';

type CelebrationKind = 'deal-won' | 'goal-reached' | 'streak' | 'level-up' | 'milestone';

interface CelebrationOptions {
  kind?: CelebrationKind;
  title: string;
  description?: string;
  duration?: number;
  emoji?: string;
}

const KIND_DEFAULTS: Record<CelebrationKind, { emoji: string; ariaLabel: string }> = {
  'deal-won': { emoji: '🏆', ariaLabel: 'Negócio fechado' },
  'goal-reached': { emoji: '🎯', ariaLabel: 'Meta atingida' },
  streak: { emoji: '🔥', ariaLabel: 'Sequência ativa' },
  'level-up': { emoji: '⬆️', ariaLabel: 'Subiu de nível' },
  milestone: { emoji: '✨', ariaLabel: 'Marco alcançado' },
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
];

function spawnConfetti(rootEl: HTMLElement, pieces = 28) {
  const container = document.createElement('div');
  container.className = 'celebrate-confetti-root';
  container.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('span');
    piece.className = 'celebrate-confetti-piece';
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    const rotate = Math.random() * 360;
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    const x = (Math.random() * 2 - 1) * 220;
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    const y = -120 - Math.random() * 200;
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    const delay = Math.random() * 120;
    piece.style.setProperty('--cx', `${x}px`);
    piece.style.setProperty('--cy', `${y}px`);
    piece.style.setProperty('--cr', `${rotate}deg`);
    piece.style.background = COLORS[i % COLORS.length];
    piece.style.animationDelay = `${delay}ms`;
    container.appendChild(piece);
  }
  rootEl.appendChild(container);
  window.setTimeout(() => container.remove(), 1800);
}

/**
 * Dispara uma celebração visual + toast.
 * Respeita `prefers-reduced-motion`.
 */
export function celebrate(opts: CelebrationOptions): void {
  const kind = opts.kind ?? 'milestone';
  const meta = KIND_DEFAULTS[kind];
  const emoji = opts.emoji ?? meta.emoji;
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)') &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  toast.success(`${emoji} ${opts.title}`, {
    description: opts.description,
    duration: opts.duration ?? 4500,
  });

  if (reduced || typeof document === 'undefined') return;
  spawnConfetti(document.body);
}
