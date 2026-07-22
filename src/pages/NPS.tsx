import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Star, TrendingUp, MessageCircle, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNpsSurveys, type CsatSurvey } from '@/hooks/useNpsSurveys';
import { SendSurveyDialog } from '@/components/nps/SendSurveyDialog';
import { AnswerSurveyDialog } from '@/components/nps/AnswerSurveyDialog';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function npsCategory(score: number | null): { label: string; cls: string } {
  if (score == null) return { label: '—', cls: 'text-muted-foreground' };
  if (score >= 9) return { label: 'Promotor', cls: 'text-success' };
  if (score >= 7) return { label: 'Neutro', cls: 'text-warning' };
  return { label: 'Detrator', cls: 'text-destructive' };
}

export default function NPS() {
  const { surveys, metrics, isLoading, deleteSurvey } = useNpsSurveys();
  const [sendOpen, setSendOpen] = useState(false);
  const [answering, setAnswering] = useState<CsatSurvey | null>(null);
  const [tab, setTab] = useState('all');

  const filtered = surveys.filter(s => {
    if (tab === 'pending') return s.status === 'sent';
    if (tab === 'answered') return s.status === 'answered';
    if (tab === 'promoters') return s.status === 'answered' && (s.score ?? 0) >= 9;
    if (tab === 'detractors') return s.status === 'answered' && (s.score ?? 0) <= 6;
    return true;
  });

  const npsColor = metrics.npsScore >= 50 ? 'text-success' : metrics.npsScore >= 0 ? 'text-warning' : 'text-destructive';
  const npsLabel = metrics.npsScore >= 75 ? 'Excelente' : metrics.npsScore >= 50 ? 'Ótimo' : metrics.npsScore >= 0 ? 'Bom' : 'Crítico';

  return (
    <AppLayout>
      <Helmet>
        <title>NPS & CSAT | SINGU</title>
        <meta name="description" content="Pesquisas de satisfação NPS e CSAT, análise de promotores, detratores e feedback de clientes." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <PageHeader
          backTo="/"
          backLabel="Dashboard"
          title="NPS & Satisfação"
          actions={
            <Button size="sm" onClick={() => setSendOpen(true)} className="h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Nova Pesquisa
            </Button>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-[10px] text-muted-foreground uppercase">NPS Score</div>
              <div className={cn('text-3xl font-bold tabular-nums', npsColor)}>{metrics.npsScore}</div>
              <div className="text-[10px] text-muted-foreground">{npsLabel}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Promotores</div>
              <div className="text-2xl font-bold text-success tabular-nums">{metrics.promoters}</div>
              <div className="text-[10px] text-muted-foreground">9-10</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Neutros</div>
              <div className="text-2xl font-bold text-warning tabular-nums">{metrics.passives}</div>
              <div className="text-[10px] text-muted-foreground">7-8</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Detratores</div>
              <div className="text-2xl font-bold text-destructive tabular-nums">{metrics.detractors}</div>
              <div className="text-[10px] text-muted-foreground">0-6</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Taxa Resposta</div>
              <div className="text-2xl font-bold text-primary tabular-nums">{metrics.responseRate}%</div>
              <div className="text-[10px] text-muted-foreground">{metrics.answered}/{metrics.total}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs + Lista */}
        <Card>
          <CardContent className="p-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs h-6">Todas ({metrics.total})</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs h-6">Pendentes ({metrics.pending})</TabsTrigger>
                <TabsTrigger value="answered" className="text-xs h-6">Respondidas ({metrics.answered})</TabsTrigger>
                <TabsTrigger value="promoters" className="text-xs h-6">Promotores ({metrics.promoters})</TabsTrigger>
                <TabsTrigger value="detractors" className="text-xs h-6">Detratores ({metrics.detractors})</TabsTrigger>
              </TabsList>
              <TabsContent value={tab} className="mt-3">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 rounded bg-muted animate-pulse" />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma pesquisa nesta categoria</p>
                    <Button size="sm" onClick={() => setSendOpen(true)} className="mt-3 h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Enviar primeira pesquisa
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map(s => {
                      const cat = npsCategory(s.score);
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded border border-border hover:bg-muted/30 transition">
                          <div className="flex-shrink-0">
                            {s.status === 'answered' ? (
                              <div className={cn('h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm', cat.cls, 'bg-current/10')}>
                                <span className={cat.cls}>{s.score}</span>
                              </div>
                            ) : (
                              <Clock className="h-10 w-10 text-muted-foreground/40 p-2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium">Contato: {s.contact_id.slice(0, 8)}…</span>
                              <Badge variant="outline" className="text-[10px] h-4">{s.channel ?? '—'}</Badge>
                              {s.status === 'answered' && (
                                <Badge variant="secondary" className={cn('text-[10px] h-4', cat.cls)}>{cat.label}</Badge>
                              )}
                            </div>
                            {s.feedback && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1"><MessageCircle className="h-3 w-3" />{s.feedback}</p>}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {s.answered_at
                                ? `Respondida ${formatDistanceToNow(new Date(s.answered_at), { locale: ptBR, addSuffix: true })}`
                                : s.sent_at
                                  ? `Enviada ${formatDistanceToNow(new Date(s.sent_at), { locale: ptBR, addSuffix: true })}`
                                  : format(new Date(s.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {s.status === 'sent' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAnswering(s)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Registrar
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" aria-label="Excluir pesquisa NPS" onClick={() => deleteSurvey(s.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Insight breakdown */}
        {metrics.answered > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Distribuição</h3>
                <Badge variant="outline" className="text-[10px]">Média {metrics.avgScore}/10</Badge>
              </div>
              <div className="flex h-3 rounded overflow-hidden bg-muted">
                {metrics.detractors > 0 && (
                  <div className="bg-destructive" style={{ width: `${(metrics.detractors / metrics.answered) * 100}%` }} title={`${metrics.detractors} detratores`} />
                )}
                {metrics.passives > 0 && (
                  <div className="bg-warning" style={{ width: `${(metrics.passives / metrics.answered) * 100}%` }} title={`${metrics.passives} neutros`} />
                )}
                {metrics.promoters > 0 && (
                  <div className="bg-success" style={{ width: `${(metrics.promoters / metrics.answered) * 100}%` }} title={`${metrics.promoters} promotores`} />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>{Math.round((metrics.detractors / metrics.answered) * 100)}% Detratores</span>
                <span>{Math.round((metrics.passives / metrics.answered) * 100)}% Neutros</span>
                <span>{Math.round((metrics.promoters / metrics.answered) * 100)}% Promotores</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <SendSurveyDialog open={sendOpen} onOpenChange={setSendOpen} />
      <AnswerSurveyDialog survey={answering} onOpenChange={(o) => !o && setAnswering(null)} />
    </AppLayout>
  );
}
