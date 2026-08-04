# 📋 SINGU CRM — Levantamento Completo de Funcionalidades

> Documento gerado a partir de todas as conversas e módulos implementados no sistema.

---

## 1. 🏢 Gestão de Empresas (Companies)

- CRUD completo de empresas
- Campos: nome, indústria, website, telefone, email, endereço, cidade, estado, logo
- Saúde financeira (`financial_health`): growing, stable, cutting, unknown
- Número de funcionários, receita anual
- Competidores e desafios
- Tags e notas
- Contagem de contatos vinculados
- Data da última interação

---

## 2. 👤 Gestão de Contatos (Contacts)

- CRUD completo com paginação (50 por página) e `loadMore`
- Campos pessoais: nome, sobrenome, email, telefone, WhatsApp, LinkedIn, Instagram, Twitter
- Avatar, aniversário, notas pessoais
- Papel (`role`): owner, manager, buyer, contact, decision_maker, influencer
- Título do cargo (`role_title`)
- Hobbies, interesses, informações familiares
- Tags personalizadas
- Vinculação a empresas (`company_id`)
- Busca externa via `queryExternalData` (somente leitura)

### 2.1 Relacionamento
- Estágio do relacionamento: unknown → prospect → qualified_lead → opportunity → negotiation → customer → loyal_customer → advocate → at_risk → lost
- Score de relacionamento (0-100)
- Sentimento: positive, neutral, negative
- Dias sem contato
- Contagem de interações

### 2.2 Perfil Comportamental Estendido (`ContactBehavior`)
- **DISC**: perfil primário (D/I/S/C), confiança (0-100), notas
- **VAK**: visual, auditivo, cinestésico com canal primário
- **Motivações**: motivação principal, medo principal, estágio de carreira, pressão atual, objetivos profissionais
- **Comunicação**: canal preferido, estilo de mensagem, tempo médio de resposta, melhor janela de contato, nível de formalidade (1-5)
- **Tomada de Decisão**: velocidade, critérios, necessita aprovação, ID do aprovador, autoridade de orçamento
- **Influência & Poder**: papel decisório, poder de decisão (1-10), nível de suporte (1-10), IDs de influenciadores
- **Contexto Empresarial**: saúde financeira, desafios atuais, concorrentes usados, melhor momento para abordar, notas sazonais

### 2.3 Frameworks de Personalidade
- **Big Five**: openness, conscientiousness, extraversion, agreeableness, neuroticism + confiança
- **MBTI**: tipo (ex: INTJ), dimensões E/I, S/N, T/F, J/P com scores
- **Enneagram**: tipo (1-9), asa, scores por tipo
- **Temperamento** (`TemperamentProfile`): importado de `types/temperament`

### 2.4 Eventos de Vida (`LifeEvent`)
- Tipos: birthday, anniversary, promotion, travel, family, achievement, other
- Título, data, notas, lembrete
- Tabela `life_events` no banco com recorrência e dias de antecedência para lembrete

### 2.5 Parentes/Relacionados (`contact_relatives`)
- Nome, tipo de relacionamento, idade, aniversário, empresa, ocupação
- Email, telefone, notas
- Flag `is_decision_influencer`

### 2.6 Preferências de Contato (`contact_preferences`)
- Canal preferido, dias e horários preferidos
- Dias e horários a evitar
- Dicas de comunicação, restrições, notas pessoais

### 2.7 Cadência de Contato (`contact_cadence`)
- Dias entre contatos, último contato, próximo contato devido
- Prioridade, auto-lembrete, notas

### 2.8 Análise Temporal (`contact_time_analysis`)
- Dia da semana + hora do dia
- Tentativas totais, contatos com sucesso
- Tempo médio de resposta em minutos

---

## 3. 💬 Interações (Interactions)

- Tipos: whatsapp, call, email, meeting, note, social
- Título, conteúdo, URL de áudio, transcrição
- Sentimento, tags, duração (segundos para chamadas)
- Anexos
- Iniciado por: us / them
- Tempo de resposta (minutos)
- Insights-chave
- Follow-up requerido + data de follow-up
- Análise emocional (`emotion_analysis` - JSON)

---

## 4. 🧠 Módulo DISC Enterprise

### 4.1 Análise Automática (`useDISCAutoAnalysis`)
- Análise em tempo real após interações (>100 caracteres)
- Detecção automatizada de perfil via Edge Function `disc-analyzer`

### 4.2 Histórico de Análises (`disc_analysis_history`)
- Scores: dominance, influence, steadiness, conscientiousness
- Perfil primário e secundário, blend (ex: DI, SC)
- Perfil sob estresse (primário e secundário)
- Keywords e frases detectadas, indicadores comportamentais
- Fonte da análise, texto analisado, notas, resumo

### 4.3 Componentes UI
- **DISCEvolutionTimeline**: linha do tempo visual de mudanças comportamentais
- **DISCTrainingMode**: modo de treinamento/prática
- **DISCSalesScriptGenerator**: gerador de scripts de vendas por perfil
- **DISCTemplateLibrary**: biblioteca de templates de comunicação
- **DISCCompatibilityAlerts**: alertas de risco de interação
- **DISCConversionMetrics**: correlação de perfis com taxas de sucesso

### 4.4 Configuração de Perfil (`disc_profile_config`)
- Descrições detalhadas, drives e medos centrais
- Estilo de decisão, ambiente ideal, comportamento sob pressão
- Keywords de detecção, power words, palavras a evitar
- Estratégias de abertura, apresentação, objeções, fechamento, follow-up
- Matriz de compatibilidade, esquema de cores

### 4.5 Logs de Comunicação (`disc_communication_logs`)
- Perfil DISC do contato, dicas de adaptação mostradas
- Abordagem adaptada (sim/não), dicas seguidas
- Resultado da comunicação, rating de efetividade

### 4.6 Métricas de Conversão (`disc_conversion_metrics`)
- Por perfil DISC: total de contatos, oportunidades, convertidos, perdidos
- Taxa de conversão, ciclo médio de vendas, deal size médio
- Scores médios de compatibilidade e relacionamento
- Período de análise

---

## 5. 🧬 Módulo PNL/NLP Enterprise

### 5.1 Análise Automática (`useNLPAutoAnalysis`)
- Detecção em tempo real de VAK, Metaprogramas e Estados Emocionais

### 5.2 Componentes UI
- **NLPEvolutionTimeline**: rastreamento de mudanças comportamentais
- **NLPTrainingMode**: modo de treinamento
- **UnifiedScriptGenerator**: gerador unificado (DISC + NLP)
- **CommunicationCoherencePanel**: alinhamento de mensagens
- **NLPConversionMetrics**: dashboard de performance

### 5.3 Rapport & Comunicação Avançada
- **RapportRealtimeCoach**: coaching em tempo real de rapport
- **IncongruenceDetector**: detecção de incongruências
- **MiltonianCalibration**: calibração miltoniana (linguagem hipnótica)
- **PerceptualPositions**: posições perceptuais (1ª, 2ª, 3ª posição)

### 5.4 Estratégias de Decisão
- **TOTEModelMapper**: mapeamento do modelo TOTE
- **HierarchyOfCriteria**: hierarquia de critérios de decisão
- **WellFormedOutcomeBuilder**: construtor de resultados bem-formados
- **ChunkingNavigator**: navegação chunk up/chunk down

### 5.5 Âncoras & Estados Emocionais
- **AnchorTrackingSystem**: rastreamento de âncoras emocionais
- **StateElicitationToolkit**: toolkit de elicitação de estados
- **SubmodalityModifier**: modificador de submodalidades
- **SwishPatternGenerator**: gerador de padrões swish

### 5.6 Tabelas de Suporte
- **emotional_anchors**: tipo, trigger, estado emocional, força, contexto
- **emotional_states_history**: histórico de estados emocionais por interação
- **metaprogram_analysis**: toward/away-from, internal/external, options/procedures com scores e palavras detectadas

---

## 6. 🧪 Neuromarketing Enterprise

- **NeuroScore** (0-100): score neurológico do contato
- **NeuroAlerts**: alertas em tempo real de mudanças neurais
- **NeuroRadarChart**: gráfico radar de equilíbrio cerebral
- **NeuroTimeline**: histórico evolutivo
- **Pain-Claim-Gain Builder**: construtor de argumentos
- **NeuroABTracker**: tracking de sucesso por abordagem por contato
- **NeuroHeatmapCalendar**: janelas ótimas baseadas em ciclos circadianos
- Tratamento de objeções por sistema cerebral dominante
- Ferramentas educativas

---

## 7. ✍️ Copywriting & Sales Tools (Enterprise)

### 7.1 Frameworks de Persuasão
- **FAB**: Feature-Advantage-Benefit
- **AIDA**: Attention-Interest-Desire-Action
- **PAS**: Problem-Agitate-Solution
- **4Ps**: Promise-Picture-Proof-Push
- **Storytelling**: arcos narrativos (Jornada do Herói, etc.)

### 7.2 Analisador de Copy
- Legibilidade Flesch (PT-BR)
- Densidade de gatilhos mentais
- Scores de emoção

### 7.3 Previews Multi-Canal
- WhatsApp, Email, Redes Sociais

### 7.4 Gerador de Scripts de Vendas com IA
- Adaptados ao perfil comportamental (DISC, VAK, Carnegie)
- Templates com gatilhos mentais (Novidade, Exclusividade)
- Tratamento de objeções e medos específicos

---

## 8. 🔮 Lux Intelligence

- Varreduras profundas na internet (redes sociais, dados fiscais/CNPJ, stakeholders LinkedIn)
- Webhooks assíncronos com n8n
- Tabela `lux_intelligence` com:
  - Perfis sociais, análise social, dados fiscais
  - Stakeholders, análise de audiência, perfil pessoal
  - Relatório IA, resumo IA
  - Status: pending → processing → completed → error
- Criação automática de stakeholders como contatos locais
- Interface premium (shimmer, partículas, animações)
- Indicadores de progresso
- Polling automático durante processamento (5s)
- Edge Function `lux-trigger`

---

## 9. 🔍 Vieses Cognitivos (`cognitive_bias_history`)

- Vieses detectados, vieses dominantes
- Distribuição por categoria
- Vulnerabilidades e resistências
- Estratégias de vendas baseadas em vieses
- Resumo do perfil
- Vinculação a interações

---

## 10. 📊 Análise RFM (`rfm_analysis`)

- Scores de Recência, Frequência e Monetário
- Tendências (recency, frequency, monetary, overall)
- Segmentação com cor e descrição
- Probabilidade de churn
- Valor de vida previsto (lifetime value)
- Data prevista da próxima compra
- Ações e ofertas recomendadas
- Prioridade de comunicação
- Valor monetário total, total de compras, valor médio de pedido

---

## 11. 🎯 Inteligência Emocional (`eq_analysis_history`)

- Score geral (0-100) com nível (low/medium/high)
- Scores por pilar (autoconsciência, autogestão, empatia, habilidades sociais)
- Indicadores, estilo de comunicação
- Forças e áreas de crescimento
- Implicações para vendas
- Resumo do perfil

---

## 12. 🚫 Objeções Ocultas (`hidden_objections`)

- Tipo de objeção, indicador, severidade
- Objeção real provável, probabilidade
- Sonda sugerida, templates de resolução
- Status de resolução

---

## 13. 💰 Histórico de Compras (`purchase_history`)

- Nome e categoria do produto
- Valor, data de compra, data de renovação
- Ciclo em meses, notas

---

## 14. 🎁 Sugestões de Oferta (`offer_suggestions`)

- Nome e categoria da oferta
- Razão, score de confiança
- Status: pending → presented → accepted → rejected
- Datas de apresentação e expiração

---

## 15. 📋 Critérios de Decisão (`decision_criteria`)

- Nome, tipo, prioridade
- Detectado de (fonte), como endereçar

---

## 16. 💎 Valores do Cliente (`client_values`)

- Nome do valor, categoria, importância
- Frequência de menção, última menção
- Frases detectadas

---

## 17. 🔔 Sistema de Alertas

### 17.1 Alertas Gerais (`alerts`)
- Tipos: birthday, no_contact, sentiment_drop, opportunity, follow_up, life_event
- Prioridade: low, medium, high
- Dismissível, com URL de ação e expiração

### 17.2 Alertas de Compatibilidade (`compatibility_alerts`)
- Score de compatibilidade, threshold
- Tipo de alerta, dismissível, expiração

### 17.3 Alertas de Saúde (`health_alerts`)
- Score de saúde atual e anterior
- Tipo de alerta, fatores contribuintes
- Canais de notificação

### 17.4 Configurações de Alerta de Saúde (`health_alert_settings`)
- Thresholds: warning e critical
- Notificações: push, email
- Frequência de verificação (horas)

### 17.5 Configurações de Compatibilidade (`compatibility_settings`)
- Threshold de alerta
- Alertar apenas contatos importantes
- Score mínimo de relacionamento para "importante"
- Notificações por email

---

## 18. 📈 Atividades (`activities`)

- Tipos: company_created, contact_created, interaction_added, insight_generated, tag_added, profile_updated, alert_triggered
- Entidade: company, contact, interaction
- ID e nome da entidade, descrição

---

## 19. 💡 Insights (`insights`)

- Categorias: personality, preference, behavior, opportunity, risk, relationship
- Título, descrição, confiança (0-100)
- Fonte, acionável (sim/não), sugestão de ação
- Dismissível, com expiração

---

## 20. 🔍 Busca & Navegação

### 20.1 Busca Global (`GlobalSearch`)
- Sincronização com parâmetros de URL
- Atalhos de teclado

### 20.2 Predefinições de Busca (`useSearchPresets`)
- Salvar filtros personalizados (até 10)
- Persistência em `localStorage`
- Contexto por módulo (contacts, companies, etc.)

---

## 21. 🎨 Layout & UX

### 21.1 AppLayout
- Sidebar desktop com estado colapsável (`useSidebarState`)
- Header mobile com busca
- Bottom navigation mobile
- Atalhos de teclado globais (`useKeyboardShortcutsEnhanced`)
- Skip to content (acessibilidade)
- Botão de adição rápida (`QuickAddButton`)
- Centro de notificações (`NotificationCenter`)
- Tour de onboarding (`OnboardingTourWrapper`)

### 21.2 Engajamento & Retenção
- Emblemas de notificação agrupados por categoria
- Feature Spotlight (descoberta de funcionalidades)
- `useFormDraft`: salvamento automático de rascunhos em `localStorage`

---

## 22. 👤 Perfis de Usuário (`profiles`)

- Nome, sobrenome, telefone, avatar
- Nome da empresa, título do cargo
- Perfil NLP do usuário (JSON)
- Preferências do sistema (JSON)

---

## 23. 🔐 Autenticação

- Sistema de autenticação via Lovable Cloud
- Hook `useAuth`
- RLS policies em todas as tabelas com `user_id`

---

## 24. 📱 Push Notifications (`push_subscriptions`)

- Endpoint, chaves p256dh e auth
- Vinculação ao usuário

---

## 25. ⭐ Templates Favoritos (`favorite_templates`)

- Vinculação usuário ↔ template

---

## 26. 🗄️ Comunicação com Banco Externo

- `queryExternalData`: busca somente leitura em banco externo
- Suporte a filtros, ordenação e paginação (range)
- Usado no `useContacts` para listagem

---

## 27. 📊 Dashboard (`DashboardStats`)

- Total de empresas e contatos
- Interações da semana
- Score médio de relacionamento
- Top empresas
- Atividades recentes
- Follow-ups próximos
- Alertas ativos

---

*Documento gerado em: 2026-03-15*
*Versão: 1.0*
