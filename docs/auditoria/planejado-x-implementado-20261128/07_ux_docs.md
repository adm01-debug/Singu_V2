# 07 — Experiência de uso e promessas dos documentos de produto/raiz × código (HEAD `e77396e`, 2026-11-26)

> **Notação:** `ctx-supabase:X` e `ctx-codigo:X` = arquivo `X` em `docs/contexto/supabase/` e `docs/contexto/codigo/` do branch `origin/contexto` (snapshot gerado do banco real e do código); `tables:public.T.md` / `functions:public.F.sql` = subpastas `tables/public/` e `functions/public/` desse snapshot.

**Recorte:** UX transversal, design system, navegação, acessibilidade, performance percebida, telas escondidas e promessas de docs de produto/raiz. Itens de domínio (contatos, IA, marketing, vendas, segurança, infra) ficam com os outros auditores. Os IDs entre parênteses (PD-x, ROT-x, HF-x…) são os da MATRIZ_RECONCILIADA_20261012_UX, para rastrear.

**Fontes lidas:** `docs/PRODUCT_DESIGN_STRATEGY_ANALYSIS_V6.md` (66 itens numerados + 9 subitens do pilar 12 + métricas), `docs/ux_improvement_strategy.md`, `docs/adr/011-rodada-h-accessibility-dx.md`, `docs/adr/012-rodada-i-polimento-final.md`, `PLANEJADO_NAO_EXECUTADO.md` §6.9, §7, §8, §11 e §12 Onda 6, `docs/lacunas/C1_docs_produto_ux_qa.md` (§10, §11, §13), `docs/lacunas/MATRIZ_RECONCILIADA_20261012_UX.md` (base `a2b73c7`), `docs/ONBOARDING.md`, `docs/QA_ANALYSIS_REPORT.md`, `audit_report.md`, `AUDITORIA.md` e `AUDITORIA_COMPLETA_SISTEMA.md`/`AUDITORIA_SISTEMA.md` (só as recomendações que pedem código de UX). Estado real: `src/app/AppRoutes.tsx`, `src/app/lazyPages.tsx`, `AppSidebar.tsx`, `AdminSidebar.tsx`, `commandRegistry.ts`, `MobileBottomNav.tsx` e grep em `src/`. Status de PRs via `gh api` REST.

**Aviso sobre o inventário:** `inventario/estado/rotas.json` (gerado em 24/11) está **desatualizado**: lista 114 URLs e não tem `/inteligencia-ramos`, `/funil-vendas`, `/eventos`, `/clientes`, `/grupos-economicos`, `/admin/observabilidade`, `/admin/readiness`, `/admin/ia`, `/admin/workspaces`, `/admin/qualidade-cadastral`, `/parceiros`, `/carteira` nem `/aprovacoes-follow-up`. Ainda acusa `src/pages/admin/Observability.tsx` como "página sem rota", e hoje ela tem rota (`AppRoutes.tsx:189`). `ctx-codigo:rotas.json` informa 128 URLs, o mesmo que o `AppRoutes.tsx` atual. Usei o `AppRoutes.tsx` do HEAD como fonte.

**Script de shell:** Um script local de apoio (não versionado) resolve cada `<P.X>` de `AppRoutes.tsx` até o arquivo da página e procura `<AppLayout` ou `<AdminLayout` no arquivo e nos imports locais, até 2 níveis.

## Contagem

| Grupo | Total | ✅ | 🟨 | ❌ | ❔ |
|---|---|---|---|---|---|
| ux_improvement_strategy | 10 | 5 | 4 | 0 | 1 |
| PRODUCT_DESIGN_STRATEGY V6 | 76 | 14 | 28 | 13 | 21 |
| ADR-011 + ADR-012 | 10 | 6 | 2 | 0 | 2 |
| PLANEJADO §6.9 (só o que não repete o V6; ROT-19 somado a UX-060) | 2 | 0 | 1 | 1 | 0 |
| PLANEJADO §7 (itens deste recorte) | 6 | 5 | 0 | 0 | 1 |
| §8 + ONBOARDING/QA/audit_report/AUDITORIA (afirmações em docs) | 12 | 2 | 1 | 9 | 0 |
| §11 (PRs em andamento/abandonados) | 7 | 5 | 0 | 0 | 2 |
| §12 Onda 6 (itens deste recorte) | 3 | 0 | 1 | 2 | 0 |
| Navegação, rotas escondidas, shell | 32 | 5 | 23 | 4 | 0 |
| Transversal (métricas inventadas, tokens, i18n, tour) | 6 | 0 | 3 | 2 | 1 |
| **Total** | **164** | **42** | **63** | **31** | **28** |

Na tabela, cada status vem ordenado do maior para o menor impacto. ✅ só entra na contagem.

## Tabela (só 🟨, ❌ e ❔)

| ID | Item planejado | Fonte (doc:linha) | Status | Evidência no HEAD | O que falta |
|---|---|---|---|---|---|
| UX-001 | Shell compartilhado (sidebar, header, Ctrl+K, QuickAdd, NotificationCenter, rage-click) em todas as telas autenticadas (ROT-13) | PLANEJADO_NAO_EXECUTADO.md:572 ("43 páginas sem layout"); MATRIZ_UX:37 | ❌ | Script de layout: 65 das 128 páginas roteadas sem `<AppLayout>`/`<AdminLayout>`. Tirando públicas e guards, sobram **52 autenticadas**, entre elas 13 itens da própria sidebar: `/marketing` (1º item do menu, `AppSidebar.tsx:29`), `/cadastro`, `/historico`, `/perfis-comportamentais`, `/aprovacoes-follow-up`, `/lead-scoring`, `/enrichment`, `/crm/copywriting`, `/tarefas`, `/territorios`, `/seguranca`, `/admin/seguranca`, `/admin/error-logs`. Também `RolesPage`, `Rodizio`, `Forecasting`, `RevOps`, `CustomerSuccess`, `DealRooms`, `Playbooks`, `WinLoss` e 10 páginas admin. Ctrl+K só existe dentro do layout: `useGlobalSearch()` é chamado em `AppLayout.tsx:89` | Envolver as 52 páginas em `AppLayout` (ou num layout de rota único com `<Outlet>`). Ao clicar num desses itens o usuário perde o menu e os atalhos |
| UX-002 | Toda rota interna protegida por autenticação + MFA + ErrorBoundary/Suspense | padrão `Protected` em AppRoutes.tsx:31-39 | ❌ | `AppRoutes.tsx:177` `<Route path="/eventos" element={<P.EventosCliente />} />`: sem `Protected`/`RequireAuth`, sem `MFAGuard` e sem `LazyPage` (Suspense+ErrorBoundary). Mesmo assim está no menu, em "Eventos de cliente" (`AppSidebar.tsx:56`). Entrou em `2e20fce` (#372) | Envolver em `<Protected>`. O comportamento de um lazy sem Suspense no runtime não foi verificado; a falta de guarda está no código |
| UX-003 | Command bar "Novo contato / Nova interação / Nova empresa" abre o formulário (ROT-16) | MATRIZ_UX:39 | ❌ | `GlobalCommandBar.tsx:69,79,89` navega para `?new=1`; 0 leituras de `new` em `src/pages` (grep `get('new')` = 0) | Abrir o diálogo a partir de `?new=1` em Contatos, Empresas e Interações |
| UX-004 | "Perguntar ao CRM" pela command bar abre o chat (ROT-17) | MATRIZ_UX:40 | ❌ | `AppLayout.tsx:263` dispara `open-ask-crm`, mas nenhum `addEventListener('open-ask-crm')` em `src/` (0) | Ligar o `AskCrmChat` ao evento ou usar um estado compartilhado |
| UX-005 | Métricas sem número inventado: "precisão" do relacionamento (HF-06) | PLANEJADO_NAO_EXECUTADO.md:571 (Onda 2, CR12) | ❌ | `src/components/crm/RelationshipKPIsDashboard.tsx:238` literal `94.2%` com `animate-pulse`; montado em `dashboard/tabs/RelationshipsTab.tsx` e `pages/Automacoes.tsx` | Calcular a partir de dados reais ou remover o cartão |
| UX-006 | Variação calculada no KPI do dashboard (HF-07) | MATRIZ_UX:59 | ❌ | `src/components/dashboard/DashboardStatsGrid.tsx:62` `change: '+2% vs ontem'`, `changeType: 'positive'` fixos; montado em `OverviewTab.tsx`, aba inicial do `/` | Comparar com o período anterior ou omitir a variação |
| UX-007 | Dashboards embeddable (Onda 6; ROT-08) | PLANEJADO_NAO_EXECUTADO.md:591; MATRIZ_UX:35 | ❌ | `src/components/bi/EmbeddableDashboards.tsx:36-37` copia `<iframe src=".../embed/dashboard/${id}">`; nenhuma rota `/embed` em `AppRoutes.tsx` (cai no `*` → NotFound) | Rota pública com token ou retirar o botão "copiar embed" |
| UX-008 | SSO (Onda 6) | PLANEJADO_NAO_EXECUTADO.md:591 | ❌ | Só a rota `/sso/callback` (`AppRoutes.tsx:73`); `src/pages/Auth.tsx` não tem botão nem `signInWithSSO` (grep -i sso = 0 fora dos toasts) | Entrada de SSO no login, ou decidir que não vai existir |
| UX-009 | Simulador de negociação (CS-1) | PLANEJADO_NAO_EXECUTADO.md:446; COMPLETE_SYSTEM_ANALYSIS.md:470 | ❌ | 0 ocorrências de `NegotiationSimulator` em `src/` | Implementar ou tirar do doc |
| UX-010 | ProgressToast em operações longas (PD-3.3) | PRODUCT_DESIGN_STRATEGY_ANALYSIS_V6.md:171-183 | ❌ | 0 `ProgressToast` em `src/`; `BulkImportDialog.tsx:174` só troca o texto para "Importando..." | Toast/barra com contagem processada/total e cancelamento |
| UX-011 | Mega menu Recentes/Favoritos de Empresas/Contatos (PD-2.2) | V6.md:121-123 | ❌ | `AppSidebar.tsx:24-90`: itens estáticos, sem recent/favorit (grep = 0). Recentes só no palette (`GlobalSearch.tsx:37-85`) | Dropdown de recentes/favoritos na sidebar |
| UX-012 | Badges de pendência por seção na sidebar (PD-12.3b) | V6.md:683-707 | ❌ | `AppSidebar.tsx` sem badge/count (grep = 0) | Contadores (tarefas, notificações, follow-ups) |
| UX-013 | Quick-add a partir da sidebar (PD-12.3c) | V6.md:683-707 | ❌ | Só existe o botão flutuante `QuickAddButton` (`AppLayout.tsx:289`), que some nas 52 páginas sem layout (UX-001); nada na sidebar | Botão "+" na sidebar, ou dar o item como coberto pelo QuickAdd global depois de UX-001 |
| UX-014 | Exportar gráfico em PNG/PDF (PD-11.4) | V6.md:630 | ❌ | 0 `html2canvas`/`toPng`/`html-to-image`/`exportChart` em `src/` | Exportar a visualização atual com os mesmos filtros |
| UX-015 | Busca/filtros salvos em Contatos e Empresas (PD-10.3) | V6.md:570-577 | ❌ | `src/hooks/useSavedFilters.ts` sem nenhum consumidor (grep = só o próprio arquivo) | Botão "Salvar filtro" nas listas |
| UX-016 | Presets salvos no AdvancedFilters (PD-12.2c) | V6.md:665-681 | ❌ | Mesmo hook órfão do UX-015 | Idem UX-015 |
| UX-017 | Sugestões enquanto digita na busca (PD-10.4) | V6.md:581-583 | ❌ | `GlobalSearch.tsx` (572 linhas) faz fuzzy só sobre recentes e navegação (`:161-164`), sem autocomplete de termos | Sugestões de termos/entidades durante a digitação |
| UX-018 | Analytics de busca (PD-10.2) | V6.md:566-568 | ❌ | 0 eventos de busca registrados (sem `trackEvent`/posthog/mixpanel em `src/`) | Registrar termo, resultado clicado e "sem resultado", com privacidade |
| UX-019 | Métricas de UX: TTFMI, conclusão de tarefa, SUS, NPS do produto (PD-MET) | V6.md:845-866; PLANEJADO:445 | ❌ | Nenhum SDK de product analytics em `src/`; o rage-click (`AppLayout.tsx:87`) não mede conclusão de tarefa | Instrumentar eventos de produto |
| UX-020 | `srcset`/LQIP (PD-6.5) | V6.md:374-378 | ❌ | 0 `srcSet` em `src/`; `vite-imagetools` ausente do `package.json` | Variantes responsivas de imagem |
| UX-021 | Sons de notificação (PD-9.4) | V6.md:535-537 | ❌ | Só TTS (`voice/playTtsAudio.ts`); nenhuma opção de som | Decisão de produto: silenciar/escolher som |
| UX-022 | Vídeos tutoriais (PD-13.5) | V6.md:750-752 | ❌ | Nenhum conteúdo/embed de tutorial em `src/` (youtube só em `SocialsCard`) | Conteúdo, ou tirar do roadmap |
| UX-023 | ONBOARDING: porta do dev server (ON-1) | docs/ONBOARDING.md:28 | ❌ | Doc diz `localhost:5173`; AGENTS.md e vite usam 8080 | Corrigir o doc |
| UX-024 | ONBOARDING: `npm run test:watch` e "4.470+ testes" (ON-3) | docs/ONBOARDING.md:89-90 | ❌ | `package.json:21` só tem `"test": "vitest run"`; não existe `test:watch` | Corrigir o doc ou criar o script |
| UX-025 | ONBOARDING: primeira contribuição em `Dashboard.tsx` em `src/pages/` (ON-4) | docs/ONBOARDING.md:108 | ❌ | O arquivo não existe (`ls` falha); o dashboard é `src/pages/Index.tsx` | Corrigir o doc |
| UX-026 | Diagrama ER (§8) | PLANEJADO:494; docs/er-diagram.md:1-7 | ❌ | `docs/er-diagram.md` tem 7 linhas, com `erDiagram` vazio | Gerar o ER real ou apagar o arquivo |
| UX-027 | "Máx. 400 linhas por arquivo" (§8; CONTRIBUTING/AGENTS) | PLANEJADO:498; AGENTS.md (Código) | ❌ | 98 arquivos `.ts/.tsx` em `src/` passam de 400 linhas (`wc -l`), por exemplo `GlobalSearch.tsx` (572) e `useKeyboardShortcutsEnhanced.ts` (446) | Ratchet no CI ou rever a regra |
| UX-028 | `COMPLETE_SYSTEM_ANALYSIS.md` cita 24 componentes (CS-REF) | PLANEJADO:492 | ❌ | Os citados continuam inexistentes: `ClientTriggerPanel`, `MetaprogramProfileCard`, `SleightOfMouthLibrary`, `VAKProfileCard` (0 ocorrências cada) | Marcar o doc como histórico ou corrigir |
| UX-029 | QA_ANALYSIS_REPORT: "Arquivos não utilizados: ZERO" | docs/QA_ANALYSIS_REPORT.md:50 | ❌ | Componentes sem consumidor: `ContextualHelpTooltip`, `CPFInput`, `CNPJInput` (0 usos `<X` cada); `useSavedFilters` órfão | Marcar o doc como legado e corrigir a afirmação |
| UX-030 | QA_ANALYSIS_REPORT: "TODO/FIXME ZERO, 100% production-ready" | docs/QA_ANALYSIS_REPORT.md:32,53 | ❌ | 4 `TODO/FIXME/HACK` em `src/` (grep); além disso ver UX-005/006 (números fixos) | Idem UX-029 |
| UX-031 | BI Avançado com dashboards customizáveis por drag & drop | audit_report.md:53; TECH_DEBT TD-P9 | ❌ | `src/pages/BIAvancado.tsx`: 0 `drag`/`dnd`/`Draggable` | Grid arrastável com layout persistido |
| UX-032 | Proteção de trabalho não salvo em navegação interna, no Voltar e ao fechar modal (UX-4.2) | docs/ux_improvement_strategy.md:60-65 | 🟨 | `src/hooks/useUnsavedChangesGuard.ts:12-27`: só `beforeunload`, e `isBlocked` é sempre `false`. Usado apenas em `CompanyForm.tsx` e `Configuracoes.tsx`; `ContactForm`, `InteractionForm` e `DealDialog` não usam. Nenhum `useBlocker` em `src/` | Bloqueio SPA (`useBlocker`) + confirmação ao fechar o Dialog nos 5 fluxos |
| UX-033 | Rascunho preservado quando salvar falha (PD-8.1) | V6.md:437-453 | 🟨 | `ContactForm.tsx:123-124` chama `clearDraft()` depois de `await onSubmit`. `Contatos.tsx:229-238` (`handleCreate`) não lança erro quando `createContact` devolve `null` (`useContacts.ts:256,261`), então o rascunho se perde na falha | Limpar o rascunho só quando o retorno confirmar que salvou |
| UX-034 | Atalhos universais com efeito real (UX-3.1; ROT-18) | ux_improvement_strategy.md:43-47 | 🟨 | Em `useKeyboardShortcutsEnhanced.ts:52-221`, 15 eventos não têm nenhum ouvinte em `src/`: `toggle-global-search`, `focus-search-input`, `quick-add-contact/company/interaction`, `save-current`, `close-all-modals`, `toggle-sidebar`, `toggle-dark-mode`, `edit-/delete-selected-item`, `select-all`, `undo`, `redo` e `show-whats-new`. `:228-238` declara Alt+0..6 e Alt+R/O com `action: () => {}`. Funcionam Ctrl+K (via `useGlobalSearch`), Alt+← e `?`, e só dentro do `AppLayout` | Ligar ouvintes ou tirar do cheatsheet o que não funciona |
| UX-035 | Atalhos centralizados e descobríveis (ADR-011 §3) | docs/adr/011-rodada-h-accessibility-dx.md:25-27 | 🟨 | O cheatsheet (`KeyboardShortcutsCheatsheet.tsx:56`) anuncia atalhos que não fazem nada (UX-034) | Idem UX-034 |
| UX-036 | Component Gallery acessível para QA (ADR-011 §2 / ADR-012 §3) | ADR-011:22-24 | 🟨 | Rota `/admin/component-gallery` (`AppRoutes.tsx:190`) e tabs v2 existem (`ComponentGallery.tsx:51-52`), mas 0 links para ela em `src/` (nem `AdminSidebar.tsx:8-25`, nem a seção admin de `AppSidebar.tsx:96-111`) | Entrada no AdminSidebar |
| UX-037 | `/admin` (painel admin) alcançável pela navegação principal | rotas | 🟨 | `AdminDashboard` em `AppRoutes.tsx:163`. O único link é o próprio `AdminSidebar.tsx:9`, que só aparece nas 5 páginas com `AdminLayout` (`AdminDashboard`, `AdminConexoes`, `AdminConexoesLogs`, `AdminAuditTrail`, `DocsPage`). A seção admin da `AppSidebar.tsx:96-111` não tem `/admin`, `/admin/conexoes` nem `/admin/telemetria` | Item "Painel admin" na seção Administração |
| UX-038 | Navegação admin em mobile e em todas as páginas admin | rotas | 🟨 | `AdminSidebar.tsx:31` usa `hidden lg:block`, e 16 das 21 páginas linkadas por ele não usam `AdminLayout` (script de layout), então o menu admin some ao entrar nelas | Layout admin único, com navegação também no mobile |
| UX-039 | `/admin/permissions` sem nenhuma entrada | rotas | 🟨 | Rota em `AppRoutes.tsx:165`; 0 referências a `/admin/permissions` em `src/` fora das rotas. A sidebar aponta para `/admin/role-permissions` | Linkar ou remover a rota duplicada |
| UX-040 | `/whatsapp/importar` sem nenhuma entrada | rotas | 🟨 | Rota em `AppRoutes.tsx:81`; 0 referências em `src/` | Botão em Conversas/WhatsApp |
| UX-041 | `/intelligence/relacionamento/auditoria` sem nenhuma entrada | rotas | 🟨 | Rota em `AppRoutes.tsx:104`; 0 referências em `src/` | Link a partir de `/intelligence/auditoria` |
| UX-042 | `/inbox` só pelo Ctrl+K | rotas | 🟨 | Única referência: `commandRegistry.ts:33`; fora de sidebar e mobile | Item de menu (Principal) |
| UX-043 | `/deal-rooms` só pelo Ctrl+K e por links internos | rotas | 🟨 | `commandRegistry.ts:34`; fora da sidebar | Item de menu |
| UX-044 | `/forecasting` só pelo Ctrl+K e por links internos | rotas | 🟨 | `commandRegistry.ts:42`; fora da sidebar | Item em Análise |
| UX-045 | `/win-loss` só pelo Ctrl+K e por links internos | rotas | 🟨 | `commandRegistry.ts:44`; fora da sidebar | Item em Análise |
| UX-046 | `/revops` só pelo Ctrl+K e por links internos | rotas | 🟨 | `commandRegistry.ts:45`; fora da sidebar | Item em Análise |
| UX-047 | `/customer-success` só pelo Ctrl+K e por links internos | rotas | 🟨 | `commandRegistry.ts:46`; fora da sidebar | Item de menu |
| UX-048 | `/intent` só pelo Ctrl+K | rotas | 🟨 | `commandRegistry.ts:50`; fora da sidebar | Item em Operacional |
| UX-049 | `/territory-optimization` só pelo Ctrl+K e por links internos | rotas | 🟨 | `commandRegistry.ts:52`; fora da sidebar | Link a partir de Territórios |
| UX-050 | `/rodizio` sem menu e mostrado no Ctrl+K a quem não é admin (ROT-14) | MATRIZ_UX:38 | 🟨 | `commandRegistry.ts:55` sem filtro de papel; a rota é `<Admin>` (`AppRoutes.tsx:139`) e `RequireAdmin.tsx:50` redireciona em silêncio para `/` | Filtrar por papel; item na seção admin |
| UX-051 | `/campanhas` só pelo Ctrl+K e pelo Marketing Hub | rotas | 🟨 | `commandRegistry.ts:59`; `MarketingHub.tsx:92`, que não tem shell (UX-001) | Item de menu ou aba no hub |
| UX-052 | `/sms-marketing` só pelo Ctrl+K | rotas | 🟨 | `commandRegistry.ts:60` é a única referência | Item de menu (integração adiada: decidir se aparece) |
| UX-053 | `/nurturing` só pelo Ctrl+K e por texto no hub | rotas | 🟨 | `commandRegistry.ts:63`; `MarketingHub.tsx:511` | Item de menu |
| UX-054 | `/knowledge-base` só pelo Ctrl+K | rotas | 🟨 | `commandRegistry.ts:64` é a única referência | Item de menu |
| UX-055 | `/deduplicacao` só pelo Ctrl+K | rotas | 🟨 | `commandRegistry.ts:68` é a única referência | Link em Contatos/Empresas |
| UX-056 | `/erp` só pelo Ctrl+K e pelo widget da empresa | rotas | 🟨 | `commandRegistry.ts:69`; `CompanyErpProposalsWidget.tsx:48,64` (escopo de propostas é vetado: decidir, PLANEJADO §10) | Decisão de escopo |
| UX-057 | `/playbooks` só pelo Ctrl+K e por links internos | rotas | 🟨 | `commandRegistry.ts:72`; fora da sidebar | Item de menu |
| UX-058 | `/report-builder` só pelo Ctrl+K | rotas | 🟨 | `commandRegistry.ts:73` é a única referência | Item de menu, depois de UX-063 |
| UX-059 | `/relatorios-customizaveis` só pelo Ctrl+K | rotas | 🟨 | `commandRegistry.ts:74` é a única referência | Item de menu |
| UX-060 | "O que há de novo" realmente exibido e reabrível; aviso de atualização do PWA (PD-13.3; ROT-19) | V6.md:740-742; PLANEJADO:448 | 🟨 | `WhatsNewModal.tsx:90-93`: o efeito grava a versão como vista e faz `setIsVisible(false)`, então o modal nunca aparece. `:181` dispara `show-whats-new` sem ouvinte (0). `main.tsx:63-64` emite `pwa:update-available` e nenhum componente escuta (grep = só `main.tsx`) | Exibir antes de marcar como visto; ouvinte de novidades; toast "Atualizar" no update do SW |
| UX-061 | Promessas na UI: "Modo Offline Aprimorado – continue trabalhando sem conexão" e "Tooltips em todas as métricas" (PH-04) | PLANEJADO:447 | 🟨 | Textos em `WhatsNewModal.tsx:60-61,67-68`. Na prática `vite.config.ts:70` tem `runtimeCaching: []`, não há fila offline (UX-064) e `ContextualHelpTooltip` tem 0 consumidores | Tirar os textos ou entregar os recursos |
| UX-062 | Indicador de progresso em multi-etapas na importação (UX-4.1; PD-3.3 parcial) | ux_improvement_strategy.md:54-58 | 🟨 | Agora existe o stepper `MultiStepProgress` (`BulkImportDialog.tsx:73-77`), mas sem progresso medido (linhas processadas/total) durante a importação (`:174`) | Contagem/percentual durante o import |
| UX-063 | Report Builder útil e persistente (Onda 6; PH-03) | PLANEJADO:591 | 🟨 | `src/pages/ReportBuilder.tsx:56,70` persiste o layout só em `localStorage` (some ao trocar de navegador ou dispositivo e não é compartilhado); rota sem menu (UX-058) | Persistir em tabela com RLS e ligar widgets a dados |
| UX-064 | Offline-first com fila de mutações (PD-14.1; CS-4) | V6.md:765-779 | 🟨 | Existe o aviso de conexão (`AppRoutes.tsx:54-57`, toast online/offline); `vite.config.ts:70` `runtimeCaching: []`; nenhuma fila de mutações | Cache de leitura + fila, ou retirar a promessa (UX-061) |
| UX-065 | Retry manual após erro final (PD-14.2) | V6.md:781-791 | 🟨 | `CompanyProfileAnalytics.tsx:67-71` mostra a mensagem de erro sem botão "Tentar novamente" (grep `refetch` = 0) | Botão de nova tentativa (refetch) |
| UX-066 | Ações rápidas dentro das notificações (PD-9.2) | V6.md:514-527 | 🟨 | `NotificationCenter.tsx:13` usa `GroupedNotifications`, mas não preenche `actions` ao mapear (grep `actions` = 0 no arquivo) | Mapear ações com handlers reais |
| UX-067 | Preferências granulares de notificação aplicadas (PD-9.1) | V6.md:501-512 | 🟨 | UI e hook existem (`useNotificationPreferences.ts`; rota `/notificacoes/configuracoes`); 0 functions em `supabase/functions` leem `notification_preferences` | O backend respeitar canais e tipos |
| UX-068 | Entrega agendada / horário de silêncio (PD-9.5) | V6.md:539-541 | 🟨 | `quiet_hours_*`/`digest_mode` só no front; 0 ocorrências em `supabase/functions` | Aplicar no envio |
| UX-069 | Busca fuzzy em toda a carteira (PD-10.1) | V6.md:554-564 | 🟨 | `Contatos.tsx:193` aplica `useFuzzySearch(contacts, …)` só aos registros já carregados (página de 50, `useContacts`) | Busca no servidor sobre toda a carteira autorizada |
| UX-070 | Busca com prefixo `@empresa` e categorização (PD-2.3) | V6.md:125-132 | 🟨 | Há recentes e grupos (`GlobalSearch.tsx:37-85`; `global-search/SearchResultGroups.tsx`); nenhum parser de prefixo `@` (grep = 0) | Prefixos de filtro por entidade |
| UX-071 | Loading padronizado em botões (`LoadingButton`) (PD-3.1) | V6.md:156-165 | 🟨 | `LoadingButton` usado só em `ProximaAcaoCTA.tsx` e `NextBestActionCard.tsx`; os formulários centrais (`ContactForm`, `CompanyForm`, `InteractionForm`) usam Button + Loader2 separados | Usar nos formulários centrais |
| UX-072 | Bottom sheet em criar/editar no mobile (PD-5.5) | V6.md:307-311 | 🟨 | `Contatos.tsx:366,372` e `Empresas.tsx:263,266` usam `<Dialog>`; `ResponsiveDialog` só em `CompanyInteractionsModal.tsx` | `ResponsiveDialog`/Drawer nesses fluxos |
| UX-073 | Formulários mobile: `inputMode`, `enterKeyHint`, `autoComplete` (PD-5.1) | V6.md:277-286 | 🟨 | `inputMode` em 4 arquivos, `enterKeyHint` em 0, `autoComplete` em 6 | Aplicar nos formulários de contato, empresa e interação |
| UX-074 | Máscaras de CPF/CNPJ (PD-8.3) | V6.md:466-478 | 🟨 | `ContactFormTabs.tsx:56` CPF com `<Input>` comum (só `PhoneInput` mascarado, `:4`); `CPFInput`/`CNPJInput` com 0 consumidores | Usar as máscaras existentes |
| UX-075 | Validação inline no blur (PD-8.2) | V6.md:455-464 | 🟨 | `mode: 'onBlur'` em `CompanyForm`, `ContactForm`, `InteractionForm` e `ContactFormTabs`; `pipeline/DealDialog.tsx` sem `mode` (o único `mode` é `mode="single"` do calendário, `:307`) | Aplicar no DealDialog |
| UX-076 | Virtualização de listas longas (PD-6.2) | V6.md:343-361 | 🟨 | `react-window` só em `pages/contatos/ContatosContent.tsx`; Empresas e Interações sem virtualização | Virtualizar as demais listas |
| UX-077 | Gestos: swipe, pull-to-refresh, long-press (PD-5.2; CS-5) | V6.md:288-291 | 🟨 | Pull-to-refresh/swipe só em `ContatosContent.tsx` (`ui/pull-to-refresh.tsx`) | Empresas/Interações |
| UX-078 | Haptic universal: toggles, sliders, destrutivos (PD-3.2) | V6.md:167-169 | 🟨 | `useHapticFeedback` com 2 consumidores (`Contatos`, `MobileBottomNav`) | Aplicar nos controles previstos |
| UX-079 | Touch targets ≥ 44 px (PD-4.6) | V6.md:262-266 | 🟨 | Tokens `min-h-touch`/`min-w-touch` em `tailwind.config.ts:145-146` com 0 usos; 44 px aparece em 21 arquivos; `BulkImportDialog.tsx:99` usa `h-8 w-8` | Aplicar o token nos alvos interativos mobile |
| UX-080 | Upload de importação acessível pelo teclado (PD-2.5) | V6.md:140-143 | 🟨 | `BulkImportDialog.tsx:80-83`: `<div onClick>` sem `role`, `tabIndex` ou `onKeyDown` | Usar `<button>`/`<label>` com foco |
| UX-081 | Gráficos acessíveis: tabela sr-only ou alternativa (PD-11.1) | V6.md:600-618 | 🟨 | 57 arquivos com `ResponsiveContainer`, só 9 com `sr-only`/`aria-label` | Wrapper padrão de gráfico acessível |
| UX-082 | Drill-down nos gráficos do dashboard (PD-11.2) | V6.md:620-622 | 🟨 | Pontual: 4 arquivos com drill-down (`EvidenceDrillDownSheet` etc.); os gráficos do dashboard/Analytics não têm | Cross-filter/drill nos gráficos centrais |
| UX-083 | Intervalo de datas personalizado nos gráficos (PD-11.5) | V6.md:634-636 | 🟨 | `Analytics.tsx:77` só oferece `PeriodFilter` fixo (`'30d'` etc.); `DateRangePopover` usado só em `interactions/AdvancedSearchBar.tsx` | Intervalo livre no Analytics |
| UX-084 | Ajuda contextual nas métricas (PD-13.2) | V6.md:723-738 | 🟨 | `ContextualHelpTooltip` com 0 consumidores; `ModuleHelp` só em 2 abas do contato (`ContactIntelligenceTab`, `ContactBehavioralTab`) | Ajuda nas métricas do dashboard/Analytics, acessível sem mouse |
| UX-085 | Progresso do onboarding com os 7 marcos (PD-13.4) | V6.md:746-748 | 🟨 | `Index.tsx:115-120` passa só 4 props; `hasDeals`, `hasLeadScore` e `hasSequence` ficam `false` por padrão (`OnboardingChecklist.tsx:53-55`), então o checklist nunca chega a 100% | Consultar os 3 marcos restantes |
| UX-086 | Tour guiado ancorado nos elementos reais | V6.md:710-750 (pilar 13) | 🟨 | `OnboardingTour.tsx:36-60` mira `[data-tour="contacts"]`, `companies`, `analytics`, `calendar` e `settings`, mas só `data-tour="quick-add"` existe no DOM (`QuickAddButton.tsx:212`); 5 de 6 alvos ausentes | Pôr `data-tour` nos itens da sidebar/header |
| UX-087 | Transições por contexto: drill-down × lateral × substituição (PD-3.4) | V6.md:187-189 | 🟨 | `navigation/PageTransition.tsx:21-22` só distingue `direction === 'back'` | Variantes lateral/aprofundamento, respeitando reduced motion |
| UX-088 | Score percentual animado (PD-7.4) | V6.md:417-419 | 🟨 | `DashboardStatsGrid.tsx:61` passa `value` como string `` `${…}%` ``, e o StatCard só anima valores numéricos | Animar preservando a unidade |
| UX-089 | Escala de z-index em tokens (PD-1.3) | V6.md:72-83 | 🟨 | Tokens em `index.css:195-205` e `tailwind.config.ts:141-144`, com **0 usos** de `z-dropdown`/`z-modal`/`z-toast`… em `.tsx`; continuam `z-50` (43×), `z-10` (45×), `z-[100]` (5×) e `z-[9999]` | Migrar para os tokens |
| UX-090 | Raio de borda semântico button/card/modal (PD-1.4) | V6.md:87-93 | 🟨 | `--radius-card` (`index.css:215`) com 0 usos; não existem `--radius-button`/`--radius-modal`; mistura de `rounded-lg` (1008), `rounded-md` (330), `rounded-xl` (151) e `rounded-2xl` (55) | Tokens semânticos + consumo |
| UX-091 | Cores via tokens HSL, sem paleta hardcoded (AGENTS.md "Código") | AGENTS.md; V6 pilar 7 | 🟨 | 1.212 usos de paleta Tailwind fixa (`text-emerald-600`, `bg-sky-…`) em 136 `.tsx` e 189 hex em 28 `.tsx`. Exemplo novo: `EventosCliente.tsx:25-34` (`TIPO_CLASSE` emerald/sky/amber/violet) | Tokens semânticos (success/info/warning) + regra de lint |
| UX-092 | UI 100% em português | AGENTS.md ("UI em português") | 🟨 | Rótulos em inglês na `AppSidebar.tsx` (Network, Intelligence, Insights, Analytics, Performance, Conversation Intel, Copywriting, Landing Pages, Lead Scoring = 9) e na `AdminSidebar.tsx:9-23` (Dashboard, Error Budget, Schema Drift, Field Mapping, Email Pipeline, Voice AI, Secrets, Feature Flags, Audit Trail, Knowledge Export…); aba "Overview" em `MarketingHub.tsx:112` | Traduzir os rótulos |
| UX-093 | Rage-click medido em todas as telas (UX-5.1) | ux_improvement_strategy.md:68-69 | 🟨 | `useRageClickDetector()` em `AppLayout.tsx:87`; não cobre as 52 páginas sem layout (UX-001) | Resolve junto com UX-001 |
| UX-094 | Um único documento de arquitetura (§8) | PLANEJADO:497 | 🟨 | `ARCHITECTURE.md` (raiz) e `docs/ARCHITECTURE.md` continuam coexistindo | Eleger um e apontar o outro |
| UX-095 | Captura de Win/Loss ao mover deal para ganho/perdido (§7; CMP-02) | PLANEJADO:463 | ❔ | `WinLossCaptureDialog` agora montado em `components/pipeline/DealDetailDrawer.tsx`; não verifiquei se ele abre sozinho no drag para ganho/perdido no Kanban | Ler o handler de movimento/abrir no runtime |
| UX-096 | `/design-system` público | MATRIZ_UX:207 | ❔ | `AppRoutes.tsx:71` sem guarda; é decisão de produto, não falha comprovada | Decidir se fica público |
| UX-097 | WCAG/ARIA "exaustivas" em Sidebar e Header (UX-3.2) | ux_improvement_strategy.md:49-50 | ❔ | Há ARIA e `aria-live` (29 arquivos; `AriaLiveProvider` em `AppProviders.tsx:59`); conformidade só se prova com leitor de tela | Auditoria com leitor de tela/axe no navegador |
| UX-098 | Contraste de cores AA (PD-4.1) | V6.md:206-213 | ❔ | Tokens em `index.css`; contraste real depende de renderização | Medir com axe/Lighthouse no build |
| UX-099 | Ícones decorativos com `aria-hidden` (PD-4.4) | V6.md:240-247 | ❔ | `aria-hidden` explícito em 110 arquivos contra 933 que importam `lucide-react`; não verifiquei se a versão do lucide já aplica `aria-hidden` por padrão | Conferir a versão do lucide e auditar no DOM |
| UX-100 | Line-height aplicado com consistência (PD-1.5) | V6.md:95-97 | ❔ | `--leading-*` em `index.css:44-47`; 148 usos de `leading-*`. "Consistente" é visual | Revisão visual |
| UX-101 | Preview no hover da sidebar recolhida (PD-2.4) | V6.md:136-138 | ❔ | Não localizei mini-cards; só tooltips. Precisa de inspeção visual | Inspeção no navegador |
| UX-102 | Empty states com CTA contextual (PD-3.5) | V6.md:191-195 | ❔ | `EmptyState` em 11 arquivos e `emptyAction` no `DashboardStatsGrid.tsx:56`; cobertura por tela não mensurável por grep | Percorrer as telas vazias |
| UX-103 | Cards menos densos no mobile (PD-5.3) | V6.md:293-299 | ❔ | Visual/responsivo | Teste em viewport móvel |
| UX-104 | Landscape mode (PD-5.4) | V6.md:303-305 | ❔ | Visual | Teste em viewport landscape |
| UX-105 | Hierarquia visual (PD-7.1) | V6.md:390-397 | ❔ | Visual | Revisão de design |
| UX-106 | Ilustrações personalizadas (PD-7.2) | V6.md:399-401 | ❔ | Visual/conteúdo | Revisão de design |
| UX-107 | Cores de badge consistentes (PD-7.3) | V6.md:403-413 | ❔ | Relacionado a UX-091; a consistência é visual | Revisão de design |
| UX-108 | Uso de gradientes (PD-7.5) | V6.md:421-425 | ❔ | Visual | Revisão de design |
| UX-109 | Smart defaults em formulários (PD-8.4) | V6.md:482-484 | ❔ | Recomendação genérica, sem critério verificável | Definir os campos |
| UX-110 | Dependências entre campos (PD-8.5) | V6.md:486-490 | ❔ | Idem | Definir os campos |
| UX-111 | Comparativo YoY/MoM (PD-11.3) | V6.md:624-626 | ❔ | `YoyComparisonWidget`/`useYoyComparison` existem; o contrato da RPC `get_yoy_comparison` no banco canônico não foi conferido | Consultar a RPC no Supabase |
| UX-112 | ContactCardWithContext: subproblema 1 (PD-12.1a) | V6.md:642-663 | ❔ | Densidade/contexto visual | Revisão visual |
| UX-113 | ContactCardWithContext: subproblema 2 (PD-12.1b) | V6.md:642-663 | ❔ | Idem | Revisão visual |
| UX-114 | ContactCardWithContext: subproblema 3 (PD-12.1c) | V6.md:642-663 | ❔ | Idem | Revisão visual |
| UX-115 | AdvancedFilters: subproblema 2 (PD-12.2b) | V6.md:665-681 | ❔ | Visual/fluxo | Revisão visual |
| UX-116 | Sidebar: subproblema 1 (PD-12.3a) | V6.md:683-707 | ❔ | Visual | Revisão visual |
| UX-117 | Onboarding mais curto (PD-13.1) | V6.md:719-721 | ❔ | `/onboarding` existe; "curto" depende de medição de tempo | Medir conclusão/tempo |
| UX-118 | Graceful degradation (PD-14.3) | V6.md:793-795 | ❔ | `ExternalDataCard` com estados de circuito aberto (Gallery); cobertura por tela é runtime | Simular falhas por módulo |
| UX-119 | CHANGELOG Keep-a-Changelog estrito (ADR-012 §4) | ADR-012:77-79 | ❔ | `CHANGELOG.md` existe; formato estrito e tag `v2.1.0` não conferidos | Ler o CHANGELOG/tags |
| UX-120 | SemVer estrito (ADR-012 §5) | ADR-012:81-82 | ❔ | Processo, não código | Conferir as tags/releases |
| UX-121 | PR #3 (`contacts.length >= 0`, reduce sem seed) fechado sem merge | PLANEJADO:546 | ❔ | `gh api …/pulls/3` → `closed`, `merged_at=null`; não verifiquei se a correção entrou por outro caminho | Grep dos padrões citados no PR |
| UX-122 | PR #58 (migration t216) fechado sem merge | PLANEJADO:547 | ❔ | `gh api …/pulls/58` → `closed`, sem merge; a paridade ledger↔repo é do auditor de banco | Delegar ao auditor de banco |

## 3. Itens que os docs antigos davam como faltando e que já foram resolvidos (com evidência)

- **Observability tinha rota ausente e números fixos (ROT-02)**: rota `/admin/observabilidade` (`AppRoutes.tsx:189`) com item na sidebar admin (`AppSidebar.tsx:102`); o cabeçalho de `src/pages/admin/Observability.tsx:10-17` registra que os números fixos 99.9%/142ms/0.02% saíram, e `:128` mostra `—` quando não há dado. O `inventario/estado/rotas.json` ainda acusa a página como órfã, o que está desatualizado.
- **Logs de Conexões (ROT-01, §7)**: rota `/admin/conexoes/logs` (`AppRoutes.tsx:185`), com link em `AdminConexoes.tsx:46` (usa `<a href>`, que recarrega a página inteira, mas abre).
- **"Esqueci minha senha" (CMP-01, §7)**: `ForgotPasswordForm` montado em `src/pages/Auth.tsx`.
- **Recomendação de playbook (CMP-03, §7)**: `PlaybookSuggestionDrawer` montado em `components/pipeline/DealDetailDrawer.tsx`.
- **Card de intenção por conta (CMP-04, §7)**: `IntentSignalCard` montado em `src/pages/EmpresaDetalhe.tsx`.
- **Bibliotecas Carnegie/gatilhos só em testes (CMP-19, §7)**: `data/carnegieEagerWant` com 2 consumidores e `data/triggersAdvancedData` com 2, fora de testes.
- **Métricas aleatórias (HF-05/HF-25, §8 "Métricas aleatórias removidas")**: não há mais `Math.random` em `useDealVelocity`, `useEmotionalIntelligence` nem `useHiddenObjections`. Os `Math.random` restantes servem para IDs, celebração ou skeleton.
- **Benchmark do setor inventado (HF-08)**: `CompanyBenchmarkRadar.tsx:10-19` agora mostra só `health_score`/`churn_risk` reais.
- **Ranking de vendedores inventado (HF-01)**: `Analytics.tsx:81-82` usa `useActivityOverview` (RPC), comparando o período atual com o anterior.
- **Links quebrados (ROT-04/05/06/07)**: `HealthAlertsPanel.tsx:150` e `ImportantDatesCalendar.tsx:65,151,158` apontam para `/contatos/:id`; `ContatoDetalhe.tsx:176` para `/relatorio/:id`; `NLPInsightsDashboard.tsx:84` para `/relatorio/:id`; `OnboardingChecklist.tsx:126` para `/sequencias`.
- **Botão Voltar + NavigationStackContext + histórico (UX-1.1/1.2/1.3)**: `NavigationStackProvider` em `AppProviders.tsx:68`, `PageTransition` em `AppLayout`, `SmartBackButton` usado em várias páginas (ex.: `IntentSetup.tsx:16`).
- **Reduced motion global (PD-4.5)**: `<MotionConfig reducedMotion="user">` em `AppProviders.tsx:55`.
- **Tokens de espaço e de motion (PD-1.1/1.2)**: `index.css:157-192` + `tailwind.config.ts:21-30,137`.
- **Indicador ativo no MobileBottomNav (PD-2.1)**: `MobileBottomNav.tsx:175,187` (`layoutId`).
- **Gate de a11y e registro de atalhos (ADR-012 §1/§2)**: `src/test/a11y/critical-components.test.tsx`, que roda no CI via `npm run test:coverage` (`ci.yml:164`); `keyboardShortcutRegistry.ts` com `useScopedShortcut` em `useFicha360FilterShortcuts.ts` e `InteracoesContent.tsx`.
- **Checklist WCAG documentado (ADR-011 §1)**: `.lovable/memory/standards/accessibility-wcag-aa.md` existe.
- **Status sem fail-open (AUDITORIA.md:162)**: `StatusPage.tsx:46,57` trata `isError` como `unavailable`.
- **`ONBOARDING.md` "10 ADRs" (ON-2)**: o texto não cita mais a quantidade (`:12,138`).
- **PRs do §11**: #103 e #106 foram mergeados em 12/10 (`gh api` → `merged_at` 2026-10-12). #87 foi fechado, mas o objetivo entrou: `vite-plugin-pwa` está em `devDependencies` (`package.json:149`). #83 e #7 (Dependabot) estão fechados.
- **Stepper na importação (UX-4.1, parcial)**: `MultiStepProgress` em `BulkImportDialog.tsx:73-77`. Falta o progresso medido (UX-062).
