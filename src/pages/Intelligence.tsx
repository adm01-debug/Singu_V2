import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Network, User, GitCompare, MessageSquare, Activity, Command, Camera } from 'lucide-react';
import { GraphTab } from '@/components/intelligence/GraphTab';
import { Entity360Tab, type Entity360Handle } from '@/components/intelligence/Entity360Tab';
import { CrossRefTab } from '@/components/intelligence/CrossRefTab';
import { AskTab } from '@/components/intelligence/AskTab';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { IntelStatusBar } from '@/components/intel/IntelStatusBar';
import { IntelCommandPalette } from '@/components/intel/IntelCommandPalette';
import { IntelDensityToggle } from '@/components/intel/IntelDensityToggle';
import { IntelPresentationToggle } from '@/components/intel/IntelPresentationToggle';
import { IntelThemeToggle } from '@/components/intel/IntelThemeToggle';
import { IntelTourOverlay } from '@/components/intel/IntelTourOverlay';
import { PinnedEntitiesPanel } from '@/components/intel/PinnedEntitiesPanel';
import { RecentSnapshotsPanel } from '@/components/intel/RecentSnapshotsPanel';
import { KeyboardMapOverlay } from '@/components/intel/KeyboardMapOverlay';
import { IntelHealthPanel } from '@/components/intel/IntelHealthPanel';
import { useIntelTelemetry, useIntelTabView } from '@/hooks/useIntelTelemetry';
import { useIntelHotkeys } from '@/hooks/useIntelHotkeys';
import { useIntelSnapshots } from '@/hooks/useIntelSnapshots';
import { decodeSnapshot, buildShareUrl } from '@/lib/intelSnapshot';
import type { HistoryEntry } from '@/hooks/useEntityHistory';
import type { EntityBookmark } from '@/hooks/useEntityBookmarks';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';

const TABS = [
  { value: 'graph', label: 'Graph', icon: Network, hotkey: 'G' },
  { value: 'entity', label: 'Entity 360', icon: User, hotkey: 'E' },
  { value: 'crossref', label: 'Cross-Ref', icon: GitCompare, hotkey: 'C' },
  { value: 'ask', label: 'Ask', icon: MessageSquare, hotkey: 'A' },
] as const;

type TabValue = typeof TABS[number]['value'];

const isValidTab = (v: string | null): v is TabValue =>
  !!v && TABS.some((t) => t.value === v);

const Intelligence = () => {
  usePageTitle('Intelligence Hub');
  const [params, setParams] = useSearchParams();
  const tabFromUrl = params.get('tab');
  const tab: TabValue = isValidTab(tabFromUrl) ? tabFromUrl : 'graph';
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
  const [sessionId] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const [contextEntity, setContextEntity] = useState<HistoryEntry | null>(null);
  const { log } = useIntelTelemetry();
  useIntelTabView(tab, log);
  const { create: createSnapshot } = useIntelSnapshots();

  const setTab = useCallback(
    (next: string) => {
      const np = new URLSearchParams(params);
      np.set('tab', next);
      setParams(np, { replace: true });
    },
    [params, setParams]
  );

  useIntelHotkeys(setTab);

  const entityRef = useRef<Entity360Handle | null>(null);
  const askBridgeRef = useRef<{
    clear: () => void;
    exportLast: () => void;
    help: () => void;
    run: (q: string) => void;
  } | null>(null);

  const registerAskBridge = useCallback(
    (bridge: { clear: () => void; exportLast: () => void; help: () => void; run: (q: string) => void }) => {
      askBridgeRef.current = bridge;
    },
    []
  );

  const openBookmark = useCallback((b: EntityBookmark) => {
    setTab('entity');
    requestAnimationFrame(() => entityRef.current?.open(b));
  }, [setTab]);

  const focusInGraph = useCallback((b: EntityBookmark) => {
    const np = new URLSearchParams(params);
    np.set('tab', 'graph');
    np.set('focusType', b.type);
    np.set('focusId', b.id);
    setParams(np, { replace: true });
    toast.success(`Focando ${b.name} no Graph.`);
  }, [params, setParams]);

  const handleSnapshot = useCallback(() => {
    const current = entityRef.current?.getCurrent() ?? null;
    if (current) setContextEntity(current);
    const paramsObj: Record<string, string> = {};
    params.forEach((v, k) => {
      if (k !== 'snap') paramsObj[k] = v;
    });
    const currentNameSuffix = current ? ` · ${current.name}` : '';
    const label = `${tab.toUpperCase()}${currentNameSuffix}`;
    const hash = createSnapshot(
      { tab, params: paramsObj, entity: current, ts: Date.now() },
      label,
    );
    navigator.clipboard.writeText(buildShareUrl(hash)).then(
      () => toast.success('Snapshot salvo e link copiado.'),
      () => toast.success('Snapshot salvo (copie o link no painel).'),
    );
    log({ kind: 'command', label: '/snapshot' });
  }, [tab, params, createSnapshot, log]);

  const applySnapshot = useCallback((hash: string) => {
    const payload = decodeSnapshot(hash);
    if (!payload) {
      toast.error('Snapshot inválido.');
      return;
    }
    const np = new URLSearchParams(payload.params);
    np.set('tab', payload.tab);
    setParams(np, { replace: true });
    if (payload.entity) {
      setContextEntity({
        type: payload.entity.type as HistoryEntry['type'],
        id: payload.entity.id,
        name: payload.entity.name,
      });
      requestAnimationFrame(() => {
        entityRef.current?.open({
          type: payload.entity!.type as HistoryEntry['type'],
          id: payload.entity!.id,
          name: payload.entity!.name,
        });
      });
    }
    toast.success('Snapshot aplicado.');
  }, [setParams]);

  // Aplicar snapshot vindo da URL ?snap=
  const snapHash = params.get('snap');
  useMemo(() => {
    if (!snapHash) return;
    const payload = decodeSnapshot(snapHash);
    if (!payload) return;
    const np = new URLSearchParams(payload.params);
    np.set('tab', payload.tab);
    setParams(np, { replace: true });
    if (payload.entity) {
      const entry: HistoryEntry = {
        type: payload.entity.type as HistoryEntry['type'],
        id: payload.entity.id,
        name: payload.entity.name,
      };
      setContextEntity(entry);
      requestAnimationFrame(() => entityRef.current?.open(entry));
    }
  }, [snapHash, setParams]);

  const tabComponents = useMemo(
    () => ({
      graph: <GraphTab />,
      entity: <Entity360Tab ref={entityRef} />,
      crossref: <CrossRefTab />,
      ask: <AskTab onRegisterBridge={registerAskBridge} contextEntity={contextEntity} />,
    }),
    [registerAskBridge, contextEntity]
  );

  // Atualiza contextEntity quando a aba entity está ativa (snapshot diário do current)
  const refreshContextOnTabSwitch = useCallback(() => {
    const cur = entityRef.current?.getCurrent() ?? null;
    if (cur) setContextEntity(cur);
  }, []);

  const handleTabChange = useCallback((next: string) => {
    refreshContextOnTabSwitch();
    setTab(next);
  }, [refreshContextOnTabSwitch, setTab]);

  return (
    <AppLayout>
      <SEOHead
        title="Intelligence Hub"
        description="Centro de inteligência: grafo, entidade 360, cruzamentos e busca natural"
      />
      <a href="#intel-main" className="intel-skip-link">Pular para o conteúdo</a>
      <KeyboardMapOverlay />
      <IntelTourOverlay />
      <IntelCommandPalette
        onChangeTab={setTab}
        onClearAsk={() => {
          if (askBridgeRef.current) {
            askBridgeRef.current.clear();
          } else {
            setTab('ask');
            toast.info('Abra a aba Ask para limpar o console.');
          }
        }}
        onExportAsk={() => {
          if (askBridgeRef.current) askBridgeRef.current.exportLast();
          else toast.info('Abra a aba Ask para exportar.');
        }}
        onHelp={() => askBridgeRef.current?.help()}
      />
      <div className="intel-surface min-h-screen">
        <div className="intel-grid-bg">
          <div className="px-4 md:px-6 py-4 md:py-6 max-w-[1600px] mx-auto">
            <header className="flex items-center justify-between mb-4 pb-3 border-b border-border gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-sm border border-[hsl(var(--intel-accent))] bg-[hsl(var(--intel-accent)/0.1)] flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-[hsl(var(--intel-accent))]" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base md:text-lg font-semibold text-foreground tracking-tight">
                      INTELLIGENCE_HUB
                    </h1>
                    <IntelBadge severity="ok">LIVE</IntelBadge>
                  </div>
                  <p className="intel-mono text-[10px] text-muted-foreground hidden sm:block" data-intel-hide-pres="true">
                    OPERATIONAL_VIEW · {new Date().toISOString().slice(0, 19).replace('T', ' ')}Z
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSnapshot}
                  className="h-7 intel-mono text-[10px] gap-1.5"
                  aria-label="Salvar snapshot da sessão"
                  title="Snapshot do estado atual"
                >
                  <Camera className="h-3 w-3" aria-hidden /> SNAPSHOT
                </Button>
                <IntelPresentationToggle />
                <IntelDensityToggle />
                <IntelThemeToggle />
                <span className="intel-eyebrow flex items-center gap-1" data-intel-hide-pres="true">
                  <Command className="h-3 w-3" aria-hidden /> CTRL+P
                </span>
                <span className="intel-eyebrow" data-intel-hide-pres="true">SESSION</span>
                <span className="intel-mono text-xs text-foreground" data-intel-hide-pres="true">{sessionId}</span>
              </div>
            </header>

            <main id="intel-main" className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
              <div>
                <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
                    {TABS.map((t) => {
                      const Icon = t.icon;
                      return (
                        <TabsTrigger
                          key={t.value}
                          value={t.value}
                          className="intel-mono text-[11px] uppercase gap-1.5"
                          title={`${t.label} (${t.hotkey})`}
                        >
                          <Icon className="h-3 w-3" aria-hidden /> {t.label}
                          <span className="ml-1 opacity-60 hidden sm:inline">[{t.hotkey}]</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  <AnimatePresence mode="wait">
                    {TABS.map((t) =>
                      tab === t.value ? (
                        <TabsContent key={t.value} value={t.value} forceMount>
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                          >
                            <DashboardErrorBoundary sectionName={t.label}>
                              {tabComponents[t.value]}
                            </DashboardErrorBoundary>
                          </motion.div>
                        </TabsContent>
                      ) : null
                    )}
                  </AnimatePresence>
                </Tabs>
              </div>

              <aside className="hidden lg:block space-y-3" data-intel-aside="pinned">
                <PinnedEntitiesPanel onOpen={openBookmark} onFocusInGraph={focusInGraph} />
                <RecentSnapshotsPanel onApply={applySnapshot} />
              </aside>
            </main>

            {params.get('diag') === '1' && (
              <div className="mt-4">
                <IntelHealthPanel />
              </div>
            )}

            <IntelStatusBar />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Intelligence;
