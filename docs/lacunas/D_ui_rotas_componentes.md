# D — Camada de UI (src/app, src/pages, src/components, navegação, src/data)

Repositório: `/home/user/Singu_V2` · HEAD `e616c20` · auditoria estática (nenhum arquivo do repo alterado).

**Método.** Rotas extraídas de `src/app/AppRoutes.tsx` (todos os `<Route>`). Grafo de imports montado por script (imports estáticos, `import()` dinâmico, `export … from`, aliases `@/`), com alcançabilidade a partir de `src/main.tsx` e testes excluídos. Todos os destinos de navegação (`navigate(`, `to=`, `href=`, `url:`, `path:`, `window.open`, `${origin}/…`) foram cruzados com as rotas. Também foram varridos: botões sem handler (`<Button>`/`<button>` sem `onClick`, `asChild`, `type=submit` nem Trigger pai), eventos `CustomEvent` sem ouvinte, JSX solto fora do `return`, literais de KPI fixos no código, `Math.random` em dados exibidos e termos de placeholder. Cada achado abaixo foi lido no código.

Legenda de status: ❌ NÃO INICIADO · 🟨 PARCIAL · 🎭 VITRINE (parece funcionar, mas o dado ou a ação é falso) · 🔌 DESCONECTADO (existe, mas não está ligado) · ⬛ MORTO.

---

## Mapa de rotas (contagem + anomalias)

| Métrica | Valor | Evidência |
|---|---|---|
| `<Route>` em `AppRoutes.tsx` | **113** | `src/app/AppRoutes.tsx:60-181` |
| públicas (`LazyPage`) | 11 + 1 catch-all (`*` → NotFound) | `AppRoutes.tsx:62-72,180` |
| protegidas (`Protected` = RequireAuth + MFAGuard) | 77 (inclui `/onboarding`) | `AppRoutes.tsx:73-155` |
| admin (`Admin` = RequireAdmin) | 23 (22 `/admin/*` + `/rodizio`) | `AppRoutes.tsx:133,156-177` |
| redirect | 1 (`/whatsapp` → `/interacoes?canal=whatsapp`) | `AppRoutes.tsx:154` |
| exports em `lazyPages.tsx` | 119 (112 páginas + 7 de shell) | `src/app/lazyPages.tsx` |
| página lazy **sem rota** | 1 (`AdminObservability`) | `lazyPages.tsx:3` |
| arquivos em `src/pages` (sem testes) | 141 (106 na raiz + 9 em `admin/` + 1 em `crm/` + 25 subcomponentes) | `find src/pages` |
| itens da sidebar desktop | 33 | `src/components/layout/AppSidebar.tsx:20-78` |
| rotas no command palette (Ctrl+K) | 48 | `src/components/command/commandRegistry.ts:24-79` |
| drawer mobile / bottom nav / sidebar admin | 27 / 12 / 16 | `MobileSidebarDrawer.tsx:47-76`, `MobileBottomNav.tsx:24-38`, `AdminSidebar.tsx:8-25` |
| links internos para rota inexistente | **9 destinos / 12 ocorrências** | ver ROT-01…ROT-08 |
| rotas sem menu, sem comando e sem link | **15** (6 do app + 7 admin + `/admin` + `/design-system`) | ver ROT-09…ROT-11 |
| rotas acessíveis **só** pelo Ctrl+K | **18** | ver ROT-12 |
| páginas autenticadas renderizadas **sem** AppLayout/AdminLayout | **43**, entre elas 7 itens da sidebar | ver ROT-13 |

Anomalias estruturais:
- **Não existe layout global.** `AppRoutes` é montado direto em `src/app/AppProviders.tsx:71`. Sidebar, header, Command Bar (`AppLayout.tsx:264`) e atalhos (`AppLayout.tsx:106`) só existem quando a própria página se envolve em `<AppLayout>` (ROT-13).
- `/design-system` está **público, sem autenticação** (`AppRoutes.tsx:69`): é ferramenta interna exposta na internet.
- Nenhuma rota é condicionada por feature flag (FF-01). O único gate de papel é `RequireAdmin`, que consulta `has_role` (`src/components/admin/RequireAdmin.tsx:26-27`). As páginas admin ainda repetem `useIsAdmin`, o que é redundante mas funcional.

| ID | Funcionalidade afetada | Status | Evidência (arquivo:linha) | O que falta | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|
| ROT-13 | Navegação consistente (sidebar, header, Ctrl+K, atalhos) em 43 páginas autenticadas, entre elas os itens de sidebar Marketing & Campanhas, Tarefas, Territórios, Lead Scoring, Enriquecimento, Copywriting e Segurança | 🟨 PARCIAL | `src/app/AppProviders.tsx:71` (sem layout global); `src/pages/Tarefas.tsx:68-71`, `src/pages/MarketingHub.tsx:150-151`, `src/pages/Territorios.tsx:13`, `src/pages/LeadScoring.tsx:17`, `src/pages/Enrichment.tsx:14`, `src/pages/Security.tsx:15`, `src/pages/crm/CopywritingEnterprise.tsx` (nenhuma usa AppLayout); idem Forecasting, WinLoss, RevOps, CustomerSuccess, DealRooms, Playbooks, SmsMarketing, Rodizio, TerritoryOptimization, ErpViewer, Deduplicacao, LeadScoringConfig/Automations, Marketing*Detail e 9 páginas admin sem `AdminLayout` | Envolver essas páginas em `AppLayout`/`AdminLayout`, ou criar um layout de rota (`<Outlet>`) | Ao clicar em 7 dos 33 itens da sidebar, a sidebar some e o Ctrl+K deixa de funcionar; o usuário só sai pelo botão "voltar" do navegador | M |
| ROT-14 | Rodízio de carteira no Ctrl+K | 🟨 PARCIAL | `commandRegistry.ts:55` (visível a todos) × `AppRoutes.tsx:133` (`<Admin>`) × `RequireAdmin.tsx:50` (`Navigate to="/"`) | Esconder o item para quem não é admin, ou abrir a rota a gestores | Quem não é admin clica e cai no dashboard sem explicação | P |

---

## Páginas órfãs / rotas inacessíveis / links quebrados

| ID | Funcionalidade afetada | Status | Evidência (arquivo:linha) | O que falta | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|
| ROT-01 | Logs unificados de conexões e webhooks (+ DLQ de webhooks + anomalias) | 🔌 DESCONECTADO | Botão "Ver logs unificados" → `/admin/conexoes/logs` em `src/pages/AdminConexoes.tsx:44`; página pronta em `src/pages/AdminConexoesLogs.tsx:49`, sem rota nem lazy; usa `WebhookDlqPanel` e `AnomaliesWidget` (`AdminConexoesLogs.tsx:15-16`), ambos inalcançáveis | Rota `/admin/conexoes/logs` + entrada em `lazyPages` | Admin não consegue diagnosticar falhas de integração nem reprocessar a DLQ; o botão leva a 404 | P |
| ROT-02 | Observabilidade (latência, slow queries, SLO) | ⬛ MORTO + 🎭 | `src/app/lazyPages.tsx:3` (lazy sem `<Route>`); `src/pages/admin/Observability.tsx:59,69,79` com "99.9%", "142ms" e "0.02%" escritos no código | Rota, mais KPIs reais vindos de `system_health_snapshots` e `slow_queries_audit` | Painel de SRE não existe para o usuário; se for ligado como está, mostra números inventados | M |
| ROT-03 | Banner "MFA não configurado" para admin | 🔌 | `src/components/admin/RequireAdmin.tsx:60` → `/configuracoes/seguranca` (rota inexistente; a correta é `/seguranca`, `AppRoutes.tsx:155`) | Corrigir o destino | Admin sem 2FA clica em "Configurar agora" e cai em 404, ou seja, o fluxo de endurecimento do admin quebra | P |
| ROT-04 | Abrir contato a partir de alertas de saúde e do calendário de datas importantes no Dashboard | 🔌 | `/contato/${id}` (singular) em `src/components/dashboard/HealthAlertsPanel.tsx:150` e `src/components/dashboard/ImportantDatesCalendar.tsx:65,151,158`; a rota real é `/contatos/:id` (`AppRoutes.tsx:83`) | Corrigir para `/contatos/` | 4 pontos clicáveis do Dashboard (aniversários, alertas de risco) levam a 404 | P |
| ROT-05 | "Relatório Completo" no detalhe do contato | 🔌 | `src/pages/ContatoDetalhe.tsx:166` → `/contatos/${id}/relatorio`; a rota real é `/relatorio/:id` (`AppRoutes.tsx:100`) | Corrigir o destino | O relatório consolidado do contato fica inacessível pelo botão principal | P |
| ROT-06 | "Exportar PDF" dos Insights de Negociação PNL | 🔌 | `src/components/nlp/NLPInsightsDashboard.tsx:84` → `window.open('/relatorio-contato/${id}')` (rota inexistente); o componente aparece em `ContactOverviewTab.tsx:80` | Corrigir para `/relatorio/:id` | Exportação em PDF abre aba com 404 | P |
| ROT-07 | Checklist de onboarding, passo "Ative uma sequência" | 🔌 | `src/components/dashboard/OnboardingChecklist.tsx:126` → `/sequences`; a rota é `/sequencias` (`AppRoutes.tsx:104`) | Corrigir o destino | Usuário novo, no onboarding, cai em 404 | P |
| ROT-08 | Dashboards embeddable (iframe em portais externos) | ❌ NÃO INICIADO | Snippet `/embed/dashboard/${id}` em `src/components/bi/EmbeddableDashboards.tsx:37,120`; nenhuma rota `embed` em `AppRoutes.tsx`; dashboards fixos no cliente em `src/hooks/useBIAdvanced.ts:147-171`; o rodapé promete "autenticação via token" (`EmbeddableDashboards.tsx:128`) que não existe | Rota pública de embed, emissão e validação de token, renderização dos widgets | O código de embed copiado pelo cliente gera iframe com 404; a promessa de segurança é falsa | G |
| ROT-09 | Entrada para a área Admin | 🔌 | `'/admin'` só aparece em `src/components/admin/AdminSidebar.tsx:9`, que é renderizado **dentro** do admin; não há link em `AppSidebar.tsx:20-78`, `Header.tsx`, `MobileSidebarDrawer.tsx:47-76` nem `commandRegistry.ts` | Item "Administração" visível só para admin | O admin precisa digitar a URL para chegar a qualquer painel administrativo | P |
| ROT-10 | Gestão de RBAC e segurança admin: `/admin/roles`, `/admin/permissions`, `/admin/role-permissions`, `/admin/seguranca`, `/admin/error-logs`, `/admin/component-gallery` | 🔌 | Rotas em `AppRoutes.tsx:158-161,172-173`; nenhum desses caminhos aparece em `AdminSidebar.tsx:8-25` nem em outro link | Itens no AdminSidebar | A aprovação de reset de senha e as páginas de papéis e erros só abrem por URL digitada | P |
| ROT-11 | Cadastro unificado (Empresa / Pessoa / Vínculo), Histórico unificado, Perfis comportamentais, Importação de WhatsApp, Assistente IA (threads), Auditoria de relacionamento CRM | 🔌 | Rotas `AppRoutes.tsx:77,78,79,80,99,139`; nenhum `navigate`, `Link`, item de menu ou comando aponta para elas (grep de todos os destinos) | Itens de menu ou comando | 6 telas prontas que o usuário não encontra, como a importação de conversas do WhatsApp e o assistente com histórico | P |
| ROT-12 | Inbox, Deal Rooms, Forecasting, Win/Loss, RevOps, Customer Success, Intent, Otimização de Territórios, Rodízio, Campanhas, SMS, Nurturing, Knowledge Base, Deduplicação, ERP, Playbooks, Report Builder, Relatórios Customizáveis | 🟨 PARCIAL | Só em `commandRegistry.ts:33-74`; ausentes de `AppSidebar.tsx:20-78` e de `MobileSidebarDrawer.tsx:47-76` | Seções na sidebar (ex.: "Receita", "Marketing", "Suporte") | 18 módulos, incluindo o núcleo de RevOps e Marketing, ficam invisíveis para quem não conhece o Ctrl+K | P |
| ROT-16 | Ações "Novo contato / Nova interação / Nova empresa" no Ctrl+K | 🎭 VITRINE | `GlobalCommandBar.tsx:66,76,86` navegam com `?new=1`; nenhuma página lê o parâmetro `new` (grep vazio em `src/pages`) | Abrir o formulário quando `?new=1` estiver presente | O atalho só abre a lista, não cria nada | P |
| ROT-17 | "Perguntar ao CRM" no Ctrl+K | 🔌 | `AppLayout.tsx:268` dispara `open-ask-crm`, mas nenhum `addEventListener('open-ask-crm')` existe; `AskCrmChat` controla o próprio estado (`src/components/ask-crm/AskCrmChat.tsx:85`) | Ouvinte no AskCrmChat ou estado compartilhado | A ação anunciada no palette não faz nada | P |
| ROT-18 | 14 atalhos de teclado: busca global, focar busca, quick-add de contato/interação/empresa, salvar, fechar modais, alternar sidebar, dark mode, editar/excluir item, selecionar tudo, desfazer, refazer | 🎭 VITRINE | `src/hooks/useKeyboardShortcutsEnhanced.ts:54,61,96,103,110,117,133,141,149,177,183,192,212,221` disparam `CustomEvent` sem nenhum ouvinte (grep do nome do evento = 0 fora do `dispatchEvent`); aparecem no cheatsheet via `KeyboardShortcutsDialogEnhanced` | Ouvintes nos componentes alvo | Atalhos documentados ao usuário não funcionam (inclusive desfazer/refazer e salvar) | M |
| ROT-19 | Reabrir "O que há de novo" e aviso de atualização do PWA | 🔌 | `WhatsNewModal.tsx:181` (`show-whats-new`) e `src/main.tsx:122` (`pwa:update-available`), ambos sem ouvinte (o comentário em `main.tsx:112-118` só descreve o contrato) | Componente que escute os eventos e mostre um toast | O usuário nunca é avisado de nova versão, fica com bundle velho em cache | P |

---

## Placeholders e "em breve"

Nos arquivos de `src/pages` e `src/components` não há nenhum `TODO`, `FIXME`, `XXX` ou `HACK` real (grep: zero). As promessas aparecem como texto, toast ou comentário:

| ID | Funcionalidade afetada | Status | Evidência (arquivo:linha) | O que falta | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|
| PH-01 | Aplicar recomendação de otimização de território | ❌ NÃO INICIADO | `src/components/territory-optimization/TerritoryRecommendationCard.tsx:72-74`: toast "Aplicação automática em breve. Por enquanto execute manualmente em Territórios ou Rodízio." | Mutação que aplique a recomendação (reatribuição de território ou onda de rodízio) | A IA recomenda, mas o gestor precisa refazer tudo à mão | M |
| PH-02 | Aplicar tag em lote às interações selecionadas | ❌ NÃO INICIADO | `src/components/interactions/InteractionBatchActions.tsx:75`: `toast.info('Funcionalidade em desenvolvimento')` (barra usada em `InteracoesContent.tsx:31`) | Diálogo de tag + update em lote | Não dá para classificar conversas em massa | P |
| PH-03 | Report Builder (`/report-builder`) | 🎭 VITRINE | `src/pages/ReportBuilder.tsx:45` "Placeholder widget rendering - these would connect to real hooks in production"; `WidgetRenderer` (`:40-64`) só mostra ícone e rótulo; layouts salvos apenas em `localStorage` (`:76,90`) | Ligar os 12 widgets a hooks reais e persistir layouts no banco | O "construtor de relatórios" exibe cartões vazios; nenhum relatório real | G |
| PH-04 | Novidades anunciadas no WhatsNew: "Ajuda Contextual: tooltips em todas as métricas" e "Modo Offline Aprimorado: continue trabalhando sem conexão" | 🎭 VITRINE | `src/components/features/WhatsNewModal.tsx:60-61,67-68`; `ContextualHelpTooltip` e `ContextualHelp` estão mortos (CMP-18); `vite.config.ts:64` tem `runtimeCaching: []`; `public/sw-push.js:208-210`: `checkForNotifications` só faz `console.log` | Implementar cache e fila offline, aplicar os tooltips, ou retirar o anúncio | Comunicação de produto promete recursos que não existem | M |
| PH-05 | "Campanhas SMS segmentadas" | 🟨 PARCIAL | Promessa em `src/pages/SmsMarketing.tsx:62`; a edge envia para **todos** os contatos com telefone (`supabase/functions/send-sms-campaign/index.ts:71-90`); nenhuma UI de segmento, agendamento ou gestão de `sms_opt_outs` (grep em `src` = 0) | Seletor de segmento, agendamento, tela de opt-out | Disparo em massa sem segmentação, com risco de custo e de LGPD/opt-out | M |
| PH-06 | "Princípios de Carnegie — Implementação Completa" (Insights) | 🎭 VITRINE | `src/components/carnegie/CarnegieDashboard.tsx:42-43` "Calculate a sample score for demo" → `calculateCarnegieScore(65)` exibido em `:104`; os componentes valem 50 fixos em `src/hooks/useCarnegieAnalysis.ts:107-118`; renderizado sem contato em `src/pages/Insights.tsx:138` | Score real por contato ou carteira | O score mostrado é constante para qualquer usuário | M |
| PH-07 | "Tópicos e Pendências" da última interação no card de Próximos Passos | 🎭 VITRINE | `src/components/dashboard/StrategicNextStepsCard.tsx:535` (comentário "Simulados se não houver no banco"); fallback fixo "Contexto de negócio / Próximos passos" e a pendência "Validar proposta" sempre presente (`:541-552`) | Dados vindos de `key_insights` e follow-ups reais | O vendedor vê uma pendência inventada no Dashboard | P |
| PH-08 | Filtro "EXTERNAL_SYNC" na trilha de auditoria | 🟨 PARCIAL | `src/pages/AdminAuditTrail.tsx:89-92`: bloco vazio "For now, we assume…" | Consultar o log de sincronização externa | O filtro não traz os eventos de sync | P |
| PH-09 | Edição de eventos na Ficha 360 | 🟨 PARCIAL | `src/components/ficha-360/DadosPessoaisCard.tsx:590`: "Somente Leitura por enquanto conforme plano" | Edição inline dos eventos | Eventos de agenda não editáveis na ficha | P |
| PH-10 | Analisador de Copy (Copywriting) | 🟨 PARCIAL | `src/components/crm/copywriting/CopyAnalyzer.tsx:38` "Mock analysis engine": gatilhos por palavra-chave (`:47-51`) e emoções fixas (`joy: text.includes('!') ? 80 : 40`, `:73-75`) | Análise por IA (as edges de IA já existem) | O score de copy é heurística rasa apresentada como análise | M |

---

## Handlers falsos / dados fake exibidos como reais

**Resposta direta: sim, `src/data/analyticsData.ts` é usado em produção como dado real.** A rota `/analytics` (sidebar e atalho Alt+A) importa os geradores em `src/pages/Analytics.tsx:66-72` e os chama em `:86-92`. Os valores alimentam os 4 KPIs (`:169-172`), o gráfico de evolução (`:296`), o "Top performers" com nomes fictícios ("João Silva", "Maria Santos"… `analyticsData.ts:171-177`) (`:328`) e as abas Engajamento e Sentimento (`:374,378`). Não há nenhum `supabase` nesse fluxo.

| ID | Funcionalidade afetada | Status | Evidência (arquivo:linha) | O que falta | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|
| HF-01 | Analytics: visão geral, engajamento e sentimento | 🎭 VITRINE | `src/pages/Analytics.tsx:66-92,169-172,296,328,374,378`; `src/data/analyticsData.ts:27-211` (todos os arrays fixos por período); loading falso de 800 ms em `Analytics.tsx:81-84` | Hooks reais (as interações e o sentimento já estão no banco) | O gestor toma decisão com números inventados e iguais para todas as contas | M |
| HF-02 | Analytics: botões "Exportar" e "Atualizar" | 🎭 | `src/pages/Analytics.tsx:158-163` (sem `onClick`) | Export CSV/PDF e refetch | Os botões não fazem nada | P |
| HF-03 | Analytics, aba Neuro ("Balanço Neural Médio do Portfólio", heatmap, A/B) | 🎭 | `Analytics.tsx:214-221` passa `discProfile={null} interactions={[]}`; `NeuroRadarChart.tsx:55-57` cai no padrão 33/34/33; `NeuroHeatmapCalendar.tsx:83-121` usa padrão `limbic` e `timeData=[]` (heurística fixa); `NeuroABTracker` sem resultados | Agregar dados reais do portfólio | Gráficos de "portfólio" são estáticos | M |
| HF-04 | Analytics, aba PNL: 12 ferramentas (Rapport Coach, Miltoniano, TOTE, Âncoras etc.) | 🎭 | `Analytics.tsx:273-278` sem contato → `DEMO_CONTACT` (`src/components/nlp/RapportRealtimeCoach.tsx:65`; `src/domain/demoEntities.ts:1-6`, também em `AdvancedTriggersPanel.tsx:28`) | Seletor de contato real | O vendedor treina e analisa um contato fictício como se fosse da carteira | M |
| HF-05 | Velocidade de deals (Analytics, Dashboard › Analytics/Inteligência) | 🎭 | `src/hooks/useDealVelocity.ts:67`: `averageDays: Math.round(Math.random() * 15) + 3`; consumido por `DealVelocityPanel` (`Analytics.tsx:259`, `dashboard/tabs/AnalyticsTab.tsx`, `IntelligenceTab.tsx`) | Calcular a partir do histórico de estágio | O ciclo médio de venda muda a cada render | P |
| HF-06 | Dashboard, aba Relacionamentos: "Estatísticas de relacionamento" e "Precisão IA" | 🎭 | `src/components/dashboard/RelationshipStatsPanel.tsx:34-88,132` (tudo fixo: "4.2h", "92%", canais, semana); `src/components/crm/RelationshipKPIsDashboard.tsx:120-127` (trend Jan–Mai fixo) e `:238` ("Precisão IA 94.2%" + "Auto-ajuste ativo"); também usado em `src/pages/Automacoes.tsx:15` | Métricas reais | KPIs da home são fake | M |
| HF-07 | Dashboard: KPI "Closing Score (Avg)" | 🎭 | `src/components/dashboard/DashboardStatsGrid.tsx:62` `change: '+2% vs ontem'` fixo | Variação calculada | A tendência é sempre positiva | P |
| HF-08 | Empresa › Insights: "Benchmark do Setor" | 🎭 | `src/components/company-detail/CompanyBenchmarkRadar.tsx:14-21` ("Mock data… would ideally come from an RPC"; média do setor, Receita 70 e Fidelidade 85 fixos), carregado em `CompanyInsightsTab.tsx:28` | RPC de benchmark | Comparação competitiva inventada | M |
| HF-09 | Marketing Hub: CPL / CAC / LTV / ROI | 🎭 | `src/pages/MarketingHub.tsx:253-262` (R$ 14,30 / R$ 452,00 / R$ 8.900,00); `src/components/crm/marketing/components/MarketingStats.tsx:18-19` ("ROI Estimado 12.4x"); o card "Lead Magnets" mostra views | Cálculo com custos e receita atribuída | Indicadores financeiros de marketing são falsos | M |
| HF-11 | Filtros do Pipeline | 🎭 | `src/components/pipeline/PipelineFilterBar.tsx:42-48` (checkboxes fixos, um sempre `checked`, "Limpar filtros" sem handler); `src/pages/Pipeline.tsx:376` `onFilterChange={() => {}}` | Estado de filtro aplicado aos deals | O menu "Filtros" do Pipeline não filtra | P |
| HF-12 | Configurações › Segurança: Alterar senha, Sessões ativas, Excluir conta | 🎭 | `src/pages/configuracoes/ConfigSecurityTab.tsx:25,35,45` (Buttons sem `onClick`), aba em `Configuracoes.tsx:158` | Fluxos de troca de senha, listagem e revogação de sessões, exclusão de conta | Sem autoatendimento de senha e sem exclusão de conta (LGPD) | M |
| HF-13 | Configurações › Notificações (e-mail, push, resumo, lembretes) | 🎭 | `src/pages/Configuracoes.tsx:46-48` (`useState` local); `src/pages/configuracoes/ConfigNotificationsTab.tsx:47-51`; nada é persistido | Gravar em `notification_preferences` | As preferências se perdem ao sair da página | P |
| HF-14 | Alterar foto de perfil | ❌ | `src/pages/Configuracoes.tsx:121` (`<button aria-label="Alterar foto de perfil">` sem `onClick`) | Upload para storage + update de `avatar_url` | Não dá para trocar o avatar | P |
| HF-15 | Detalhe de uma análise de Conversation Intelligence | ❌ | `src/components/conversation-intel/ConversationAnalysesTable.tsx:72` (botão "Visualizar" sem handler) | Drawer ou página de detalhe (transcrição, momentos, coaching) | O resultado da análise de chamada não é consultável | M |
| HF-16 | Marketing › Segmentação comportamental: "Automação", "Criar Campanha de Email", "Exportar Lista de Público" | 🎭 | `src/components/crm/marketing/components/BehavioralSegmentation.tsx:176,236,239` | Ligar a campanhas, automação e export | Segmentos sem ação possível | M |
| HF-17 | MQL Manager "Ver todos os N MQLs" | 🟨 | `src/components/crm/marketing/components/MQLManager.tsx:95` | Listagem completa | Só 5 MQLs visíveis | P |
| HF-18 | Marketing Hub "Ver modelos recomendados" (isca digital) | ❌ | `src/pages/MarketingHub.tsx:442-444` | Galeria de templates | CTA de empty state não faz nada | P |
| HF-19 | Empresa › Interações: "Registrar Interação" (empty state) | 🎭 | `src/components/company-detail/CompanyInteractionsTab.tsx:236` | Abrir diálogo de interação | CTA principal da aba inerte | P |
| HF-20 | Follow-up rápido de empresa: "Criar Tarefa" | 🎭 | `src/components/company-detail/QuickFollowUpGenerator.tsx:140` | Mutação de tarefa | A sugestão da IA não vira tarefa | P |
| HF-21 | Próximos Passos Estratégicos: "Avançar" e "Ver lista completa" | 🎭 | `src/components/dashboard/StrategicNextStepsCard.tsx:246,261` | Handlers | Botões inertes na home | P |
| HF-22 | Predição de churn: botão de ação recomendada | 🎭 | `src/components/analytics/ChurnPredictionPanel.tsx:161` | Executar a ação (tarefa, ligação) | Recomendação não acionável | P |
| HF-23 | Ficha 360 › Análise PNL "Ver análise completa" | 🎭 | `src/components/ficha-360/NLPAnalysisCard.tsx:180` | Navegação ou drawer | Link inerte | P |
| HF-25 | Inteligência emocional do contato | 🎭 | `src/hooks/useEmotionalIntelligence.ts:53,73` (`strength` com `Math.random()`), consumido por `EmotionalIntelligencePanel` (vivo via `ContactIntelligenceTab`) | Força determinística | O score de EQ muda a cada recálculo | P |
| HF-26 | Envio de pesquisa NPS/CSAT por canal | 🟨 | `src/components/nps/SendSurveyDialog.tsx:18,33,123-129` (canal Email/WhatsApp/SMS/In-app só é gravado); `:92` "cole este link…": nada é enviado | Disparo pelo canal escolhido (SMS e WhatsApp já têm infra) | Pesquisa depende de copiar e colar manualmente | M |
| HF-27 | Aprovação de reset de senha (admin) | 🔌 | `src/hooks/usePasswordResetRequests.ts:29-30,41-42` só fazem `update status`; não resetam nem enviam link; nenhum código no front ou nas edges insere em `password_reset_requests` (grep) | Criação da solicitação (tela de login) + ação real de reset | Painel aprova solicitações que nunca chegam e não fazem efeito | M |
| HF-28 | "Gerenciar Roles" / Permissões / Mapa Role×Permissão | 🟨 | `src/pages/RolesPage.tsx:17-60` (somente leitura, exibe UUID); `PermissionsPage.tsx`, `RolePermissionsPage.tsx` somente leitura; `src/hooks/useRBAC.tsx:13` sem consumidor | Atribuir e revogar papéis; aplicar permissões granulares na UI | RBAC só existe como leitura; papéis são geridos fora do sistema | G |
| HF-29 | Insights comportamentais de marketing (Distribuição DISC, canais VAK, principais motivações) | ⬛ MORTO | `src/pages/MarketingHub.tsx:50-139`: bloco JSX solto no corpo da função, fora do `return` (`:150`); a query `useMarketingBehavioralInsights` roda sem uso | Mover o bloco para dentro do `return` | Painel pronto que nunca aparece (e consulta desperdiçada) | P |
| HF-30 | Preferências de horário do contato (preferidos / a evitar) | 🔌 | `src/components/contact-detail/data-tab/CadencePreferencesCard.tsx:111-131`: inputs JSX soltos dentro de `startEditingPrefs`, nunca renderizados; os campos são exibidos em `:348-362` e salvos em `:93-94` | Renderizar os inputs no formulário | Não dá para editar os horários ideais de contato | P |
| HF-31 | Aba "Segmentação" do Marketing Hub | 🟨 | `src/pages/MarketingHub.tsx:199-201`: `<TabsContent value="segmentation">` dentro de `<TabsList>` (`:191-203`) | Mover o conteúdo para fora da lista | O conteúdo da aba renderiza dentro da barra de abas (layout quebrado) | P |

---

## Componentes e features órfãs

O grafo de imports (raiz em `src/main.tsx`) aponta **132 arquivos não-teste inalcançáveis, com 20.882 linhas**:

| Pasta | Arquivos | Linhas |
|---|---|---|
| `components` | 76 | 8.545 |
| `data` | 20 | 7.453 |
| `hooks` | 24 | 3.022 |
| `types` | 4 | 1.096 |
| `domain` | 3 | 294 |
| `pages` | 2 | 408 |
| `stores`, `app`, `lib` | 3 | 64 |

Somam-se mais **~14 arquivos** vivos apenas porque estão reexportados em barrels (`carnegie`, `neuromarketing`, `micro-interactions`), sem nenhum consumidor, e a página `admin/Observability` (lazy sem rota).

Distribuição dos componentes mortos: triggers 15, crm 10, feedback 9, admin 6, ui 5, analytics 5, lead-scoring 3, demais com 1 ou 2.

| ID | Funcionalidade afetada | Status | Evidência (arquivo:linha) | O que falta | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|
| CMP-01 | "Esqueci minha senha" (autoatendimento) | 🔌 | `src/components/auth/ForgotPasswordForm.tsx:16,30` (pronto, chama `resetPasswordForEmail`) não é importado; `src/pages/Auth.tsx` não tem link nem fluxo de recuperação (grep "esque"/`resetPassword` = 0) | Link "Esqueci minha senha" no Auth | Usuário que esquece a senha fica bloqueado (e HF-27 também não funciona) | P |
| CMP-02 | Captura de Win/Loss ao fechar deal | 🔌 | `src/components/win-loss/WinLossCaptureDialog.tsx:21` sem importadores; `useUpsertWinLossRecord` (`src/hooks/useWinLoss.ts:118`) só é usado por ele; a edge `win-loss-record-deal` não tem chamador | Abrir o diálogo ao mover deal para ganho/perdido no Pipeline | Nenhum caminho de UI grava `win_loss_records`: o módulo `/win-loss` fica sempre vazio | M |
| CMP-03 | Sugestão de playbook no contexto do deal | 🔌 | `src/components/playbooks/PlaybookSuggestionDrawer.tsx` morto; `useRecommendPlaybooks` (`usePlaybooks.ts`) e a edge `playbook-recommender` sem outro consumidor | Montar o drawer no deal ou contato | Recomendação de playbook por IA não chega ao vendedor | P |
| CMP-04 | Score de intenção por conta/contato | 🔌 | `src/components/intent/IntentSignalCard.tsx` morto; `useIntentScore` só usado nele | Inserir o card em Empresa ou Contato | Sinais de intent coletados pelo pixel não aparecem no contexto da conta | P |
| CMP-05 | Painel "Recomendação de Abordagem" (rapport, valores, objeções ocultas, vieses, EQ) | ⬛ | `src/components/analytics/ApproachRecommendationPanel.tsx` + `approach/ApproachSubComponents.tsx`, `useApproachRecommendation`, `useRapportGenerator`, `useClientValues`, `useHiddenObjections` (inclui `Math.random` em `useHiddenObjections.ts:30`) | Montar o painel (e remover o aleatório) | Feature de "como abordar este cliente" não exposta | M |
| CMP-06 | Painel de Vieses Cognitivos (anunciado no WhatsNew `WhatsNewModal.tsx:46-47`) | ⬛/🟨 | `src/components/analytics/CognitiveBiasesPanel.tsx` + `useCognitiveBiasPersistence` mortos (o histórico `cognitive_bias_history` só é lido em `ContactBehavioralTab`) | Montar o painel | Novidade anunciada sem tela própria | M |
| CMP-07 | Painel de saúde do cliente | ⬛ | `src/components/analytics/ClientHealthPanel.tsx`; `useClientHealth` sem outro consumidor | Montar ou remover | Recurso redundante e invisível | P |
| CMP-08 | Comportamento estendido + log de consentimento (LGPD) + export de relatório | ⬛ | `src/components/crm/ContactBehaviorExtended.tsx` + 6 subtabs em `crm/behavior/`, `crm/consent/ConsentAuditLog.tsx` (lê `crm_consent_audit_logs`), `crm/relationship/RelationshipReportExport.tsx` | Montar no contato | Trilha de consentimento CRM não é consultável na UI | M |
| CMP-09 | Logs de comunicação DISC (documentado em `FUNCIONALIDADES_SISTEMA.md` §4.5) | ⬛ | `src/components/contact-detail/DISCCommunicationLogsPanel.tsx` + `useDISCCommunicationLogs` | Montar no contato | Feedback de efetividade DISC não é registrado nem visto | P |
| CMP-10 | Aba de dominância cerebral | ⬛ | `src/components/contact-detail/behavioral-tab/NeuroDominanceTab.tsx:21` (lê `brain_dominance_analysis`); o botão "Gerar Script de Rapport" (`:184`) não tem handler | Montar a aba + handler | Análise neuro por contato invisível | P |
| CMP-11 | Suíte de templates por perfil (sugestões inteligentes, performance A/B de templates, histórico por perfil, score de compatibilidade) | ⬛ | 15 arquivos em `src/components/triggers/`: `SmartTemplateSuggestions`, `TemplatePerformanceComparison`, `TemplateHistoryByProfile`, `CompatibilityScore`, `ProfileBasedSuggestions` + subpastas; dados exclusivos `vakTemplates.ts`, `metaprogramTemplates.ts`, `persuasionTemplates.ts`; `ProfileBasedSuggestions.tsx:143` `onCopy={() => {}}` | Montar em Contato ou Analytics | Biblioteca de mensagens por perfil nunca usada | M |
| CMP-12 | Neuromarketing avançado: caminho de decisão, construtor Dor-Promessa-Ganho, compatibilidade, NeuroScore, alertas, gerador de script (botão "Regenerar" sem handler, `NeuroScriptGenerator.tsx:151`), tratador de objeções, tooltips | ⬛ | 8 componentes só no barrel `src/components/neuromarketing/index.ts:5-21` (`NeuroDecisionPath`, `PainClaimGainBuilder`, `NeuroCompatibilityAnalysis`, `NeuroScore`, `NeuroAlerts`, `NeuroScriptGenerator`, `NeuroObjectionHandler`, `NeuroTooltipSystem`), ~2.341 linhas, 0 importadores por nome | Montar ou remover | Metade do módulo neuromarketing fica sem tela | M |
| CMP-13 | Widgets admin: status do pipeline de e-mail, saúde do sistema, gestão de acesso, tabela de telemetria | ⬛ | `src/components/admin/EmailPipelineStatus.tsx`, `SystemHealthWidget.tsx`, `AccessSecurityManager.tsx` → `PasswordResetApproval.tsx`; `src/pages/admin/TelemetryTable.tsx:33` | Montar ou remover | Telemetria duplicada e não usada | P |
| CMP-14 | Busca visual | ⬛ | `src/components/search/VisualSearchButton.tsx` (277 linhas) é o único chamador da edge `visual-search` | Montar no header ou no GlobalSearch | Edge paga e implementada sem UI | M |
| CMP-15 | Gerador de mensagens por IA (variações) | ⬛ | `src/components/ai/AIMessageGenerator.tsx` (229 linhas; o hook segue vivo via `AIEmailComposer`) | Montar ou remover | Duplicidade | P |
| CMP-16 | Exportador avançado de dados (multi-entidade) | ⬛ | `src/components/data-export/AdvancedDataExporter.tsx` + `src/data/exporterConfigs.ts` | Montar em Configurações | Usuário não consegue exportar a base completa | M |
| CMP-17 | Diversos: banner de cadastro de MFA, configurações de alerta DISC, card de notificações inteligentes, item de follow-up, contatos-chave estratégicos, resumo de touchpoints, gráfico de tópicos CI, card de interação memo, chips de densidade, LeadScoreCard duplicado | ⬛ | `security/MFAEnrollmentBanner.tsx`, `disc/DISCCompatibilityAlertSettings.tsx`, `dashboard/SmartNotificationsCard.tsx`, `dashboard/your-day/FollowUpItem.tsx`, `company-detail/insights/KeyContactsStrategicCard.tsx`, `TouchpointSummaryCard.tsx`, `conversation-intel/TopicsChart.tsx`, `interactions/InteractionCardMemo.tsx`, `interactions/DensityChips.tsx` (só teste), `lead-scoring/LeadScoreCard.tsx` (+Breakdown, Sparkline) | Montar ou remover | O banner de MFA para usuário comum e o gráfico de tópicos de CI não aparecem | P |
| CMP-18 | Biblioteca de UX não usada: ajuda contextual, estados de erro/loading, spotlight de features, stepper, toast system, density toggle, keyboard hints, priority indicator, micro-interações (SuccessCheckmark, NumberTicker, StatusIndicators, Flip/Slot/CountUp), CarnegieQuickAccess, `withProviderCheck` | ⬛ | `src/components/feedback/index.ts` (barrel sem importador) + 8 arquivos; `help/ContextualHelpTooltip.tsx`; `ui/density-toggle.tsx` + `useTableDensity`; `ui/keyboard-list-hint.tsx`, `ui/multi-step-progress.tsx`, `ui/priority-indicator.tsx`; `micro-interactions/index.ts` (só `AnimatedBadge` e `MorphingNumber` usados); `carnegie/CarnegieQuickAccess.tsx`; `hoc/withProviderCheck.tsx` | Usar ou remover | Peso morto; promessas do WhatsNew (PH-04) dependem destes componentes | P |
| CMP-19 | Conteúdo pronto sem tela: 10 bibliotecas Carnegie (crítica, desejo ardente, empatia, encorajamento, interesse genuíno, transferência de ideia, perguntas, storytelling, talk ratio, escada do sim) e 5 de gatilhos (bundles, matriz de conflitos, templates por metaprograma e VAK, gatilhos estendidos) | ⬛ | `src/data/carnegie{CriticismDetector,EagerWant,EmpathyTemplates,Encouragement,GenuineInterest,OwnershipTransfer,QuestionInfluence,Storytelling,TalkRatio,YesLadder}.ts` (3.405 linhas) e `src/data/trigger{Bundles,ConflictsMatrix,TemplatesMetaprograms,TemplatesVAK}.ts` + `triggersExtendedData.ts` (2.041 linhas): só importados por testes | Telas ou abas que consumam | ~5,4 mil linhas de metodologia comercial sem uso no produto | M |
| CMP-20 | Frameworks Big Five / MBTI / Eneagrama (documentados em `FUNCIONALIDADES_SISTEMA.md:48-52`) | 🟨 | `src/types/big-five.ts`, `mbti.ts`, `enneagram.ts` (970 linhas) sem importadores; a UI só exibe campos crus em `contact-detail/behavioral-tab/PersonalitySubTab.tsx` e `PersonalityExecutiveSummary.tsx:16-22` | Usar os modelos tipados (descrições, estratégias) | Frameworks rasos: só o número, sem interpretação | M |

---

## Feature flags

| ID | Funcionalidade afetada | Status | Evidência (arquivo:linha) | O que falta | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|
| FF-01 | Sistema de feature flags (rollout gradual) | 🔌 DESCONECTADO | Hook `useFeatureFlag` em `src/hooks/useFeatureFlag.ts:15` com **0 consumidores** (grep `useFeatureFlag(` = só a definição); o painel `/admin/feature-flags` cria e alterna flags (`src/pages/admin/FeatureFlagsPage.tsx:23-56`) sem efeito em nenhuma tela; a coluna `roles` (`useFeatureFlag.ts:8`) é ignorada; nenhum seed de flag nas migrations | Envolver features beta em `useFeatureFlag` (ex.: CI, Forecasting, Deal Rooms) | Admin acha que liga e desliga recursos, mas nada muda | P |
| FF-02 | Flags por ambiente | ℹ️ inexistente | `import.meta.env.VITE_*` usados: só `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY` e `VITE_APP_VERSION` (`.env.example:1-18`) | — | **Nenhuma feature está atrás de flag desligada por padrão**: tudo que tem rota está exposto | — |
| FF-03 | Tabela `feature_flags` em produção (risco cruzado, cabe à fatia de dados confirmar) | ⚠️ a verificar | `scripts/tabelas-ausentes.md:3,32` (snapshot de 2026-08-04, gerado a partir do OpenAPI do projeto `pgxfvjmuubtbowutlide`) lista `feature_flags` entre as **119** tabelas referenciadas pelo front e ausentes no banco | Confirmar no banco atual | Se ainda ausente, o painel de flags quebra em produção, assim como as demais telas da lista | P |

---

## Fluxos de Setup / Públicos / Marketing

Verificação feita em três camadas: tela → hook → backend (tabela, RPC ou edge function confirmadas em `supabase/migrations` e `supabase/functions`).

| ID | Funcionalidade afetada | Status | Evidência (arquivo:linha) | O que falta | Impacto no negócio (1 linha) | Esforço |
|---|---|---|---|---|---|---|
| FLX-01 | Disparo de campanha de e-mail (`/campanhas`) | 🎭 VITRINE | `src/hooks/useEmailCampaigns.ts:84-86` (comentário: "Simula o envio (não dispara emails reais…)"); `:88-142` marca destinatários como `status: 'sent'` e a campanha como `sent` sem enviar nada; ignora `segment_filter` e pega **todos** os contatos com e-mail (`:95-101`), embora a página mostre `SegmentBuilderPanel` (`Campanhas.tsx:200`); a "Taxa Abertura" (`Campanhas.tsx:104`) é sempre 0; não existe edge de e-mail (sem `resend`/`smtp`/`sendgrid` em `supabase/functions`) | Provedor de e-mail, envio real, aplicar segmento, tracking de abertura e clique | O usuário acha que enviou a campanha; nenhum e-mail sai | G |
| FLX-02 | Sequências multicanal (`/sequencias`) | 🔌 | Inscrição: `enrollContact` (`src/hooks/useSequences.ts:167,199`) não é desestruturado na página (`src/pages/Sequencias.tsx:19`), logo não há UI para inscrever contato. Envio: `supabase/functions/sequence-processor/index.ts:320-346` grava o passo como `sent` e chama `send-transactional-email`, edge que não existe (só um `console.warn`) | UI de inscrição + edge de e-mail | Cadências registram envios que não aconteceram | G |
| FLX-03 | Nurturing (`/nurturing`) | 🟨 | Editor: passos e-mail/WhatsApp/tarefa nascem com `content: ''` e `subject: ''`, sem campo de edição (`src/pages/Nurturing.tsx:28-29`; só "aguardar" tem input, `:150-157`). Runner: e-mail/WhatsApp viram apenas registro de interação, sem envio (`supabase/functions/nurturing-runner/index.ts:91-99`). Gatilhos `tag_added`, `stage_changed`, `score_*` (`Nurturing.tsx:18`) não têm avaliador (só o runner lê workflows). `useEnrollContact` sem UI (`src/hooks/useNurturingExecutions.ts:38`) | Editor de conteúdo, envio real, motor de gatilhos, inscrição manual | Workflows de nutrição não nutrem ninguém | G |
| FLX-04 | Formulário público (`/f/:slug`) | 🟨 | Tela `src/pages/PublicForm.tsx:23-55` → edge `form-submit-handler` → RPC `submit_public_form` (`supabase/migrations/20260417011613_40e57206-6feb-4bd8-a3f0-110e3a2cb8e1.sql:283-316`): grava `form_submissions` + touchpoint com `contact_id NULL` (`:304`); **não cria contato nem lead** e não usa `forms.nurturing_workflow_id` (`:12`, sem UI para configurá-lo) | Criar ou deduplicar contato + inscrever no nurturing | Lead capturado não entra no CRM | M |
| FLX-05 | Landing page pública (`/lp/:slug`) | 🟨 | `src/pages/PublicLandingPage.tsx:74-85` insere em `landing_page_submissions`; nenhuma trigger ou consumidor converte em contato (grep em migrations e functions); `landing_pages.submission_count` nunca é incrementado (só `forms`, migration `…011613…sql:297`), então a lista mostra sempre "0 leads" (`src/pages/LandingPages.tsx:37,141`) | Trigger de contagem + conversão em contato | Contador de conversão errado; leads da LP ficam isolados numa gaveta | M |
| FLX-06 | Lead magnet público (`/lm/:slug`) | 🟨 | RPC `track_magnet_download` só registra o download (migration `…011613…sql:337-378`), sem criar contato; o editor só aceita URL externa (`src/pages/MarketingMagnetDetail.tsx:61-62`), não há upload para `file_path`; `PublicLeadMagnet.tsx:60-62` abriria `file_path` como URL relativa | Upload em storage + URL assinada + criação de contato | E-mail capturado não vira lead; arquivo próprio não é suportado | M |
| FLX-07 | Automações (`/automacoes`, item da sidebar) | 🔌 | CRUD completo em `src/hooks/useAutomationRules.ts:105-213` e `src/pages/Automacoes.tsx:23`; `automation_rules` não é lida por nenhuma edge ou trigger (só aparece na allowlist de `supabase/functions/external-data/index.ts:119`) | Motor que avalie e execute as regras | Regras criadas pelo usuário nunca disparam | G |
| FLX-08 | SMS Marketing (`/sms-marketing`) | 🟨 | Tela → `useSmsCampaigns` → edge `send-sms-campaign` (Twilio via gateway; marca falha quando o provedor não está configurado, `send-sms-campaign/index.ts:107-123`): funcional, mas sem segmento, agendamento e opt-out (PH-05); página sem AppLayout e fora da sidebar | Ver PH-05 | Envio só "para todos" | M |
| FLX-09 | Setup — Conversation Intelligence (`/conversation-intelligence/setup`) | ✅ ligado | `src/pages/ConversationIntelligenceSetup.tsx:22-23` → `TopicsEditor`/`ScorecardEditor` → `src/hooks/useConversationIntel.ts:124-216` (`conversation_topics_catalog`, `coaching_scorecards`, RPC `seed_conversation_topics`) | — (falta só o detalhe da análise, HF-15) | — | — |
| FLX-10 | Setup — Forecasting (`/forecasting/setup`) | 🟨 | Ligado a `forecast_quota_settings` (lido em `supabase/functions/forecast-analyzer/index.ts:81`), mas a página não tem AppLayout nem botão voltar (`src/pages/ForecastingSetup.tsx:31`) e salva pesos que não somam 100% (só avisa, `:60`, e salva em `:73`) | Validar a soma, layout e navegação | Health score pode ficar distorcido por configuração inválida | P |
| FLX-11 | Setup — Intent (`/intent/setup`) | ✅ ligado | `src/pages/IntentSetup.tsx:28` → `PixelSetupCard` → edge `intent-pixel-snippet` / `intent-tracker` | (score por conta não aparece: CMP-04) | — | — |
| FLX-12 | Setup + módulo Win/Loss | 🔌 | O setup grava motivos e concorrentes (`src/pages/WinLossSetup.tsx:27-28`), mas nenhum registro de Win/Loss é criado pela UI (CMP-02) e a edge `win-loss-record-deal` não tem chamador | Diálogo de captura no fechamento do deal | Análise de Win/Loss sempre vazia | M |
| FLX-13 | Deal Room público (`/dr/:token`) | ✅ ligado | `src/hooks/useDealRooms.ts:467-498` (`get_deal_room_by_token`, `buyer_toggle_milestone`, `buyer_add_comment`, `get_buyer_document_path`, edge `deal-room-buyer-view`), RPCs liberadas para anon em `supabase/migrations/20261006120000_least_privilege_canonical.sql:113-123` | — | — | — |
| FLX-14 | Assinatura pública (`/signature/:token`) | ✅ ligado | `src/pages/PublicSignaturePage.tsx:48,78` → edges `get-signature` / `submit-signature` (existem em `supabase/functions/`) | Envio do link por e-mail (hoje só copiar link, `Documentos.tsx:146`) | Distribuição manual | P |
| FLX-15 | Pesquisa pública NPS/CSAT (`/survey/:token`) | ✅ ligado | `src/pages/PublicSurvey.tsx:35,59` → RPCs `get_public_csat_survey` / `submit_public_csat_survey` (migration `20261006120000…sql:161-241`) | Envio pelo canal escolhido (HF-26) | Distribuição manual | M |
| FLX-16 | Controles de acesso: restrição por IP, geo-blocking, detecção de novo dispositivo, máximo de sessões, timeout | 🔌 | Configuração gravada em `access_security_settings` (`src/hooks/useAccessSecurity.ts:34-49`; UI em `src/pages/Security.tsx:38-41`), mas o único aplicador, a edge `validate-access`, não tem chamador (grep em `src` = 0; idem `detect-new-device`) | Chamar `validate-access` no login ou no middleware | Usuário liga a "restrição por IP" e nada é bloqueado: falsa sensação de segurança | G |

---

## Resumo numérico

- **Rotas:** 113 (11 públicas + 1 catch-all, 77 protegidas, 23 admin, 1 redirect). Uma página lazy sem rota (`AdminObservability`) e duas páginas órfãs em `src/pages` (`AdminConexoesLogs`, `admin/TelemetryTable`).
- **Links quebrados:** 9 destinos inexistentes em 12 ocorrências (ROT-01…08).
- **Rotas sem nenhum ponto de entrada:** 15. **Rotas só via Ctrl+K:** 18. **Páginas autenticadas sem layout:** 43, sendo 7 itens da sidebar.
- **Atalhos e eventos sem ouvinte:** 17 eventos (14 atalhos + `open-ask-crm` + `show-whats-new` + `pwa:update-available`).
- **Achados registrados: 96**
  - ROT (rotas e navegação): 18
  - PH (placeholders e promessas): 10
  - HF (handlers falsos e dados fake): 29
  - CMP (componentes e features órfãs): 20
  - FF (feature flags): 3
  - FLX (fluxos de setup, públicos e marketing): 16
- **Por status:** 89 lacunas, mais 5 fluxos ✅ ligados (servem de referência) e 2 itens informativos (FF-02 ℹ️, FF-03 ⚠️). Achados com dois status contam no primeiro.

| Status | Achados |
|---|---|
| ❌ NÃO INICIADO | 6 |
| 🟨 PARCIAL | 19 |
| 🎭 VITRINE | 27 |
| 🔌 DESCONECTADO | 22 |
| ⬛ MORTO | 15 |

- **Código morto:** 132 arquivos inalcançáveis (20.882 linhas), mais ~14 arquivos vivos só via barrel (~3,5 mil linhas). Desses, ~5,4 mil linhas são conteúdo de `src/data` usado só por testes.
- **Feature flags:** 0 features protegidas por flag; o hook tem 0 consumidores.
- **`src/data/analyticsData.ts`:** confirmado em uso como dado real na rota `/analytics` (KPIs, gráficos, ranking com nomes fictícios).

## Top 10 lacunas de maior impacto

1. **FLX-01: campanhas de e-mail são encenadas.** "Enviar" marca tudo como enviado sem disparar nada, ignora o segmento e não existe edge de e-mail (`useEmailCampaigns.ts:84-142`).
2. **FLX-04/05/06: captura de marketing não gera lead.** Formulário, landing page e lead magnet gravam submissões que nunca viram contato; a landing page mostra sempre "0 leads".
3. **HF-01 + HF-03…07: Analytics e Dashboard exibem números inventados.** `analyticsData.ts` alimenta `/analytics`; o Dashboard tem KPIs fixos e o ciclo de venda vem de `Math.random`.
4. **FLX-07 + FLX-02 + FLX-03: automações, sequências e nurturing sem motor ou envio.** Regras nunca executam; passos de e-mail são registrados como enviados sem envio; não há inscrição manual.
5. **CMP-02/FLX-12: Win/Loss sem captura.** Nenhuma tela grava `win_loss_records`, então o módulo fica sempre vazio.
6. **FLX-16: controles de IP, geo e dispositivo não são aplicados.** Falsa sensação de segurança, pois `validate-access` não tem chamador.
7. **CMP-01 + HF-12 + HF-27: conta e senha sem autoatendimento.** Não há "Esqueci a senha"; os botões alterar senha, sessões e excluir conta não fazem nada; a aprovação de reset do admin é inócua.
8. **ROT-13: 43 páginas sem layout**, incluindo 7 itens da sidebar. A navegação e o Ctrl+K somem nessas telas.
9. **ROT-01…08: 9 destinos de link quebrados**, entre eles dashboard → contato, relatório do contato, logs de conexões, banner de MFA do admin e embed de BI.
10. **PH-03 + ROT-08 + FF-01: Report Builder, BI embed e feature flags são vitrine.** Os widgets são placeholder, a rota de embed não existe e o painel de flags não controla nenhuma feature.
