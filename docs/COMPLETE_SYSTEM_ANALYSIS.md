# 📊 ANÁLISE COMPLETA DO SISTEMA RelateIQ CRM
## Documento de Funcionalidades Exaustivo e Detalhado

**Data:** 2026-01-12  
**Versão:** 1.0  
**Escopo:** Análise completa de todas as funcionalidades, módulos, hooks, componentes e integrações

---

## 🎯 RESUMO EXECUTIVO

O **RelateIQ** é um CRM (Customer Relationship Management) avançado focado em **Inteligência Comportamental** e **Análise de Relacionamentos**. O sistema combina técnicas de PNL (Programação Neurolinguística), psicologia comportamental e inteligência artificial para otimizar a gestão de contatos e vendas.

### Estatísticas do Sistema

| Categoria | Quantidade |
|-----------|------------|
| Páginas | 13 |
| Componentes | 150+ |
| Hooks Customizados | 75 |
| Edge Functions | 12 |
| Tabelas no Banco | 25+ |
| Frameworks Comportamentais | 10 |

---

## 📱 MÓDULO 1: PÁGINAS PRINCIPAIS

### 1.1 Dashboard (Index.tsx)
**Rota:** `/`

**Funcionalidades:**
- ✅ Estatísticas gerais (empresas, contatos, interações, score médio)
- ✅ Filtro por período (7d, 30d, 90d)
- ✅ Seção "Seu Dia" com tarefas e follow-ups
- ✅ Portfolio Health Dashboard
- ✅ Calendário de Datas Importantes
- ✅ Gráficos de Atividade e Evolução
- ✅ Distribuição de Contatos por Sentimento
- ✅ Estatísticas de Relacionamento
- ✅ Padrões de Compra e Comportamento
- ✅ Inteligência de Negócios (Churn, Best Time, Deal Velocity)
- ✅ Ranking de Closing Score
- ✅ Smart Reminders
- ✅ Alertas de Saúde
- ✅ Alertas de Compatibilidade
- ✅ Melhores Relacionamentos
- ✅ Atividades Recentes
- ✅ Pre-Contact Briefing Modal

### 1.2 Contatos (Contatos.tsx)
**Rota:** `/contatos`

**Funcionalidades:**
- ✅ Listagem em Grid/Lista
- ✅ Busca por nome, cargo, email
- ✅ Filtros Avançados (papel, sentimento, estágio)
- ✅ Ordenação múltipla
- ✅ CRUD completo (criar, editar, excluir)
- ✅ Seleção múltipla e ações em lote
- ✅ Exportação de dados avançada
- ✅ Navegação por teclado
- ✅ Mini celebrations ao criar/atualizar
- ✅ Empty states contextuais

### 1.3 Detalhe do Contato (ContatoDetalhe.tsx)
**Rota:** `/contatos/:id`

**Funcionalidades:**
- ✅ Perfil completo do contato
- ✅ Score de Relacionamento visual
- ✅ Funil de Relacionamento interativo
- ✅ Badges DISC, VAK, Sentimento
- ✅ Ações rápidas (WhatsApp, Tel, Email, LinkedIn)
- ✅ Assistente de Escrita com IA
- ✅ Timeline de Interações
- ✅ Sugestão de Próxima Ação (IA)
- ✅ Perfil Comportamental editável
- ✅ Dashboard NLP Unificado
- ✅ Dashboard de Inteligência de Vendas
- ✅ Quick NLP Insights
- ✅ Resumo Executivo Comportamental
- ✅ Perfil VAK com templates
- ✅ Biblioteca Sleight of Mouth
- ✅ Perfil de Metaprogramas
- ✅ Gatilhos do Cliente
- ✅ Templates de Persuasão
- ✅ Histórico de Uso de Gatilhos
- ✅ Painel de Closing Score
- ✅ Inteligência Emocional
- ✅ Vieses Cognitivos
- ✅ Evolução Comportamental
- ✅ Perfil Comportamental Unificado
- ✅ Recomendação de Abordagem
- ✅ Saúde do Cliente
- ✅ Ofertas Personalizadas
- ✅ Datas Importantes
- ✅ Score de Satisfação
- ✅ Padrões de Compra
- ✅ Alertas de Comportamento
- ✅ Preferências de Comunicação
- ✅ Histórico de Compras
- ✅ Eventos de Vida
- ✅ Configurações de Cadência

### 1.4 Empresas (Empresas.tsx)
**Rota:** `/empresas`

**Funcionalidades:**
- ✅ Listagem de empresas
- ✅ CRUD completo
- ✅ Filtros e busca
- ✅ Health Score da empresa
- ✅ Contagem de contatos por empresa

### 1.5 Detalhe da Empresa (EmpresaDetalhe.tsx)
**Rota:** `/empresas/:id`

**Funcionalidades:**
- ✅ Informações completas da empresa
- ✅ Lista de contatos vinculados
- ✅ Interações da empresa
- ✅ Mapa de Stakeholders
- ✅ Simulador de Stakeholders
- ✅ Detecção de Coalizões
- ✅ Alertas de Stakeholders
- ✅ Rede de Influência
- ✅ Score de saúde financeira

### 1.6 Analytics (Analytics.tsx)
**Rota:** `/analytics`

**Funcionalidades:**
- ✅ Estatísticas com comparação de período
- ✅ Gráfico de Evolução de Relacionamento
- ✅ Distribuição de Sentimento (Pie Chart)
- ✅ Engajamento por Canal (Bar Chart)
- ✅ Radar de Engajamento
- ✅ Top Performers
- ✅ Previsão de Churn
- ✅ Melhor Horário para Contato
- ✅ Velocidade do Deal
- ✅ Analytics NLP
- ✅ Ranking de Closing Score
- ✅ Predição de Churn por Conta

### 1.7 Insights (Insights.tsx)
**Rota:** `/insights`

**Funcionalidades:**
- ✅ Geração de Insights com IA
- ✅ Categorização (personalidade, preferência, comportamento, oportunidade, risco, relacionamento)
- ✅ Filtros por categoria
- ✅ Busca de insights
- ✅ Relatório de Compatibilidade do Portfolio
- ✅ Lista de Alertas de Compatibilidade
- ✅ Indicadores de confiança
- ✅ Sugestões acionáveis

### 1.8 Interações (Interacoes.tsx)
**Rota:** `/interacoes`

**Funcionalidades:**
- ✅ Timeline de interações
- ✅ Filtros por tipo, sentimento
- ✅ Criação de interações
- ✅ Transcrição de áudio
- ✅ Tags e insights chave

### 1.9 Calendário (Calendario.tsx)
**Rota:** `/calendario`

**Funcionalidades:**
- ✅ Visualização de eventos
- ✅ Datas importantes
- ✅ Follow-ups agendados
- ✅ Aniversários e eventos de vida

### 1.10 Network (Network.tsx)
**Rota:** `/network`

**Funcionalidades:**
- ✅ Visualização em grafo de relacionamentos
- ✅ Conexões entre contatos
- ✅ Influência e poder de decisão
- ✅ Force-directed graph interativo

### 1.11 Configurações (Configuracoes.tsx)
**Rota:** `/configuracoes`

**Funcionalidades:**
- ✅ Perfil do Vendedor (DISC, metaprogramas)
- ✅ Configurações de alertas de compatibilidade
- ✅ Configurações de notificações de templates
- ✅ Relatório semanal
- ✅ Alertas de saúde
- ✅ Preferências do tour

### 1.12 Notificações (Notificacoes.tsx)
**Rota:** `/notificacoes`

**Funcionalidades:**
- ✅ Central de notificações
- ✅ Categorização por tipo
- ✅ Ações rápidas

### 1.13 Auth (Auth.tsx)
**Rota:** `/auth`

**Funcionalidades:**
- ✅ Login
- ✅ Cadastro
- ✅ Recuperação de senha

### 1.14 Onboarding (Onboarding.tsx)
**Rota:** `/onboarding`

**Funcionalidades:**
- ✅ Wizard de boas-vindas
- ✅ Configuração de perfil
- ✅ Importação de dados
- ✅ Preferências iniciais

---

## 🧠 MÓDULO 2: 10 FRAMEWORKS DE COMPORTAMENTO HUMANO

### 2.1 DISC Profile
**Arquivos:** `src/components/ui/disc-badge.tsx`, `src/types/index.ts`

**Funcionalidades:**
- Identificação de perfil (Dominante, Influente, Estável, Conforme)
- Confiança do perfil (0-100%)
- Notas sobre comportamento
- Visualização em gráfico radar
- Cores e labels por perfil
- Recomendações de abordagem

**Aplicações:**
- Personalização de comunicação
- Previsão de comportamento em negociação
- Compatibilidade vendedor-cliente

### 2.2 VAK/D (Visual, Auditivo, Cinestésico)
**Arquivos:** `src/hooks/useVAKAnalysis.ts`, `src/components/contacts/VAKProfileCard.tsx`, `src/components/triggers/VAKTemplateLibrary.tsx`

**Funcionalidades:**
- Análise de preferência sensorial
- Scores para cada modalidade
- Identificação de modalidade primária
- Templates adaptados por VAK
- Palavras-chave por modalidade

**Aplicações:**
- Adaptação de linguagem em emails/mensagens
- Apresentações personalizadas
- Materiais de vendas customizados

### 2.3 Metaprogramas
**Arquivos:** `src/hooks/useMetaprogramAnalysis.ts`, `src/components/triggers/MetaprogramProfileCard.tsx`, `src/components/triggers/MetaprogramTemplateLibrary.tsx`

**Funcionalidades:**
- Análise de padrões mentais
- Categorias: Proativo/Reativo, Interno/Externo, Opções/Procedimentos, Geral/Específico
- Templates por metaprograma
- Detecção automática em textos

**Aplicações:**
- Estruturação de argumentos de venda
- Personalização de propostas
- Previsão de objeções

### 2.4 Gatilhos Mentais
**Arquivos:** `src/hooks/useClientTriggers.ts`, `src/components/triggers/ClientTriggerPanel.tsx`, `src/components/triggers/PersuasionTemplates.tsx`

**Tipos de Gatilhos:**
- Escassez
- Urgência
- Autoridade
- Prova Social
- Reciprocidade
- Compromisso e Consistência
- Afinidade
- Novidade

**Funcionalidades:**
- Histórico de uso por contato
- Efetividade de cada gatilho
- Templates prontos
- Sugestões contextuais

### 2.5 Sleight of Mouth
**Arquivos:** `src/data/sleightOfMouth.ts`, `src/components/triggers/SleightOfMouthLibrary.tsx`

**Padrões:**
- Redefinição
- Consequência
- Intenção
- Meta-Frame
- Modelo do Mundo
- Hierarquia de Critérios
- Mudança de Tamanho do Frame
- Analogia

**Funcionalidades:**
- Biblioteca de padrões
- Exemplos de aplicação
- Uso para rebater objeções
- Categorização por cenário

### 2.6 Estados Emocionais & Âncoras
**Arquivos:** `src/hooks/useEmotionalStates.ts`, `src/hooks/useEmotionalStatesPersistence.ts`

**Funcionalidades:**
- Detecção de estado emocional em textos
- Histórico de estados por contato
- Identificação de âncoras positivas/negativas
- Melhor momento para fechamento
- Tendência emocional

**Estados Detectados:**
- Entusiasmado, Confiante, Receptivo
- Neutro, Cauteloso
- Frustrado, Resistente, Desinteressado

### 2.7 Valores & Critérios de Decisão
**Arquivos:** `src/hooks/useClientValues.ts`, `src/hooks/useClientValuesPersistence.ts`

**Funcionalidades:**
- Detecção de valores em conversas
- Hierarquia de valores
- Critérios de decisão
- Alinhamento de benefícios
- Drivers motivacionais
- Drivers de medo

**Categorias de Valores:**
- Segurança, Crescimento, Reconhecimento
- Eficiência, Qualidade, Inovação
- Relacionamento, Autonomia

### 2.8 Inteligência Emocional (EQ)
**Arquivos:** `src/hooks/useEmotionalIntelligence.ts`, `src/hooks/useEQPersistence.ts`, `src/components/analytics/EmotionalIntelligencePanel.tsx`

**Pilares Analisados:**
- Autoconsciência
- Autogestão
- Consciência Social
- Gestão de Relacionamentos

**Funcionalidades:**
- Score geral de EQ
- Scores por pilar
- Indicadores comportamentais
- Estilo de comunicação
- Implicações para vendas
- Evolução histórica

### 2.9 Vieses Cognitivos
**Arquivos:** `src/hooks/useCognitiveBiases.ts`, `src/hooks/useCognitiveBiasPersistence.ts`, `src/components/analytics/CognitiveBiasesPanel.tsx`

**Vieses Detectados:**
- Ancoragem
- Confirmação
- Disponibilidade
- Aversão à Perda
- Efeito Halo
- Status Quo
- Escassez
- Prova Social
- Autoridade
- Reciprocidade

**Funcionalidades:**
- Detecção em textos
- Vulnerabilidades do contato
- Resistências identificadas
- Estratégias de vendas recomendadas
- Histórico de vieses

### 2.10 Rapport & Espelhamento
**Arquivos:** `src/hooks/useRapportGenerator.ts`

**Funcionalidades:**
- Análise de estilo de comunicação
- Sugestões de espelhamento
- Pontos de conexão
- Interesses compartilhados
- Abordagem personalizada

---

## 🎣 MÓDULO 3: HOOKS CUSTOMIZADOS (75 hooks)

### 3.1 Hooks de Dados Core
| Hook | Descrição |
|------|-----------|
| `useAuth` | Autenticação e sessão do usuário |
| `useContacts` | CRUD de contatos |
| `useCompanies` | CRUD de empresas |
| `useInteractions` | CRUD de interações |
| `useContactDetail` | Dados detalhados de um contato |
| `useDashboardStats` | Estatísticas do dashboard |

### 3.2 Hooks de Análise Comportamental
| Hook | Descrição |
|------|-----------|
| `useVAKAnalysis` | Análise VAK |
| `useMetaprogramAnalysis` | Análise de metaprogramas |
| `useCognitiveBiases` | Detecção de vieses |
| `useEmotionalIntelligence` | Análise de EQ |
| `useEmotionalStates` | Estados emocionais |
| `useClientValues` | Valores do cliente |
| `useHiddenObjections` | Objeções ocultas |
| `useRapportGenerator` | Geração de rapport |

### 3.3 Hooks de Persistência
| Hook | Descrição |
|------|-----------|
| `useEQPersistence` | Histórico de EQ |
| `useCognitiveBiasPersistence` | Histórico de vieses |
| `useEmotionalStatesPersistence` | Histórico emocional |
| `useClientValuesPersistence` | Histórico de valores |
| `useHiddenObjectionsPersistence` | Histórico de objeções |
| `useFavoriteTemplates` | Templates favoritos |
| `useTriggerHistory` | Histórico de gatilhos |

### 3.4 Hooks de Analytics
| Hook | Descrição |
|------|-----------|
| `useClosingScore` | Score de fechamento |
| `useClosingScoreAlerts` | Alertas de closing |
| `useClosingScoreRanking` | Ranking de closing |
| `useChurnPrediction` | Previsão de churn |
| `useAccountChurnPrediction` | Churn por conta |
| `useDealVelocity` | Velocidade do deal |
| `useBestTimeToContact` | Melhor horário |
| `useSatisfactionScore` | Score de satisfação |
| `usePurchasePatterns` | Padrões de compra |
| `useClientHealth` | Saúde do cliente |
| `usePortfolioHealth` | Saúde do portfólio |
| `usePersuasionScore` | Score de persuasão |

### 3.5 Hooks de Stakeholders
| Hook | Descrição |
|------|-----------|
| `useStakeholderAnalysis` | Análise de stakeholders |
| `useStakeholderAlerts` | Alertas de stakeholders |
| `useStakeholderSimulator` | Simulador de cenários |
| `useCoalitionDetection` | Detecção de coalizões |
| `useNetworkGraph` | Grafo de rede |

### 3.6 Hooks de Comunicação
| Hook | Descrição |
|------|-----------|
| `useContactPreferences` | Preferências do contato |
| `useContactCadence` | Cadência de contato |
| `useBehaviorAlerts` | Alertas de comportamento |
| `useApproachRecommendation` | Recomendação de abordagem |
| `usePreContactBriefing` | Briefing pré-contato |

### 3.7 Hooks de Templates
| Hook | Descrição |
|------|-----------|
| `useVAKTemplates` | Templates VAK |
| `useClientTriggers` | Gatilhos do cliente |
| `useTemplateNotifications` | Notificações de templates |
| `usePersonalizedOffers` | Ofertas personalizadas |
| `useSalesScript` | Script de vendas |
| `useNegotiationSimulator` | Simulador de negociação |

### 3.8 Hooks de UX/UI
| Hook | Descrição |
|------|-----------|
| `useGlobalSearch` | Busca global |
| `useSidebarState` | Estado da sidebar |
| `useKeyboardShortcutsEnhanced` | Atalhos de teclado |
| `useKeyboardNavigation` | Navegação por teclado |
| `useHapticFeedback` | Feedback tátil |
| `useReducedMotion` | Preferência de movimento |
| `useScrollEffects` | Efeitos de scroll |
| `usePrefetch` | Prefetch de dados |
| `useLazySection` | Carregamento lazy |
| `useDebounce` | Debounce de valores |
| `useMobile` | Detecção de mobile |
| `useOnlineStatus` | Status de conexão |
| `useFormAutosave` | Auto-save de formulários |
| `useSavedFilters` | Filtros salvos |
| `useEasterEggs` | Easter eggs |

### 3.9 Hooks de Notificações
| Hook | Descrição |
|------|-----------|
| `useNotifications` | Notificações do sistema |
| `useRealtimeNotifications` | Notificações em tempo real |
| `useHealthAlerts` | Alertas de saúde |
| `useCompatibilityAlerts` | Alertas de compatibilidade |
| `useSmartReminders` | Lembretes inteligentes |
| `useImportantDates` | Datas importantes |
| `useYourDay` | Agenda do dia |
| `useWeeklyReport` | Relatório semanal |

---

## 🔧 MÓDULO 4: COMPONENTES (150+)

### 4.1 Componentes de Layout
- `AppLayout` - Layout principal da aplicação
- `Sidebar` - Menu lateral
- `Header` - Cabeçalho com breadcrumbs
- `MobileHeader` - Header mobile
- `MobileBottomNav` - Navegação inferior mobile
- `MobileSidebarDrawer` - Drawer mobile
- `DynamicBreadcrumbs` - Breadcrumbs dinâmicos
- `PersonalizedGreeting` - Saudação personalizada

### 4.2 Componentes de Contato
- `ContactCardWithContext` - Card de contato com menu
- `ContactForm` - Formulário de contato
- `BehaviorProfileForm` - Formulário de perfil comportamental
- `VAKProfileCard` - Card de perfil VAK
- `InteractionTimeline` - Timeline de interações
- `InteractionForm` - Formulário de interação
- `AIWritingAssistant` - Assistente de escrita IA
- `NextActionSuggestion` - Sugestão de próxima ação

### 4.3 Componentes de Empresa
- `CompanyCardWithContext` - Card de empresa
- `CompanyForm` - Formulário de empresa
- `CompanyHealthScore` - Score de saúde

### 4.4 Componentes de Analytics
- `ClosingScorePanel` - Painel de closing score
- `ClosingScoreAlertsList` - Alertas de closing
- `ClosingScoreRanking` - Ranking de closing
- `ChurnPredictionPanel` - Previsão de churn
- `AccountChurnPredictionPanel` - Churn por conta
- `BestTimeToContactPanel` - Melhor horário
- `DealVelocityPanel` - Velocidade do deal
- `EmotionalIntelligencePanel` - Painel de EQ
- `CognitiveBiasesPanel` - Painel de vieses
- `BehaviorEvolutionChart` - Evolução comportamental
- `UnifiedBehavioralProfilePanel` - Perfil unificado
- `ApproachRecommendationPanel` - Recomendação de abordagem
- `ClientHealthPanel` - Saúde do cliente
- `SatisfactionScorePanel` - Score de satisfação
- `PurchasePatternsPanel` - Padrões de compra
- `BehaviorAlertsPanel` - Alertas de comportamento
- `PersonalizedOffersPanel` - Ofertas personalizadas
- `ImportantDatesPanel` - Datas importantes
- `NLPAnalyticsPanel` - Analytics NLP

### 4.5 Componentes de Gatilhos/Templates
- `ClientTriggerPanel` - Painel de gatilhos
- `PersuasionTemplates` - Templates de persuasão
- `VAKTemplateLibrary` - Biblioteca VAK
- `SleightOfMouthLibrary` - Biblioteca Sleight of Mouth
- `MetaprogramProfileCard` - Card de metaprograma
- `MetaprogramTemplateLibrary` - Templates de metaprograma
- `TriggerUsageHistory` - Histórico de uso
- `TriggerAnalytics` - Analytics de gatilhos
- `SmartTemplateSuggestions` - Sugestões inteligentes
- `TemplateHistoryByProfile` - Histórico por perfil
- `TemplatePerformanceComparison` - Comparação de performance
- `ProfileBasedSuggestions` - Sugestões por perfil

### 4.6 Componentes de Dashboard
- `YourDaySection` - Seção "Seu Dia"
- `PortfolioHealthDashboard` - Dashboard de saúde
- `HealthAlertsPanel` - Alertas de saúde
- `RelationshipStatsPanel` - Estatísticas de relacionamento
- `ImportantDatesCalendar` - Calendário de datas
- `WeeklyReportPanel` - Relatório semanal
- `DashboardCharts` - Gráficos do dashboard

### 4.7 Componentes de Stakeholders
- `StakeholderMap` - Mapa de stakeholders
- `StakeholderSimulator` - Simulador
- `StakeholderInfluenceNetwork` - Rede de influência
- `StakeholderAlertsList` - Lista de alertas
- `CoalitionDetectionPanel` - Detecção de coalizões

### 4.8 Componentes de Feedback/UX
- `ContextualLoader` - Loader contextual
- `LoadingStates` - Estados de carregamento
- `EmptyStateIllustrations` - Empty states
- `ErrorBoundary` - Boundary de erro
- `ToastSystem` - Sistema de toasts
- `ProgressToast` - Toast com progresso
- `OfflineBanner` - Banner offline
- `DraftRecoveryBanner` - Recuperação de drafts
- `ContextualHelp` - Ajuda contextual
- `SwipeableListItem` - Item swipeable
- `PullToRefresh` - Pull to refresh

### 4.9 Componentes de Microinterações
- `MorphingNumber` - Número com morphing
- `AnimatedCounter` - Contador animado
- `NumberTicker` - Ticker de números
- `StatusIndicators` - Indicadores de status
- `SuccessCheckmark` - Checkmark de sucesso

### 4.10 Componentes de Navegação
- `GlobalSearch` - Busca global
- `SmartBreadcrumbs` - Breadcrumbs inteligentes
- `NavigationPatterns` - Padrões de navegação
- `KeyboardShortcutsDialogEnhanced` - Dialog de atalhos

### 4.11 Componentes de Formulário
- `ContactForm` - Formulário de contato
- `CompanyForm` - Formulário de empresa
- `InteractionForm` - Formulário de interação
- `BehaviorProfileForm` - Formulário de comportamento
- `CommunicationPreferencesForm` - Preferências de comunicação
- `LifeEventForm` - Eventos de vida
- `PurchaseHistoryForm` - Histórico de compras

### 4.12 Componentes UI (shadcn + customizados)
- Todos os componentes shadcn/ui
- `OptimizedAvatar` - Avatar otimizado
- `RoleBadge` - Badge de papel
- `DISCBadge` - Badge DISC
- `VAKBadge` - Badge VAK
- `EQBadge` - Badge EQ
- `BiasBadge` - Badge de viés
- `RelationshipScore` - Score visual
- `RelationshipStage` - Estágio de relacionamento
- `SentimentIndicator` - Indicador de sentimento
- `PriorityIndicator` - Indicador de prioridade
- `CompanyHealthScore` - Score de saúde da empresa
- `StatCard` - Card de estatística
- `TagManager` - Gerenciador de tags
- `MaskedInput` - Input com máscara
- `LoadingButton` - Botão com loading

---

## ☁️ MÓDULO 5: EDGE FUNCTIONS (12)

### 5.1 ai-writing-assistant
**Função:** Assistente de escrita com IA

**Recursos:**
- Geração de emails personalizados
- Adaptação por perfil DISC/VAK
- Sugestões de abordagem

### 5.2 check-health-alerts
**Função:** Verificação de alertas de saúde

**Recursos:**
- Análise de relacionamentos em risco
- Notificações automáticas
- Cálculo de scores de saúde

### 5.3 check-notifications
**Função:** Sistema de notificações

**Recursos:**
- Verificação de eventos
- Disparo de notificações
- Gestão de preferências

### 5.4 client-notifications
**Função:** Notificações do cliente

**Recursos:**
- Push notifications
- Notificações in-app

### 5.5 generate-insights
**Função:** Geração de insights com IA

**Recursos:**
- Análise de padrões
- Identificação de oportunidades
- Detecção de riscos
- Sugestões acionáveis

### 5.6 generate-offer-suggestions
**Função:** Sugestões de ofertas personalizadas

**Recursos:**
- Análise de histórico
- Personalização por perfil
- Timing otimizado

### 5.7 send-push-notification
**Função:** Envio de push notifications

**Recursos:**
- Web Push API
- VAPID authentication
- Gestão de subscriptions

### 5.8 smart-reminders
**Função:** Lembretes inteligentes

**Recursos:**
- Análise de padrões de contato
- Sugestões contextuais
- Priorização inteligente

### 5.9 suggest-next-action
**Função:** Sugestão de próxima ação

**Recursos:**
- Análise de contexto
- Recomendação baseada em IA
- Score de confiança

### 5.10 template-success-notifications
**Função:** Notificações de sucesso de templates

**Recursos:**
- Tracking de uso
- Análise de efetividade
- Sugestões de melhoria

### 5.11 voice-to-text
**Função:** Transcrição de áudio

**Recursos:**
- Integração com IA
- Processamento de áudio
- Transcrição em português

### 5.12 weekly-digest
**Função:** Relatório semanal

**Recursos:**
- Compilação de métricas
- Destaques da semana
- Envio por email

---

## 🗄️ MÓDULO 6: BANCO DE DADOS (25+ tabelas)

### 6.1 Tabelas Core
- `contacts` - Contatos
- `companies` - Empresas
- `interactions` - Interações
- `activities` - Atividades
- `alerts` - Alertas
- `insights` - Insights

### 6.2 Tabelas de Comportamento
- `cognitive_bias_history` - Histórico de vieses
- `emotional_states_history` - Histórico emocional
- `emotional_anchors` - Âncoras emocionais
- `eq_analysis_history` - Histórico de EQ
- `client_values` - Valores do cliente
- `decision_criteria` - Critérios de decisão
- `hidden_objections` - Objeções ocultas

### 6.3 Tabelas de Preferências
- `contact_preferences` - Preferências de contato
- `contact_cadence` - Cadência de contato
- `contact_time_analysis` - Análise de horários
- `communication_preferences` - Preferências de comunicação
- `favorite_templates` - Templates favoritos

### 6.4 Tabelas de Alertas/Saúde
- `health_alerts` - Alertas de saúde
- `health_alert_settings` - Configurações de alertas
- `compatibility_alerts` - Alertas de compatibilidade
- `compatibility_settings` - Configurações de compatibilidade

### 6.5 Tabelas de Suporte
- `push_subscriptions` - Subscriptions de push
- `weekly_report_settings` - Configurações de relatório

---

## 📊 MÓDULO 7: INTEGRAÇÕES

### 7.1 Supabase (Lovable Cloud)
- Autenticação
- Banco de dados PostgreSQL
- Edge Functions
- Realtime subscriptions
- Storage (preparado)

### 7.2 Lovable AI Gateway
- Geração de insights
- Assistente de escrita
- Transcrição de áudio
- Análise de comportamento

### 7.3 PWA
- Service Worker
- Push Notifications
- Offline support
- Install prompt

---

## 🎨 MÓDULO 8: DESIGN SYSTEM

### 8.1 Tokens de Cor
- Paleta primária com gradientes
- Estados semânticos (success, warning, error, info)
- Superfícies hierárquicas
- Dark mode completo

### 8.2 Tipografia
- Escala modular (ratio 1.25)
- Font Manrope
- Line-heights otimizados

### 8.3 Animações
- Framer Motion integrado
- Transições de página
- Microinterações
- Celebrations

### 8.4 Componentes shadcn/ui
- 50+ componentes base
- Customizações extensivas
- Variantes personalizadas

---

## 📱 MÓDULO 9: RECURSOS MOBILE

### 9.1 Navegação
- Bottom navigation
- Sidebar drawer
- Safe area handling
- Touch targets otimizados

### 9.2 Gestos
- Swipeable list items
- Pull to refresh
- Long press actions

### 9.3 Feedback
- Haptic feedback
- Toast notifications
- Loading states

---

## ⌨️ MÓDULO 10: ATALHOS DE TECLADO

| Atalho | Ação |
|--------|------|
| `Ctrl/⌘ + K` | Busca global |
| `Ctrl/⌘ + B` | Toggle sidebar |
| `Alt + 1-9` | Navegação rápida |
| `G + número` | Ir para página |
| `N` | Novo item |
| `E` | Editar |
| `D` | Deletar |
| `↑↓` | Navegar em listas |
| `Enter` | Abrir item |
| `Escape` | Fechar modais |

---

## 🔒 MÓDULO 11: SEGURANÇA

### 11.1 Autenticação
- Supabase Auth
- Session management
- Protected routes

### 11.2 RLS (Row Level Security)
- Políticas por usuário
- Isolamento de dados
- Validação em queries

### 11.3 Edge Functions
- JWT validation
- CORS configurado
- Rate limiting (preparado)

---

## 📈 CONCLUSÃO

O RelateIQ é um sistema CRM **extremamente robusto e completo**, com foco único em:

1. **Inteligência Comportamental** - 10 frameworks científicos integrados
2. **Automação Inteligente** - IA para insights, sugestões e análises
3. **UX Premium** - Microinterações, animações, feedback contextual
4. **Mobile-First** - PWA completo com suporte offline
5. **Analytics Avançado** - Dashboards, relatórios, previsões

### Diferenciais Competitivos:
- Único CRM com 10 frameworks de comportamento humano integrados
- Análise preditiva de churn e closing
- Assistente de escrita com IA personalizado
- Mapa de stakeholders e detecção de coalizões
- Compatibilidade vendedor-cliente automatizada

**Total de Funcionalidades Únicas: 200+**
