import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, ArrowRight, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  updated_at: string;
}

interface Interaction {
  id: string;
  created_at: string;
  contact_id?: string | null;
}

interface Props {
  contacts: Contact[];
  interactions: Interaction[];
  totalDealsAtRisk?: number;
  weeklyInteractions?: number;
  weeklyAverage?: number;
  className?: string;
}

const STORAGE_PREFIX = 'singu-briefing-';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isToday(iso: string): boolean {
  return iso.slice(0, 10) === todayKey();
}

function isYesterday(iso: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return iso.slice(0, 10) === d.toISOString().slice(0, 10);
}

/**
 * Card "Briefing do dia" — aparece 1x por dia no topo do Dashboard.
 * Resume o que mudou desde ontem e sugere prioridades.
 * Heurística 100% client-side sobre dados já carregados.
 */
export function DailyBriefingCard({
  contacts,
  interactions,
  totalDealsAtRisk = 0,
  weeklyInteractions = 0,
  weeklyAverage = 0,
  className,
}: Props) {
  const key = STORAGE_PREFIX + todayKey();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  const summary = useMemo(() => {
    const interactionsToday = interactions.filter((i) => isToday(i.created_at)).length;
    const interactionsYesterday = interactions.filter((i) => isYesterday(i.created_at)).length;
    const newContactsToday = contacts.filter((c) => isToday(c.updated_at)).length;
    const trend = interactionsToday - interactionsYesterday;
    const vsAverage = weeklyAverage > 0 ? Math.round(((weeklyInteractions - weeklyAverage) / weeklyAverage) * 100) : 0;

    const priorities: Array<{ label: string; href: string; tone: 'urgent' | 'opportunity' | 'normal' }> = [];
    if (totalDealsAtRisk > 0) {
      priorities.push({
        label: `${totalDealsAtRisk} ${totalDealsAtRisk === 1 ? 'deal precisa' : 'deals precisam'} de atenção no pipeline`,
        href: '/pipeline',
        tone: 'urgent',
      });
    }
    if (interactionsYesterday > 0 && interactionsToday === 0) {
      priorities.push({
        label: 'Você ainda não registrou conversas hoje — retome o ritmo de ontem',
        href: '/interacoes?new=1',
        tone: 'normal',
      });
    }
    if (newContactsToday === 0) {
      priorities.push({
        label: 'Adicione novos contatos para alimentar o pipeline',
        href: '/contatos?new=1',
        tone: 'opportunity',
      });
    }
    return {
      interactionsToday,
      interactionsYesterday,
      newContactsToday,
      trend,
      vsAverage,
      priorities: priorities.slice(0, 3),
    };
  }, [contacts, interactions, totalDealsAtRisk, weeklyInteractions, weeklyAverage]);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(key, '1');
    } catch { /* noop */ }
  };

  return (
    <Card className={cn('relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background', className)} data-density-aware>
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" aria-hidden="true" />
      <CardContent className="relative p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/15 p-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold leading-tight">Briefing do dia</h3>
              <p className="text-xs text-muted-foreground">
                {summary.interactionsToday} {summary.interactionsToday === 1 ? 'conversa' : 'conversas'} hoje ·{' '}
                {summary.newContactsToday} novos contatos ·{' '}
                {summary.trend >= 0 ? '+' : ''}{summary.trend} vs ontem
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={dismiss}
            aria-label="Dispensar briefing por hoje"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {summary.vsAverage !== 0 && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className={cn('gap-1 text-[10px]', summary.vsAverage >= 0 ? 'text-success border-success/30' : 'text-warning border-warning/30')}>
              <TrendingUp className="h-3 w-3" />
              {summary.vsAverage > 0 ? '+' : ''}{summary.vsAverage}% vs média semanal
            </Badge>
          </div>
        )}

        {summary.priorities.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Prioridades sugeridas
            </p>
            <ul className="space-y-1">
              {summary.priorities.map((p, i) => {
                const Icon = p.tone === 'urgent' ? AlertCircle : p.tone === 'opportunity' ? Sparkles : CheckCircle2;
                return (
                  <li key={i}>
                    <Link
                      to={p.href}
                      className="group flex items-center gap-2 rounded-md border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                    >
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', p.tone === 'urgent' ? 'text-destructive' : p.tone === 'opportunity' ? 'text-primary' : 'text-success')} aria-hidden="true" />
                      <span className="flex-1 truncate">{p.label}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
