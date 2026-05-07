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
    <Card className={cn('relative overflow-hidden border-primary/20 bg-card/60 backdrop-blur-xl shadow-lg rounded-2xl', className)} data-density-aware>
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/15 blur-[60px] pointer-events-none animate-pulse-glow" aria-hidden="true" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-nexus-cyan/10 blur-[60px] pointer-events-none" aria-hidden="true" />
      <CardContent className="relative p-6 md:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 shadow-inner-sm">
              <Sparkles className="h-5 w-5 text-primary animate-pulse-soft" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-heading font-bold tracking-tight text-foreground">Briefing do dia</h3>
              <p className="text-sm text-muted-foreground font-light tracking-tight">
                Você teve <span className="font-semibold text-foreground">{summary.interactionsToday}</span> {summary.interactionsToday === 1 ? 'conversa' : 'conversas'} hoje e <span className="font-semibold text-foreground">{summary.newContactsToday}</span> novos contatos.
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
          <div className="mt-8 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
              Prioridades sugeridas
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.priorities.map((p, i) => {
                const Icon = p.tone === 'urgent' ? AlertCircle : p.tone === 'opportunity' ? Sparkles : CheckCircle2;
                return (
                  <Link
                    key={i}
                    to={p.href}
                    className="group flex items-center gap-3 rounded-xl border border-border/20 bg-background/40 px-4 py-3 text-sm transition-all duration-300 hover:bg-background/80 hover:border-primary/30 hover:shadow-soft"
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', p.tone === 'urgent' ? 'text-destructive' : p.tone === 'opportunity' ? 'text-primary' : 'text-success')} aria-hidden="true" />
                    <span className="flex-1 truncate font-medium tracking-tight">{p.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
