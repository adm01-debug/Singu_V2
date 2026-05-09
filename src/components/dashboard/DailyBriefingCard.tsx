import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, ArrowRight, TrendingUp, AlertCircle, CheckCircle2, Sun, Moon, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Bom dia', icon: Coffee };
  if (hour < 18) return { text: 'Boa tarde', icon: Sun };
  return { text: 'Boa noite', icon: Moon };
}

/**
 * Card "Briefing do dia" — aparece 1x por dia no topo do Dashboard.
 * Resume o que mudou desde ontem e sugere prioridades.
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

  const greeting = useMemo(() => getGreeting(), []);

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

  const GreetingIcon = greeting.icon;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Card className={cn('relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm hover:shadow-md transition-shadow duration-300', className)} data-density-aware>
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" aria-hidden="true" />
            <CardContent className="relative p-4 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-2.5 shadow-sm">
                    <GreetingIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold tracking-tight text-foreground">
                      {greeting.text}, seu briefing está pronto
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        {summary.interactionsToday} {summary.interactionsToday === 1 ? 'conversa' : 'conversas'} hoje
                      </span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{summary.newContactsToday} novos contatos</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className={cn('font-medium', summary.trend >= 0 ? 'text-success' : 'text-warning')}>
                        {summary.trend >= 0 ? '+' : ''}{summary.trend} vs ontem
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted/80 rounded-full transition-colors"
                  onClick={dismiss}
                  aria-label="Dispensar briefing por hoje"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {summary.vsAverage !== 0 && (
                  <Badge variant="outline" className={cn('gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold border-2 transition-all', 
                    summary.vsAverage >= 0 ? 'text-success border-success/20 bg-success/5' : 'text-warning border-warning/20 bg-warning/5')}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    {summary.vsAverage > 0 ? '+' : ''}{summary.vsAverage}% vs média semanal
                  </Badge>
                )}
                {summary.interactionsToday > 0 && (
                  <Badge variant="outline" className="gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold border-2 border-primary/20 bg-primary/5 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ritmo ativo
                  </Badge>
                )}
              </div>

              {summary.priorities.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    Sugestões de Ação
                  </p>
                  <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {summary.priorities.map((p, i) => {
                      const Icon = p.tone === 'urgent' ? AlertCircle : p.tone === 'opportunity' ? Sparkles : CheckCircle2;
                      return (
                        <li key={i}>
                          <Link
                            to={p.href}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl border p-3 text-sm transition-all duration-200",
                              p.tone === 'urgent' ? "border-destructive/10 bg-destructive/5 hover:border-destructive/30 hover:bg-destructive/10" : 
                              p.tone === 'opportunity' ? "border-primary/10 bg-primary/5 hover:border-primary/30 hover:bg-primary/10" : 
                              "border-border/50 bg-background/60 hover:border-border hover:bg-muted"
                            )}
                          >
                            <div className={cn(
                              "rounded-lg p-1.5 transition-colors",
                              p.tone === 'urgent' ? "bg-destructive/10 group-hover:bg-destructive/20" : 
                              p.tone === 'opportunity' ? "bg-primary/10 group-hover:bg-primary/20" : 
                              "bg-muted group-hover:bg-background"
                            )}>
                              <Icon className={cn('h-4 w-4 shrink-0', p.tone === 'urgent' ? 'text-destructive' : p.tone === 'opportunity' ? 'text-primary' : 'text-success')} aria-hidden="true" />
                            </div>
                            <span className="flex-1 font-medium leading-tight">{p.label}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}