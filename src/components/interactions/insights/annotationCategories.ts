import { Megaphone, Lightbulb, Rocket, Users, Pin, type LucideIcon } from 'lucide-react';
import type { AnnotationCategory } from '@/hooks/useSentimentAnnotations';

export interface CategoryMeta {
  label: string;
  color: string; // hsl(var(--token))
  badgeClass: string;
  icon: LucideIcon;
}

export const ANNOTATION_CATEGORIES: Record<AnnotationCategory, CategoryMeta> = {
  campanha: {
    label: 'Campanha',
    color: 'hsl(var(--primary))',
    badgeClass: 'text-primary bg-primary/10 border-primary/30',
    icon: Megaphone,
  },
  abordagem: {
    label: 'Abordagem',
    color: 'hsl(var(--warning))',
    badgeClass: 'text-warning bg-warning/10 border-warning/30',
    icon: Lightbulb,
  },
  release: {
    label: 'Release',
    color: 'hsl(var(--success))',
    badgeClass: 'text-success bg-success/10 border-success/30',
    icon: Rocket,
  },
  reuniao: {
    label: 'Reunião',
    color: 'hsl(var(--accent-foreground))',
    badgeClass: 'text-accent-foreground bg-accent border-border',
    icon: Users,
  },
  outro: {
    label: 'Outro',
    color: 'hsl(var(--muted-foreground))',
    badgeClass: 'text-muted-foreground bg-muted border-border',
    icon: Pin,
  },
};

export const CATEGORY_KEYS: AnnotationCategory[] = ['campanha', 'abordagem', 'release', 'reuniao', 'outro'];
