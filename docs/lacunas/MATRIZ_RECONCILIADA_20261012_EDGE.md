# Edge Functions

[Voltar ao índice da matriz reconciliada](MATRIZ_RECONCILIADA_20261012.md)


**Origem:** docs/auditoria/02_ACHADOS_EDGE_FUNCTIONS.md; docs/lacunas/F_edge_functions.md.

## Reconciliação — unidade edge

**Base:** `a2b73c7dee837f19aa756e6afe385eba837b5d54`. Documentos/Graphify consultados, código conferido. Checkout limpo; sem alterações versionadas/deploy/escrita SQL.

## Lacunas graves e tarefas concretas

1. **Cron/autenticação:** 23 guards obrigatórios continuam; frontend/migrations não contêm `x-cron-secret`. Dois agendamentos históricos usam refs diferentes do canônico; `config.toml:1` também diverge. Corrigir contratos manual/cron separadamente, destinos e jobs, sem colocar segredo no navegador. Aceite: job canônico autenticado e execução manual autorizada por proprietário; usuário comum não dispara processamento global.
2. **Falhas após efeitos colaterais:** `.catch()` diretamente no builder Supabase permanece em assistente, assinatura, validação, buscas e outros caminhos. Reproduzido localmente: builder tem `then`, mas não `catch`. Corrigir gravações obrigatórias/auxiliares distintamente; testar retorno sem perder erro obrigatório e retries sem duplicação. Não declarar o padrão inteiro resolvido pelo PR já mergeado.
3. **Filas:** validation/regen possuem claims atômicos, mas nurturing/sequence/DLQ continuam concorrentes; validation não tem lease recuperável; upserts parciais omitem `NOT NULL`. Corrigir transições condicionais, resultados persistidos e recuperação após interrupção. Aceite: dois workers, falha depois do efeito externo e reinício sem repetição/perda.
4. **Entrega versus registro:** campanha deixou de fingir envio, e smart-notify deixou de simular e-mail; sequência ainda marca `sent` antes de invocar função inexistente; digest/alertas/nurturing não comprovam entrega. Push continua sem VAPID/criptografia. Manter indisponibilidade explícita até integração real, sem converter registro no banco em entrega.
5. **CORS remoto divergente:** OPTIONS canônico/Vercel retornou 200: external-data/smart-notify refletem Vercel; get-signature/intent-tracker/evolution-webhook devolvem Lovable, bloqueando esses preflights. Reconciliar artefato/deploy e respostas efetivas; não deduzir versão implantada.
6. **MFA/admin:** AAL1 redireciona para `/seguranca` também protegida, podendo renderizar vazio. Corrigir elevação sem remover AAL2; testar inscrito/não inscrito/renovação.

**Provas:** 12 testes Deno + 10 Node e gates imports/CORS passaram. Import `npm:@supabase/supabase-js@2/cors` resolveu. Não provam cobertura/deploy/entrega. Management API:401; sem SQL remoto.

## Como ler a matriz

RC = **RESOLVIDO NO CÓDIGO**; PR = **CORRIGIDO EM PR ABERTO**; AR = **AINDA REPRODUZÍVEL**; NR = **NÃO VERIFICADO NO RUNTIME**; OD = **OBSOLETO/DUPLICADO**; AD = **DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA**.

`EF` identifica auditoria; `F/` identifica lacunas F; `B/` identifica B2; `INV/` preserva as 108 linhas do inventário. Intervalos incluem cada ID. Evidências `função:linhas` significam `supabase/functions/função/index.ts`; `_shared/...` usa o mesmo prefixo. RC nunca significa produção comprovada. Linhas parciais preservam o defeito remanescente explicitamente.

Heads [108](https://github.com/adm01-debug/Singu_V2/pull/108)/[109](https://github.com/adm01-debug/Singu_V2/pull/109) conferidos: não alteram Edge Functions nem corrigem EF-11/cron/entrega. Rollback não prova aplicação permanente; nenhum ID recebeu PR por associação indireta.

### Auditoria EF-1–EF-17

| ID | Estado | Evidência atual | Falta | Aceite |
|---|---|---|---|---|
| EF-1 | RESOLVIDO NO CÓDIGO | evolution-webhook:75–79 sem referência indefinida | Deploy/fluxo real NR; outros bugs F/F28 | Caminho de sucesso sem ReferenceError |
| EF-2,INV/106 | RESOLVIDO NO CÓDIGO | whatsapp-import:1–4 usa helpers locais | Deploy NR | Import/boot e importação autenticada |
| EF-3 | AINDA REPRODUZÍVEL | _shared/fetch-utils.ts existe; lux-trigger:14–22,155–170 já aplica timeout em cada tentativa; evolution-bitrix-connector mantém chamadas sem deadline | Cobrir apenas as chamadas restantes | Provedor travado termina em prazo limitado |
| EF-4 | AINDA REPRODUZÍVEL | evolution-webhook:20 exige segredo; :150–155,177–183 escolhe primeiro perfil | Remover fallback cross-owner; integração AD | Instância sem dono é rejeitada, sem atribuição arbitrária |
| EF-5 | AINDA REPRODUZÍVEL | nurturing-runner:75–78,143–145 chama RPC ausente | Antigo contador=1/duplo incremento mudou; contador continua sem contrato | Duas conclusões incrementam exatamente duas vezes |
| EF-6 | AINDA REPRODUZÍVEL | validation:38–39/regen:27–28 têm RPC; DLQ:43–73/nurturing:33–38/sequence:66–90 não | Claims parcialmente resolvidos; deploy NR | Dois workers reivindicam lotes disjuntos |
| EF-7 | AINDA REPRODUZÍVEL | send-sms-campaign:67–101,135–164; agora fetchAPI | Claim, paginação, persistência; Twilio AD | Lote grande sem duplicação/interrupção presa |
| EF-8 | AINDA REPRODUZÍVEL | process-webhook-dlq:117–120 | Alvo desconhecido não pode virar sucesso | Alvo inválido falha/quarentena sem inserção |
| EF-9 | OBSOLETO/DUPLICADO | migration 20260712221610:2–4 define contact_id como PK | Não assumir múltiplas linhas por contato; lease ainda merece teste | Unicidade e atualização concorrente preservadas |
| EF-10 | AINDA REPRODUZÍVEL | claim_validation_batch em 20260720000002:12–35 só seleciona pending | Lease/reclaim processing | Morte do worker não bloqueia item para sempre |
| EF-11,INV/46 | AINDA REPRODUZÍVEL | external-data:471–474 retorna jsonOk(error); :435–452 mascara batch_distinct | Seleção comum agora falha corretamente; RPC/batch ainda HTTP200 | Falha RPC não é sucesso nem lista vazia |
| EF-12 | AINDA REPRODUZÍVEL | lead-score-cron:23; forecast-snapshot-cron:14–51 | Paginação/erros/valores inválidos; null numérico não implica NaN necessariamente | >1000 registros, erro DB e número inválido explícitos |
| EF-13 | AINDA REPRODUZÍVEL | next-best-action:124–126/abm-whitespace-analyzer:88–91 divergem | Há guards; JSON inválido/contrato sem validação uniforme; IA AD | Ausência/malformação não gera resultado falso |
| EF-14 | AINDA REPRODUZÍVEL | evolution-webhook:532–536 usa avatar IS NOT NULL | Alinhar intenção/filtro; integração AD | Atualizar só avatar elegível |
| EF-15 | RESOLVIDO NO CÓDIGO | Helpers scoped; gates imports/CORS passaram | Restam contratos específicos e drift remoto F/S7 | Preflight e resposta de cada rota coerentes |
| EF-16,INV/13 | AINDA REPRODUZÍVEL | bulk-revalidate:71–76 limit(5000), :119 cappedAt só do lote | Paginar universo/avisar truncamento | Contato elegível além do teto é encontrado |
| EF-17 | AINDA REPRODUZÍVEL | evolution-webhook:348–372 usa tarefas assíncronas não aguardadas | Persistir/aguardar trabalho crítico; integração AD | Encerrar request não perde transcrição/análise |

### Lacunas F: causas sistêmicas

| ID | Estado | Evidência atual | Falta | Aceite |
|---|---|---|---|---|
| F/S1 | AINDA REPRODUZÍVEL | ai-assistant:195; get-signature:89; teste builder | Correções pontuais não abrangem todas as funções | Nenhum TypeError em gravação auxiliar |
| F/S2 | AINDA REPRODUZÍVEL | _shared/auth.ts:239–249; generate-behavioral-profile:54 | Auth manual/cron e downstream consistente | JWT autorizado ou cron correto, sem segredo no cliente |
| F/S3 | NÃO VERIFICADO NO RUNTIME | B2 §8; nenhum header cron em migrations/src | Ler cron.job/histórico canônico; ausência Git não prova ausência remota | Jobs, horários, destino e resultados registrados |
| F/S4 | AINDA REPRODUZÍVEL | validation:99–100/regen:101/sequence:244–253; DDL NOT NULL | UPDATE por chave em vez de inserts incompletos | Resultados persistidos com falha DB explícita |
| F/S5 | AINDA REPRODUZÍVEL | sequence:331–346; weekly-digest:204–207 | Provedor ausente; bloquear sucesso falso | sent só após confirmação, falha recuperável |
| F/S6 | AINDA REPRODUZÍVEL | send-push-notification:32–52; pushNotifications.ts:4–6 | VAPID/criptografia/subscrição real | Dispositivo recebe payload autenticado |
| F/S7 | AINDA REPRODUZÍVEL | config.toml:1 sem blocos; deploy-all.sh:66–100 | Versionar política verify_jwt e destino; runtime NR | Deploy reproduz política, endpoints públicos funcionam sem abrir os privados |
| F/S8 | AINDA REPRODUZÍVEL | evolution-webhook:20/lux-webhook:18/bitrix24-webhook:40 | Inventário/header/nome compatíveis; integrações AD | Configuração documentada sem valores expostos |

### Lacunas F01–F68 e inventário correspondente

| ID | Estado | Evidência atual | Falta | Aceite |
|---|---|---|---|---|
| F/F01,INV/1 | AINDA REPRODUZÍVEL | abm-account-scorer:111–129 | Dimensões fixas/upsert incompleto | Score calculado e persistido |
| F/F02,F/F11,F/F14,F/F17,F/F18,F/F21,F/F22,F/F29,F/F32,F/F38,F/F39,F/F44,F/F49,F/F63,F/F65,F/F67,INV/3,INV/19,INV/23,INV/27,INV/31,INV/36,INV/39,INV/47,INV/56,INV/67,INV/68,INV/75,INV/83,INV/99,INV/104,INV/107 | AINDA REPRODUZÍVEL | respectivamente ai-assistant:195;connection-introspect:135;conversational-search:239;deal-room-health:97;detect-new-device:57,83;email-finder:87;email-verifier:55;ficha360-conversation-summary:240;get-signature:61,89;lux-webhook:130;mcp-server:220,230;phone-validator:102;semantic-search:224;validate-access:63,82;voice-to-text:145;win-loss-analyzer:208 | Builders sem catch; alguns têm schema/auth adicionais | Sucesso/erro DB e retry sem falso 500/duplicação |
| F/F03,INV/8 | OBSOLETO/DUPLICADO | useAttribution.ts:61 usa compute_attribution | EF redundante; runtime da RPC NR | Marketing consome RPC autorizada |
| F/F04,F/F13,F/F33,F/F68,INV/9,INV/22,INV/58,INV/108 | OBSOLETO/DUPLICADO | audit-analytics:34–42;conversation-coaching-digest:12;health-aggregate:173;win-loss-record-deal:59–73 | Superfícies sem chamador/duplicadas; não apagar por grep apenas | Dono/consumidor ou aposentadoria deliberada |
| F/F05,F/F06,F/F31,F/F45,F/F47,INV/10,INV/11,INV/53,INV/78,INV/80 | AINDA REPRODUZÍVEL | auto-rebatch:35,44–59,125;auto-regen:15,134–168;generate-behavioral-profile:54,260;regen:50–58,101;retry:16,119–126 | Auth incompatível, persistência incompleta; IA AD | Fluxo autorizado ponta a ponta sem 401 interno |
| F/F07,F/F26,F/F27,F/F28,INV/12,INV/43,INV/44,INV/45 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | bitrix24-webhook:40,110–114;evolution-api:46;connector:16,134–150;evolution-webhook:20,327 | Bitrix/Evolution adiados; continuam header/schema/dono/catch; evolution-api sem papel admin | Se reativar: tenant correto e ações administrativas restritas |
| F/F08,F/F09,F/F10,F/F30,F/F35,F/F48,F/F61,F/F66,INV/14,INV/15,INV/17,INV/51,INV/63,INV/81,INV/97,INV/105 | AINDA REPRODUZÍVEL | guards check-health:107;check-notifications:15;client-notifications:23;forecast:8;lead-score:10;revops:20;template:33;weekly:31 | Agendamento NR; email simulado/last_sent sem entrega e push anon permanecem | Execução autorizada, efeitos verdadeiros, indisponibilidade explícita |
| F/F12,INV/21 | AINDA REPRODUZÍVEL | conversation-analyzer:41,45 | duration_seconds não existe em interactions canônicas | Interação existente não vira 404 de schema |
| F/F15,INV/24 | AINDA REPRODUZÍVEL | crm-automation-monitor:49,63 usa bestEffortWrite, mas não há chamador conhecido para alimentar o widget | Ligar o monitor ao produtor ou remover a promessa | Gravação auxiliar sem TypeError e widget alimentado |
| F/F16,F/F23,INV/25,INV/40 | AINDA REPRODUZÍVEL | cs-health-recalc:99–105;enrich-contacts:152–155 | Upsert omite campos obrigatórios; enriquecimento ainda órfão | Atualizar existente sem inserir linha incompleta |
| F/F19,INV/32 | AINDA REPRODUZÍVEL | disc-analyzer:267,282 usa bestEffortWrite, mas evolution-webhook:419–428 chama com service-role um handler que exige JWT de usuário | Autorizar a chamada interna com escopo comprovado; IA AD | Chamada interna autorizada sem acesso cruzado |
| F/F20,INV/33 | AINDA REPRODUZÍVEL | dual-write-proxy:2,37–41 falha fechado, mas não existe consumidor de x-dual-write-secret | Ligar produtor comprovado; reparar kill-switch B/N04 | Escrita canônica espelhada no cutover autorizado |
| F/F24,INV/41 | RESOLVIDO NO CÓDIGO | enrichlayer-linkedin:146 aguarda builder | Deploy/provedor NR | Perfil persiste ou erro explícito |
| F/F25,INV/42 | AINDA REPRODUZÍVEL | error-budget:141;useErrorBudget.ts:58 | Sem amostra assume 100%; cadência remota NR | Falta de amostra exibida como desconhecida |
| F/F34,INV/62 | AINDA REPRODUZÍVEL | intent-tracker:27,72,123; preflight remoto Lovable | Origem/assinatura e catch; não basta liberar Vercel para sites clientes | Cliente permitido envia; origem não autorizada não forja sinais |
| F/F36,INV/64 | AINDA REPRODUZÍVEL | lead-score-threshold-runner:174–189 | create_task escreve alerts, não tasks | Tarefa real aparece para responsável |
| F/F37,INV/66 | AINDA REPRODUZÍVEL | lux-trigger:151–179 | Callback sem segredo; falha upstream chama catch inválido | Falha rastreada sem processing eterno |
| F/F40,INV/70 | AINDA REPRODUZÍVEL | mql-evaluator:60 usa contacts.lead_score | Consultar lead_scores; cron NR | Score canônico classifica contato correto |
| F/F41,INV/71 | RESOLVIDO NO CÓDIGO | next-best-action:148–152 aguarda/valida persistência | IA AD; deploy NR | Falha DB não anuncia ação criada |
| F/F42,F/F46,F/F52,F/F64,INV/72,INV/79,INV/86,INV/100 | AINDA REPRODUZÍVEL | nurturing:129–145;DLQ:43–159;sequence:244–359;validation:66–100 | Claim parcial, auth downstream, upserts, RPCs ausentes e envio falso | Concorrência/reinício/DB/provedor sem perder nem repetir |
| F/F43,F/F55,F/F57,INV/74,INV/90,INV/92 | RESOLVIDO NO CÓDIGO | objection-handler:126,137;social-behavior:156;social-profile:169,284 | IA/Firecrawl AD; deploy NR | Writes auxiliares corretos não derrubam resultado |
| F/F50,INV/84 | AINDA REPRODUZÍVEL | send-push-notification:32–52 | Transporte não é Web Push completo | VAPID + RFC8291 + dispositivo real |
| F/F51,F/F56,INV/85,INV/91 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | SMS:27,163–164;social-events:35,355–359 | Twilio/Firecrawl adiados; guard/upsert ainda defeituosos | Se reativar: proprietário, lotes, estado final confiável |
| F/F53,INV/87 | AINDA REPRODUZÍVEL | sequence:337;sequence-track sem emissor | Email inexistente não injeta tracking | Abertura/clique reais alimentam branching |
| F/F54,INV/88 | AINDA REPRODUZÍVEL | smart-notify:11,110–178; cron histórico incorreto | Catch/email fake removidos; guard/job/escalation_role continuam; entrega WhatsApp AD | Cron canônico; sem sucesso inventado; destinatário de escalonamento correto |
| F/F58,INV/94 | AINDA REPRODUZÍVEL | suggest-next-action:195 Math.random | Necessidade preditiva continua sorteada | Inferência justificável ou exemplo rotulado |
| F/F59,INV/95 | AINDA REPRODUZÍVEL | sync-social-interests:9,61;generate-offer:36 withAuth | Front bloqueado e downstream service-role rejeitado; IA AD | Chamada interna autenticada sem segredo exposto |
| F/F60,INV/96 | AINDA REPRODUZÍVEL | system-health:139;StatusPage.tsx:49,57 | Fail-open corrigido; visitante não autorizado continua indisponível | Status agregado anônimo com limites |
| F/F62,INV/98 | NÃO VERIFICADO NO RUNTIME | territory-optimization:231–235 usa RPCs externas | Ausência local não prova ausência externa; erros não devem virar vazio | RPC remota/contrato e falha explícita |

### B2: riscos e plano, sem duplicar causas

| ID | Estado | Evidência atual | Falta | Aceite |
|---|---|---|---|---|
| B/R1,B/P1,B/D01 | RESOLVIDO NO CÓDIGO | types.ts regerado; ci.yml:70 usa npm run typecheck | Drift automatizado/strict ainda incompletos; remoto NR | Contrato canônico/regressões de tipos |
| B/R2,B/P3,B/PB | AINDA REPRODUZÍVEL | auth.ts:239–249; B2 §8/crons históricos | Contratos e jobs; existência remota NR | Critério prioridade 1 |
| B/R2b | AINDA REPRODUZÍVEL | config.toml:1; URLs históricas dos dois crons | Um destino canônico | Nenhum job aponta a projeto errado |
| B/R3,B/P2 | RESOLVIDO NO CÓDIGO | ci.yml:37–70,116–135 | Não inferir deploy verde | Falha de gate impede entrega |
| B/R3b,B/PF,B/F09 | NÃO VERIFICADO NO RUNTIME | deploy-all.sh:66–100;restore-drill.yml | Fluxo real de deploy/ledger/rollback não comprovado | Artefato e migrations identificados no canônico |
| B/R4,B/PA | NÃO VERIFICADO NO RUNTIME | Remoção informada pelo pai; exposição histórica | Revogação/rotação pelo usuário; não reinspecionei valores | Credenciais antigas recusadas |
| B/R4b | AINDA REPRODUZÍVEL | secrets.template.env versus três guards F/S8 | Completar nomes, não provisionar integração AD | Inventário cobre contratos usados |
| B/R5,B/P4 | NÃO VERIFICADO NO RUNTIME | DDL connector_log/oauth_tokens/email_logs ausente; baseline canônico parcial | Dump/replay e comparação remoto; não afirmar tabela remota ausente | Banco novo com objetos e contratos necessários |
| B/R6,B/PC | AINDA REPRODUZÍVEL | MapaEmpresas:139–140 canônico;useErpData:32–53 candidatos fora da allowlist | Mapa corrigido; ERP agora mostra erro, mas contrato continua incompatível | Produto/proposta canônicos sem fallback enganoso |
| B/R7,B/PG,B/I25,B/S28,B/S43 | AINDA REPRODUZÍVEL | useEmailCampaigns:88–125 não finge envio;sequence:331–346/check-health:225–228/weekly:204–207 | Canal real/estado honesto nos demais emissores; componente S43 órfão | Confirmação externa antes de sent |
| B/R8,B/P6,B/S01 | AINDA REPRODUZÍVEL | useMFAGuard:30–34;MFAGuard:13–14;AppRoutes:154 | Fluxo elevação MFA | Critério prioridade 6 |
| B/R9,B/P5 | AINDA REPRODUZÍVEL | suggest-next-action:195;useDealVelocity:67;MarketingHub:254–262 | Remover/rotular métricas inventadas restantes | Mesma entrada produz cálculo verificável |
| B/R9b,B/P7,B/S15 | AINDA REPRODUZÍVEL | StatusPage:57 falha fechado;system-health:139 exige JWT | Endpoint público agregado | Visitante distingue indisponível de saudável |
| B/R10 | AINDA REPRODUZÍVEL | generate-insights:142–143 só retorna; leitores de insights/telemetria | Produtores/consumidores, sem confundir hooks corrigidos com produtores | Ação gera dado novo visível |
| B/R11,B/F10,B/F13,B/F14,B/F15 | AINDA REPRODUZÍVEL | Testes grep/espelho persistem;auth-flow.test.ts:1;CI sem Deno | Cobertura comportamental real; ordem estranha de import não prova teste inválido | Mutação da regra real quebra teste |
| B/R12,B/S13,B/S14,B/N04 | AINDA REPRODUZÍVEL | FeatureFlagsPage:42–45;useFeatureFlag sem consumidor;dual-write-diverge:68 usa key, PK=name | Enforcement/seed/coluna | Desligar flag interrompe caminho alvo |
| B/R13 | AINDA REPRODUZÍVEL | main.tsx:19–26;vite.config.ts:26;pushNotifications:30 | SWs/documentação divergentes | Um ciclo atualização/subscrição coerente |
| B/R13b | AINDA REPRODUZÍVEL | config.toml sem functions;deploy-all.sh NO_JWT | =F/S7 | Política reproduzível por função |
| B/P8,B/S46,B/F30,B/F31,B/F32,B/F33 | AINDA REPRODUZÍVEL | RUNBOOK:466,487–488;README/HANDOFF;dois audit_report/ARCHITECTURE;er-diagram | Documentos/diagramas contraditórios ou vazios | Fonte canônica descreve execução comprovada |
| B/PD,B/I16 | RESOLVIDO NO CÓDIGO | incoming-webhook:181–200 e migration 20261002103000 | Deploy/replay remoto NR | Assinatura/timestamp/idempotência inválidos rejeitados |
| B/PE,B/I05,B/I06,B/I10,B/I12,B/I32,B/IC2,B/N03 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | Evolution/Bitrix/SMS: F/F07,26–28,51,54 | Integrações adiadas; schema/auth/sync CRM ainda incompletos | Reativação exige prova externa/tenant |

### B2: administração, integração, dados, infraestrutura e reverificação

| ID | Estado | Evidência atual | Falta | Aceite |
|---|---|---|---|---|
| B/S02 | AINDA REPRODUZÍVEL | RequireAdmin.tsx:42,60 aponta rota inexistente | Link e falha fechada | Sem papel/erro não libera admin |
| B/S03,B/S08 | AINDA REPRODUZÍVEL | useWebAuthn:41–42 só cadastro;SSOCallbackPage:10 só getSession | Login real/challenge servidor/SSO | Sessão autenticada por cerimônia válida |
| B/S04,B/S05,B/S06,B/S07 | AINDA REPRODUZÍVEL | validate-access:63,82;GeoBlockingManager:24;detect-new-device:57;hooks sem enforcement | Ligar controles/corrigir builders | Acesso bloqueado antes de sessão liberada |
| B/S09–B/S12 | AINDA REPRODUZÍVEL | useRBAC.tsx:13 sem consumidor;RolesPage:17/PermissionsPage:17/RolePermissionsPage:16 só select | Permissões efetivas e mutações | Papel alterado muda autorização real |
| B/S16,B/S22,B/S32,B/S41,B/S42 | OBSOLETO/DUPLICADO | health-aggregate:173;audit-analytics:34–42;Observability:20–21;componentes sem rota/consumidor | Aposentadoria ou conexão intencional | Sem duplicata exposta como funcional |
| B/S17,B/S18,B/S19 | AINDA REPRODUZÍVEL | system-health:183–190 sob demanda;error-budget:69–99,141 | Amostragem/alertas reais; stack NR | Sem amostra nunca vira uptime100 |
| B/S20,B/S23,B/S25 | AINDA REPRODUZÍVEL | AdminTelemetria:56,79;useSchemaDriftAlerts:29,57,78;usePasswordResetRequests:14,30 | Produtores/aprovação de reset efetiva | Evento gera registro e ação real |
| B/S21 | AINDA REPRODUZÍVEL | policy 20260926195756:60 proprietário;AdminAuditTrail:70 | Escopo organizacional autorizado | Admin vê permitido, vendedor só próprio |
| B/S24,B/I26,B/I27 | AINDA REPRODUZÍVEL | useSecretRotation:20–28,60 só hash;RUNBOOK:405 | Não anunciar rotação/integradores inexistentes | Status descreve operação realmente executada |
| B/S26,B/S27,B/S29,B/N01,B/N02 | AINDA REPRODUZÍVEL | F/F31,46,54;guards 54/27/11;frontend sem header | Auth/jobs/cadeia e painel DLQ | Manual e cron autorizados, sem vazamento |
| B/S30 | AINDA REPRODUZÍVEL | crm-automation-monitor:49 agora write correto, sem caller | Alimentar widget | Ação real produz log consumido |
| B/S31,B/I15 | RESOLVIDO NO CÓDIGO | dual-write-proxy:2,37–41 | Legado/runtime NR; N04 separado | Import/auth válidos |
| B/S33 | AINDA REPRODUZÍVEL | record_rpc_perf_sample restrito à observabilidade | Instrumentação dos RPCs de negócio | Amostra real de operação alvo |
| B/S34,B/F26,B/F27,B/F29,B/I30,B/I31 | NÃO VERIFICADO NO RUNTIME | Sem scrape/deploy versionado;alertmanager.yml:31,38,44 placeholders | Provar stack/receptores ativos, não ler secrets | Falha real dispara alerta recebido |
| B/S35,B/IA7 | AINDA REPRODUZÍVEL | externalData.ts:55 breaker frontend;backend sem breaker persistente | Resiliência externa por integração; não exigir reenvio de entrega ambígua | Timeout/rejeição/ambiguidade tratados distintamente |
| B/S36–B/S39,B/S44 | AINDA REPRODUZÍVEL | AdminFieldMapping:23–63;AdminKnowledgeExport:16;DocsPage:34;AppRoutes:69;AdminSidebar:8–24 | Configuração dinâmica/escopo/menu coerentes | Alteração realmente aplicada; restrição decidida |
| B/S40 | AINDA REPRODUZÍVEL | AdminConexoes:44;AdminConexoesLogs fora de rotas | Dados corrigidos não criaram rota | Link abre logs e DLQ autorizados |
| B/S45 | AINDA REPRODUZÍVEL | ResetPassword.tsx:15 min6 | Mesma política forte do restante auth | Senha fraca recusada no reset |
| B/S47 | OBSOLETO/DUPLICADO | clear-must-reset-flag:16; import Deno resolveu | Hipótese boot inválido não reproduzida; runtime/tabela NR | Deploy resolve import; reset limpa flag |
| B/I02 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | meeting-summary:128 usa api.lovable.dev | IA adiada; host divergente não prova falha remota | Se reativar: endpoint oficial/teste real |
| B/I18 | AINDA REPRODUZÍVEL | connection-tester testMcpClaude só initialize | Consumo real ou rótulo teste | Tool externa executada, não só handshake |
| B/I19 | AINDA REPRODUZÍVEL | F/F50/S6 | Transporte Web Push | Recebimento no dispositivo |
| B/I20,B/I21,B/I22 | AINDA REPRODUZÍVEL | geocoding:1–25 tem cache;sem rate global;useIPValidation:16;ícones CDN | Limite Nominatim/privacidade/assets locais | Sem rajada multiusuário nem dependência CDN |
| B/I24 | AINDA REPRODUZÍVEL | intent-tracker:27,72,123 | =F/F34 | Não aceitar evento forjado |
| B/I28,B/I29 | AINDA REPRODUZÍVEL | webhookTemplates:62–78 versus incoming-webhook:57–77 | Adaptar assinaturas Stripe/GitHub, não remover HMAC | Payload oficial válido aceito, adulterado recusado |
| B/D02–B/D06,B/D11,B/D12 | OBSOLETO/DUPLICADO | Pipeline usa deals;trilhas/caches/legados sem consumidor;src/data só testes | Contagens históricas não reestimadas; investigar consumidores externos antes de remover | Objeto tem dono/consumidor ou aposentadoria segura |
| B/D03 (rastro comercial distinto) | OBSOLETO/DUPLICADO | As trilhas *_audit antigas não são o contrato de activities do PR109 | Não usar PR109 como solução geral dessas trilhas | Auditoria comercial e triggers testadas separadamente |
| B/D07,B/D08,B/D09,B/D10 | NÃO VERIFICADO NO RUNTIME | Sem CREATE MATERIALIZED VIEW;schemas históricos;DROP deals antigo;refresh sem job Git | Replay/restauro/refresh remoto, não deduzir ausência remota | Banco novo e dados diários consistentes |
| B/D13 | AINDA REPRODUZÍVEL | Não localizado índice/criação de unicidade email;há drops históricos | Índice/decisão de unicidade por tenant; índice remoto NR | EXPLAIN e dedup sob proprietário correto |
| B/D14 | AINDA REPRODUZÍVEL | sequence:359/nurturing:145 chamam increment* sem DDL | RPC válida ou atualização transacional; territórios são externos | Contador cresce só para transição concluída |
| B/F01,B/F02,B/F04,B/F08,B/F12,B/F17,B/F18 | AINDA REPRODUZÍVEL | tsconfig.app:17–19;ci:26;três locks;LH:13–19 warn;Vitest sem thresholds;CI sem Deno/node--test | Gates efetivos; meus testes locais não instalaram runner CI | Regressão de tipos/perf/teste bloqueia CI |
| B/F03,B/F05,B/F06,B/F07,B/F11,B/F16,B/F19,B/F20,B/F21 | RESOLVIDO NO CÓDIGO | ci:16,35,60–67,96,100–101,105,116–135;Playwright:18–44 | Execução atual CI/credenciais remotas NR | Gates e testes de build executados sem bypass |
| B/F22,B/F23,B/F24,B/F28 | OBSOLETO/DUPLICADO | scripts/apply-*;generate_*;verify/tests/scenarios;monitoring/*exporter sem runner | Retenção/runner deliberados; não chamar implementação completa | Script autorizado/reproduzível ou retirado |
| B/F25 | NÃO VERIFICADO NO RUNTIME | scripts/migration/*;deployAllScript.test.ts:5–16 | Scripts manuais não têm prova integral de execução | Procedimentos relevantes reproduzíveis e aprovados |
| B/V01 | RESOLVIDO NO CÓDIGO | useAttribution:61;grant compute_attribution 20261006130000:428 | Runtime NR; F/F03 redundante | Atribuição com usuário autorizado |
| B/V02,B/V03,B/V04,B/V05 | AINDA REPRODUZÍVEL | auto-regen:15,134;regen:16,50;client-notifications:23;rebatch:35,44 | Headers incompatíveis; jobs remotos NR | Fila avança por processamento autenticado |
| B/V06,B/V07,B/V08 | OBSOLETO/DUPLICADO | enrich-contacts órfã;win-loss-record-deal:59;coaching-digest:12 | Decidir uso/retirada; defeitos F continuam | Consumidor intencional identificado |
| B/V09,B/V10 | AINDA REPRODUZÍVEL | WinLossCaptureDialog sem import;useSequences:170–194 agora RPC atômica, tela sem enrollment | Montar ações UI; persistência corrigida não cria botão | Fechar deal registra motivo; inscrever contato visível |
| B/V11 | NÃO VERIFICADO NO RUNTIME | Só metadados/preflight verificados;sem SQL/logs gateway | Consultar cron.job/histórico com acesso aprovado | Evidência de uso antes de remover funções |

### Inventário completo e cron sem novos IDs

As linhas INV ligadas aos F acima herdam **estado, evidência, falta e aceite** do respectivo F. As demais são discriminadas abaixo. A seção 8 de B2 está coberta por F/S2–S3, F/F05–10,16,30–31,35,40,42,45–48,51–52,54,56,59,61,64,66 e INV/18. `lead-routing` removida é OD; os quatro jobs SQL de rodízio não comprovam agendamento das Edge Functions.

| ID | Estado | Evidência atual | Falta | Aceite |
|---|---|---|---|---|
| INV/2,INV/4,INV/5,INV/6,INV/7,INV/18,INV/29,INV/34,INV/35,INV/38,INV/48,INV/49,INV/50,INV/54,INV/69,INV/73,INV/76,INV/89,INV/101,INV/102 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | abm-whitespace-analyzer:19;ai-email-refine:61;ai-suggest-mapping:62;ai-writing-assistant:136;ask-crm:64;connection-anomaly-detector:69;demand-forecast:53;elevenlabs-scribe-token:24;elevenlabs-tts:30;email-thread-summary:123;firecrawl-scrape:40;forecast-analyzer:90;forecast-narrative:38;generate-insights:33;meeting-summary:91;objection-context-summary:61;playbook-generator:80;smart-reminders:337;visual-search:22;voice-agent:125 | IA/voz/scraping deliberadamente sem chave; não validados | Se reativar: provedor real, contrato/tenant/erros |
| INV/16,INV/20,INV/26,INV/28,INV/30,INV/37,INV/52,INV/55,INV/57,INV/59,INV/60,INV/61,INV/65,INV/77,INV/82,INV/93,INV/103 | NÃO VERIFICADO NO RUNTIME | clear-must-reset-flag:18;connection-tester:14;deal-room-buyer-view:8;deal-room-share:2;detect-churn-risk:2;email-pipeline-health:2;form-submit-handler:7;generate-offer-suggestions:5;health:2;incoming-webhook:34;intent-aggregator:2;intent-pixel-snippet:6;lead-scorer:4;playbook-recommender:83;rfm-analyzer:5;submit-signature:8;voice-ai-health:1 | Deploy/contrato remoto e fluxos não executados | Execução autorizada e efeito correto; health-check não é entrega |

## Limites da conclusão

Não foram comprovados: migrations permanentes, cron.job/histórico de execução, verify_jwt implantado, logs gateway, disponibilidade dos objetos externos, envio/recebimento de email/SMS/WhatsApp/push e rotação de credenciais históricas. Não solicitei chaves das integrações adiadas. Compile/teste/preflight não equivalem a entrega. Nenhuma conclusão depende de assumir tabela/job remoto ausente por falta de acesso.


---
