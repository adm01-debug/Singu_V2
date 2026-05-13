import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, AlertCircle, User, FlaskConical } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useFicha360 } from '@/hooks/useFicha360';
import { useFicha360Filters } from '@/hooks/useFicha360Filters';
import { useFicha360DraftFilters } from '@/hooks/useFicha360DraftFilters';
import { useFicha360FilterShortcuts } from '@/hooks/useFicha360FilterShortcuts';
import { useFicha360ChannelCounts } from '@/hooks/useFicha360ChannelCounts';
import { PerfilComportamentalCard } from '@/components/ficha-360/PerfilComportamentalCard';
import { TagsInteresseCard } from '@/components/ficha-360/TagsInteresseCard';
import { HistoricoTagsCard } from '@/components/ficha-360/HistoricoTagsCard';
import { DadosPessoaisCard } from '@/components/ficha-360/DadosPessoaisCard';
import { FrequenciaContatoCard } from '@/components/ficha-360/FrequenciaContatoCard';
import { UltimasInteracoesCard } from '@/components/ficha-360/UltimasInteracoesCard';
import { ConversasRelacionadasCard } from '@/components/ficha-360/ConversasRelacionadasCard';
import { FiltrosInteracoesBar } from '@/components/ficha-360/FiltrosInteracoesBar';
import { FiltrosAtivosChips } from '@/components/ficha-360/FiltrosAtivosChips';
import { FavoritosFiltrosMenu } from '@/components/ficha-360/FavoritosFiltrosMenu';
import { ContagemPorTipoBar } from '@/components/ficha-360/ContagemPorTipoBar';
import { CopiarLinkFiltrosButton } from '@/components/ficha-360/CopiarLinkFiltrosButton';
import { OrdenacaoToggle } from '@/components/ficha-360/OrdenacaoToggle';
import { FiltroTagsDropdown } from '@/components/ficha-360/FiltroTagsDropdown';
import { GerarResumoIAButton } from '@/components/ficha-360/GerarResumoIAButton';
import { ResumoConversaIADialog } from '@/components/ficha-360/ResumoConversaIADialog';
import { countByTag, interactionMatchesTags } from '@/lib/interactionTags';
import { useFicha360Sort } from '@/hooks/useFicha360Sort';
import { sortInteractions } from '@/lib/sortInteractions';
import { AplicarFavoritoCompartilhadoDialog } from '@/components/ficha-360/AplicarFavoritoCompartilhadoDialog';
import { useFicha360DeeplinkToast } from '@/hooks/useFicha360DeeplinkToast';
import { useFicha360FilterFavorites, suggestFavoriteName, type FilterFavorite } from '@/hooks/useFicha360FilterFavorites';
 import { RelatoriosFixosBar } from '@/components/ficha-360/RelatoriosFixosBar';
 import { NLPAnalysisCard } from '@/components/ficha-360/NLPAnalysisCard';
 import { useFicha360NLP } from '@/hooks/useFicha360NLP';
 import { FileText, Printer } from 'lucide-react';
import type { Ficha360Period } from '@/hooks/useFicha360Filters';
import { ScoreProntidaoCard } from '@/components/ficha-360/ScoreProntidaoCard';
import { ProximaAcaoCTA } from '@/components/ficha-360/ProximaAcaoCTA';
import { ProximosPassosCard } from '@/components/ficha-360/ProximosPassosCard';
import { ProntidaoTrendChart } from '@/components/ficha-360/ProntidaoTrendChart';
import { ProntidaoFactorBreakdownChart } from '@/components/ficha-360/ProntidaoFactorBreakdownChart';
import { SimulationModePanel } from '@/components/ficha-360/SimulationModePanel';
import { computeProntidaoScore } from '@/domain/leadScoring';
import { computeProntidaoTrend } from '@/domain/churnRisk';
import { computeProximosPassos } from '@/lib/proximosPassos';
import { useProximoPassoFeedbacks } from '@/hooks/useProximoPassoFeedback';
import { applySimulation } from '@/domain/forecastSimulation';
import { useEffectiveProntidaoWeights } from '@/stores/useProntidaoWeightsStore';
import { useSimulationStore } from '@/stores/useSimulationStore';
import { useBestContactTime } from '@/hooks/useBestContactTime';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, X as XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const sentimentClass = (s?: string | null) => {
  const v = (s || '').toLowerCase();
  if (v.includes('pos')) return 'bg-success/15 text-success border-success/30';
  if (v.includes('neg')) return 'bg-destructive/15 text-destructive border-destructive/30';
  return 'bg-muted text-muted-foreground border-border';
};

const Ficha360Skeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-56" />
      <Skeleton className="h-56" />
      <Skeleton className="h-72" />
      <Skeleton className="h-72" />
    </div>
    <Skeleton className="h-32 w-full" />
  </div>
);

const Ficha360 = () => {
  const { id } = useParams<{ id: string }>();
  const { days, channels, q, tags, setDays, setChannels, setQ, setTags, clear, activeCount } = useFicha360Filters();
  const {
    draftDays,
    draftChannels,
    setDraftDays,
    setDraftChannels,
    isDirty: filtersDirty,
    reset: resetDraft,
  } = useFicha360DraftFilters(days, channels);
  const {
    profile,
    intelligence,
    recentInteractions,
    rapportIntel,
    rapportPoints,
    channelCounts,
    isLoading,
    interactionsFetching,
  } = useFicha360(id, { days, channels, interactionsLimit: 50 });
  const {
    counts: potentialChannelCounts,
    totals: tipoTotals,
    filtered: tipoFiltered,
    isFetched: channelCountsReady,
    isLoading: channelCountsLoading,
  } = useFicha360ChannelCounts(id, draftDays, q, channels);

  const applyDraftFilters = () => {
    setDays(draftDays);
    setChannels(draftChannels);
  };
  const clearDraftFilters = () => {
    setDraftDays(90);
    setDraftChannels([]);
  };

  // Aplica um favorito (próprio ou compartilhado): atualiza estado aplicado e draft.
  const applyFavoriteFilters = (favDays: number, favChannels: string[]) => {
    const validDays = ([7, 30, 90, 365] as const).includes(favDays as Ficha360Period)
      ? (favDays as Ficha360Period)
      : 90;
    setDays(validDays);
    setChannels(favChannels);
    setDraftDays(validDays);
    setDraftChannels(favChannels);
  };

  // Busca textual local — input controlado, sincroniza com URL via debounce 200ms.
  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => {
    setSearchInput(q);
  }, [q]);
  const debouncedSearch = useDebounce(searchInput, 200);
  useEffect(() => {
    if (debouncedSearch.trim() !== q) setQ(debouncedSearch);
  }, [debouncedSearch, q, setQ]);

  // Contagens por tag — calculadas sobre o conjunto já filtrado por período/canais
  // (mesma base de Y do ContagemPorTipoBar). Eixo independente da busca livre.
  const tagCounts = useMemo(() => countByTag(recentInteractions), [recentInteractions]);

  const filteredInteractions = useMemo(() => {
    const term = q.trim();
    const norm = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const needle = term ? norm(term) : '';
    
    return recentInteractions.filter((it) => {
      // Channel filtering (including virtual channels)
      if (channels.length > 0) {
        const hasMatch = channels.some(ch => {
          if (ch === 'audio') return !!it.audio_url || it.channel === 'call';
          if (ch === 'transcription') return !!it.transcription;
          return it.channel?.toLowerCase() === ch.toLowerCase();
        });
        if (!hasMatch) return false;
      }

      if (tags.length > 0 && !interactionMatchesTags(it, tags)) return false;
      
      if (!needle) return true;
      
      const haystack = norm(
        [
          it.assunto ?? '', 
          it.resumo ?? '', 
          it.channel ?? '', 
          it.direction ?? '',
          (it as any).transcription ?? ''
        ].join(' '),
      );
      return haystack.includes(needle);
    });
  }, [recentInteractions, q, tags, channels]);

  const { sort, setSort } = useFicha360Sort();

  const sortedInteractions = useMemo(
    () => sortInteractions(filteredInteractions, sort === 'relevante' ? 'relevance' : 'recent', q),
    [filteredInteractions, sort, q],
  );

  // Quando a busca é limpa, "relevante" perde sentido — volta ao default
  // e remove `?ordem` da URL (evita estado fantasma).
  useEffect(() => {
    if (!q.trim() && sort === 'relevante') setSort('recente');
  }, [q, sort, setSort]);

  const hasPeriodChip = days !== 90;

  // Handler de "copiar link" — guardado em ref para o atalho Shift+L sempre
  // ler o estado mais recente sem causar re-registro do listener.
  const copyLinkRef = useRef<() => void>(() => {});
  copyLinkRef.current = () => {
    if (activeCount === 0) return;
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Link copiado', { duration: 2000 }))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Não foi possível copiar o link';
        toast.error(msg);
      });
  };

  // Controle do menu de favoritos (atalho Shift+F abre o popover).
  const [favoritosMenuOpen, setFavoritosMenuOpen] = useState(false);
  const [resumoIAOpen, setResumoIAOpen] = useState(false);
  const [salvarRelatorioOpen, setSalvarRelatorioOpen] = useState(false);
  // Confirmação de "Limpar tudo": evita reset acidental quando o usuário tem
  // múltiplos filtros ativos (período, canais, busca e tags). O atalho Shift+C
  // continua direto — só interceptamos o clique no chip.
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const performClearAll = useCallback(() => {
    setSearchInput('');
    clear();
  }, [clear]);
  const requestClearAll = useCallback(() => {
    // Se só houver 1 filtro ativo, não há ambiguidade — limpa direto.
    if (activeCount <= 1) {
      performClearAll();
      return;
    }
    setConfirmClearOpen(true);
  }, [activeCount, performClearAll]);
  const { quickSave: quickSaveFavorito, findMatch: findFavoritoMatch, canSaveMore: canSaveMoreFavoritos, maxFavorites: maxFavoritos } =
    useFicha360FilterFavorites();

  // Aplica relatório fixo: filtros + (opcionalmente) abre resumo IA.
  const applyRelatorio = (preset: FilterFavorite) => {
    const validDays = ([7, 30, 90, 365] as const).includes(preset.days as Ficha360Period)
      ? (preset.days as Ficha360Period)
      : 90;
    setDays(validDays);
    setChannels(preset.channels);
    setTags(preset.tags);
    setQ(preset.q ?? '');
    setSearchInput(preset.q ?? '');
    setDraftDays(validDays);
    setDraftChannels(preset.channels);
    if (preset.autoOpenSummary !== false) {
      // Aguarda recompute de filteredInteractions antes de abrir
      setTimeout(() => setResumoIAOpen(true), 0);
    }
    toast.success(`Relatório aplicado: "${preset.name}"`, {
      description: preset.description,
      duration: 2200,
    });
  };

  const quickSaveRef = useRef<() => void>(() => {});
  quickSaveRef.current = () => {
    if (days === 90 && channels.length === 0) {
      toast.info('Configure ao menos um filtro antes de salvar.', { duration: 1800 });
      return;
    }
    const existing = findFavoritoMatch(days, channels);
    if (existing) {
      toast.info(`Já existe favorito: "${existing.name}"`, { duration: 1800 });
      return;
    }
    const result = quickSaveFavorito(days, channels);
    if (!result) {
      toast.error(
        !canSaveMoreFavoritos
          ? `Limite de ${maxFavoritos} favoritos atingido.`
          : `Não foi possível salvar (período inválido).`,
      );
      return;
    }
    toast.success(`Favorito salvo: "${result.name}"`, {
      description: suggestFavoriteName(days, channels),
      duration: 2200,
    });
  };

  useFicha360FilterShortcuts({
    days,
    channels,
    q,
    hasPeriodChip,
    enabled: !isLoading && !!profile,
    onClearAll: () => {
      setSearchInput('');
      clear();
      setDraftDays(90);
      setDraftChannels([]);
    },
    onClearPeriod: () => {
      setDays(90);
      setDraftDays(90);
    },
    onClearSearch: () => {
      setSearchInput('');
      setQ('');
    },
    onRemoveChannel: (c) => {
      const next = channels.filter((x) => x !== c);
      setChannels(next);
      setDraftChannels(next);
    },
    onCopyLink: () => copyLinkRef.current(),
    onQuickSaveFavorito: () => quickSaveRef.current(),
    onAbrirFavoritos: () => setFavoritosMenuOpen(true),
    onSortRecente: () => {
      setSort('recente');
      toast.info('Ordenação: mais recente', { duration: 1500 });
    },
    onSortRelevante: () => {
      setSort('relevante');
      toast.info('Ordenação: mais relevante', { duration: 1500 });
    },
    onAbrirResumoIA: () => setResumoIAOpen(true),
    onSalvarRelatorio: () => setSalvarRelatorioOpen(true),
    filteredCount: filteredInteractions.length,
  });

  // Toast informativo quando a página abre com filtros vindos da URL.
  useFicha360DeeplinkToast({
    days,
    channels,
    q,
    activeCount,
    ready: !isLoading && !!profile,
  });

   const { vakProfile, metaprogramProfile, latestReframings, refetch: refetchNLP } = useFicha360NLP(id);
 
   const handleExportPDF = () => {
     window.print();
   };
 
  const weights = useEffectiveProntidaoWeights(id);
  const simEnabled = useSimulationStore((s) => s.enabled);
  const simOverrides = useSimulationStore((s) => s.overrides);
  // Reaproveita cache do ProximaAcaoCTA — zero query nova
  const { data: bestTime } = useBestContactTime(id ?? '', !!id);

  // Score real (sem simulação) — sempre calculado para comparativo no painel
  const realProntidao = useMemo(
    () => computeProntidaoScore({ profile, intelligence, weights }),
    [profile, intelligence, weights],
  );

  // Profile/intel "efetivos" (com simulação aplicada quando ligada)
  const { profile: effectiveProfile, intelligence: effectiveIntel } = useMemo(() => {
    if (!simEnabled) return { profile, intelligence };
    return applySimulation(profile, intelligence, simOverrides);
  }, [simEnabled, simOverrides, profile, intelligence]);

  const prontidao = useMemo(
    () =>
      computeProntidaoScore({
        profile: effectiveProfile,
        intelligence: effectiveIntel,
        weights,
      }),
    [effectiveProfile, effectiveIntel, weights],
  );

  const [trendWeeks, setTrendWeeks] = useState<4 | 8 | 12 | 24>(8);
  const [showFactorBreakdown, setShowFactorBreakdown] = useState(false);
  const [breakdownAsPercent, setBreakdownAsPercent] = useState(false);

  const trend = useMemo(
    () =>
      computeProntidaoTrend({
        interactions: recentInteractions,
        profile: effectiveProfile,
        intelligence: effectiveIntel,
        weights,
        weeks: trendWeeks,
      }),
    [recentInteractions, effectiveProfile, effectiveIntel, weights, trendWeeks],
  );

  const { data: passoFeedbacks = [] } = useProximoPassoFeedbacks(id);

  const feedbackHints = useMemo(() => {
    const seen = new Set<string>();
    const hints: { passoId: string; lastOutcome: 'respondeu_positivo' | 'respondeu_neutro' | 'nao_respondeu' | 'nao_atendeu' | 'pulou'; daysAgo: number }[] = [];
    for (const f of passoFeedbacks) {
      if (seen.has(f.passo_id)) continue;
      seen.add(f.passo_id);
      const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(f.executed_at).getTime()) / 86400000));
      hints.push({ passoId: f.passo_id, lastOutcome: f.outcome, daysAgo });
    }
    return hints;
  }, [passoFeedbacks]);

  const passos = useMemo(
    () =>
      computeProximosPassos({
        profile: effectiveProfile,
        intelligence: effectiveIntel,
        recentInteractions,
        prontidao,
        birthday: rapportIntel?.birthday ?? null,
        email:
          typeof effectiveIntel?.email === 'string' ? (effectiveIntel.email as string) : null,
        feedbackHints,
      }),
    [effectiveProfile, effectiveIntel, recentInteractions, prontidao, rapportIntel, feedbackHints],
  );

  if (!id) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">ID do contato inválido.</p>
          <Button asChild variant="link">
            <Link to="/contatos">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Voltar para contatos
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const fullName = profile?.full_name?.trim() || 'Contato';
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <AppLayout>
      <SEOHead
        title={`Ficha 360 — ${fullName}`}
        description={`Visão consolidada de ${fullName}: perfil, interesses, frequência de contato e conversas relacionadas.`}
      />
      <AplicarFavoritoCompartilhadoDialog onApply={applyFavoriteFilters} />
       <div className="min-h-screen p-4 md:p-6 space-y-4 print:p-0 print:space-y-6">
        <PageHeader
          backTo="/contatos"
          backLabel="Contatos"
          title="Ficha 360"
           actions={
             <div className="flex gap-2 print:hidden">
               <Button variant="outline" size="sm" onClick={handleExportPDF}>
                 <Printer className="h-4 w-4 mr-1.5" />
                 Exportar PDF
               </Button>
               <Button asChild variant="outline" size="sm">
                 <Link to={`/contatos/${id}`}>
                   <ExternalLink className="h-4 w-4 mr-1.5" />
                   Detalhe completo
                 </Link>
               </Button>
             </div>
           }
        />

        {isLoading ? (
          <Ficha360Skeleton />
        ) : (
          <>
            {/* Painel de simulação (sandbox) */}
            <SimulationModePanel
              realScore={realProntidao.score}
              simulatedScore={prontidao.score}
            />

            {/* Banner de aviso quando simulação ativa */}
            {simEnabled && (
              <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning flex items-center gap-2">
                <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Modo de testes ativo — score, breakdown, tendência e próximos passos refletem
                  cenário simulado, não os dados reais. A próxima ação sugerida pela IA continua
                  usando dados reais do CRM.
                </span>
              </div>
            )}

            {/* Header sticky */}
            <Card className="sticky top-0 z-10">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start gap-4 flex-wrap">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={undefined} alt={fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {initials || <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
                      {fullName}
                    </h1>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile?.cargo ? `${profile.cargo}` : 'Cargo não informado'}
                      {profile?.company_name ? ` · ${profile.company_name}` : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge variant="default" className="text-xs">
                        Score: {profile?.relationship_score ?? '—'}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        Estágio: {profile?.relationship_stage ?? '—'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn('text-xs capitalize', sentimentClass(profile?.sentiment))}
                      >
                        {profile?.sentiment ?? 'Sentimento —'}
                      </Badge>
                      {profile?.company_id && (
                        <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <Link to={`/empresas/${profile.company_id}`}>Ver empresa</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <ScoreProntidaoCard
                data={prontidao}
                contactId={id}
                simulated={simEnabled}
                realData={simEnabled ? realProntidao : undefined}
              />
              {id && <ProximaAcaoCTA contactId={id} contactName={fullName} />}
            </div>

            {/* Tendência semanal do Score de Prontidão */}
            <ProntidaoTrendChart
              data={trend}
              currentScore={prontidao.score}
              simulated={simEnabled}
              weeks={trendWeeks}
              onWeeksChange={setTrendWeeks}
              interactions={recentInteractions}
            />

            {/* Toggle: decomposição por fator */}
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="factor-breakdown-toggle"
                  checked={showFactorBreakdown}
                  onCheckedChange={setShowFactorBreakdown}
                />
                <Label
                  htmlFor="factor-breakdown-toggle"
                  className="text-xs font-medium cursor-pointer"
                >
                  Decompor tendência por fator
                </Label>
              </div>
              {showFactorBreakdown && (
                <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5">
                  <button
                    type="button"
                    onClick={() => setBreakdownAsPercent(false)}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      !breakdownAsPercent
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-pressed={!breakdownAsPercent}
                  >
                    pts
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakdownAsPercent(true)}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      breakdownAsPercent
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-pressed={breakdownAsPercent}
                  >
                    %
                  </button>
                </div>
              )}
            </div>

            {/* Decomposição por fator (cadência, recência, sentimento, canal) */}
            {showFactorBreakdown && (
              <ProntidaoFactorBreakdownChart data={trend} asPercent={breakdownAsPercent} />
            )}

            {/* Grid 2 colunas */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-4">
                  <PerfilComportamentalCard profile={profile} />
                  <NLPAnalysisCard 
                    contactId={id!} 
                    vakProfile={vakProfile} 
                    metaprogramProfile={metaprogramProfile} 
                    reframings={latestReframings}
                    onRefetch={refetchNLP}
                  />
                </div>
                <TagsInteresseCard rapportIntel={rapportIntel} rapportPoints={rapportPoints} />
                <HistoricoTagsCard contactId={id} />
                <DadosPessoaisCard rapportIntel={rapportIntel} />
              </div>
              <div className="space-y-4">
                <FrequenciaContatoCard profile={profile} intelligence={intelligence} />
                <ProximosPassosCard
                  contactId={id}
                  contactName={fullName}
                  passos={passos}
                  bestTime={bestTime}
                  firstName={effectiveProfile?.first_name ?? fullName.split(' ')[0]}
                  sentiment={(effectiveProfile?.sentiment ?? null) as 'positivo' | 'neutro' | 'negativo' | 'misto' | null}
                  companyId={profile?.company_id ?? null}
                  preferredChannel={intelligence?.best_channel ?? null}
                />
                <UltimasInteracoesCard
                  interactions={sortedInteractions}
                  contactId={id}
                  filtersActive={activeCount > 0}
                  isLoading={interactionsFetching}
                  days={days}
                  channels={channels}
                  q={q}
                  headerExtra={
                    <>
                      <RelatoriosFixosBar
                        days={days}
                        channels={channels}
                        tags={tags}
                        q={q}
                        onApply={applyRelatorio}
                        saveDialogOpen={salvarRelatorioOpen}
                        onSaveDialogOpenChange={setSalvarRelatorioOpen}
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        <GerarResumoIAButton
                          count={filteredInteractions.length}
                          onClick={() => setResumoIAOpen(true)}
                        />
                        <FavoritosFiltrosMenu
                          days={days}
                          channels={channels}
                          onApply={applyFavoriteFilters}
                          open={favoritosMenuOpen}
                          onOpenChange={setFavoritosMenuOpen}
                        />
                        <CopiarLinkFiltrosButton
                          days={days}
                          channels={channels}
                          q={q}
                          activeCount={activeCount}
                        />
                        <OrdenacaoToggle
                          sort={sort}
                          onChange={setSort}
                          hasQuery={!!q.trim()}
                        />
                        <FiltroTagsDropdown
                          selected={tags}
                          onChange={setTags}
                          counts={tagCounts}
                        />
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Buscar por assunto, resumo, canal…"
                            className="h-8 pl-8 pr-8 text-sm max-w-xs"
                            aria-label="Buscar interações"
                          />
                          {searchInput && (
                            <button
                              type="button"
                              onClick={() => setSearchInput('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                              aria-label="Limpar busca"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <FiltrosInteracoesBar
                        days={draftDays}
                        channels={draftChannels}
                        onDaysChange={setDraftDays}
                        onChannelsChange={setDraftChannels}
                        onClear={clearDraftFilters}
                        activeCount={activeCount}
                        shownCount={filteredInteractions.length}
                        totalCount={channelCounts.total}
                        channelCounts={potentialChannelCounts}
                        channelCountsReady={channelCountsReady}
                        isDirty={filtersDirty}
                        onApply={applyDraftFilters}
                        onDiscard={resetDraft}
                      />
                      <ContagemPorTipoBar
                        totals={tipoTotals}
                        filtered={tipoFiltered}
                        isLoading={channelCountsLoading}
                      />
                      <FiltrosAtivosChips
                        days={days}
                        channels={channels}
                        tags={tags}
                        shownCount={filteredInteractions.length}
                        totalCount={channelCounts.total}
                        searchTerm={q}
                        searchMatchCount={filteredInteractions.length}
                        onRemoveDays={() => setDays(90)}
                        onRemoveChannel={(c) => setChannels(channels.filter((x) => x !== c))}
                        onRemoveTag={(t) => setTags(tags.filter((x) => x !== t))}
                        onRemoveSearch={() => {
                          setSearchInput('');
                          setQ('');
                        }}
                        onClearAll={requestClearAll}
                      />
                    </>
                  }
                />
              </div>
            </div>

            <ConversasRelacionadasCard contactId={id} channelCounts={channelCounts} companyId={profile?.company_id ?? null} />
          </>
        )}
      </div>
      {id && (
        <ResumoConversaIADialog
          open={resumoIAOpen}
          onOpenChange={setResumoIAOpen}
          contactId={id}
          interactions={sortedInteractions.map((it) => ({
            id: it.id,
            channel: it.channel ?? null,
            direction: it.direction ?? null,
            data_interacao: it.data_interacao ?? null,
            assunto: it.assunto ?? null,
            resumo: it.resumo ?? null,
          }))}
          contactSnapshot={{
            full_name: fullName,
            role_title: profile?.cargo ?? null,
            company_name: profile?.company_name ?? null,
            disc_profile: null,
            hobbies: [],
            interests: [],
          }}
          filtersSummary={{
            period_days: days,
            channels,
            tags,
            query: q,
          }}
        />
      )}
      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todos os filtros?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai desativar {channels.length > 0 ? `${channels.length} canal${channels.length === 1 ? '' : 'is'}` : 'os canais'}
              {tags.length > 0 ? `, remover ${tags.length} tag${tags.length === 1 ? '' : 's'}` : ''}
              {q ? ', limpar a busca' : ''}
              {days !== 90 ? ' e voltar o período para 90 dias' : ''}.
              Os parâmetros serão removidos da URL — links já compartilhados continuam funcionando.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performClearAll}>Limpar tudo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Ficha360;
