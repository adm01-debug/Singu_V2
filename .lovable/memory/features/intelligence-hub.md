---
name: Intelligence Hub
description: Hub Palantir-inspired em /intelligence com 4 abas, hotkeys G/E/C/A + ?, bookmarks, histórico, snapshot PNG/sessão, share link, diff, common events timeline, saved views, latência p95, data source badge, densidade, presentation, timeline mensal com filtro, quick-pivot CrossRef, PATH BFS, theme cyan/amber, onboarding tour, status bar bookmarks/notes navegáveis e Ask history export+replay.
type: feature
---

# Intelligence Hub (`/intelligence`)

Módulo "command center" inspirado em Palantir, **additive** sobre Nexus Blue.

## Tokens (`src/index.css`)
- Wrapper `.intel-surface` (opt-in) + `.intel-grid-bg`; variáveis `--intel-bg/surface-1/2`, `--intel-border`, `--intel-accent` (cyan 188 95% 55%); severidade `--sev-critical/warn/info/ok`
- Helpers: `.intel-mono`, `.intel-card`, `.intel-card-hover`, `.intel-corner-frame`, `.intel-skip-link`
- **Densidade**: `html.intel-density-compact .intel-surface` reduz padding/gap/texto
- **Apresentação**: `html.intel-presentation .intel-surface` aumenta tipografia 115% e oculta `[data-intel-hide-pres="true"]`
- **Tema amber**: `html.intel-theme-amber .intel-surface` sobrescreve `--intel-accent/-soft`, `--intel-border/-strong`, `--sev-info` (38 95% 60%) com contraste WCAG AA
- **Aside flash**: `.intel-aside-flash` (animação 1.2s) usado pelo badge "NOTE:N" para focar o painel lateral

## Componentes (`src/components/intel/`)
- Base: `EntityCard`, `MetricMono`, `IntelBadge`, `DataGrid`, `SectionFrame`, `IntelSkeleton`, `IntelErrorState`, `IntelEmptyState`, `GraphLegend`, `TemporalHeatmap`, `TypewriterText`
- Status/telemetria: `IntelStatusBar` (hide em pres), `IntelTelemetryPanel` (`?debug=1`), `IntelLatencyBadge`, `IntelDataSourceBadge`, `IntelInflightBadge`, `IntelHealthPanel` (`?diag=1`), `IntelBookmarksNotesBadge` (★ abre command palette · NOTE foca aside)
- Comando/UX: `IntelCommandPalette` (⌘P), `IntelDensityToggle`, `IntelPresentationToggle`, `IntelThemeToggle` (cyan↔amber), `KeyboardMapOverlay` (`?` · com REPLAY TOUR), `IntelTourOverlay` (4 passos), `ExportFormatMenu` (csv/tsv/json/md)
- Painéis aside: `PinnedEntitiesPanel` (data-intel-aside="pinned"), `SavedViewsPanel`, `RecentSnapshotsPanel`
- Análise: `CommonEventsTimeline`, `MetadataDiffPanel`, `MultiDiffPanel`, `EntityNotesPanel` (autosave 500ms), `EntityMonthlyTimeline` (filtro ALL/INTERACTION/DEAL/EVENT persistido), `CrossRefInsightsPanel`

## Hooks (`src/hooks/`)
- Dados: `useEntity360`, `useCrossReference` (com `interactionsWithMatches`)
- Telemetria: `useIntelTelemetry`, `useIntelTabView`
- Atalhos/navegação: `useIntelHotkeys`, `useEntityHistory`, `useEntityBookmarks`
- Persistência: `useSavedAskViews`, `useIntelDensity`, `useIntelPresentation`, `useIntelSnapshots`, `useGraphLayout`, `useEntityNotes`, `useIntelTheme` (cyan/amber), `useIntelTour` (primeiro acesso)
- Contexto IA: `useContextualSuggestions(entity)`

## Lib (`src/lib/`)
- `intelExport.ts` — `downloadCsv` RFC 4180 + BOM (legacy)
- `intelExportUniversal.ts` — `csv|tsv|json|markdown`
- `graphSnapshot.ts` — captura PNG do canvas force-graph
- `intelSnapshot.ts` — `encodeSnapshot/decodeSnapshot`
- `entityDiff.ts` — `computeMetadataDiff`
- `jaccard.ts` — `jaccardIndex(groups)` para OVERLAP_INDEX
- `intelHealth.ts` — inspect/reset/format
- `crossRefInsights.ts` — `buildCrossRefInsights` heurísticas locais (sem LLM)
- `graphPath.ts` — BFS shortest-path entre 2 entidades

## Tabs (`src/components/intelligence/`)
- **GraphTab**: filtros URL + `?focusId/focusType`; PNG, SHARE, LAYOUT (save), RESTORE; **PATH** (≥2 bookmarks · `?path=id1,id2` · overlay informativo)
- **Entity360Tab**: ★ PIN; Alt+←/→; NOTE, DIFF, 3DIFF; **TIMELINE** mensal toggle; Shift+click envia `?pivot=type:id` para CrossRef
- **CrossRefTab**: aceita `?pivot=type:id`; metadata comparison; heatmap; CommonEventsTimeline; OVERLAP_IDX (Jaccard); INSIGHTS heurísticos; EXPORT multi-formato + BUNDLE
- **AskTab**: ⌘K, histórico com **EXPORT (JSON)** e **REPLAY** individual por item; SAVE; hotkey R; SUGGESTED_QUERIES dinâmicas

## Página (`src/pages/Intelligence.tsx`)
- Header: SNAPSHOT + PRES + DENSITY + THEME + ⌘P + sessionId
- Layout 2 colunas + aside (`data-intel-aside="pinned"`) com `PinnedEntitiesPanel` + `RecentSnapshotsPanel`
- `KeyboardMapOverlay` global com REPLAY TOUR
- `IntelTourOverlay` no primeiro acesso
- `?snap=<base64>` aplica snapshot completo
- `?diag=1` mostra `IntelHealthPanel`
- `contextEntity` propagado para `AskTab`

## Persistência
- URL: `?tab`, `?debug=1`, `?diag=1`, `?period`, `?etype`, `?minScore`, `?focusId`, `?focusType`, `?snap`, `?path`, `?pivot`
- `localStorage`: `intel-bookmarks-v1`, `intel-saved-views-v1`, `intel-density-v1`, `intel-pres-v1`, `intel-snapshots-v1`, `intel-ask-history`, `intel-graph-layout-v1`, `intel-notes-v1:<entityKey>`, `intel-theme-v1`, `intel-tour-v1`, `intel-timeline-filter-v1`
- `sessionStorage`: `intel-telemetry-v1`

## Acessibilidade
- Skip link, `aria-pressed`, `aria-label` em ícones, `role="status"`/`aria-live="polite"` em status bar e console Ask
- Hotkeys ignorados em inputs/textarea/contentEditable
- KeyboardMapOverlay e IntelTourOverlay como `role="dialog" aria-modal="true"`
- Contraste WCAG AA validado em ambos temas (cyan + amber)

## Constraints
- Português obrigatório; sem novos backends; TanStack Query exclusivo (sem `useEffect` para fetch além do uso pontual em CrossRef pivot resolve)
- Sem mexer em CRM/Pipeline/ABM; reusa `NetworkVisualization`, `useInstantKpis`, `useAskCrm`, `external-data` proxy
- Max 400 linhas/arquivo, sem `any`, sem `dangerouslySetInnerHTML`
