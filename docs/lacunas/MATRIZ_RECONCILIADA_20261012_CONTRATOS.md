# Contratos frontend/backend

[Voltar ao índice da matriz reconciliada](MATRIZ_RECONCILIADA_20261012.md)


**Origem:** docs/lacunas/E_contratos_front_backend.md; docs/lacunas/B1_reverificacao_estado_01_04.md.

## Contratos — reconciliação E + B1

## Lacunas graves e tarefas concretas

1. **RPCs incompatíveis:** corrigir parâmetros de mesclar empresas, registrar interação e criar deal rápido; testar botões e outro proprietário.
2. **Deduplicação não atômica:** `useMergeRecords` atualiza, transfere e exclui separadamente. Falha intermediária deixa alterações parciais. Usar transação preservando overrides/vínculos; cadastro composto não corrige esse caminho.
3. **Proxy/views divergentes:** `user_id` injetado onde não existe no tipo canônico. Corrigir projeção/RPC com isolamento, nunca simplesmente retirar o filtro. E-T07 está parcialmente corrigido; atividades sem vínculo foram desativadas.
4. **Dados/envios fictícios:** EQ, velocidade, metaprogramas, Analytics/MarketingHub; sequências gravam `sent` antes da entrega, nurturing/assinatura sem envio. Campanhas corrigiram a mentira, mas só preparam destinatários.
5. **Cron bloqueia UI/internos:** separar autorização manual/interna/agendada; conferir jobs remotos. Sequências/nurturing ainda usam `.catch` em builders: confirmei localmente `typeof builder.catch === 'undefined'`, sem rede.
6. **E-C01 corrigido após esta revisão:** a ficha 360 usa `contact_id` e o código mergeado da auditoria reconhece esse identificador; migration aplicada e fixture pós-aplicação aprovadas. Resta o reteste autenticado de leitura/exclusão na interface.

## Base e limites

Snapshot **a2b73c7dee837f19aa756e6afe385eba837b5d54**; HEAD/origin/main iguais após fetch. Checkout limpo, não shallow; sem alteração versionada/escrita SQL/publicação. Anexos/consolidado lidos; Graphify (`9e96cb5`) apenas orientou, código confirmou.

**49 testes dirigidos passaram, nove arquivos**; roundtrip do snapshot sem localStorage também passou. [PR 108](https://github.com/adm01-debug/Singu_V2/pull/108) e [PR 109](https://github.com/adm01-debug/Singu_V2/pull/109) mergeados; deploy e migrations confirmados separadamente, Preview do `main` falha pela divergência histórica de versões.

Base: snapshot, exceto PRs. Prefixos: **H**=`src/hooks/`, **C**=`src/components/`, **P**=`src/pages/`, **L**=`src/lib/`, **F**=`supabase/functions/`, **M**=`supabase/migrations/`, **T**=`src/integrations/supabase/types.ts`. SQL abreviado por timestamp único. Todos os itens têm **runtime não verificado**. Ausência de produtor/DDL versionado não comprova ausência remota.

## Matriz E — 101 IDs

| ID | Estado | Evidência atual | O que falta | Teste/aceite |
|---|---|---|---|---|
| E-T01, E-H07 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | H/useErpData.ts:32–53; F/external-data/index.ts:109–159 | Candidatos ERP não permitidos; erro agora explícito, não vazio; escopo Produtos/Propostas vetado no consolidado §10 | Decidir visualização ERP antes de liberar contratos |
| E-T02 | NÃO VERIFICADO NO RUNTIME | H/useRecommendationAudit.ts:25; T:ai_recommendation_audit_logs_v2; M/20260723150429:33,100 | Tipado agora; falta baseline e conferir ACL v2; RPC lê v1 | Usuário escreve/lê sua trilha; outro não |
| E-T03, E-F02 | AINDA REPRODUZÍVEL | C/admin/conexoes/IncomingWebhookFormDialog.tsx:30; F/incoming-webhook/index.ts:316 | Alvo `notes` sem contrato tipado/DDL encontrado | Retirar alvo ou ingestão persistir nota real |
| E-T04, E-P12 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | C/contact-detail/ContactCommercialTab.tsx:70–73; F/external-data/index.ts:109–159 | `purchase_history` fora da allowlist; ingestão de pedidos não versionada; Bitrix adiado | Histórico real e RFM monetário reconciliados |
| E-T05, E-T06 | AINDA REPRODUZÍVEL | F/external-data/index.ts:532–534; T:55362–55381,57778–57787 | Timeline/busca não expõem `user_id` | Consulta funciona isolada por proprietário |
| E-T07 | AINDA REPRODUZÍVEL | T:49581–49599; H/usePendingFollowups.ts:27 | Alertas/follow-ups/contatos sem apelido ainda conflitam; data-health/interações sem apelido já têm `user_id` | Cada widget retorna dados próprios ou erro explícito |
| E-T08 | AINDA REPRODUZÍVEL | T:email_logs,inactivity_alerts,vw_deals_full; F/external-data/index.ts:532 | Restam contratos sem `user_id`; NPS principal usa csat_surveys; atividades sem vínculo foram desativadas | Cards comerciais não falham nem misturam carteiras |
| E-T09, E-T10 | AINDA REPRODUZÍVEL | T:51663–51679, vw_eq_dashboard, vw_contacts_full; F/external-data/index.ts:532 | Escopo das views comportamentais/enriquecidas | Dois proprietários, nenhuma exposição cruzada |
| E-T11, E-T12 | AINDA REPRODUZÍVEL | T:vw_companies_stats,51056–51075; H/useCompanyViews.ts:62–69 | Views empresa/churn sem `user_id`; erro ainda pode virar ausência | KPIs/churn próprios; falha distinta de vazio |
| E-T13, E-T14, E-T16, E-T17 | NÃO VERIFICADO NO RUNTIME | M/20260723150429:22–100; consumidores nos anexos E-T13–T17 | REVOKE continua; conferir ACL/policies atuais antes de regrant mínimo ou endpoint admin | Catálogo e testes SELECT/escrita admin/vendedor |
| E-T15 | NÃO VERIFICADO NO RUNTIME | M/20260723150429:80–83; M/20261011150000:229 | RFM recebeu SELECT/INSERT; demais históricos precisam conferência ACL | Histórico de score/RFM persiste e isola |
| E-T18, E-T19, E-D03, E-D04 | NÃO VERIFICADO NO RUNTIME | H/useRodizioEquipe.ts:77,99; M/20261011195900:44–133; M/20261012040000:15–94 | Baseline avançou para relações de empresa/atividades, mas `users`, configuração e várias views seguem sem CREATE em migrations | Replay isolado + comparação do catálogo |
| E-R01 | AINDA REPRODUZÍVEL | H/useTasks.ts:238–243; F/external-data/index.ts:83–85 | `reopen_task` fora da allowlist; fallback não equivale à RPC | Reabrir pelo contrato e negar dono diferente |
| E-R02 | AINDA REPRODUZÍVEL | H/useCompanyActions.ts:10–12 × T:66968–66970 | `p_company_keep/p_company_remove` | Mesclagem sem PGRST202 e sem perda de vínculos |
| E-R03 | AINDA REPRODUZÍVEL | C/ficha-360/ProximaAcaoCTA.tsx:105–109 × T:61950–61957 | Contrato por contato/empresa correto | CTA registra a interação correta |
| E-R04 | AINDA REPRODUZÍVEL | C/pipeline/CreateDealWidget.tsx:17–21 × T:61825–61833 | `p_titulo/p_valor` | Widget cria título/valor corretos |
| E-R05 | AINDA REPRODUZÍVEL | H/useInteractionsRpc.ts:79–82; M/20261008120000:807 | Hook RPC sem consumidor envia `p_user_id`, não vendedor | Corrigir antes de ligar; widget vivo usa outro hook |
| E-R06, E-R07, E-R08 | NÃO VERIFICADO NO RUNTIME | H/usePipeline.ts:146–200; H/useReportsAnalytics.ts:99–313; H/useGamification.ts:76–159 | RPCs tipadas, mas definições citadas não versionadas | Replay e amostras de respostas por carteira |
| E-R09, E-R10, E-R11 | NÃO VERIFICADO NO RUNTIME | H/useCompanyIntelligence.ts:141–365; H/useContactIntelligence.ts:32; H/useCompleteDashboard.ts:37 | Parte das funções sem CREATE; emails têm reparo específico apenas no PR 108 | Catálogo/assinaturas/resultados com dois donos |
| E-R12, E-N04 | AINDA REPRODUZÍVEL | F/external-data/index.ts:85–100; C/dashboard/StrategicNextStepsCard.tsx:361 | Aprovação grava v2; RPCs aprovação/logs/território não ligadas à UI | Aprovação produz efeito observável, não só linha |
| E-R13 | NÃO VERIFICADO NO RUNTIME | F/external-data/index.ts:185–196,524–525 | Conferir identidade efetiva dos projetos sem expor secrets | JWT usuário respeita auth.uid; origem errada falha fechado |
| E-R14 | OBSOLETO/DUPLICADO | F/external-data/index.ts:20–101 | RPC permitida sem chamador não prova vulnerabilidade nem feature faltante | Revisar necessidade/autorizações, não apagar por contagem |
| E-F01 | AINDA REPRODUZÍVEL | L/pushNotifications.ts:4–6; F/send-push-notification/index.ts:44–52 | VAPID real/criptografia; JSON cru ainda enviado | Push recebido e autenticado no navegador |
| E-F03 | AINDA REPRODUZÍVEL | H/useEdgeFunctionActions.ts:15–22 | Resposta/erro tipados; toast genérico persiste | Erro acionável sem confundir falha com resultado |
| E-C01 | VALIDADO NO BANCO | PR 109 mergeado; T:442–477; H/useActivityLogger.ts:27–35 | `contact_id` reconhecido; migration aplicada e fixture de auditoria/autorização passou no banco; leitura/exclusão autenticadas na interface pendentes | Lista NULL+contagem; individual UUID; troca/renovação de conta |
| E-C02, E-C03 | AINDA REPRODUZÍVEL | H/useInboundActivityHeatmap.ts:75; H/useCrossReference.ts:42–48; H/useEntity360.ts:106–108; T:28486–28530 | `tipo`/`occurred_at` incompatíveis; cross-reference ignora erro | Heatmap/timeline usam colunas reais, falha explícita |
| E-C04 | OBSOLETO/DUPLICADO | T:28515; H/usePrefetch.ts:74–81 | `outcome` existe; prefetch agora verifica erro | Prefetch aquece cache sem esconder falha |
| E-C05 | AINDA REPRODUZÍVEL | H/useMetaprogramAnalysis.ts:98 × T:31670–31692 | Seis scores continuam ausentes na tabela consultada | Agregação consulta dimensões existentes |
| E-C06, E-H01, E-P16 | AINDA REPRODUZÍVEL | H/useSocialInsights.ts:48–86; M/20260720000023:95–105 | Select inválido cai em biografia fictícia; não há produtor versionado | Erro/vazio honesto; nenhum insight inventado |
| E-C07 | AINDA REPRODUZÍVEL | H/useCadenceEnrollments.ts:27; T:cadence_enrollments | Ordenar por `enrolled_at`, não `created_at` | Lista ordenada sem coluna inexistente |
| E-C08 | RESOLVIDO NO CÓDIGO | C/company-detail/CompanyCommercialTab.tsx:232–244; C/contact-detail/SalesActivitiesWidget.tsx:4–17 | Consulta insegura removida; vínculo real ainda não implementado | UI informa indisponibilidade; não atribui por nome |
| E-C09 | AINDA REPRODUZÍVEL | H/useCompanyIntelligence.ts:326 × T:51763–51779 | View usa `id`, não `company_id` | Duplicatas próprias realmente aparecem |
| E-C10 | NÃO VERIFICADO NO RUNTIME | H/usePipeline.ts:92–109; M/20260317213221:3; M/20260512184042:24 | Baseline canônico de deals; ALTERs parciais não bastam | Banco reconstruído aceita leitura/movimento |
| E-C11 | NÃO VERIFICADO NO RUNTIME | H/useContacts.ts:70–108 | Normalização/versão corrigidas; ainda provar paridade DDL/canônico | Replay aceita seleção e escrita sem campos gerados |
| E-H02 | AINDA REPRODUZÍVEL | H/useNLPClosingProbability.ts:19–30 | Fatores demonstrativos, não probabilidade calibrada | Remover inflação ou derivar de evidências |
| E-H03 | AINDA REPRODUZÍVEL | H/useDealVelocity.ts:66–85 | Velocidade aleatória e projeção fixa | Histórico real produz resultado reprodutível |
| E-H04 | AINDA REPRODUZÍVEL | H/useEmotionalIntelligence.ts:53,73 | Força de indicador sorteada | Mesmo conjunto de interações, mesmo score |
| E-H05 | AINDA REPRODUZÍVEL | H/useHiddenObjections.ts:30; painel inalcançável | Probabilidade aleatória em código não ligado | Não publicar essa análise como dado real |
| E-H06 | AINDA REPRODUZÍVEL | H/useClosingScoreRanking.ts:52–63 | Campos constantes aparentam análise inexistente | Origem verificável para tendência/contagem/fraqueza |
| E-H08 | AINDA REPRODUZÍVEL | H/useCompanyRelatedData.ts:91–99; H/useCompanyViews.ts:62–69 | Erro continua virando lista/null nesses hooks | Falha não renderiza “sem dados” |
| E-H09 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | src/domain/demoEntities.ts:1–5; C/nlp/MiltonianCalibration.tsx:179 | Distinguir treinamento demonstrativo de análise de cliente | Demo identificada ou estado sem contato |
| E-H10 | AINDA REPRODUZÍVEL | L/rodizioRpc.ts:42–60; T:rodizio_sugerir_distribuicao | Tipos existem, mas helper mantém RPC dinâmica sem validar argumentos | Assinatura incorreta deve reprovar typecheck |
| E-H11 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | src/stores/useProntidaoWeightsStore.ts:31,54 e stores irmãos | Preferências apenas locais; decidir sincronização por usuário | Configuração preservada conforme política escolhida |
| E-H12, E-M13 | AINDA REPRODUZÍVEL | src/domain/dealState.ts:7–15; domínio/stores/data sem alcance de main | Enum `ed` e módulos órfãos; dívida sem impacto vivo confirmado | Remover ou integrar com contrato/teste real |
| E-M01, E-M02, E-P17 | AINDA REPRODUZÍVEL | H/useApproachRecommendation.ts; H/useCognitiveBiasPersistence.ts:93; C/analytics/CognitiveBiasesPanel.tsx:25–38 | Painéis inalcançáveis; único escritor do histórico não vivo | Painel acessível e persistência por conteúdo |
| E-M03, E-M04 | AINDA REPRODUZÍVEL | C/admin/conexoes/WebhookDlqPanel.tsx; C/triggers/SmartTemplateSuggestions.tsx | Painéis DLQ/anomalias/templates/descoberta inalcançáveis | Acesso real; não pedir chaves adiadas |
| E-M05, E-P18 | AINDA REPRODUZÍVEL | H/useCommunicationPreferences.ts:34,41 | Único escritor sem consumidor vivo | Formulário salva e leitura recupera preferência |
| E-M06, E-P10 | AINDA REPRODUZÍVEL | H/useRBAC.tsx:13,38; P/RolePermissionsPage.tsx:16 | RBAC granular/role_permissions não ligado; RBAC básico não confundido | Permissão por papel aplicada e testada |
| E-M07 | AINDA REPRODUZÍVEL | H/useFeatureFlag.ts:15; P/admin/FeatureFlagsPage.tsx:7 | Só administração usa lista; flag não governa feature | Alternar flag altera rollout correspondente |
| E-M08 | AINDA REPRODUZÍVEL | H/usePipeline.ts:121; H/useTasks.ts:256; H/useInteractionsRpc.ts:72,90 | Resumo/soneca/conclusão RPC sem consumidores | Ações acessíveis; assinatura validada |
| E-M09 | AINDA REPRODUZÍVEL | H/useMQL.ts:103; H/useNurturingExecutions.ts:38; H/useAttribution.ts:74; H/useIntent.ts:203 | MQL/inscrição/touchpoint/sinal/resultados finder sem consumidores | Gatilhos de UI ou automação verificáveis |
| E-M10 | AINDA REPRODUZÍVEL | H/useRevOps.ts:65; H/useForecasting.ts:119; H/useCustomerSuccess.ts:194,296,378 | Histórico/fechamento/QBR/renovação não ligados | Operações e histórico acessíveis |
| E-M11 | AINDA REPRODUZÍVEL | H/useABM.ts:156,176; H/useDealRooms.ts:176,195; H/useWinLoss.ts:142 | Exports CRUD/vínculos/logs sem consumidores | Editar/excluir com autorização e feedback |
| E-M12, E-P06 | AINDA REPRODUZÍVEL | H/useLeadScore.ts:268,380; H/useCompanyActions.ts:26; H/useSearchContactsView.ts:15 | Exports utilitários/config/export sem uso; busca tem import só de tipo | Ligar recurso necessário; não contar type-import como execução |
| E-P01, E-P03, E-P04, E-P05 | NÃO VERIFICADO NO RUNTIME | H/useAutomationRules.ts:124; H/useNLPAnalyticsData.ts:84–85; H/useDISCConversionMetrics.ts:18; C/contact-detail/ContactBehavioralTab.tsx:78 | Sem escritores vivos versionados para logs/valores/critérios/DISC/EQ/objeções | Identificar produtor remoto ou produzir/persistir com isolamento |
| E-P02, E-P13 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | H/useUnifiedHistory.ts:131; H/useWhatsAppData.ts:14; C/whatsapp/WhatsAppDashboard.tsx:23 | Telefonia/WhatsApp e agregação sem produtor versionado | Entrega adiada sem Twilio/Evolution; não alegar validação |
| E-P07, E-P08, E-P09, E-P11, E-P14 | NÃO VERIFICADO NO RUNTIME | H/useMarketingInsights.ts:120; H/useUnifiedTimeline.ts:66; H/useRFMSegmentConfig.ts:13–18; H/useTriggerAnalytics.ts:13–25; H/useContactTimeAnalysis.ts:27 | Campanhas/neuro/RFM/gatilhos/horários sem produtor versionado; erros RFM ignorados | Evidenciar produtor e dado calculado, não inferir vazio remoto |
| E-P15 | NÃO VERIFICADO NO RUNTIME | H/useCadenceEnrollments.ts:24; H/useChurnRisk.ts:65; H/useContactEmailLogs.ts:26 | Conferir produtores canônicos; atividades sem vínculo estão explicitamente indisponíveis | Registro real percorre produtor→card próprio |
| E-N01 | AINDA REPRODUZÍVEL | L/externalData.ts:150,271; H/useActivityLogger.ts:27; PR 109 | Compatibilidade corrigida no código; nenhuma leitura de activities no fluxo versionado | Trilha consultável e identificação correta do acesso |
| E-N02 | AINDA REPRODUZÍVEL | C/contact-detail/MetricOverrideFlow.tsx:49 | Override escrito sem consumidor nos cálculos | Recalcular usa override auditado |
| E-N03 | NÃO VERIFICADO NO RUNTIME | C/crm/CRMAutomationAuditLog.tsx:72; M/20260509175700 | Fila criada/alimentada sem worker versionado | Reprocesso avança ou falha explicitamente; conferir worker remoto |
| E-D01, E-D02, E-D05, E-D06 | RESOLVIDO NO CÓDIGO | T:61825–61957,66968–66974; package.json:typecheck; .github/workflows/ci.yml:69–70 | Tipos canônicos/typecheck real entregues; casts/drift/strict continuam questões separadas | Gate verifica app/node; comparar schema automaticamente |
| E-D07 | AINDA REPRODUZÍVEL | supabase/config.toml:1 × URL canônica confirmada | Ref local antiga ainda diferente; não prova runtime errado | Ferramentas/deploy miram pgxfvjmuubtbowutlide |

## Matriz B1 — 117 IDs

| ID | Estado | Evidência atual | O que falta | Teste/aceite |
|---|---|---|---|---|
| C01, X06 | AINDA REPRODUZÍVEL | H/useTeamDashboard.ts:25–54 | Equipe antiga; `value/stage` incompatíveis; erros ignorados | Gestor vê equipe/valores reais, não zeros por falha |
| C02, C03 | RESOLVIDO NO CÓDIGO | H/useCompanyProfileAnalytics.ts:107–112; H/usePipeline.ts:219; M/20261006130000:321–350 | Banco único/movimento atômico implementados; runtime e baseline pendentes | Analytics e drag persistem na mesma carteira |
| C04 | OBSOLETO/DUPLICADO | M/20260712215719:90–128; T:entity_relationships | Trigger já valida FROM/TO; tese “nenhuma validação” refutada; tipos agora existem | Confirmar trigger remoto e rejeição de ID inexistente |
| C05 | AINDA REPRODUZÍVEL | H/useDedupEngine.ts:63–84; PR 108 | Teto 2000 permanece; emails relacionais corrigidos só no PR | Duplicata além do limite também detectada |
| C06 | AINDA REPRODUZÍVEL | H/useMergeRecords.ts:46–66 | Transação não cobre caminho da deduplicação | Falha intermediária deixa zero mudança parcial |
| C07, C18 | AINDA REPRODUZÍVEL | H/useTasks.ts:238–243 | Mesmo E-R01: RPC barrada, fallback persiste | Reabertura autorizada pelo contrato |
| C08, C17 | AINDA REPRODUZÍVEL | H/useNotifications.ts:313–334; H/useUnifiedNotifications.ts:30–49 | Sino lê outras fontes, não `notifications`; dedupe local | Notificação persistida/deduplicada entre dispositivos |
| C09 | AINDA REPRODUZÍVEL | P/Configuracoes.tsx:46–48; P/configuracoes/ConfigNotificationsTab.tsx:47–50 | Quatro toggles apenas em memória | Recarregar mantém opção e produtor a respeita |
| C10 | AINDA REPRODUZÍVEL | H/useDocumentTemplates.ts:190–214 | Gera registro/link, mas anuncia envio sem entrega | Mensagem honesta ou aceite do provedor |
| C11, C16 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | H/useErpData.ts:32–53; consolidado §10 | Mesmo E-T01; erro silencioso corrigido, contrato ERP não | Decisão de escopo precede integração |
| C12, R16 | AINDA REPRODUZÍVEL | F/enrich-contacts/index.ts; ausência de chamadores de produção | Enriquecedor órfão; não confundir existência com uso | Ligar/remover por escopo; IA runtime adiada |
| C13, C14 | NÃO VERIFICADO NO RUNTIME | F/check-notifications/index.ts:15; F/client-notifications/index.ts:23 | Nenhum agendamento versionado dessas EFs; catálogo remoto desconhecido | Job autorizado executa lembrete real |
| C15 | NÃO VERIFICADO NO RUNTIME | M/20260317213221:3; M/20260512184042:24; M/20261011125900 | Mesmo E-C10: schema deals ainda não consolidado | Replay reproduz Pipeline |
| I01 | AINDA REPRODUZÍVEL | P/Insights.tsx:90–114; H/useYourDay.ts:79 | Geração só atualiza estado; ausência de INSERT versionado em insights | Resultado persistido alimenta feed após recarga |
| I02 | NÃO VERIFICADO NO RUNTIME | H/useRecommendationAudit.ts:25; T:ai_recommendation_audit_logs_v2 | Mesmo E-T02; existência tipada não prova grants/baseline | Trilha IA própria reproduzível |
| I03 | AINDA REPRODUZÍVEL | P/CRMRelationshipAuditPage.tsx:47–64,88 | Limite 100 agora declarado; segue sem paginação/histórico | Carteira inteira auditável sem N RPCs por contato |
| I04, I07, I08, I09, I22 | AINDA REPRODUZÍVEL | H/useEmotionalIntelligence.ts:53,73; C/nlp/MetaProgramsProfiler.tsx:12–27; C/carnegie/CarnegieDashboard.tsx:43; C/nlp/CommunicationCoherencePanel.tsx:91,153 | Scores/random/hash/demo persistem em telas de análise | Evidência reprodutível ou treinamento explicitamente identificado |
| I05 | AINDA REPRODUZÍVEL | H/useCognitiveBiases.ts:79; C/analytics/CognitiveBiasesPanel.tsx:25–38 | Keyword_match honesto, mas painel morto e salva por contagem | Mudança de conteúdo persiste; não prometer análise semântica |
| I06 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | C/nlp/NLPMasteryScore.tsx:13–17 | Fake removido; metodologia de maestria indefinida | Método aprovado antes de exibir score |
| I10 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | C/search/VisualSearchButton.tsx; consolidado §10 | Botão órfão busca produtos, escopo explicitamente vetado | Não integrar sem decisão de escopo |
| I11 | NÃO VERIFICADO NO RUNTIME | F/conversation-coaching-digest/index.ts:12 | Sem chamador/agendamento versionado; IA adiada | Origem de execução e digest verificáveis |
| I12, I13, I14, X01, X02, X03, X04 | AINDA REPRODUZÍVEL | F/generate-behavioral-profile/index.ts:54–55; F/retry-behavioral-profile/index.ts:16; F/social-events-detector/index.ts:35; F/sync-social-interests/index.ts:9 | Guarda bloqueia UI/internos; geração IA continua adiada sem chave | Autorização manual/interna correta; usuário não envia segredo de cron |
| I15 | RESOLVIDO NO CÓDIGO | M/20260719000002:59–63 | Índice versionado; aplicação remota não conferida | Catálogo confirma índice válido |
| I16 | AINDA REPRODUZÍVEL | H/voice/logVoiceCommand.ts:17–22 | Só log local; sem persistência de comandos | Evento medível no painel; voz remota adiada |
| I17, I18 | AINDA REPRODUZÍVEL | P/crm/CopywritingEnterprise.tsx:4–6; F/demand-forecast/index.ts:123 | Abas IA não ligadas; previsão não persistida nem baseada em receita | Rota correta e previsão com histórico; IA runtime adiada |
| I19, I21 | OBSOLETO/DUPLICADO | F/_shared/aiGatewayLogger.ts sem import; C/ficha-360/ScoreProntidaoCard.tsx importa domínio | Logger redundante; domínio não tem obrigação de ser backend IA | Não transformar código isolado em defeito de produção |
| I20 | AINDA REPRODUZÍVEL | C/ai/AIMessageGenerator.tsx sem alcance de main | Componente não montado | Acesso real se feature mantida; IA adiada |
| I23 | NÃO VERIFICADO NO RUNTIME | H/useCompatibilityAlerts.ts:147–150; P/Index.tsx:63 | Há produtor no cliente; job servidor não versionado | Alerta produzido sem depender de abertura do dashboard |
| I24 | OBSOLETO/DUPLICADO | L/intelSnapshot.ts:39–49,85–89; P/Intelligence.tsx:107–162 | Tese “link não abre sem banco” refutada: payload está na URL; histórico/telemetria seguem locais | Abrir link em outro dispositivo; sync só se produto exigir |
| M01, M02, M03 | NÃO VERIFICADO NO RUNTIME | H/useAutomationRules.ts:105–213; C/crm/CadenceRulesConfig.tsx:71–117; T:evaluate_automation_rules | Executor genérico não versionado; função canônica tipada não revela execução/cron | Identificar motor remoto antes de implementar duplicado |
| M04, M06, M13, R03, R04 | AINDA REPRODUZÍVEL | H/useSequenceProcessor.ts:9; F/sequence-processor/index.ts:54; F/nurturing-runner/index.ts:22; F/revops-snapshot-builder/index.ts:20 | Botões sem segredo são bloqueados; agendamento remoto não verificado | Ação manual autorizada, usuário só opera sua carteira |
| M05, M11, M12, M29, R02, R14 | AINDA REPRODUZÍVEL | H/useSequences.ts:170–194; H/useNurturingExecutions.ts:38; H/useMQL.ts:103; M/20261011210827 | Inscrição sequência já atômica; inscrição manual/MQL seguem sem gatilho vivo | Inscrever e classificar lead; topo RevOps recebe classificação |
| M07, M08, M09, M14 | AINDA REPRODUZÍVEL | F/sequence-processor/index.ts:321–359; F/nurturing-runner/index.ts:91–132 | `sent` antes de entrega; EF email ausente; pixel sem injeção; nurturing só tenta inserir interação | Sem aceite, não gravar envio; eventos abertura/clique reais |
| M10, M15 | AINDA REPRODUZÍVEL | F/sequence-processor/index.ts:359; F/nurturing-runner/index.ts:145 | RPCs contadoras sem CREATE e `.catch` inexistente no builder | Contadores corretos sem TypeError |
| M16, M17, M18 | AINDA REPRODUZÍVEL | H/useEmailCampaigns.ts:85–145,157–159 | Falso “enviado” corrigido; permanece preparo pending sem provedor/tracking | Destinatários pendentes até aceite; taxas por eventos reais |
| M19, M20 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | H/useSmsCampaigns.ts:106; F/send-sms-campaign/index.ts:27 | Twilio adiado; guarda incompatível continua no código | Não pedir chave nem afirmar envio validado |
| M21, M28 | AINDA REPRODUZÍVEL | P/PublicLandingPage.tsx:106–118; M/20260417011613:250; H/useForms.ts:25 | Submissão não converte contato no fluxo versionado; workflow não usado pela RPC | Uma submissão cria contato deduplicado e inscrição esperada |
| M22, M23, M24, M25, M26 | AINDA REPRODUZÍVEL | P/MarketingHub.tsx:51–150,199–203,254–262,302 | JSX descartado; conteúdo dentro TabsList; custos/progresso fixos | Segmentação visível; métricas calculadas ou indisponíveis |
| M27 | RESOLVIDO NO CÓDIGO | H/useMarketingInsights.ts:41–45; M/20261006130000:56,443 | Funil com escopo/grant versionados; runtime pendente | Agregados próprios consistentes com base |
| M30 | AINDA REPRODUZÍVEL | P/MarketingHub.tsx:509–536; H/useAttribution.ts:74 | Grant restaurado; UX UUID e touchpoints sequência não ligados | Selecionar deal; sequência recebe crédito verificável |
| M31, M32 | AINDA REPRODUZÍVEL | P/ReportBuilder.tsx:45,76,90; H/useSavedReports.ts:25,38 | Widgets placeholder; definições apenas locais | Relatório real; persistência/compartilhamento conforme escopo |
| M33, M34 | AINDA REPRODUZÍVEL | H/useBIAdvanced.ts:69–70; C/bi/EmbeddableDashboards.tsx:37,120; src/app/AppRoutes.tsx | Rentabilidade zerada por constante; rota embed inexistente | Valores dos deals; iframe autorizado sem 404 |
| M35, R01, R10, R12, R13, R18 | NÃO VERIFICADO NO RUNTIME | H/useIntent.ts:189; F/forecast-snapshot-cron/index.ts:8; F/lead-score-cron/index.ts:10; F/cs-health-recalc/index.ts:7 | Rotinas/fila sem scheduler versionado; estado cron remoto desconhecido | Catálogo + execução periódica e fila drenada |
| M36, M37 | AINDA REPRODUZÍVEL | F/weekly-digest/index.ts:31,194–206,226; F/template-success-notifications/index.ts:33 | Digest registra last_sent sem entrega; chamador templates barrado | Gerado ≠ entregue; acionamento autorizado |
| M38, M42, M43, M44 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | F/smart-notify/index.ts:10; F/firecrawl-scrape/index.ts; F/incoming-webhook/index.ts:181–186; F/bitrix24-webhook/index.ts:40 | Evolution/Firecrawl/Bitrix adiados; HMAC/middleware obrigatório preservado | Sem pedidos de secrets; nenhuma alegação de integração validada |
| M39 (EnrichLayer) | NÃO VERIFICADO NO RUNTIME | H/useEdgeFunctionActions.ts:46–47; H/useEnrichSocialProfiles.ts:60–64; F/enrichlayer-linkedin/index.ts:89 exige `ENRICHLAYER_API_KEY` | Verificar chave, publicação e execução do enriquecimento separadamente de Firecrawl | Solicitação autenticada produz perfil real ou erro explícito |
| M40 | NÃO VERIFICADO NO RUNTIME | M/20260417120721:14–24; F/validation-queue-worker/index.ts:24 | Agendamento versionado antigo/ref divergente, sem header esperado; catálogo remoto não lido | Job canônico autenticado; não mostrar JWT histórico |
| M41 | NÃO VERIFICADO NO RUNTIME | F/lux-trigger/index.ts:151–166; F/lux-webhook/index.ts:18 | n8n externo não inspecionado | Ida/volta rastreável sem duplicação |
| R05 | AINDA REPRODUZÍVEL | H/useRevOps.ts:65 sem consumidor | Histórico não montado | Série temporal visível |
| R06, R07, R08 | AINDA REPRODUZÍVEL | C/win-loss/WinLossCaptureDialog.tsx inalcançável; H/useWinLoss.ts:126; F/win-loss-record-deal/index.ts:61 | Produtores existem, mas fechamento do Pipeline não os chama | Ganho/perda gera registro único com motivo |
| R09 | AINDA REPRODUZÍVEL | H/useABM.ts:84,420–422; P/ABMCampaigns.tsx | Metrics não coletadas/renderizadas | Campanha exibe resultados mensurados |
| R11 | RESOLVIDO NO CÓDIGO | H/useLeadScoring.ts:7,87,113; F/_shared/lead-score-contract.ts:1–22 | A–D normalizados com cold/warm/hot/on_fire | Distribuição A/B/C/D correta; teste dirigido passou |
| R15, R22, R24 | OBSOLETO/DUPLICADO | M/20260924213115:39–42; P/Performance.tsx; M/20261006130000:428–446 | Reset substituído; fake PNL retirado; attribution EF redundante após regrant | Não restaurar botão/fake; provar cron/atribuição separadamente |
| R17, R25 | AINDA REPRODUZÍVEL | C/playbooks/PlaybookSuggestionDrawer.tsx; C/lead-scoring/LeadScoreCard.tsx sem alcance de main | Componentes não montados; prioridade baixa, não defeito produtivo provado | Integrar apenas feature mantida |
| R19, R21 | AINDA REPRODUZÍVEL | H/useTerritories.ts:41–49; H/useGamification.ts:76–79 | Falha RPC vira vazio; CREATEs de leitura/metas não encontrados | Mostrar erro; validar catálogo e carteira |
| R20 | AINDA REPRODUZÍVEL | F/territory-optimization/index.ts:211–230; H/useTerritoryOptimization.ts:70–90 | Service role externa, retorno EMPTY por erro, sem persistência | Escopo autorizado, erro explícito, recomendação recuperável |
| R23 | AINDA REPRODUZÍVEL | P/Analytics.tsx:82–91; src/data/analyticsData.ts:171–177 | Ranking/Overview inventados | Dados próprios ou demonstração explícita |
| X05 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | C/lead-routing/QuickDistributeWidget.tsx:15–24 | Lead avulso retirado por desenho de ondas | Negócio decide; não reintroduzir automaticamente |

## Pendências não verificadas

Não verificados: catálogo SQL, grants/policies/constraints/cron/produtores; publicação permanente; tráfego Vercel/UI autenticada. Rollback não é publicação. LOVABLE_API_KEY, Evolution/WhatsApp, Bitrix, ElevenLabs, Firecrawl e Twilio adiados pelo usuário. Rotação do PAT/senha continua ação do usuário; nenhuma credencial consultada.


---
