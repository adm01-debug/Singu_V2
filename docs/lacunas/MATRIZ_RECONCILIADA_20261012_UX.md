# UX, navegação e acessibilidade

[Voltar ao índice da matriz reconciliada](MATRIZ_RECONCILIADA_20261012.md)


**Origem:** docs/auditoria/03_ACHADOS_FRONTEND.md; docs/lacunas/C1_docs_produto_ux_qa.md; docs/lacunas/D_ui_rotas_componentes.md; docs/lacunas/B2_reverificacao_estado_05_10.md.

## Singu V2 — reconciliação UX/frontend

Base exclusiva: `a2b73c7dee837f19aa756e6afe385eba837b5d54`. Árvore versionada limpa. README, CONTRIBUTING, AGENTS, anexos e consolidado lidos; Graphify consultado primeiro e confirmado no código. Nenhuma escrita remota ou alteração versionada.

## Primeiro: lacunas graves e tarefas concretas

1. **Decisões comerciais com dados inventados:** Analytics, velocidade, EQ, benchmark e Marketing continuam fictícios. Remover números sem origem, distinguir demonstração e calcular somente com evidências reais.
2. **Envio inexistente tratado como sucesso:** sequência grava `sent` antes de chamar uma função ausente; nurturing apenas registra interações e ainda encadeia `.catch()` em builders. Corrigir estados/erros sem depender das integrações adiadas.
3. **Perda de trabalho:** `useUnsavedChangesGuard` só intercepta fechamento/reload, não links/Voltar internos; ContactForm, InteractionForm e DealDialog nem o utilizam. Implementar guarda SPA/modal com continuar/descartar.
4. **Navegação quebrada:** sete destinos de D não correspondem a nenhuma rota; Marketing/Tarefas e outras páginas continuam sem shell. Corrigir destinos e compartilhar layout/atalhos.
5. **Segurança configurável sem efeito:** IP/geo/dispositivo não têm aplicador no login; limiter local zera ao recarregar. Não apresentar esses controles como proteção efetiva.

**Provas locais:** 43 testes passaram em sete arquivos (histórico, modal, busca, campanhas, logs); `npm run typecheck` passou. Matcher real do React Router confirmou os sete destinos D inválidos, o deep-link FX-1 inválido e `/deal-room/:token` inválido; `/dr/:token` existe. Builders insert/RPC do Supabase instalado têm `.catch` indefinido, confirmado sem rede. Não houve teste autenticado nem prova de produção.

**Estados abreviados nas matrizes:** R = RESOLVIDO NO CÓDIGO; PR = CORRIGIDO EM PR ABERTO; A = AINDA REPRODUZÍVEL; V = NÃO VERIFICADO NO RUNTIME; O = OBSOLETO/DUPLICADO; D = DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA. R nunca significa publicado. Intervalos incluem cada ID individual. Números históricos de tabelas, cobertura e órfãos não foram reutilizados como diagnóstico remoto.

## Matriz D, frontend e duplicações C1

| ID | Estado | Evidência atual | Falta | Teste/aceite |
|---|---|---|---|---|
| ROT-01 | AINDA REPRODUZÍVEL | `src/pages/AdminConexoes.tsx:44`; `src/app/AppRoutes.tsx:156-177` | Registrar logs/lazy | Link abre logs, não 404 |
| ROT-02 | AINDA REPRODUZÍVEL | `src/app/lazyPages.tsx:3`; `src/pages/admin/Observability.tsx:59,69,79` | Rota e métricas reais | Sem percentuais fixos |
| ROT-03 | AINDA REPRODUZÍVEL | `src/components/admin/RequireAdmin.tsx:60`; `/seguranca` também passa pelo MFAGuard | Corrigir destino e permitir enrollment/challenge em AAL1, preservando bloqueio administrativo até AAL2 | Configurar ou confirmar MFA sem 404, tela vazia ou loop |
| ROT-04 | AINDA REPRODUZÍVEL | `src/components/dashboard/HealthAlertsPanel.tsx:150`; `ImportantDatesCalendar.tsx:65,151,158` | Usar `/contatos/:id` | Quatro links abrem contato |
| ROT-05 | AINDA REPRODUZÍVEL | `src/pages/ContatoDetalhe.tsx:165` | Usar `/relatorio/:id` | Relatório abre |
| ROT-06 | AINDA REPRODUZÍVEL | `src/components/nlp/NLPInsightsDashboard.tsx:84` | Corrigir destino PDF | Aba não retorna 404 |
| ROT-07 | AINDA REPRODUZÍVEL | `src/components/dashboard/OnboardingChecklist.tsx:126` | `/sequencias` | Checklist navega corretamente |
| ROT-08 | AINDA REPRODUZÍVEL | `src/components/bi/EmbeddableDashboards.tsx:37,120`; AppRoutes sem embed | Implementar/recolher snippet/token | Iframe autorizado funciona |
| ROT-09, ROT-10, ROT-11, ROT-12 | AINDA REPRODUZÍVEL | `src/components/layout/AppSidebar.tsx:20-78`; `src/components/admin/AdminSidebar.tsx:8-25`; `src/components/command/commandRegistry.ts:24-79` | Entradas por papel/mobile | Todos módulos previstos descobertos |
| ROT-13 | AINDA REPRODUZÍVEL | `src/app/AppProviders.tsx:71`; `src/pages/Tarefas.tsx:68-71`; `MarketingHub.tsx:150-151` | Shell compartilhado | Sidebar/atalhos permanecem; 43 é contagem histórica |
| ROT-14 | AINDA REPRODUZÍVEL | `src/components/command/commandRegistry.ts:55`; `RequireAdmin.tsx:50` | Ocultar rodízio não-admin | Sem redirecionamento silencioso |
| ROT-16 | AINDA REPRODUZÍVEL | `src/components/command/GlobalCommandBar.tsx:66,76,86`; Contatos/Empresas/Interacoes não leem `new` | Consumir `?new=1` | Três ações abrem formulário |
| ROT-17 | AINDA REPRODUZÍVEL | `src/components/layout/AppLayout.tsx:268`; `src/components/ask-crm/AskCrmChat.tsx:85` | Compartilhar abertura | Palette abre chat; IA adiada |
| ROT-18 | AINDA REPRODUZÍVEL | `src/hooks/useKeyboardShortcutsEnhanced.ts:54-221` | Ouvintes dos 14 eventos | Cada atalho altera estado; Alt+Voltar já funciona |
| ROT-19 | AINDA REPRODUZÍVEL | `src/components/features/WhatsNewModal.tsx:181`; `src/main.tsx:122` | Ouvintes novidades/update | Aviso visível e atualização consentida |
| PH-01 | AINDA REPRODUZÍVEL | `src/components/territory-optimization/TerritoryRecommendationCard.tsx:72-74` | Mutação de aplicação | Recomendação altera território autorizado |
| PH-02 | AINDA REPRODUZÍVEL | `src/components/interactions/InteractionBatchActions.tsx:75` | Tag em lote | Seleção recebe tag persistida |
| PH-03 | AINDA REPRODUZÍVEL | `src/pages/ReportBuilder.tsx:40-90` | Widgets/dados/layout persistente | Relatório útil, não ícones vazios |
| PH-04, PD-14.1, CS-4 | AINDA REPRODUZÍVEL | `WhatsNewModal.tsx:60-68`; `vite.config.ts:64` | Retirar promessa/fila offline segura | Desconexão sem perda/sucesso fictício |
| PH-05, FLX-08 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | `src/pages/SmsMarketing.tsx:62`; `supabase/functions/send-sms-campaign/index.ts:71-111` | Twilio/segmento/agendamento/UI opt-out adiados | Sem disparo nesta etapa |
| PH-06 | AINDA REPRODUZÍVEL | `src/components/carnegie/CarnegieDashboard.tsx:42-43`; `src/hooks/useCarnegieAnalysis.ts:107-118` | Retirar score-demo | Conta vazia sem score fabricado |
| PH-07 | AINDA REPRODUZÍVEL | `src/components/dashboard/StrategicNextStepsCard.tsx:538-558` | Remover tópicos/tarefa fixos | Só pendências reais |
| PH-08 | NÃO VERIFICADO NO RUNTIME | `src/pages/AdminAuditTrail.tsx:89-92` | Confirmar produtor EXTERNAL_SYNC | Evento real aparece no filtro |
| PH-09 | AINDA REPRODUZÍVEL | `src/components/ficha-360/DadosPessoaisCard.tsx:590` | Editar eventos | Alteração persiste e recarrega |
| PH-10 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | `src/components/crm/copywriting/CopyAnalyzer.tsx:38,73-75` | IA adiada; rotular heurística | Sem afirmar análise IA validada |
| HF-01 | AINDA REPRODUZÍVEL | `src/pages/Analytics.tsx:66-92,169-172`; `src/data/analyticsData.ts:27-211` | Consultas reais | Sem vendedores/KPIs inventados |
| HF-02 | AINDA REPRODUZÍVEL | `src/pages/Analytics.tsx:158-163` | Exportar/refetch | Arquivo correto e atualização observável |
| HF-03 | AINDA REPRODUZÍVEL | `src/pages/Analytics.tsx:214-221` | Agregação portfólio | Vazio não vira distribuição fixa |
| HF-04 | AINDA REPRODUZÍVEL | `src/pages/Analytics.tsx:273-278`; `RapportRealtimeCoach.tsx:65` | Contexto real/demo explícita | Contato selecionado propagado |
| HF-05, HF-25, RA-1, QF-P1 | AINDA REPRODUZÍVEL | `src/hooks/useDealVelocity.ts:67`; `useEmotionalIntelligence.ts:53,73`; `useHiddenObjections.ts:30` | Remover sorteio de métricas | Resultado estável, rastreável; crypto não resolve |
| HF-06 | AINDA REPRODUZÍVEL | `src/components/dashboard/RelationshipStatsPanel.tsx:34-88`; `src/components/crm/RelationshipKPIsDashboard.tsx:120-127,238` | Séries/precisão reais | Sem 94,2% arbitrário |
| HF-07 | AINDA REPRODUZÍVEL | `src/components/dashboard/DashboardStatsGrid.tsx:62` | Variação calculada | Tendência pode cair |
| HF-08 | AINDA REPRODUZÍVEL | `src/components/company-detail/CompanyBenchmarkRadar.tsx:14-21` | Fonte benchmark | Sem comparação inventada |
| HF-09 | AINDA REPRODUZÍVEL | `src/pages/MarketingHub.tsx:253-262`; `MarketingStats.tsx:18-19` | Custos/receita atribuídos | CPL/CAC/LTV/ROI auditáveis |
| HF-11 | AINDA REPRODUZÍVEL | `src/components/pipeline/PipelineFilterBar.tsx:42-48`; `src/pages/Pipeline.tsx:376` | Aplicar/limpar filtros | Deals exibidos mudam |
| HF-12, HF-14 | AINDA REPRODUZÍVEL | `src/pages/configuracoes/ConfigSecurityTab.tsx:25,35,45`; `Configuracoes.tsx:121` | Senha/sessões/exclusão/avatar | Ações executam fluxos autorizados |
| HF-13 | AINDA REPRODUZÍVEL | `src/pages/Configuracoes.tsx:46-48`; `ConfigNotificationsTab.tsx:47-51` | Persistência | Preferências sobrevivem remount |
| HF-15 | AINDA REPRODUZÍVEL | `src/components/conversation-intel/ConversationAnalysesTable.tsx:72` | Abrir resultado | Visualizar abre transcrição/resultado |
| HF-16, HF-17, HF-18 | AINDA REPRODUZÍVEL | `BehavioralSegmentation.tsx:176,236,239`; `MQLManager.tsx:95`; `src/pages/MarketingHub.tsx:442-444` | Ligar ações/lista/templates | CTAs produzem resultado, não silêncio |
| HF-19, HF-20 | AINDA REPRODUZÍVEL | `src/components/company-detail/CompanyInteractionsTab.tsx:236`; `QuickFollowUpGenerator.tsx:140` | Abrir interação/criar tarefa | Registro persistido |
| HF-21, HF-22, HF-23 | AINDA REPRODUZÍVEL | `StrategicNextStepsCard.tsx:246,261`; `ChurnPredictionPanel.tsx:161`; `NLPAnalysisCard.tsx:180` | Handlers | Ações/analise abrem destino funcional |
| HF-26 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | `src/components/nps/SendSurveyDialog.tsx:33,92,123-129` | Entrega pelo canal adiada | Link manual não significa enviado |
| HF-27 | AINDA REPRODUZÍVEL | `src/hooks/usePasswordResetRequests.ts:29-42` | Pedido e reset efetivo | Aprovar emite recuperação, não só status |
| HF-28 | AINDA REPRODUZÍVEL | `src/pages/RolesPage.tsx:17-60`; `src/hooks/useRBAC.tsx:13` | Gestão/papel/permissão real | Atribuir/revogar com escopo |
| HF-29, HF-31 | AINDA REPRODUZÍVEL | `src/pages/MarketingHub.tsx:50-150,191-203` | JSX no return; painel fora TabsList | Segmentação visível corretamente |
| HF-30 | AINDA REPRODUZÍVEL | `src/components/contact-detail/data-tab/CadencePreferencesCard.tsx:111-131` | Inputs no formulário | Horários editáveis/persistidos |
| CMP-01 | AINDA REPRODUZÍVEL | `src/components/auth/ForgotPasswordForm.tsx:30`; sem caminho desde main | Ligar recuperação no Auth | Esqueci senha acessível |
| CMP-02, FLX-12 | AINDA REPRODUZÍVEL | `WinLossCaptureDialog.tsx:21`; `src/pages/WinLossSetup.tsx:27-28` | Captura no fechamento | Ganho/perda grava registro |
| CMP-03, CMP-05, CMP-06, CMP-07 | AINDA REPRODUZÍVEL | `src/components/playbooks/PlaybookSuggestionDrawer.tsx:25`; `src/components/analytics/{ApproachRecommendationPanel,CognitiveBiasesPanel,ClientHealthPanel}.tsx`: sem caminho desde main | Montar/remover; IA adiada | Sem anunciar recurso invisível |
| CMP-04 | AINDA REPRODUZÍVEL | `src/components/intent/IntentSignalCard.tsx:13` sem consumidor | Contextualizar intent | Conta mostra seu score |
| CMP-08, CMP-09, CMP-10 | AINDA REPRODUZÍVEL | `src/components/crm/ContactBehaviorExtended.tsx:20`; `src/components/contact-detail/DISCCommunicationLogsPanel.tsx`; `behavioral-tab/NeuroDominanceTab.tsx:15`: sem consumidor | Ligar consentimento/logs/aba | Registro consultável no contato |
| CMP-11, CMP-12, AR-2 | AINDA REPRODUZÍVEL | `src/components/triggers/ProfileBasedSuggestions.tsx`; `src/components/neuromarketing/index.ts:5-21` | Consumir componentes, não apenas barrel | Tela renderiza e ações funcionam |
| CMP-13, AR-3 | AINDA REPRODUZÍVEL | `src/components/admin/{EmailPipelineStatus,SystemHealthWidget,AccessSecurityManager}.tsx`; `src/pages/admin/TelemetryTable.tsx:33`: sem caminho desde main | Montar/remover | Telemetria encontrada e real |
| CMP-14 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | `src/components/search/VisualSearchButton.tsx` órfão; busca produto | Escopo produtos vetado + IA adiada | Não ligar sem decisão |
| CMP-15, CMP-16 | AINDA REPRODUZÍVEL | `src/components/ai/AIMessageGenerator.tsx`; `src/components/data-export/AdvancedDataExporter.tsx`: sem caminho desde main | Ligar/remover; gerador IA adiado | Exportação real/autorizada |
| CMP-17, TD-13 | AINDA REPRODUZÍVEL | `src/components/security/MFAEnrollmentBanner.tsx:17`; demais órfãos de D:153 | Montar/remover | Não anunciar componentes invisíveis |
| CMP-18, TD-10, TD-11 | AINDA REPRODUZÍVEL | `src/components/help/ContextualHelpTooltip.tsx:48`; `src/components/feedback/ProgressStepper.tsx:19`; `src/app/composeProviders.tsx:15`: sem consumidor | Usar/remover biblioteca | Ajuda/progresso efetivamente acessíveis |
| CMP-19 | AINDA REPRODUZÍVEL | `src/data/carnegie*.ts`, `trigger*.ts`: consumidores somente testes | Expor/remover conteúdo | Biblioteca alcançável pelo usuário |
| CMP-20 | AINDA REPRODUZÍVEL | `src/types/big-five.ts`, `mbti.ts`, `enneagram.ts` sem consumidor | Interpretação tipada | Não tratar número cru como análise |
| FF-01 | AINDA REPRODUZÍVEL | `src/hooks/useFeatureFlag.ts:15` único uso; roles ignoradas | Consumidores por papel | Toggle realmente altera feature |
| FF-02 | OBSOLETO/DUPLICADO | Flags ambientais não implementadas; duplica FF-01 | Sem flag desligada escondendo correção | Decisão explícita de rollout |
| FF-03 | NÃO VERIFICADO NO RUNTIME | `src/hooks/useFeatureFlag.ts:20-25`; types gerados não provam tabela publicada | Consultar canônico | Tabela/grants/RLS comprovados |
| FLX-01 | AINDA REPRODUZÍVEL | `src/hooks/useEmailCampaigns.ts:85-158` | Segmento/entrega; falso sent já retirado | Contatos fora segmento não preparados |
| FLX-02, N-3 | AINDA REPRODUZÍVEL | `supabase/functions/sequence-processor/index.ts:321-346`; `src/pages/Sequencias.tsx:19` | Inscrição; estados honestos/entrega | Ausência provedor nunca gera sent |
| FLX-03, N-4 | AINDA REPRODUZÍVEL | `src/pages/Nurturing.tsx:28-29`; runner:91-99,129-145 | Conteúdo/gatilhos/inscrição/erros | Sem interação fingindo mensagem |
| FLX-04, FLX-06 | AINDA REPRODUZÍVEL | `20260417011613_40e57206-6feb-4bd8-a3f0-110e3a2cb8e1.sql:283-316,337-378` | Conversão/dedupe/upload | Lead gerado; estado remoto não inferido |
| FLX-05 | AINDA REPRODUZÍVEL | `src/pages/PublicLandingPage.tsx:106-118`; `src/pages/LandingPages.tsx:141` | Consumidor/conversão/contador versionados | Submissão vira contato; contador correto |
| FLX-07 | AINDA REPRODUZÍVEL | `src/hooks/useAutomationRules.ts:105-213`; backend sem executor de automation_rules | Motor | Regra dispara efeito único |
| FLX-09, FLX-11, FLX-13, FLX-14, FLX-15 | NÃO VERIFICADO NO RUNTIME | `ConversationIntelligenceSetup.tsx:22-23`; `IntentSetup.tsx:28`; `useDealRooms.ts:467-498`; `PublicSignaturePage.tsx:48,78`; `PublicSurvey.tsx:35-59` | Provas remotas públicas/setup | Tokens válidos/expirados e escopo |
| FLX-10 | AINDA REPRODUZÍVEL | `src/pages/ForecastingSetup.tsx:60,73` | Bloquear soma diferente 100%; shell | Configuração inválida não salva |
| FLX-16, N-6, AQ-4 | AINDA REPRODUZÍVEL | validate-access/detect-new-device sem chamador; `src/lib/rateLimiter.ts:21` | Enforcement servidor | IP/geo negados; F5 não zera bloqueio |
| FE-1, TQ-2, TD-16, TD-P7, AQ-6 | AINDA REPRODUZÍVEL | AST atual: 5 any (OverviewTab/ContactFormTabs/useUnifiedTimeline); 176 casts duplos | Tipos reais, não casts | Ratchet AST; contagens antigas obsoletas |
| FE-2, AQ-2 | AINDA REPRODUZÍVEL | `src/hooks/useHealthAlerts.ts:63,82`; `useDISCConversionData.ts:26-36` | Fetch/cache/cancelamento | Troca usuário não mostra resposta antiga |
| FE-3, PM-46, AQ-5, DP-2 | AINDA REPRODUZÍVEL | Contagem atual: 90 fontes >400; 20 >600; `DocsPage.tsx:115-116` | Reduzir hotspots/revisar afirmação | Limite medido, não alegado |
| FE-4 | RESOLVIDO NO CÓDIGO | `src/app/queryClient.ts:10-12` | Prova visual opcional | staleTime 5min global |
| FE-5 | RESOLVIDO NO CÓDIGO | `WhyScoreDrawer.tsx:80-84`; `intelSnapshot.ts:46-50`; `useNotifications.ts:315` | Nenhuma correção desses parses | JSON corrompido tem fallback |
| FE-6 | AINDA REPRODUZÍVEL | `src/hooks/useSequenceProcessor.ts:7-18` | Invalidar após mutação persistente | UI reflete processamento |
| FE-7 | AINDA REPRODUZÍVEL | `src/hooks/useUnifiedTimeline.ts:19` | Schema metadados | JSON inválido não é tratado como objeto conhecido |
| FE-8 | OBSOLETO/DUPLICADO | `src/hooks/useEmotionalIntelligence.ts:43,63`: fallback string | Não há find().prop cru confirmado | Entrada sem frase não quebra |
| FE-9 | AINDA REPRODUZÍVEL | `src/lib/errorReporting.ts:208` | Handle/cleanup/idempotência | Init repetido não duplica timer |
| FE-10 | AINDA REPRODUZÍVEL | `src/hooks/useStakeholderAnalysis.ts:366` | Guard divisão vazia | Interno finito; sem vazamento UI confirmado |
| FE-11 | RESOLVIDO NO CÓDIGO | `package.json:59`; typecheck real passou | Nenhuma correção Leaflet | MarkerClusterGroup compila |
| UX-4.1, PD-3.3 | AINDA REPRODUZÍVEL | `src/components/import/BulkImportDialog.tsx:156-164` | Progresso medido/stepper | Import longo mostra etapa/contagem |
| UX-4.2 | AINDA REPRODUZÍVEL | `src/hooks/useUnsavedChangesGuard.ts:7-31`; só CompanyForm/Configuracoes usam | Guarda SPA/modal nos cinco fluxos | Voltar/link exige descarte; salvar libera |
| UX-1.1, UX-1.2, UX-1.3 | RESOLVIDO NO CÓDIGO | `NavigationStackContext.tsx`; `BackButton.tsx`; `PageTransition.tsx`; 20 testes histórico passaram | Visual autenticado | Histórico/avanço/fallback/contexto preservados |
| UX-2.1, UX-2.2, UX-5.1 | RESOLVIDO NO CÓDIGO | `src/components/ui/button.tsx:8`; Header/AppSidebar blur; `AppLayout.tsx:87` rage-click | Cobrir páginas sem layout | Feedback presente nas superfícies ligadas |
| UX-3.1 | AINDA REPRODUZÍVEL | Voltar/Ctrl+K ligados, mas 14 eventos ROT-18 sem ouvintes | Atalhos universais | Cada atalho com efeito real |
| UX-3.2 | NÃO VERIFICADO NO RUNTIME | Header/AppSidebar têm ARIA, sem auditoria visual aqui | WCAG/foco/semântica | Leitor de tela/mobile validados |

## Matriz C1 restante — produto, documentação e limites cruzados

| ID | Estado | Evidência atual | Falta | Teste/aceite |
|---|---|---|---|---|
| PD-1.1 | RESOLVIDO NO CÓDIGO | `src/index.css:157–180` define --space-*; `tailwind.config.ts:20–30` mapeia a escala | Validar consistência visual | Espaçamento consumido nas telas |
| PD-1.4 | AINDA REPRODUZÍVEL | `src/index.css:215` define radius-card isolado | Tokens semânticos de raio e consumidores | Raios coerentes em botões, cartões e modais |
| PD-2.2, PD-12.3b, PD-12.3c | AINDA REPRODUZÍVEL | `src/components/layout/AppSidebar.tsx:20-78` | Recentes/favoritos/badges/quick-add | Acesso contextual acionável |
| PD-2.3, PD-10.4 | AINDA REPRODUZÍVEL | `src/components/search/GlobalSearch.tsx:37,69-72` | Prefixos/sugestões | @empresa filtra corretamente |
| PD-3.2, PD-5.2, CS-5 | AINDA REPRODUZÍVEL | useHapticFeedback só MobileBottomNav; gestos ContatosContent | Cobertura planejada | Empresas/interações com gesto acessível |
| PD-4.6 | AINDA REPRODUZÍVEL | `ConversationAnalysesTable.tsx:72` h-7; BulkImportDialog h-8 | Touch targets | Alvos mínimos verificados mobile |
| PD-5.1 | AINDA REPRODUZÍVEL | Fonte atual: inputMode 3 arquivos; enterKeyHint 0 | Formulários mobile | Teclado/Enter apropriados |
| PD-6.2 | AINDA REPRODUZÍVEL | react-window em ContatosContent; demais listas sem virtualização | Listas longas | 500+ itens sem degradação |
| PD-6.5, TD-P5 | AINDA REPRODUZÍVEL | srcSet 0 no src; package sem vite-imagetools | Pipeline imagens | Variantes responsivas reais |
| PD-8.2 | AINDA REPRODUZÍVEL | `ContactForm.tsx:71` já onBlur; `DealDialog.tsx:76-87` sem mode | Apenas DealDialog restante | Campo inválido sinaliza no blur |
| PD-9.1, PD-9.5 | AINDA REPRODUZÍVEL | `useNotificationPreferences.ts:13-24,43`; backend só DDL/policies | Aplicar preferências | Canais/quiet-hours respeitados |
| PD-9.4 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | Sem opções de som; recurso de produto | Escolher necessidade/acessibilidade | Preferência mute respeitada |
| PD-10.2, PD-MET | AINDA REPRODUZÍVEL | Sem product/search analytics; rage-click não mede conclusão | Instrumentação com privacidade | Eventos/metas verificáveis |
| PD-10.3, PD-12.2c | AINDA REPRODUZÍVEL | `src/hooks/useSavedFilters.ts:19` sem consumidor | Filtros salvos; views existentes não equivalem | Preset reaplicável |
| PD-11.1, PD-11.2 | AINDA REPRODUZÍVEL | Gráficos Analytics/Recharts; tabelas/drill-down pontuais | Alternativa acessível/cross-filter | Teclado/leitor abre dados |
| PD-11.3 | NÃO VERIFICADO NO RUNTIME | ReportsTab monta YoyComparisonWidget, que usa useYoyComparison; contrato remoto de get_yoy_comparison não comprovado | Verificar RPC e comparar períodos com dados reais | Mesmo dataset/períodos reais |
| PD-11.4 | AINDA REPRODUZÍVEL | Sem exportação PNG/PDF dos gráficos | Exportar a visualização atual | Arquivo gerado com os mesmos filtros |
| PD-13.5, CS-1, PR3-1 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | Sem tutoriais/simulador/dashboards separados prometidos | Escopo/conteúdo/visões gerenciais | Não vender feature inexistente |
| PD-13.2 | AINDA REPRODUZÍVEL | ContextualHelpTooltip órfão; ModuleHelp existe | Cobertura prometida das métricas | Explicação alcançável sem mouse |
| PD-9.2 | AINDA REPRODUZÍVEL | NotificationCenter não preenche actions ao mapear as notificações; NotificationGroup só mostra ações quando presentes | Ligar ações rápidas a handlers reais | Ação executada sem sair do contexto |
| PD-14.2 | AINDA REPRODUZÍVEL | CompanyProfileAnalytics mostra erro sem refetch e mantém skeletons após esgotar tentativas | Oferecer nova tentativa manual após erro final | Consulta recuperável sem recarregar a página |
| PD-7.4 | AINDA REPRODUZÍVEL | DashboardStatsGrid fornece Closing Score como string percentual; StatCard só anima valores originalmente numéricos | Animar scores formatados preservando unidade e acessibilidade | Atualização do percentual animada, respeitando movimento reduzido |
| PD-3.1 | AINDA REPRODUZÍVEL | `ContactForm.tsx:136`, `CompanyForm.tsx:228`, `InteractionForm.tsx:610` usam Button/Loader2 separados; LoadingButton tem cobertura parcial | Padronizar ações assíncronas nos formulários centrais | Texto, bloqueio e anúncio acessível consistentes |
| PD-8.1 | AINDA REPRODUZÍVEL | `Contatos.tsx:217-227` aceita retorno null; `ContactForm.tsx:122-123` limpa o rascunho mesmo após falha | Limpar apenas após confirmação persistida | Falha seguida de recarga preserva os valores |
| PD-10.1 | AINDA REPRODUZÍVEL | `Contatos.tsx:94,181-186` aplica fuzzy só aos contatos carregados; `useContacts.ts:92,117-124` começa com 50 registros | Busca em toda a carteira autorizada | Contato de página posterior encontrado sem carregar mais |
| PD-11.5 | AINDA REPRODUZÍVEL | `Analytics.tsx:75-92,146-155` oferece apenas períodos fixos; DateRangePopover não é consumido pela tela | Intervalo personalizado nos gráficos | Datas selecionadas determinam o mesmo conjunto em gráficos e totais |
| PD-5.5 | AINDA REPRODUZÍVEL | `Contatos.tsx:333-343`, `Empresas.tsx:253-258` usam Dialog; ResponsiveDialog tem cobertura parcial | Bottom sheets nos fluxos móveis centrais | Criação/edição utilizáveis no celular, mantendo foco e teclado |
| PD-8.3 | AINDA REPRODUZÍVEL | ContactFormTabs.tsx:56 e CompanyFormFiscalTab.tsx:17–21 usam Input comum; CPFInput/CNPJInput sem consumidores | Aplicar máscaras existentes | CPF/CNPJ exibem formatação e persistem valores válidos |
| PD-13.3 | AINDA REPRODUZÍVEL | WhatsNewModal.tsx:90–94 grava versão vista sem exibir; show-whats-new não possui listener | Ligar acionamento e confirmar visualização | Novidades aparecem e só são marcadas vistas após exibição |
| PD-13.4 | AINDA REPRODUZÍVEL | Index.tsx:115–120 alimenta quatro dos sete marcos; hasDeals/hasLeadScore/hasSequence ficam false | Consultar os três marcos restantes | Usuário com sete marcos alcança conclusão real |
| PD-3.4 | AINDA REPRODUZÍVEL | NavigationStackContext.tsx:112–138 usa forward nas rotas novas; PageTransition.tsx:21–34 só distingue back | Diferenciar navegação lateral, aprofundamento e substituição | Transições refletem o contexto e respeitam movimento reduzido |
| PD-1.2, PD-1.3, PD-2.1, PD-4.2, PD-4.3, PD-4.5, PD-6.1, PD-6.3, PD-6.4, PD-9.3, PD-10.5, PD-12.2a, PD-14.4, PD-14.5 | RESOLVIDO NO CÓDIGO | index.css tokens; MotionConfig; lazyPages; NotificationCenter; filtros/presets; SessionExpiryHandler/ConcurrentEditError | Visual/produção continuam pendentes | Não generalizar cobertura universal |
| PD-4.1, PD-14.3, PD-1.5, PD-2.4, PD-3.5, PD-4.4, PD-5.3, PD-5.4, PD-7.1, PD-7.2, PD-7.3, PD-7.5, PD-8.4, PD-8.5, PD-12.1a, PD-12.1b, PD-12.1c, PD-12.2b, PD-12.3a, PD-13.1 | NÃO VERIFICADO NO RUNTIME | C1:209-250 distingue itens visuais não comprovados; AppSidebar/Header têm ARIA | Auditoria visual/contraste/foco/contexto | Desktop/mobile/leitor/reduced-motion |
| PD-2.5 | AINDA REPRODUZÍVEL | `src/components/import/BulkImportDialog.tsx:61-72`: div clicável sem teclado | Upload acessível | Tab/Enter seleciona arquivo |
| N-1, EA-3 | AINDA REPRODUZÍVEL | `useSequenceProcessor.ts:9`; sequence-processor:54; nurturing-runner:22; process-webhook-dlq:27 | JWT autorizado ou retirar botões | Sem segredo cron no navegador |
| N-2 | NÃO VERIFICADO NO RUNTIME | Migrations HTTP históricas sem header; cron real não consultado | Validar agenda canônica | Logs/execução autorizada sem escrita nesta etapa |
| N-5, TQ-7 | AINDA REPRODUZÍVEL | `supabase/config.toml:1`; CSP index.html/public/_headers divergentes | Config/CSP canônicos | Bundle conecta só destinos permitidos |
| SEC-5 | AINDA REPRODUZÍVEL | `supabase/functions/_shared/auth.ts:78-86` mantém sufixos Lovable | Allowlist exata | Origem de terceiro rejeitada |
| EF-3, MR-8, EF-4, EF-14, EF-17, EA-5 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | evolution-bitrix-connector/evolution-webhook e contrato webhook | Evolution/Bitrix adiados; riscos não validados | Timeout/dono/avatar/waitUntil/header ao retomar |
| EF-5 | AINDA REPRODUZÍVEL | nurturing-runner:145 chama increment_workflow_completed sem DDL | RPC/erro explícito | Contagem atômica correta |
| EF-6, MR-6, PM-43 | AINDA REPRODUZÍVEL | sequence-processor:67-72; nurturing-runner:33-38; DLQ:43-45 | Claim exclusivo das três filas | Duas execuções não duplicam efeito |
| EF-7 | AINDA REPRODUZÍVEL | send-sms-campaign:67,73,99-104 | Atomicidade/paginação independente da chave | 1001 contatos; execução concorrente |
| EF-8 | AINDA REPRODUZÍVEL | process-webhook-dlq:117-120 | Não marcar sucesso sem destino | Payload inválido termina erro explícito |
| EF-10, EF-12, EF-15, EF-16, PM-42 | AINDA REPRODUZÍVEL | `20260720000002_ef6_atomic_queue_claim.sql:26` só pending; lead-score-cron:23/bulk-revalidate:76 limit5000; auto-rebatch:35,44 exige duas guardas | Reclaim/paginação/auth consistente; remoto não inferido | Crash recuperável; >5000 itens; header único |
| EF-11 | AINDA REPRODUZÍVEL | external-data:474 ainda HTTP200; `src/lib/externalData.ts` interpreta erro | Status HTTP correto; mitigação frontend existe | Cliente não confunde erro/vazio |
| BD-2 | AINDA REPRODUZÍVEL | `src/hooks/useSocialInsights.ts:56-92` | Remover mock no catch; integração adiada | Erro nunca vira promoção fictícia |
| BD-1, MR-10, RA-2 | AINDA REPRODUZÍVEL | `restore-drill.yml` restaura um dump do banco existente; replay desde banco vazio falha na primeira migration sem `contact_phones` (H-04) | Recuperar fundação histórica e comprovar replay integral | Banco vazio reproduz o catálogo canônico via migrations |
| BD-4 | NÃO VERIFICADO NO RUNTIME | `restore-drill.yml` comprova restauração de dump, não replay periódico das migrations | Validar periodicidade e critérios distintos | Restaurar dump e reproduzir cadeia do zero em testes separados |
| BD-5, BD-6, BD-7, BD-8, BD-9, BD-10, PM-39, PM-44, DA-2 | NÃO VERIFICADO NO RUNTIME | Migrations históricas; canônico não consultado nesta unidade | Validar catálogo/constraints/índices | Não inferir ausência por grep |
| PM-45, RA-4, DD-1, DG-1, DG-2, DG-4, GS-2, SE-3 | NÃO VERIFICADO NO RUNTIME | types canônicos atualizados; scripts/tabelas-ausentes fotografia antiga | Confrontar schema real/DDL/doc | Inventário remoto atual, sem alegar 119 ausências |
| TQ-3, PM-40, MR-O3 | AINDA REPRODUZÍVEL | `tsconfig.app.json:17-19` permissivo | Endurecimento incremental | strictNullChecks real |
| PM-41 | NÃO VERIFICADO NO RUNTIME | Strict desligado não comprova cada bug de null | Cenário concreto | Fixture reproduz falha antes de reparar |
| TQ-4, ON-1, ON-2, ON-3, ON-4, ON-5 | AINDA REPRODUZÍVEL | `docs/ONBOARDING.md:28,39,80,89-90,108`; README:151 | Atualizar porta/scripts/inventário/exemplo | Onboarding executável |
| TQ-6, SE-2, PR3-3 | AINDA REPRODUZÍVEL | `.github/workflows/ci.yml` sem deno test/lint/gitleaks | Gates backend/secrets | Teste real executado no pipeline |
| TQ-11 | AINDA REPRODUZÍVEL | bun.lock/bun.lockb/package-lock; @types em dependencies | Lockfile/deps consistentes | Instalação reprodutível |
| TQ-12 | AINDA REPRODUZÍVEL | `src/lib/sanitize.ts:18` options após restrições | Precedência segura | Override não reabre atributo proibido |
| PM-47, RA-5, AR-7 | AINDA REPRODUZÍVEL | `vitest.config.ts` sem thresholds | Piso por domínio | Regressão cobertura bloqueada |
| PM-48, MR-O4, RA-3 | AINDA REPRODUZÍVEL | API da `main` responde 404 para proteção de branch; rulesets vazios, como registrado nas matrizes de segurança e banco | Configurar proteção da `main` com checks executados no SHA de PR | Bloquear push direto e merge com check obrigatório falho |
| CE-1 | NÃO VERIFICADO NO RUNTIME | Certificação histórica com aviso; demais critérios de proteção requerem prova própria | Revalidar no GitHub após ativar proteção | Configuração remota e checks obrigatórios comprovados |
| PM-49, PM-50, SE-5 | AINDA REPRODUZÍVEL | DocsPage/ONBOARDING ainda contradizem fonte | Relatório reconciliado honesto | Sem selo universal por código existente |
| TD-7, QF-5b, TD-P4 | NÃO VERIFICADO NO RUNTIME | Migration de partições; dívida DEFINER; promessa cross-region | Catálogo/jobs/infra reais | Prova remota sem supor ausência |
| TD-P1, AR-6 | AINDA REPRODUZÍVEL | `src/hooks/useMFAGuard.ts:18,30-34`; Auth sem challenge | Política por papel/desafio/enforcement | Admin AAL1 conclui desafio; RLS validada |
| TD-P3, TD-P6 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | TECH_DEBT:32,35 propõe worker/RSC condicionais | Decisão arquitetural, não hotfix | Benefício mensurado antes migração |
| TD-P9, AR-5 | AINDA REPRODUZÍVEL | `src/pages/BIAvancado.tsx` sem drag/drop | Grid persistido | Arrastar/reabrir preserva layout |
| SE-1 | AINDA REPRODUZÍVEL | fileValidation só useDealRooms; CompanyLogoUpload/ContactAvatarUpload/InteractionForm sem magic bytes | Validar demais uploads | MIME falso rejeitado |
| SE-4, ER-1 | AINDA REPRODUZÍVEL | `docs/er-diagram.md:5-7` vazio | Gerar ER real | FKs presentes/atualizadas |
| AV-F5, AV-F6, AV-F7 | AINDA REPRODUZÍVEL | `scripts/migration/verify/index-corruption-amcheck.sql:20`; `invalid-indexes-guard.sql:12,23`; `deadlock-frequency-monitor.sql:4` | Skips/schemas/janela | >100 índices; não-public; janela curta |
| AV-S, AV-CI | AINDA REPRODUZÍVEL | 21 scripts de cenário; run-all.sh sem chamador workflow | Completar/automatizar; runtime não executado | Cenários prometidos executados |
| PR3-4 | AINDA REPRODUZÍVEL | PR3_CLOSED_REFERENCE.md:8–17 ainda cita POPs_PROCESSOS.md/KPIs_GESTAO.md; C1:387 registra a ausência | Recuperar ou substituir os documentos de processos e KPIs | Referências apontam para documentos existentes e atuais |
| AR-1, AR-4, CS-REF, CS-2, QA-1..7, PR3-5 | OBSOLETO/DUPLICADO | Inventário legado; useNLPAutoAnalysis/useCSATSurveys atuais; deploy-all versionado; docs/PR3_CLOSED_REFERENCE | Arquivar/referenciar substitutos | Sem prometer símbolos/resultados ausentes |
| CS-3 | AINDA REPRODUZÍVEL | pushNotifications:6; send-push-notification:44-51; vite.config/main divergentes | VAPID/criptografia/handler | Push entregue; nenhuma entrega alegada |
| CS-6, PR3-2 | AINDA REPRODUZÍVEL | `supabase/functions/_shared/rate-limit.ts:2-5`; diretório worker ausente | Limitador persistente | Limite mantém-se entre isolates |
| AQ-1, AQ-3, EA-1, EA-4, EA-6, EA-7, AL-1, AL-2, DP-1 | AINDA REPRODUZÍVEL | package vite6; check-edge-imports; auth handlers; DocsPage:93-104 ainda esm.sh/CORS* | Referência atual/segura | Template passa gates; contrato correto |
| EA-2 | AINDA REPRODUZÍVEL | `supabase/functions/health/index.ts:11`; probe anon em post-cutover-watch:33 | Health mínimo/probe autorizado | Sem alarme falso 401 |
| EA-8, DG-3 | AINDA REPRODUZÍVEL | Funções órfãs; pipeline stages fixos em DealDialog:42 | Consumir/remover; modelo configurável | Recurso tem produtor/consumidor |
| DA-1 | AINDA REPRODUZÍVEL | `src/hooks/useRFMSegmentConfig.ts:13-14`; `RFMSegmentDashboard.tsx:9` | Seed/produtor métricas consolidadas | RFM contato corrigido não prova este painel |
| QF-4, SA-1 | AINDA REPRODUZÍVEL | `.dependency-cruiser.cjs:12-15` warn | Plano de órfãos/ratchet | Módulo novo órfão detectado |
| QF-P3 | NÃO VERIFICADO NO RUNTIME | `src/lib/formatters.ts` supressões permanecem | Cenário regex concreto | Supressão isolada não comprova bug |
| SM-1, FX-2 | AINDA REPRODUZÍVEL | `e2e/gap-modules-smoke.spec.ts:57-95`; nenhum teste useFicha360Filters | Jornadas funcionais/URL | Smoke não basta; Ask usa /dashboard inválido |
| FX-1 | AINDA REPRODUZÍVEL | AppRoutes:85; doc deep-link usa `/ficha-360/:id` | Corrigir roteiro/alias | Link compartilhado abre ficha |
| GS-1 | AINDA REPRODUZÍVEL | supabase/tests/get_contact_sidebar_by_phone.sql sem chamada workflow/run.sh | Executar fixture na CI | Contrato RPC protegido |

## Limites e diferenças posteriores

PR [108](https://github.com/adm01-debug/Singu_V2/pull/108) confirmado em `df79c5964f65d571c584e2440163e2af1b5712a2`: não muda src. PR [109](https://github.com/adm01-debug/Singu_V2/pull/109) confirmado em `55b6ad796b61c6874d4faf0ae0036b88749eb2e3`: muda externalData e testes de auditoria, não corrige os handlers/rotas desta matriz. Não incorporados à base nem tratados como publicação.

Anomalia sem ID no anexo D: `/design-system` permanece público (`src/app/AppRoutes.tsx:69`). Estado D: decidir visibilidade do catálogo; isso, sozinho, não comprova vazamento.

LOVABLE/WhatsApp/Evolution/Bitrix/ElevenLabs/Firecrawl/Twilio explicitamente adiados; nenhum secret solicitado. Banco, agendas, grants, aplicação permanente, provedores, rotação histórica e WCAG visual seguem sem prova nesta unidade. IDs cruzados V precisam da consolidação dos agentes Banco/Edge/Infra, não de reparo presumido.


---
