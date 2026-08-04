# 🖥️ Achados — Frontend

> Escopo: `src/` (1.677 arquivos `.ts/.tsx`). Método: grep/wc/tsc + leitura.
> **Nota metodológica:** `node_modules` está **incompleto** neste ambiente (faltam `zustand`, `papaparse`, `qrcode.react`, `@radix-ui/*`). Por isso `tsc --noEmit` gera 551 erros, mas ~530 são `TS2307 "Cannot find module"` (artefato de ambiente, **não** bug). Só 2 erros reais de tipo sobrevivem (FE-11).
> **Contexto agravante:** `strict:false`, `strictNullChecks:false`, `noImplicitAny:false` — o compilador não pega nada disso.

## Resumo (números medidos vs. doc)

| Alegação da doc | Realidade medida | Veredito |
|---|---|---|
| "Zero any" | **119** ocorrências de `any` (excl. testes + `types.ts`) + **183** `as unknown as` + **40** `@ts-ignore/nocheck/eslint-disable` | ❌ FALSO |
| "NUNCA useEffect para fetch" | **72 arquivos** com fetch Supabase em `useEffect`/`useState` sem `useQuery` | ❌ FALSO |
| "máx 400 linhas/arquivo" | **65 arquivos-fonte reais** >400 linhas; **13** >600; pior = 959 | ❌ FALSO |
| "Array.isArray antes de iterar" | 231 `Array.isArray` p/ 2.413 `.map(` — mas apresentação usa early-returns/optional-chaining | ⚠️ PARCIAL (na prática OK) |

---

## Achados

### [CRÍTICO] FE-1. "Zero any" é falso: 119 `any` + 183 double-casts
`grep -roE "\bany\b"` (excl. testes/`types.ts`) = **119**; `as unknown as` = **183**. Ex.: `OverviewTab.tsx:67` (`contacts: any[]; companies: any[]; interactions: any[]` — props centrais do dashboard sem tipo); `useHealthAlerts.ts:70` (`(data||[]) as unknown as HealthAlert[]`); `DecisionCriteriaElite.tsx:25` e `UnifiedTimelineSection.tsx:24` (`Record<string, any>`, 12 ocorrências do padrão); `ContactFormTabs.tsx:33` (`UseFormReturn<any>`). Os 183 `as unknown as` apagam checagem **mesmo se** alguém reativar o strict mode.

### [CRÍTICO] FE-2. 72 arquivos fazem data-fetching dentro de `useEffect` (antipadrão proibido)
72 arquivos combinam `useEffect` + `.from()` + `setState` **sem** `useQuery`. Confirmados: `useDISCConversionData.ts:26`, `trigger-analytics/useTriggerAnalyticsData.ts:13`, `usePurchasePatterns.ts`, `useHealthAlerts.ts:79`, `useWeeklyReport.ts`, `useStakeholderAlerts.ts`. Sem cache/dedup/retry/`staleTime`, com race conditions e sem cancelamento. Alguns ainda usam `as unknown as` no `setState`.

### [ALTO] FE-3. 65 arquivos-fonte violam o limite de 400 linhas (13 >600)
Piores (código real): `ObjectionExamplesModal.tsx` **959**, `InteracoesPresetsMenu.tsx` **921**, `BehavioralRegenAudit.tsx` **821**, `SentimentTrendChart.tsx` **808**, `RelatorioContato.tsx` **748**, `InteracoesContent.tsx` **731**, `Ficha360.tsx` **669**, `useInteractionsAdvancedFilter.ts` **631**.

### [ALTO] FE-4. 87 arquivos com `useQuery` sem `staleTime`
310 arquivos usam `useQuery`; **87** não definem `staleTime` em query alguma → default `staleTime:0` → refetch a cada mount/focus. Verificar se há default global no `QueryClient` (`AppProviders`); se não, refetch excessivo/flicker. Correção de baixo custo: default global.

### [MÉDIO] FE-5. `JSON.parse` sem try/catch sobre localStorage/dados externos
`WhyScoreDrawer.tsx:80,109` (`JSON.parse(localStorage.getItem(KEY) ?? '{}')` — o `?? '{}'` só cobre ausência, não corrupção); `lib/intelSnapshot.ts:47`; `useNotifications.ts:309`; `lib/errorReporting.ts:107,209`. localStorage corrompido/manipulado → exceção não capturada que quebra o render.

### [MÉDIO] FE-6. 5 mutations sem invalidação de cache
De 119 arquivos com `useMutation`, 6 sem `invalidateQueries/setQueryData/refetch`: `useEnrichmentExport`, `useSmartFollowups`, `useEmailRefine`, `useSequenceProcessor`, `useBIAdvanced`, `DocsPage.tsx`. Os primeiros são plausivelmente mutations "puras" de IA; **`useSequenceProcessor` e `useBIAdvanced` merecem verificação** — se persistem dados, a UI fica desatualizada. (Proporção geral boa: 5% sem invalidação.)

### [MÉDIO] FE-7. `Record<string, any>` como escape em metadados de domínio
`usePlaybooks.ts:47`, `useRapportIntelView.ts:17`, `useActivityLogger.ts:16`, `useProactiveIntelligence.ts:124` (`contact.behavior as Record<string, any>`). Campos JSONB entram no app sem forma; acesso `.x.y` é runtime-unsafe com strictNullChecks off.

### [BAIXO] FE-8. `.find(...).prop` inseguro (2 casos, mitigados)
`useEmotionalIntelligence.ts:43,63` — `sentences.find(...)` mitigado com `|| ''`. Único padrão `.find().prop` cru no código; o repo em geral evita bem.

### [BAIXO] FE-9. `setInterval` sem `clearInterval`
Único: `lib/errorReporting.ts` (dos 124 arquivos com timers, só este não limpa). Singleton de longa duração → vazamento limitado, mas o timer nunca é cancelado.

### [BAIXO] FE-10. NaN silencioso em `generateRecommendations` (stakeholders)
`useStakeholderAnalysis.ts:366` — `avgSupport = reduce(...) / stakeholders.length` sem guard local → `0/0=NaN` se vazio. **Não vaza** para a saída (comparações com NaN são false), mas é frágil. As divisões de resumo (436-444) estão protegidas pelo early-return no topo do `useMemo`.

### [INFO] FE-11. Erros reais de tipo: 2 (leaflet)
`mapa/MapMarkerCluster.tsx:43` (`Namespace 'leaflet' has no exported member 'MarkerClusterGroup'`) e `:48` (`markerClusterGroup` não existe) — faltam types de `leaflet.markercluster`. Os outros ~549 erros de `tsc` são `TS2307` por `node_modules` incompleto (não são bugs).

---

## O que está BOM (auditado)
1. **Null-safety na apresentação é sólida.** `ConversationAnalysisCard`, `TeamDashboardPanel`, `RenewalPipelineList`, `BestClosingMomentsCard` usam early-returns e optional-chaining consistentemente — compensa o strictNullChecks off.
2. **Hooks de cálculo protegem divisão por zero.** `useRFMAnalysis` (early-return), `useDISCAnalysis` (`Math.max(...scores,1)`, `total>0?`), `usePreContactBriefing` (`||1`), `useStakeholderAnalysis`/`useCoalitionDetection`. Nenhum NaN chega à UI.
3. **Realtime com cleanup.** Todos os 6 `.channel(...)` têm `removeChannel`. Zero vazamento de subscription.
4. **Invalidação de cache bem adotada** (94% dos arquivos com mutation invalidam).
5. **Error boundaries em múltiplas camadas** (`ErrorBoundary`, `ProviderErrorBoundary`, `DashboardErrorBoundary` + por-tab).
6. **Acessibilidade acima da média** (815 `aria-*/role`; só 8 `<div onClick>` e 5 `<img>` sem `alt`).
7. **`useContactDetail`/`RelationshipKPIsDashboard`** são o padrão correto (`useQuery` p/ fetch + `useEffect` só p/ subscription).

## Prioridade sugerida
1. Migrar os 72 fetch-em-`useEffect` para `useQuery`. 2. Erradicar os 183 `as unknown as` + 119 `any`. 3. Definir `staleTime` global no `QueryClient`. 4. Quebrar os 13 arquivos >600 linhas. 5. Envolver `JSON.parse` de localStorage em try/catch.
