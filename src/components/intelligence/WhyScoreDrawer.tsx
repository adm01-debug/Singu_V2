import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ThumbsDown, ThumbsUp, Activity, Sparkles, Info, TrendingUp, TrendingDown, Minus, MessageSquare, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type WhyScoreDirection = 'positive' | 'negative' | 'neutral';
export type ScoreBand = 'low' | 'mid' | 'high';

export interface WhyScoreFactor {
  key: string;
  label: string;
  /** 0-100 */
  score: number;
  /** Peso relativo, 0-1 */
  weight: number;
  detail?: string;
  trend?: 'up' | 'down' | 'flat';
  /** Direção do impacto deste fator no score total. Se ausente, é inferida do score. */
  direction?: WhyScoreDirection;
}

function inferDirection(score: number): WhyScoreDirection {
  if (score >= 65) return 'positive';
  if (score <= 35) return 'negative';
  return 'neutral';
}

const DIRECTION_META: Record<WhyScoreDirection, {
  icon: typeof TrendingUp;
  label: string;
  badgeClass: string;
  verb: string;
}> = {
  positive: {
    icon: TrendingUp,
    label: 'favorece',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    verb: 'Está ajudando',
  },
  negative: {
    icon: TrendingDown,
    label: 'prejudica',
    badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    verb: 'Está prejudicando',
  },
  neutral: {
    icon: Minus,
    label: 'neutro',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    verb: 'Impacto neutro',
  },
};

interface WhyScoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Identificador estável para feedback (ex: "lead-score:contact:abc"). */
  scoreKey: string;
  title: string;
  subtitle?: string;
  /** Score 0-100 */
  score: number;
  factors: WhyScoreFactor[];
  recommendations?: string[];
  /** Banda qualitativa: 'low' | 'mid' | 'high' (auto se ausente). */
  band?: ScoreBand;
}

const FEEDBACK_KEY = 'singu-score-feedback-v1';

function readFeedback(): Record<string, 'up' | 'down'> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(FEEDBACK_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeFeedback(map: Record<string, 'up' | 'down'>) {
  try {
    window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

// Feedback sobre a explicação ("faz sentido / não faz sentido"), persistido por scoreKey
// (que já encoda o contato, ex.: "lead-score:contact:abc").
const EXPLANATION_FEEDBACK_KEY = 'singu-explanation-feedback-v1';

export type ExplanationFeedbackValue = 'makes_sense' | 'does_not_make_sense';

interface ExplanationFeedbackEntry {
  value: ExplanationFeedbackValue;
  comment?: string;
  updatedAt: string;
}

function readExplanationFeedback(): Record<string, ExplanationFeedbackEntry> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(EXPLANATION_FEEDBACK_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeExplanationFeedback(map: Record<string, ExplanationFeedbackEntry>) {
  try {
    window.localStorage.setItem(EXPLANATION_FEEDBACK_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

function deriveBand(score: number): ScoreBand {
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}

const BAND_META: Record<ScoreBand, { label: string; cls: string; indicator: string }> = {
  low: { label: 'Baixo', cls: 'text-destructive', indicator: 'bg-destructive' },
  mid: { label: 'Médio', cls: 'text-warning', indicator: 'bg-warning' },
  high: { label: 'Alto', cls: 'text-success', indicator: 'bg-success' },
};

/** Banda por fator (0-100), alinhada com inferDirection: <35 baixa, 35-65 média, >65 alta. */
function getFactorBand(score: number): ScoreBand {
  if (score >= 65) return 'high';
  if (score <= 35) return 'low';
  return 'mid';
}
const FACTOR_BAND_META: Record<ScoreBand, { label: string; range: string; badgeClass: string }> = {
  low: {
    label: 'baixa',
    range: 'até 35',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  mid: {
    label: 'média',
    range: 'entre 35 e 65',
    badgeClass: 'bg-warning/10 text-warning border-warning/30',
  },
  high: {
    label: 'alta',
    range: 'acima de 65',
    badgeClass: 'bg-success/10 text-success border-success/30',
  },
};

/**
 * Drawer universal "Por que esse score?". Mostra fatores ponderados,
 * recomendações e captura feedback do usuário (👍/👎) em localStorage
 * para futuro retraining.
 */
export function WhyScoreDrawer({
  open,
  onOpenChange,
  scoreKey,
  title,
  subtitle,
  score,
  factors,
  recommendations = [],
  band,
}: WhyScoreDrawerProps) {
  const resolvedBand = band ?? deriveBand(score);
  const meta = BAND_META[resolvedBand];

  const [feedback, setFeedback] = useState<'up' | 'down' | null>(() => {
    return readFeedback()[scoreKey] ?? null;
  });

  const initialExplanation = useMemo<ExplanationFeedbackEntry | null>(() => {
    return readExplanationFeedback()[scoreKey] ?? null;
  }, [scoreKey]);
  const [explanationFeedback, setExplanationFeedback] = useState<ExplanationFeedbackValue | null>(
    initialExplanation?.value ?? null,
  );
  const [explanationComment, setExplanationComment] = useState<string>(initialExplanation?.comment ?? '');
  const [showCommentBox, setShowCommentBox] = useState<boolean>(false);

  const rankedFactors = useMemo(() => {
    const sorted = [...factors].sort((a, b) => b.weight * b.score - a.weight * a.score);
    const totalContribution = sorted.reduce((sum, f) => sum + f.weight * f.score, 0);
    const totalWeight = sorted.reduce((sum, f) => sum + f.weight, 0);
    return sorted.map((f, i) => {
      const contribution = f.weight * f.score;
      const contributionPct = totalContribution > 0 ? (contribution / totalContribution) * 100 : 0;
      const normalizedWeightPct = totalWeight > 0 ? (f.weight / totalWeight) * 100 : 0;
      const effectiveDirection: WhyScoreDirection = f.direction ?? inferDirection(f.score);
      const factorBand = getFactorBand(f.score);
      return { ...f, contribution, contributionPct, normalizedWeightPct, rank: i + 1, effectiveDirection, factorBand };
    });
  }, [factors]);

  const directionCounts = useMemo(() => {
    return rankedFactors.reduce(
      (acc, f) => {
        acc[f.effectiveDirection] += 1;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 } as Record<WhyScoreDirection, number>,
    );
  }, [rankedFactors]);

  const submitFeedback = (value: 'up' | 'down') => {
    setFeedback(value);
    const all = readFeedback();
    all[scoreKey] = value;
    writeFeedback(all);
    toast.success(value === 'up' ? 'Feedback registrado: score correto' : 'Feedback registrado: score incorreto', {
      description: 'Usaremos esse sinal para refinar o modelo localmente.',
    });
  };

  const persistExplanationFeedback = (value: ExplanationFeedbackValue, comment: string) => {
    const all = readExplanationFeedback();
    all[scoreKey] = {
      value,
      comment: comment.trim() ? comment.trim() : undefined,
      updatedAt: new Date().toISOString(),
    };
    writeExplanationFeedback(all);
  };

  const submitExplanationFeedback = (value: ExplanationFeedbackValue) => {
    setExplanationFeedback(value);
    setShowCommentBox(true);
    persistExplanationFeedback(value, explanationComment);
    toast.success(
      value === 'makes_sense'
        ? 'Obrigado! Marcamos a explicação como coerente.'
        : 'Anotado. Conte o que ficou estranho para melhorarmos.',
      { description: 'Salvo localmente neste contato.' },
    );
  };

  const saveExplanationComment = () => {
    if (!explanationFeedback) return;
    persistExplanationFeedback(explanationFeedback, explanationComment);
    setShowCommentBox(false);
    toast.success('Comentário salvo neste contato.');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className={cn('h-5 w-5', meta.cls)} aria-hidden="true" />
            Por que esse score?
          </SheetTitle>
          <SheetDescription>{subtitle ?? title}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{title}</span>
              <Badge variant="outline" className={cn('font-semibold', meta.cls)}>
                {meta.label}
              </Badge>
            </div>
            <p className={cn('text-3xl font-bold mt-1', meta.cls)}>
              {Math.round(score)}
              <span className="text-base text-muted-foreground">/100</span>
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" aria-hidden="true" />
              Fatores que contribuíram
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex" aria-label="Sobre a ordenação dos fatores">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs">
                    Ordenados pela contribuição real (peso × score). Cada fator mostra direção (favorece/prejudica/neutro) e banda da nota: <strong>baixa</strong> (até 35), <strong>média</strong> (35–65) e <strong>alta</strong> (acima de 65).
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h4>
            {rankedFactors.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Sem fatores detalhados disponíveis para esse score.
              </p>
            )}
            {rankedFactors.length > 0 && (directionCounts.positive + directionCounts.negative + directionCounts.neutral) > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground" aria-label="Resumo de direção dos fatores">
                {directionCounts.positive > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-success" aria-hidden="true" />
                    {directionCounts.positive} favorecendo
                  </span>
                )}
                {directionCounts.negative > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-destructive" aria-hidden="true" />
                    {directionCounts.negative} prejudicando
                  </span>
                )}
                {directionCounts.neutral > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Minus className="h-3 w-3" aria-hidden="true" />
                    {directionCounts.neutral} neutro
                  </span>
                )}
              </div>
            )}
            {rankedFactors.map((f) => {
              const contribInt = Math.round(f.contribution);
              const contribPctInt = Math.round(f.contributionPct);
              const dirMeta = DIRECTION_META[f.effectiveDirection];
              const DirIcon = dirMeta.icon;
              const rankBadge =
                f.rank === 1 ? (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    #1 maior impacto
                  </Badge>
                ) : f.rank === 2 || f.rank === 3 ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    #{f.rank}
                  </Badge>
                ) : null;
              const contribLabel =
                f.effectiveDirection === 'positive'
                  ? 'Está ajudando'
                  : f.effectiveDirection === 'negative'
                    ? 'Está prejudicando'
                    : 'Contribuição';

              const bandMeta = FACTOR_BAND_META[f.factorBand];
              const normWeightInt = Math.round(f.normalizedWeightPct);
              const rawWeightInt = Math.round(f.weight * 100);
              const scoreInt = Math.round(f.score);

              return (
                <div key={f.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="truncate">{f.label}</span>
                      {rankBadge}
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0 gap-1 font-normal', dirMeta.badgeClass)}
                        aria-label={`Este fator ${dirMeta.verb.toLowerCase()} o score`}
                      >
                        <DirIcon className="h-2.5 w-2.5" aria-hidden="true" />
                        {dirMeta.label}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0 font-normal cursor-help', bandMeta.badgeClass)}
                              aria-label={`Banda ${bandMeta.label}: score ${scoreInt} ${bandMeta.range}`}
                            >
                              Banda: {bandMeta.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[240px] text-xs">
                            Cortes da banda: <strong>baixa</strong> até 35, <strong>média</strong> de 35 a 65, <strong>alta</strong> acima de 65. Este fator atingiu <strong>{scoreInt}</strong>, caindo na banda <strong>{bandMeta.label}</strong>.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground shrink-0 cursor-help">
                            {scoreInt}/100 · representa {normWeightInt}% do total
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[240px] text-xs">
                          Peso normalizado entre os fatores listados: <strong>{normWeightInt}%</strong>. Peso bruto configurado: <strong>{rawWeightInt}%</strong>.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Progress
                    value={f.score}
                    className="h-2"
                    indicatorClassName={BAND_META[deriveBand(f.score)].indicator}
                    aria-label={`Qualidade do fator: ${Math.round(f.score)}/100`}
                  />
                  <Progress
                    value={f.contributionPct}
                    className="h-1 bg-muted"
                    indicatorClassName="bg-primary/60"
                    aria-label={`Contribuição relativa: ${contribPctInt}% do score total`}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {contribLabel}: <span className="font-medium text-foreground/80">{contribInt} pts</span> ({contribPctInt}% do total)
                  </p>
                  {f.detail && <p className="text-[11px] text-muted-foreground">{f.detail}</p>}
                </div>
              );
            })}
          </div>

          {recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Recomendações</h4>
              <ul className="space-y-2">
                {recommendations.map((r, i) => (
                  <li
                    key={i}
                    className="text-xs leading-relaxed p-2 rounded-md bg-muted/50 border border-border/50"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold">Esse score parece correto?</h4>
            <p className="text-xs text-muted-foreground">
              Seu feedback nos ajuda a calibrar o modelo. Fica salvo localmente.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={feedback === 'up' ? 'default' : 'outline'}
                size="sm"
                onClick={() => submitFeedback('up')}
                className="gap-1.5"
                aria-pressed={feedback === 'up'}
              >
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                Correto
              </Button>
              <Button
                type="button"
                variant={feedback === 'down' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => submitFeedback('down')}
                className="gap-1.5"
                aria-pressed={feedback === 'down'}
              >
                <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
                Incorreto
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              A explicação faz sentido?
            </h4>
            <p className="text-xs text-muted-foreground">
              Avalie se os fatores acima refletem bem este contato. Salvo por contato e usado para refinar o que mostramos aqui.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={explanationFeedback === 'makes_sense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => submitExplanationFeedback('makes_sense')}
                className="gap-1.5"
                aria-pressed={explanationFeedback === 'makes_sense'}
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Faz sentido
              </Button>
              <Button
                type="button"
                variant={explanationFeedback === 'does_not_make_sense' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => submitExplanationFeedback('does_not_make_sense')}
                className="gap-1.5"
                aria-pressed={explanationFeedback === 'does_not_make_sense'}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Não faz sentido
              </Button>
            </div>

            {explanationFeedback && !showCommentBox && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>
                  {explanationFeedback === 'makes_sense'
                    ? '✓ Marcado como coerente para este contato.'
                    : '✗ Marcado como incoerente para este contato.'}
                  {explanationComment && <span className="block italic mt-0.5">"{explanationComment}"</span>}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  onClick={() => setShowCommentBox(true)}
                >
                  {explanationComment ? 'Editar comentário' : 'Adicionar comentário'}
                </Button>
              </div>
            )}

            {explanationFeedback && showCommentBox && (
              <div className="space-y-2 pt-1">
                <Textarea
                  value={explanationComment}
                  onChange={(e) => setExplanationComment(e.target.value)}
                  placeholder={
                    explanationFeedback === 'does_not_make_sense'
                      ? 'O que ficou estranho? Ex.: "recência não deveria pesar tanto"'
                      : 'Quer adicionar algo? (opcional)'
                  }
                  rows={2}
                  className="text-xs resize-none"
                  maxLength={280}
                  aria-label="Comentário sobre a explicação do score"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCommentBox(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" size="sm" onClick={saveExplanationComment}>
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
