# Matriz de execução reconciliada — Singu V2

## Escopo e evidência

Reconciliação de `docs/auditoria/` e `docs/lacunas/`, baseada no commit `a2b73c7dee837f19aa756e6afe385eba837b5d54`. As cinco revisões abaixo preservam os IDs históricos, evidências e critérios de aceite. São diagnósticos de código; nenhuma delas, isoladamente, comprova publicação, isolamento no banco remoto ou entrega de mensagens.

`RESOLVIDO NO CÓDIGO` não significa validado em produção. Para encerrar um item operacional são necessárias evidências de CI, merge, deploy, ledger quando houver DDL, e execução autenticada. Ausência de DDL local não demonstra ausência do objeto remoto. As alegações históricas permanecem nos documentos de origem; esta matriz registra a reavaliação e a próxima ação.

## Atualização após as revisões — 12/10/2026

| Item | Evidência posterior | Estado de entrega | Próxima ação |
|---|---|---|---|
| Rodízio e emails duplicados | [PR 108](https://github.com/adm01-debug/Singu_V2/pull/108), head `b583bc16e4083e037989a60a9076b8ca5652ac3f`; SQL e fixtures preservados após integração com a main; duas provas com rollback, incluindo unicidade e papéis administrativos prévios | CORRIGIDO EM PR ABERTO; CI reiniciado após integração | Concluir CI do head atual, merge squash, deploy, aplicar migration e registrar ledger; repetir gates permanentes |
| Auditoria identificada e agregada, E-C01 | [PR 109](https://github.com/adm01-debug/Singu_V2/pull/109) mergeado em `a8f50e53027b37512d46c6f3daa2575798ec9f9e`; deploy de produção READY; a visão 360 usa `contact_id`; 5.948 testes locais e CI do PR passaram | RESOLVIDO NO CÓDIGO; migration e runtime autenticado pendentes | Aplicar a versão `20261012123000` depois da `20261012120000`, registrar ledger e retestar leitura/exclusão autenticadas; não reabrir o achado de `contact_id` |
| Ledger canônico | Consulta somente leitura em 12/10/2026: máxima versão `20261012040000`; versões `20261012120000` e `20261012123000` ausentes | NÃO VERIFICADO NO RUNTIME para as novas migrations | Aplicação somente após merge/deploy; provas com rollback não equivalem a aplicação permanente |
| Integrações externas | Usuário optou por seguir sem chaves de IA, WhatsApp/Evolution, Bitrix, ElevenLabs, Firecrawl e Twilio | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | Corrigir contratos e estados honestos; manter entrega/IA reais fora das funcionalidades operacionais declaradas |
| Revisões automáticas adicionais | Codex atingiu limite; Greptile/ECC não executaram a análise dos heads novos por limites de plano | NÃO VERIFICADO NO RUNTIME | Conservar revisão local e gates obrigatórios; não interpretar comentário de limite como aprovação ou achado técnico |

## Ordem de execução

1. Concluir e publicar os PRs 108/109; confirmar migrations e isolamento permanente.
2. SEC-6: bloquear URLs privadas/reservadas corretamente, IPv6 mapeado e logs de conexão de outro proprietário; registrar o risco residual de DNS/egress.
3. A9: permitir enrollment/challenge de MFA na tela de segurança em AAL1; manter conteúdo administrativo protegido por AAL2.
4. A6: efetivar proteção da main e checks que realmente são emitidos; conferir o gate de deploy.
5. Contratos ativos: alinhar RPCs, transações de mesclagem e escopo das views com evidência do catálogo canônico.
6. X-02, filas e mensagens: distinguir admin/owner/cron, completar claims e contadores, impedir sent sem prova de entrega.
7. UX: retirar métricas inventadas, proteger trabalho não salvo e conectar handlers/rotas confirmados; validar acessibilidade e jornadas autenticadas.
8. Reconstrução/operação: ledger, replay, tipos, Deno no CI, backups e restore com evidência recente. Rotação de credenciais históricas exige confirmação do usuário.

## Uso das matrizes

Os grupos podem citar um mesmo ID: segurança, contrato e UX avaliam riscos diferentes do mesmo fluxo. As abreviações de arquivos são definidas por cada grupo e apontam para o snapshot acima. `NÃO VERIFICADO NO RUNTIME` exige a prova do ambiente correspondente antes do encerramento. O campo de próxima ação/aceite descreve o risco residual. Itens adiados dependem de decisão de produto ou do acesso externo indicado; os demais podem seguir autonomamente.


---

# Segurança e documentos raiz

**Origem:** docs/auditoria/01_ACHADOS_SEGURANCA.md; docs/lacunas/A_docs_raiz_e_memoria_lovable.md.

# Reconciliação — segurança e documentos raiz

**Base:** `a2b73c7dee837f19aa756e6afe385eba837b5d54`. Revisão somente leitura, em 12/10/2026. README, CONTRIBUTING, AGENTS, índice das lacunas, os dois anexos e o consolidado foram lidos integralmente. Graphify foi consultado e confrontado com código; não constitui prova de produção.

## Prioridades confirmadas para o pai

1. **SEC-6: bloqueio SSRF incorreto.** `connection-tester` compara inteiro com sinal com bases IPv4 sem sinal. Reprodução matemática local do predicado: 127.0.0.1/10.0.0.1 bloqueados; 172.16.0.1/192.168.0.1/169.254.1.1 não bloqueados. Não houve requisição a rede privada. Normalizar uint32, cobrir IPv6 mapeado e revisar DNS/egress. Atualização de configuração filtra proprietário, mas inserção de logs não confirma ownership antes de escrever.
2. **A9: bloqueio circular de MFA.** Todo admin em AAL1 é encaminhado a `/seguranca`, que também está dentro da guarda e retorna conteúdo nulo. Mesmo alcançando o componente, fator já verificado mostra somente “2FA ativo”, sem desafio para elevar a sessão. Separar enrollment/challenge acessível em AAL1 e conservar conteúdo administrativo protegido por AAL2.
3. **A1–A3: credenciais e criptografia.** Zero PATs detectados nos arquivos correntes examinados, mas remoção não revoga históricos. Usuário deve rotacionar PAT/senha; permanece um JWT literal legado em migration e fallback determinístico de criptografia. Não declarar chave segura sem verificar GUC. Remover fallback com plano de recifragem, sem perder acesso a credenciais existentes.
4. **A6: main sem proteção.** API GitHub retornou “Branch not protected”; regras aplicáveis e rulesets, incluindo herdados, retornaram listas vazias. Proteger fluxo de merge/checks; conferir separadamente o gating Vercel.
5. **X-02: operações manuais versus cron.** Botões enviam JWT a endpoints que exigem `x-cron-secret`. Não corrigir trocando a guarda por “qualquer autenticado”: jobs globais precisam de autorização administrativa; jobs individuais, escopo de proprietário. Agendamentos remotos continuam não verificados.
6. **A10 e AUDC-01 antes de reativar integrações.** Evolution aceita operações destrutivas sem admin; Ask CRM ainda executa SQL validado por regex com service role. Manter integrações adiadas desabilitadas, sem solicitar chaves nesta etapa.

## Evidências e limites

Passaram **46 testes Vitest** de contratos do proxy/isolamento/autenticação do error reporter, **28 testes Deno** de autenticação/tenant guard e o checker de CORS. Não houve testes UI, escrita SQL, deploy ou alteração de arquivos versionados. Scanner redigido dos arquivos versionados, excluindo grafo derivado: **0 PATs Supabase/GitHub; 1 JWT literal legado**. Valores não reproduzidos.

GET do frontend canônico: HTTP 200, CSP HTTP presente; bundle `/assets/js/index-BoFRLH6I.js` referencia somente `pgxfvjmuubtbowutlide.supabase.co` entre URLs Supabase encontradas. Isso não verifica todos os fluxos/envs nem usuários no Lovable. GitHub settings são evidência remota atual, não propriedade do SHA.

Não houve acesso SQL nesta unidade. **Ausência de prova não significa ausência de tabela, cron, grant ou secret.** “RESOLVIDO NO CÓDIGO” nunca significa publicado. PRs [108](https://github.com/adm01-debug/Singu_V2/pull/108) e [109](https://github.com/adm01-debug/Singu_V2/pull/109) foram contextualizados pelo pai; não foram usados como prova de correção permanente nem revalidados aqui. Nenhum item desta unidade foi atribuído a esses PRs por inferência.

**Notação:** `F/` = `supabase/functions/`; `M/` = `supabase/migrations/`; `H/` = `src/hooks/`; `C/` = `src/components/`; `R` = `src/app/AppRoutes.tsx`; `A` = `docs/lacunas/A_docs_raiz_e_memoria_lovable.md`. Prefixos numéricos de migrations identificam o arquivo único correspondente. Linhas de `A` são referências documentais, não provas operacionais.

## Segurança: A1–A10 e SEC-*

| ID | Estado | Evidência atual | Falta | Aceite |
|---|---|---|---|---|
| A1; HER-01 | NÃO VERIFICADO NO RUNTIME | Scanner corrente: zero PAT; histórico informado pelo pai | Revogar PAT/senha históricos | Antigas credenciais recusadas; novas funcionam, sem exposição |
| A2 | AINDA REPRODUZÍVEL | M/20260417120721*:19 contém JWT literal, verificado sem imprimir | Neutralizar dependência legada e replay inseguro | Migration/cron não dependem de JWT embutido |
| A3 | AINDA REPRODUZÍVEL | M/20260420120250*:25–31 mantém fallback | Chave efetiva desconhecida; falhar fechado com recifragem | Sem GUC não cifra; dados existentes continuam recuperáveis |
| A4 | NÃO VERIFICADO NO RUNTIME | Bundle Vercel canônico; `supabase/config.toml:1` ainda aponta projeto antigo | Lovable, uso humano e defaults de CLI | Fronts/deploys aprovados utilizam projeto canônico |
| A5 | RESOLVIDO NO CÓDIGO | F/_shared/auth.ts:70–88 inclui Vercel; teste Deno passou | Publicação em todas as funções | Preflight/POST do domínio real funcionam |
| A6; NV-03 | AINDA REPRODUZÍVEL | API GitHub protection/main:404; branch_rules/rulesets:[] | Proteção e gate Vercel | Merge inválido bloqueado; deploy aguarda checks |
| A7 | NÃO VERIFICADO NO RUNTIME | Preview verde informado pelo pai para PRs posteriores | Ledger/migrations permanentes | Preview e banco canônico alinhados, sem inferir aplicação do rollback |
| A8 | NÃO VERIFICADO NO RUNTIME | M/20260925102411*:20–56: signup por domínio; F/external-data:184–195,521–533: JWT/RLS corrigidos | Trigger/allowlist/ACL reais; alcance por papel | E-mail externo recusado; usuário sem papel não lê dados alheios |
| A9 | AINDA REPRODUZÍVEL | R:31–35,154; H/useMFAGuard.ts:30–39; C/security/TwoFactorSetup.tsx:33–46 | Enrollment/challenge navegável | Admin novo e existente elevam AAL1→AAL2; código errado bloqueia |
| A10 | AINDA REPRODUZÍVEL | F/evolution-api/index.ts:24–47: ações destrutivas após withAuth | Admin; integração segue adiada | Usuário comum recebe 403 antes de qualquer ação externa |
| SEC-1 | RESOLVIDO NO CÓDIGO | M/20260720000001*:18–68; M/20261006120000*:61–108 revoga anon/policies; RPC pública por token | ACL/policies publicadas | Anon não enumera tokens; token específico permite resposta válida |
| SEC-2; SEC-2b | RESOLVIDO NO CÓDIGO | F/external-data:184–195,455–475,495–534,602–655: RLS nas leituras/RPC e ownership nas mutações | Confirmar RLS inclusive embeddings no remoto | Dois usuários reais não cruzam dados, relações ou identidade |
| SEC-2c | RESOLVIDO NO CÓDIGO | F/external-data:547–575; F/_shared/tenant-guard.ts:86–105; 6 testes passaram | Regressão completa no endpoint | Colunas/métodos inválidos não alteram escopo |
| SEC-3 | RESOLVIDO NO CÓDIGO | F/bitrix24-webhook:40; evolution-webhook:20; lux-webhook:18 exigem secrets | Deploy; Bitrix/Evolution adiadas | Header ausente/errado recusado antes de mutação |
| SEC-4 | RESOLVIDO NO CÓDIGO | F/_shared/auth.ts:239–249; guards em nurturing:22, DLQ:27, validation:24 e demais crons citados | Secret/agendamentos efetivos; X-02 | Sem segredo não executa; job autorizado só uma vez |
| SEC-5 | AINDA REPRODUZÍVEL | F/_shared/auth.ts:78–88 aceita qualquer sufixo Lovable; checker passou sem wildcard fora de exceções | Restringir previews ao projeto necessário | Origem Lovable arbitrária não recebe autorização CORS |
| SEC-6 | AINDA REPRODUZÍVEL | F/connection-tester:71–73; reprodução local falhou em três faixas; redirects bloqueados:163–170 | CIDR uint32, IPv6/egress e ownership dos logs | Todos destinos privados/link-local recusados; logs de outra conta impossíveis |
| SEC-7 | RESOLVIDO NO CÓDIGO | F/mcp-server:42–60 remove delimitadores e filtra owner | Deploy/regressão | Busca com separadores não amplia resultados além do proprietário |

## Documentos raiz e memória Lovable: matriz completa

| ID | Estado | Evidência atual | Falta | Aceite |
|---|---|---|---|---|
| PLAN-01; AUDS-01 | AINDA REPRODUZÍVEL | `.lovable/plan.md:1–20`; `AUDITORIA_SISTEMA.md:7`; lacunas confirmadas acima | Retirar “10/10”/“100%” sem prova | Claims rastreáveis a execução datada |
| PLAN-02; MEM-F09 | NÃO VERIFICADO NO RUNTIME | F/system-health-snapshot e R/admin/error-budget; agendamentos prometidos A:133 | Jobs, retenção e alertas reais | Janela medida, snapshot recente e alerta entregue |
| PLAN-03; MEM-A02; NV-05 | NÃO VERIFICADO NO RUNTIME | `scripts/check-backend-linter-baseline.mjs:17–23` aceita stdin vazio; não chamado pelos workflows | Linter remoto; ligar ratchet alimentado | Relatório atual; aumento bloqueia CI, vazio falha |
| PLAN-04 | RESOLVIDO NO CÓDIGO | `package.json:14`; `.github/workflows/ci.yml:70` chama typecheck explícito | Atualizar referência tsgo | Erro inserido em src faz typecheck falhar |
| IDX-01; CL-05 | AINDA REPRODUZÍVEL | `.lovable/memory/index.md:5`; H/useWinLoss.ts:479; `tsconfig.app.json` permissivo | Conciliar regras e exceções | Docs não afirmam zero any/400 linhas universal |
| IDX-02 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | `.lovable/memory/index.md:9`; `ARCHITECTURE.md:125–126` proíbem módulos | Não construir; decidir buscas IA residuais de produtos | Inventário distingue leitura ERP de módulo novo |
| MEM-F01 | AINDA REPRODUZÍVEL | C/admin/AdminQuickActions.tsx:36–38 somente recarrega | Limpeza real ou rótulo honesto | Cache-alvo eliminado, não só reload |
| MEM-F02 | AINDA REPRODUZÍVEL | C/admin/AdminQuickActions.tsx:65–88 executa três pings | Renomear diagnóstico ou ligar testes | Não anunciar suíte completa por três checks |
| MEM-F03 | RESOLVIDO NO CÓDIGO | `src/pages/AdminDashboard.tsx:105–158` deriva status dos checks | Prova de indisponibilidade real | Falha de banco não aparece saudável |
| MEM-F04 | AINDA REPRODUZÍVEL | F/audit-analytics existe; busca src sem consumidor | Ligar agregação ou corrigir doc | UI consulta agregados reais, não só amostra local |
| MEM-F05 | NÃO VERIFICADO NO RUNTIME | F/cs-health-recalc:7 exige cron; promessa A:129 | Agenda/alertas | Recalcular em horário comprovado e alertar queda |
| MEM-F06 | AINDA REPRODUZÍVEL | H/useEmailCampaigns.ts:85–145 agora mantém pending e declara deliveryConfirmed:false | Produtor de entrega | Só enviado após confirmação; erro nunca simula envio |
| MEM-F07 | AINDA REPRODUZÍVEL | H/useApplyFoundEmail.ts:46–58 insere email, sem enqueue explícito; score vira verified | Confirmar trigger remoto/validação | Candidato entra na fila; score não equivale a entrega válida |
| MEM-F08 | AINDA REPRODUZÍVEL | C/admin/EmailPipelineStatus.tsx:30 definido, sem import consumidor | Montar widget ou retirar promessa | Dashboard renderiza dados reais |
| MEM-F10 | NÃO VERIFICADO NO RUNTIME | F/forecast-snapshot-cron:8 exige cron | Agenda/publicação | Snapshot diário recente, sem duplicação |
| MEM-F11 | AINDA REPRODUZÍVEL | H/useForecasting.ts:119–136; sem consumidor de useClosePeriod | Ação navegável | Fechar período grava estado e data |
| MEM-F12 | AINDA REPRODUZÍVEL | C/intelligence/GraphTab.tsx:45–55,215–255 anuncia BFS; busca sem algoritmo | Calcular caminho ou retirar BFS | Caminho usa arestas reais; desconectado não inventa conexão |
| MEM-F13; MEM-F16 | AINDA REPRODUZÍVEL | C/intent/IntentSignalCard e C/lead-scoring/LeadScoreCard definidos sem consumidores | Montar widgets previstos; não confundir outro LeadScoreCard | Contato/empresa exibem sinais e score servidor |
| MEM-F14 | OBSOLETO/DUPLICADO | C/lead-routing/LeadRoutingModule.tsx:62–73; QuickDistributeWidget:31–44 utiliza Rodízio DRY_RUN | Atualizar memória antiga; validar motor real | Não chamar EF removida; simulação não movimenta carteira |
| MEM-F15 | NÃO VERIFICADO NO RUNTIME | F/lead-score-cron:40; M/20261011204000*:41 marca fila processada | Agendador/drainer real | Item enfileirado termina processado uma vez |
| MEM-F17 | NÃO VERIFICADO NO RUNTIME | F/nurturing-runner:22; F/mql-evaluator:10; A:141 | Agenda remota | Avanço periódico e classificação registrados |
| MEM-F18; MEM-F19 | AINDA REPRODUZÍVEL | F/nurturing-runner:64–112 produz ações pendentes; F/sequence-processor existe | Entrega efetiva; WhatsApp adiado | Não marcar sucesso/avançar sem resultado confirmado |
| MEM-F20 | NÃO VERIFICADO NO RUNTIME | F/revops-snapshot-builder; A:144 promete cron/alerta | Agenda/alertas reais | Snapshot completo e alerta -15%/-30% comprovados |
| MEM-F21 | AINDA REPRODUZÍVEL | C/playbooks/PlaybookSuggestionDrawer.tsx:25 sem consumidor | Entrada contextual | Pipeline/contato abrem sugestões acionáveis |
| MEM-F22 | AINDA REPRODUZÍVEL | Busca src/F sem seed_playbook_defaults; M/20260924144037*:45 revoga EXECUTE | Entrada de onboarding e autorização | Usuário autorizado popula playbooks, sem duplicar |
| MEM-F23 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | F/send-sms-campaign exige Twilio; decisão explícita do usuário | Nenhuma chave solicitada | Reabrir somente após decisão e teste de entrega |
| MEM-F24; MEM-F25 | AINDA REPRODUZÍVEL | C/admin/SystemHealthWidget:61; C/docs/TechTooltip,VersionBadge sem montagem | Header/tooltips/badge ou atualizar docs | Componentes visíveis com dados/versão corretos |
| MEM-F26 | AINDA REPRODUZÍVEL | H/useValidationQueue.ts:46 envia JWT; F/validation-queue-worker:24 exige cron | Corrigir ação manual; agenda real | Autorizado processa; comum não dispara job global |
| MEM-F27 | AINDA REPRODUZÍVEL | C/win-loss/WinLossCaptureDialog.tsx:21 sem consumidor no Kanban | Captura ligada à conclusão | Ganho/perda gera registro, sem duplicação |
| MEM-F28 | NÃO VERIFICADO NO RUNTIME | C/win-loss/ReasonsEditor.tsx:36–51 chama seed; H/useWinLoss.ts:225 chama RPC | EXECUTE/contrato remoto | “Popular padrões” funciona e é idempotente |
| MEM-F29; MEM-F32; MEM-F38 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | F/conversation-coaching-digest e connection-anomaly-detector; C/dashboard/DailyBriefingCard:82–115 é determinístico | IA/LOVABLE_API_KEY adiada; não anunciar briefing IA | Futuro aceite com chamada real; hoje informar indisponibilidade |
| MEM-F30; AUDS-02; NV-06 | NÃO VERIFICADO NO RUNTIME | `supabase/config.toml:1` só project_id; sem verify_jwt por função | Flags reais/versionamento | Função pública usa autenticação própria; privada exige JWT |
| MEM-F31 | AINDA REPRODUZÍVEL | A:155; busca src sem WorkspaceMode | Implementar ou retirar promessa | Alternância tem efeito persistido, não só documentação |
| MEM-F33; CT-01 | AINDA REPRODUZÍVEL | Memórias referenciadas e `docs/incidents/` não presentes; A:157,366 | Destinos reais/incidentes | Links resolvem; incidente relevante possui post-mortem |
| MEM-F34 | RESOLVIDO NO CÓDIGO | `src/lib/errorReporting.ts:116–149` corrigido; H/useWebVitals.ts:44–55 encaminha violações ao reporter; testes passaram | Publicação/ACL e painel RUM | Usuário autenticado envia; troca de conta não atribui erro errado |
| MEM-F35 | AINDA REPRODUZÍVEL | F/health-aggregate existe; consumidores src ausentes | Ligar consumidor público seguro | Status honesto sem revelar detalhes sensíveis |
| MEM-F36; CL-01 | AINDA REPRODUZÍVEL | F/process-webhook-dlq:27 exige cron; chamada manual documentada A:160 | Autorização manual e agenda | Replay autorizado/idempotente; sem secret não executa |
| MEM-F37; CL-02 | AINDA REPRODUZÍVEL | F/incoming-webhook:95–331 sem chamada ai-suggest-mapping/mapping_drift | Pipeline de drift; IA segue adiada | Drift sinalizado, sem remapeamento silencioso |
| MEM-F39 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | F/ask-crm:64–65 exige LOVABLE_API_KEY; hardening parcial:117–182 | Ver AUDC-01 antes de habilitar | Sem chave indisponível explícito; sem dados cruzados |
| MEM-A01 | AINDA REPRODUZÍVEL | `scripts/lint-providers.cjs` existe; sem hook/workflow versionado ligado | Integração de validação | Violação de provider bloqueia check executado |
| MEM-M01 | AINDA REPRODUZÍVEL | `scripts/migration/verify/full-audit.sh:14–80` lista diferente da promessa | Corrigir contagem/escopo | Inventário gerado corresponde aos checks executados |
| MEM-M02 | NÃO VERIFICADO NO RUNTIME | full-audit.sh:10 exige DEST_DB_URL; workflows não agendam bateria | Scheduler externo | Execução periódica datada e falha alertada |
| MEM-M03; NV-07 | NÃO VERIFICADO NO RUNTIME | Configs em monitoring; A:191,407 | Deployment/exporters/canais | Métrica coletada e alerta entregue ao canal real |
| MEM-M04; NV-09 | NÃO VERIFICADO NO RUNTIME | Revokes históricos e grants posteriores M/20261011195900*:130–133 | ACL efetiva por tabela/coluna | Cliente legítimo funciona; usuário alheio negado |
| MEM-M05 | AINDA REPRODUZÍVEL | M/20261006140000_ai_gateway_observability.sql só métricas/alertas; F/_shared/aiGatewayLogger.ts:20–40 best-effort | Budget/quota antes de reativar IA | Budget bloqueia antes de consumir provedor; telemetria não é limite |
| MEM-M06 | NÃO VERIFICADO NO RUNTIME | A:194 é backlog; chamadas Math.random/órfãos não equivalem todas a falha | Reexecutar inventário dirigido | Aleatoriedade sensível usa crypto; falsos órfãos separados |
| MEM-M07 | AINDA REPRODUZÍVEL | `.github/workflows/monitoring-lint.yml:41–48` só exporter; scanner functions sem cobertura raiz | Scan completo com padrão PAT | Fixture redigida fora de functions/exporter é detectada |
| README-01; HO-01; AR-03 | AINDA REPRODUZÍVEL | README:105,108,151; inventário:108 funções/456 migrations | Gerar números/paths atuais | Docs batem com artefato do SHA |
| README-02 | AINDA REPRODUZÍVEL | README:84 referencia PDF inexistente | Corrigir link/gerar artefato | Link abre relatório correto |
| README-03; HO-02 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | F/evolution-api; integração sem chaves por decisão | WhatsApp adiado; A10 antes de reabrir | Não prometer envio/reconexão disponível |
| README-04; AUDC-05 | AINDA REPRODUZÍVEL | F/send-push-notification:44–51 envia JSON com header aes128gcm; `src/lib/pushNotifications.ts:4–6` exemplo | VAPID/criptografia Web Push | Push entregue em navegador real; payload corretamente cifrado |
| FUNC-01 | NÃO VERIFICADO NO RUNTIME | C/contact-detail/behavioral-tab/PersonalitySubTab:32–51 permite edição manual | Produtores e dados legados | Separar perfil manual de inferência automática |
| FUNC-02 | NÃO VERIFICADO NO RUNTIME | C/contact-detail/ContactBehavioralTab:78–79 consulta histórico EQ; A:237 | Produtores/dados/contratos de cada recurso | Ausência de dado não vira métrica fabricada |
| FUNC-03 | AINDA REPRODUZÍVEL | `disc_profile_config` aparece em allowlist/tipos; A:238 | Consumidor configurável | Alterar configuração modifica análise real |
| FUNC-04 | NÃO VERIFICADO NO RUNTIME | A:239 documenta recursos; sem prova end-to-end | Montagem/produtores e persistência | Fluxo completo observável com dados reais |
| FUNC-05 | AINDA REPRODUZÍVEL | C/feedback/FeatureSpotlight sem montagem; A:240 | Entrada da descoberta | Usuário consegue abrir/dispensar spotlight |
| FUNC-06 | OBSOLETO/DUPLICADO | `useSidebarState` ausente; C/layout/AppSidebar usa implementação atual | Atualizar nome/arquitetura | Sidebar mantém comportamento sem hook fantasma |
| FM-01 | OBSOLETO/DUPLICADO | H/useContacts usa external-data; proxy exige mesma origem:184–195 | Explicar modelo canônico atual | Front/Edge não consultam bases divergentes |
| FM-02; NV-01 | NÃO VERIFICADO NO RUNTIME | F/external-data:20–74 whitelist; M/20261008120000 restaura várias RPCs | Contratos/EXECUTE reais de todas | Chamada autenticada de cada RPC sem cruzar proprietário |
| FM-03 | AINDA REPRODUZÍVEL | FIELD_MAPPING:27,50; H/useCompanies.ts:79 usa nullable/default null | Atualizar defaults | Novo registro segue contrato canônico documentado |
| HO-03 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | HANDOFF:10,127 promete VoIP/scraping; chaves externas adiadas | Delimitar capacidades, sem novos pedidos | Recursos indisponíveis rotulados, não vendidos como operacionais |
| CL-03 | AINDA REPRODUZÍVEL | CHANGELOG:6–31; C/docs/VersionBadge não montado | Unificar versão/release | Badge/build/changelog concordam |
| CL-04 | NÃO VERIFICADO NO RUNTIME | F/smart-notify:11 exige cron; promessa A:283 | Agenda e transporte do digest/reminders | Lembrete/digest chega no horário correto |
| ARQ-01 | OBSOLETO/DUPLICADO | H/useInteractions.ts:115–148 chama disc-analyzer/NLP, não trio documentado | Atualizar pipeline; IA adiada | Diagrama corresponde às chamadas atuais |
| ARQ-02 | AINDA REPRODUZÍVEL | ARCHITECTURE:16,21; package.json:76,89: Leaflet 1.9/react-leaflet 4.2.1 | Corrigir biblioteca/estado sidebar | Versões/uso Zustand verificados, sem confundir wrappers |
| AUDC-01 | AINDA REPRODUZÍVEL | F/ask-crm:117–182 valida regex e executa service role; chamada não transporta JWT usuário | Parser/allowlist estrutural e execução user-scoped | Consulta fora do escopo rejeitada; SELECT não autoriza funções arbitrárias |
| AUDC-02 | AINDA REPRODUZÍVEL | `tsconfig.app.json` mantém strictNullChecks/noImplicitAny false | Habilitação incremental | Erros de null/any não passam despercebidos |
| AUDC-03 | AINDA REPRODUZÍVEL | Deno tests existem e 28 passaram; CI sem deno test | Executá-los no CI | Regressão Deno faz check falhar |
| AUDC-04 | NÃO VERIFICADO NO RUNTIME | Workflows de gates/restauração existem; deploy Edge não comprovado | Staging/aprovação/publicação | Revisão bloqueia deploy inválido e registra versão aplicada |
| AUDC-06 | AINDA REPRODUZÍVEL | F/form-submit-handler:5 usa rateLimit; sem CAPTCHA/honeypot | Controle antiabuso real | Bot/replay recusados sem quebrar formulário público |
| AUDC-07 | NÃO VERIFICADO NO RUNTIME | Proxy reduziu service role em leituras/RPC; mutações/jobs ainda utilizam | Autorizações específicas por função | JWT comum não inicia operação global nem grava dado alheio |
| AUDC-08 | AINDA REPRODUZÍVEL | index.html:9 permite unsafe-inline; CSP HTTP presente no Vercel | Política efetiva estrita/nonce | Script inline não autorizado bloqueado |
| AUDC-09 | OBSOLETO/DUPLICADO | Error reporter próprio autenticado, ver MEM-F34; nenhuma dependência Sentry/Bugsnag | Validar retenção/alerta, não exigir marca | Erro real rastreável no painel com notificação necessária |
| AUDC-10 | AINDA REPRODUZÍVEL | H/useAuth.tsx:290 passa objeto literal ao Provider | Memoizar valor | Render não relacionado não altera identidade do contexto |
| AUDC-11 | AINDA REPRODUZÍVEL | vite.config.ts:81: sourcemap:false | Mapas privados/observabilidade | Stack produção resolve sem publicar código sensível |
| AUDC-12 | OBSOLETO/DUPLICADO | 456 migrations; política forward-only | Não squash destrutivo; baseline futura opcional | Recriação limpa sem alterar ledger publicado |
| AUDC-13 | AINDA REPRODUZÍVEL | ci.yml:10 job build-and-test sequencial | Paralelização do job principal | Gates independentes em paralelo sem perder dependências |
| AR-01 | NÃO VERIFICADO NO RUNTIME | vitest.config.ts sem thresholds; percentual antigo não reexecutado | Medir cobertura core e definir gate | Relatório atual comprova meta, não só contagem de testes |
| AR-02 | AINDA REPRODUZÍVEL | `src/pages/BIAvancado.tsx:9–35` tabs fixas; A:355 | Editor drag-and-drop prometido | Layout customizado salva e restaura |
| CT-02 | AINDA REPRODUZÍVEL | lighthouserc.json:13–19 usa warn; main desprotegida | Gate conforme CONTRIBUTING | Abaixo do orçamento falha check requerido |
| TMP-01 | OBSOLETO/DUPLICADO | Script diagnóstico raiz sem integração; leak já coberto A1/HER-01 | Arquivar/remover sem executar | Build/CI não dependem de script ad-hoc |
| GR-01 | AINDA REPRODUZÍVEL | Grafo existe; package.json:12 tem graphify:update, sem workflow automático | Atualização reproduzível e vínculo SHA | Grafo/index identificam revisão corrente |
| X-01 | NÃO VERIFICADO NO RUNTIME | M/20260924213115*:39–42 agenda Rodízio; não prova outras agendas prometidas | Inventário cron.job e resultados reais | Cada agenda necessária apresenta execução recente/idempotente |
| X-02 | AINDA REPRODUZÍVEL | Exemplo direto MEM-F26: botão JWT versus requireCronSecret | Autorização manual por job/owner | Usuário permitido executa; usuário comum não dispara job global |
| NV-02 | NÃO VERIFICADO NO RUNTIME | Pipeline email documentado, sem prova externa nesta unidade | Pub/Sub/webhook/transporte efetivo | Mensagem real correlacionada ponta a ponta |
| NV-04 | NÃO VERIFICADO NO RUNTIME | A:404 menciona mobile audit sem artefato disponível | Evidência de dispositivos | Fluxos prioritários testados com viewport/touch reais |
| NV-08 | NÃO VERIFICADO NO RUNTIME | Consultas comportamentais existem; não houve SQL | Dados legados/sem produtor atual | Inventário por tabela com origem/data, sem confundir vazio com ausência |

**Pendências externas deliberadas:** LOVABLE_API_KEY, Evolution/WhatsApp, Bitrix, ElevenLabs, Firecrawl e Twilio permanecem sem validação e sem pedido de segredo. Isso não dispensa corrigir controle de autorização antes de futura ativação.


---

# UX, navegação e acessibilidade

**Origem:** docs/auditoria/03_ACHADOS_FRONTEND.md; docs/lacunas/C1_docs_produto_ux_qa.md; docs/lacunas/D_ui_rotas_componentes.md; docs/lacunas/B2_reverificacao_estado_05_10.md.

# Singu V2 — reconciliação UX/frontend

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
| ROT-03 | AINDA REPRODUZÍVEL | `src/components/admin/RequireAdmin.tsx:60` | Usar `/seguranca` | Configurar MFA sem 404 |
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
| PD-1.1, PD-1.4 | AINDA REPRODUZÍVEL | `src/index.css`: sem --space; radius-card isolado | Tokens/consumidores | Usados, não apenas definidos |
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
| PD-11.3, PD-11.4 | AINDA REPRODUZÍVEL | Sem previousPeriod/toPng no src | Comparativo/exportação | Mesmo dataset/períodos reais |
| PD-13.5, CS-1, PR3-1 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | Sem tutoriais/simulador/dashboards separados prometidos | Escopo/conteúdo/visões gerenciais | Não vender feature inexistente |
| PD-13.2 | AINDA REPRODUZÍVEL | ContextualHelpTooltip órfão; ModuleHelp existe | Cobertura prometida das métricas | Explicação alcançável sem mouse |
| PD-1.2, PD-1.3, PD-2.1, PD-3.1, PD-3.4, PD-4.2, PD-4.3, PD-4.5, PD-5.5, PD-6.1, PD-6.3, PD-6.4, PD-7.4, PD-8.1, PD-8.3, PD-9.2, PD-9.3, PD-10.1, PD-10.5, PD-11.5, PD-12.2a, PD-13.3, PD-13.4, PD-14.2, PD-14.4, PD-14.5 | RESOLVIDO NO CÓDIGO | index.css tokens; MotionConfig; drawer/form; lazyPages; useFormDraft; NotificationCenter; filtros/presets; SessionExpiryHandler/ConcurrentEditError | Visual/produção continuam pendentes | Não generalizar cobertura universal |
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
| BD-1, BD-4, MR-10, RA-2 | OBSOLETO/DUPLICADO | `.github/workflows/restore-drill.yml` já existe | Não equivale replay integral/periódico | Agente DR comprova cadeia completa |
| BD-5, BD-6, BD-7, BD-8, BD-9, BD-10, PM-39, PM-44, DA-2 | NÃO VERIFICADO NO RUNTIME | Migrations históricas; canônico não consultado nesta unidade | Validar catálogo/constraints/índices | Não inferir ausência por grep |
| PM-45, RA-4, DD-1, DG-1, DG-2, DG-4, GS-2, SE-3 | NÃO VERIFICADO NO RUNTIME | types canônicos atualizados; scripts/tabelas-ausentes fotografia antiga | Confrontar schema real/DDL/doc | Inventário remoto atual, sem alegar 119 ausências |
| TQ-3, PM-40, MR-O3 | AINDA REPRODUZÍVEL | `tsconfig.app.json:17-19` permissivo | Endurecimento incremental | strictNullChecks real |
| PM-41 | NÃO VERIFICADO NO RUNTIME | Strict desligado não comprova cada bug de null | Cenário concreto | Fixture reproduz falha antes de reparar |
| TQ-4, ON-1, ON-2, ON-3, ON-4, ON-5 | AINDA REPRODUZÍVEL | `docs/ONBOARDING.md:28,39,80,89-90,108`; README:151 | Atualizar porta/scripts/inventário/exemplo | Onboarding executável |
| TQ-6, SE-2, PR3-3 | AINDA REPRODUZÍVEL | `.github/workflows/ci.yml` sem deno test/lint/gitleaks | Gates backend/secrets | Teste real executado no pipeline |
| TQ-11 | AINDA REPRODUZÍVEL | bun.lock/bun.lockb/package-lock; @types em dependencies | Lockfile/deps consistentes | Instalação reprodutível |
| TQ-12 | AINDA REPRODUZÍVEL | `src/lib/sanitize.ts:18` options após restrições | Precedência segura | Override não reabre atributo proibido |
| PM-47, RA-5, AR-7 | AINDA REPRODUZÍVEL | `vitest.config.ts` sem thresholds | Piso por domínio | Regressão cobertura bloqueada |
| PM-48, MR-O4, RA-3, CE-1 | NÃO VERIFICADO NO RUNTIME | CONTRIBUTING:proteção alegada; certificação histórica com aviso | API de proteção/CI pelo agente Infra | Não repetir protected:false antigo |
| PM-49, PM-50, SE-5 | AINDA REPRODUZÍVEL | DocsPage/ONBOARDING ainda contradizem fonte | Relatório reconciliado honesto | Sem selo universal por código existente |
| TD-7, QF-5b, TD-P4 | NÃO VERIFICADO NO RUNTIME | Migration de partições; dívida DEFINER; promessa cross-region | Catálogo/jobs/infra reais | Prova remota sem supor ausência |
| TD-P1, AR-6 | AINDA REPRODUZÍVEL | `src/hooks/useMFAGuard.ts:18,30-34`; Auth sem challenge | Política por papel/desafio/enforcement | Admin AAL1 conclui desafio; RLS validada |
| TD-P3, TD-P6 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | TECH_DEBT:32,35 propõe worker/RSC condicionais | Decisão arquitetural, não hotfix | Benefício mensurado antes migração |
| TD-P9, AR-5 | AINDA REPRODUZÍVEL | `src/pages/BIAvancado.tsx` sem drag/drop | Grid persistido | Arrastar/reabrir preserva layout |
| SE-1 | AINDA REPRODUZÍVEL | fileValidation só useDealRooms; CompanyLogoUpload/ContactAvatarUpload/InteractionForm sem magic bytes | Validar demais uploads | MIME falso rejeitado |
| SE-4, ER-1 | AINDA REPRODUZÍVEL | `docs/er-diagram.md:5-7` vazio | Gerar ER real | FKs presentes/atualizadas |
| AV-F5, AV-F6, AV-F7 | AINDA REPRODUZÍVEL | `scripts/migration/verify/index-corruption-amcheck.sql:20`; `invalid-indexes-guard.sql:12,23`; `deadlock-frequency-monitor.sql:4` | Skips/schemas/janela | >100 índices; não-public; janela curta |
| AV-S, AV-CI | AINDA REPRODUZÍVEL | 21 scripts de cenário; run-all.sh sem chamador workflow | Completar/automatizar; runtime não executado | Cenários prometidos executados |
| AR-1, AR-4, CS-REF, CS-2, QA-1..7, PR3-4, PR3-5 | OBSOLETO/DUPLICADO | Inventário legado; useNLPAutoAnalysis/useCSATSurveys atuais; deploy-all versionado; docs/PR3_CLOSED_REFERENCE | Arquivar/referenciar substitutos | Sem prometer símbolos/resultados ausentes |
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

# Contratos frontend/backend

**Origem:** docs/lacunas/E_contratos_front_backend.md; docs/lacunas/B1_reverificacao_estado_01_04.md.

# Contratos — reconciliação E + B1

## Lacunas graves e tarefas concretas

1. **RPCs incompatíveis:** corrigir parâmetros de mesclar empresas, registrar interação e criar deal rápido; testar botões e outro proprietário.
2. **Deduplicação não atômica:** `useMergeRecords` atualiza, transfere e exclui separadamente. Falha intermediária deixa alterações parciais. Usar transação preservando overrides/vínculos; cadastro composto não corrige esse caminho.
3. **Proxy/views divergentes:** `user_id` injetado onde não existe no tipo canônico. Corrigir projeção/RPC com isolamento, nunca simplesmente retirar o filtro. E-T07 está parcialmente corrigido; atividades sem vínculo foram desativadas.
4. **Dados/envios fictícios:** EQ, velocidade, metaprogramas, Analytics/MarketingHub; sequências gravam `sent` antes da entrega, nurturing/assinatura sem envio. Campanhas corrigiram a mentira, mas só preparam destinatários.
5. **Cron bloqueia UI/internos:** separar autorização manual/interna/agendada; conferir jobs remotos. Sequências/nurturing ainda usam `.catch` em builders: confirmei localmente `typeof builder.catch === 'undefined'`, sem rede.
6. **E-C01 corrigido após esta revisão:** a ficha 360 usa `contact_id` e o código mergeado da auditoria reconhece esse identificador. Restam aplicação da migration e teste autenticado da leitura.

## Base e limites

Snapshot **a2b73c7dee837f19aa756e6afe385eba837b5d54**; HEAD/origin/main iguais após fetch. Checkout limpo, não shallow; sem alteração versionada/escrita SQL/publicação. Anexos/consolidado lidos; Graphify (`9e96cb5`) apenas orientou, código confirmou.

**49 testes dirigidos passaram, nove arquivos**; roundtrip do snapshot sem localStorage também passou. [PR 108](https://github.com/adm01-debug/Singu_V2/pull/108) (`df79c59`) e [PR 109](https://github.com/adm01-debug/Singu_V2/pull/109) (`55b6ad7`) abertos; CI/Preview não prova publicação.

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
| E-C01 | RESOLVIDO NO CÓDIGO | PR 109 mergeado; T:442–477; H/useActivityLogger.ts:27–35 | `contact_id` reconhecido; migration e runtime autenticado pendentes | Lista NULL+contagem; individual UUID; troca/renovação de conta |
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
| M38, M39, M42, M43, M44 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | F/smart-notify/index.ts:10; F/firecrawl-scrape/index.ts; F/incoming-webhook/index.ts:181–186; F/bitrix24-webhook/index.ts:40 | Evolution/Firecrawl/Bitrix adiados; HMAC/middleware obrigatório preservado | Sem pedidos de secrets; nenhuma alegação de integração validada |
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

# Edge Functions

**Origem:** docs/auditoria/02_ACHADOS_EDGE_FUNCTIONS.md; docs/lacunas/F_edge_functions.md.

# Reconciliação — unidade edge

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
| EF-3 | AINDA REPRODUZÍVEL | _shared/fetch-utils.ts existe; lux-trigger:27–35/evolution-bitrix-connector têm fetch sem deadline | A alegação “nenhum timeout” é obsoleta; cobrir chamadas restantes | Provedor travado termina em prazo limitado |
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
| F/F15,INV/24 | RESOLVIDO NO CÓDIGO | crm-automation-monitor:49,63 usa bestEffortWrite | Sem chamador ainda; produção NR | Gravação auxiliar sem TypeError e widget alimentado |
| F/F16,F/F23,INV/25,INV/40 | AINDA REPRODUZÍVEL | cs-health-recalc:99–105;enrich-contacts:152–155 | Upsert omite campos obrigatórios; enriquecimento ainda órfão | Atualizar existente sem inserir linha incompleta |
| F/F19,INV/32 | RESOLVIDO NO CÓDIGO | disc-analyzer:267,282 usa bestEffortWrite | Service-role downstream ainda incompatível com withAuth; IA AD | Correção do catch isolada passa; chamada interna autorizada |
| F/F20,INV/33 | RESOLVIDO NO CÓDIGO | dual-write-proxy:2,37–41 | Execução pelo legado NR; kill-switch B/N04 quebrado | Rejeita segredo inválido; retorno indisponível explícito |
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

# Banco, migrations, CI e operação

**Origem:** docs/auditoria/04_ACHADOS_BANCO.md; docs/auditoria/05_ACHADOS_TESTES_BUILD_DOCS.md; docs/lacunas/G_banco_de_dados.md; docs/lacunas/H_ci_testes_deploy_infra.md; docs/lacunas/C2_adrs_migracao_dr_operacao.md.

# Reconciliação banco/CI — Singu V2

## Lacunas graves e tarefas concretas

1. **Ledger divergente:** Preview falhou: “Remote migration versions not found in local migrations directory”. Inventariar antes de `repair`; aceite: ledger reconciliado/replay descartável.
2. **`main` desprotegida:** API `404 Branch not protected`, rulesets `[]`. Exigir PR/checks/review; conferir separadamente bloqueio Vercel→CI.
3. **Crons HTTP incorretos:** projetos antigos, dump vazio, Forecast/DLQ/heartbeat sem schedules. Inventariar remoto/corrigir autenticação sem duplicar; aceite: filas drenam/séries recebem amostras.
4. **Retenção incompatível:** INSERT de auditoria usa colunas antigas; `EXCEPTION` reverte DELETE/contadores. Validar purge+auditoria em clone e backup antes de reparo destrutivo.
5. **Gates incompletos:** RLS aceita SKIP e ignora buracos anteriores a `max(version)`; E2E de escrita desabilitado, Deno fora do CI. Isolar ambiente e exigir jornadas sem SKIP.
6. **DR/alertas sem recorrência comprovada:** restore manual/PR; promtool com entrypoint errado; receivers placeholders. Agendar restore de backup persistido e comprovar entrega de alerta. Isso não certifica PITR/Storage/replay.

## Base e significado dos estados

Snapshot `a2b73c7dee837f19aa756e6afe385eba837b5d54` limpo; 456 migrations. Documentos lidos, Graphify confrontado com código. **24 testes locais** SQL/CORS/imports passaram; não certificam runtime.

**R** = RESOLVIDO NO CÓDIGO; **P** = CORRIGIDO EM PR ABERTO; **A** = AINDA REPRODUZÍVEL; **N** = NÃO VERIFICADO NO RUNTIME; **O** = OBSOLETO/DUPLICADO; **D** = DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA. R≠publicado; A inclui incompatibilidade estática demonstrável.

Evidências: **CI** `.github/workflows/ci.yml`; **RLS** `tests/rls/run.sh`; **DRW** `.github/workflows/restore-drill.yml`; **T** `src/integrations/supabase/types.ts`; **M(timestamp)** = SQL de prefixo único em `supabase/migrations/`. Linhas do snapshot.

**API verificada:** [CI verde](https://github.com/adm01-debug/Singu_V2/actions/runs/38248551586), [RLS verde](https://github.com/adm01-debug/Singu_V2/actions/runs/38248551504), [Preview falhou](https://github.com/adm01-debug/Singu_V2/runs/114809119351), [restore anterior verde](https://github.com/adm01-debug/Singu_V2/actions/runs/38163111058). [108](https://github.com/adm01-debug/Singu_V2/pull/108)/[109](https://github.com/adm01-debug/Singu_V2/pull/109) abertos, heads `df79c596`/`55b6ad79`; rollback informado pelo pai≠aplicação permanente. Não resolvem integralmente G05/BD-11.

**Provas distintas:** replay vazio=toda cadeia em banco novo; restore=snapshot consistente via dump/restore em cluster distinto; fixture RLS=pendentes+cenário em ROLLBACK, sem reconstrução/persistência. Dump do drill (`create-drill-backup.mjs:43–70`) usa `--no-owner --no-privileges`: não certifica ACLs completas/secrets/Storage/jobs/PITR.

## Matriz completa

IDs agrupados preservam rastreabilidade; última coluna é pendência/aceite.

### Auditoria de banco e testes

| IDs | Estado | Evidência | Falta / aceite |
|---|---|---|---|
| BD-1 | NÃO VERIFICADO NO RUNTIME | M(20260317213904):1 DROP; M(20260512184042):24 recria deals | Não alegar perda histórica; replay e comparação de backup pré/pós. |
| BD-2 | RESOLVIDO NO CÓDIGO | M(20260720000023):95–132 cria social_insights/RLS | Confirmar objeto/contrato remoto e consulta pelo usuário. |
| BD-3 | NÃO VERIFICADO NO RUNTIME | Hardening posterior em M(20260721000071); guards de catálogo existentes | Conferir definição final/search_path de cada assinatura, não contar CREATE históricos. |
| BD-4 | OBSOLETO/DUPLICADO | Migrations são forward-only; duplicações históricas não equivalem a rerun necessário | Reconstrução/ledger seguem em G07/H-04; testar cadeia inteira. |
| BD-5, BD-6 | NÃO VERIFICADO NO RUNTIME | Busca em migrations não encontra índice simples/unicidade contacts(email); houve drops de trigram | Medir plano real; decidir unicidade por proprietário antes de constraint. |
| BD-7, BD-8, BD-9, BD-10 | NÃO VERIFICADO NO RUNTIME | Auditoria 04 declara heurísticas | NO ACTION é válido; verificar operação/índices/JSON/escala em catálogo/testes. |
| BD-11 | NÃO VERIFICADO NO RUNTIME | M(20260711152812):6 DROP audit_log CASCADE | Backup/paridade necessários; correção de auditoria no PR109 não restaura dados históricos. |
| TQ-1 | RESOLVIDO NO CÓDIGO | CI:77–81 executa lint; check do snapshot success | Manter gate; JS sem regras é H-10. |
| TQ-2 | OBSOLETO/DUPLICADO | eslint.config.js:27 proíbe any; exceções tipadas/supressões persistem | Contagem antiga não é atual; aceitar só exceções justificadas. |
| TQ-3, ADR-018-1 | AINDA REPRODUZÍVEL | tsconfig.app.json:17–19 mantém strict/noImplicitAny/nullChecks false | Ratchet null/strict com testes de null reais. |
| TQ-4, TQ-13, H-53, ADR-IDX-1, HF-2 | AINDA REPRODUZÍVEL | README; docs/adr/README:7–14; inventários divergem de 456 migrations/T | Atualizar números por snapshot; índice sem ADR duplicado. |
| TQ-5 | OBSOLETO/DUPLICADO | CI:113–114 roda Vitest/coverage, check success | 5.494 é fotografia antiga; não inferir cobertura alta. |
| TQ-6, H-17 | AINDA REPRODUZÍVEL | CI completo sem deno test/check; testes Deno existem | Rodar backend no CI; antiga “ausência total” é obsoleta. |
| TQ-7 | RESOLVIDO NO CÓDIGO | index.html:9 e vercel.json headers têm CSP | Conferir headers publicados; inconsistências restantes H-32. |
| TQ-8 | RESOLVIDO NO CÓDIGO | vite.config.ts:60–64 runtimeCaching=[] | Logout/relogin sem PII em caches; não adicionar cache de dados implicitamente. |
| TQ-9 | RESOLVIDO NO CÓDIGO | CI:37–58 exige PG*/E2E secrets | Pulados por fixture/escrita continuam H-18/H-28. |
| TQ-10 | OBSOLETO/DUPLICADO | setup-node/upload-artifact usados em CI que concluiu success | Alegação de versões inexistentes refutada pelo run. |
| TQ-11, H-33 | AINDA REPRODUZÍVEL | package-lock.json, bun.lock, bun.lockb presentes | Escolher npm e demonstrar instalação reprodutível única. |
| TQ-12 | AINDA REPRODUZÍVEL | src/lib/sanitize.ts:9–18 espalha options após allowlist | Travar opções de segurança; payload adversarial rejeitado. |

### Banco, contratos e produtores

| IDs | Estado | Evidência | Falta / aceite |
|---|---|---|---|
| G01, G02, G32, H-47, MDDL-1 | AINDA REPRODUZÍVEL | M(20260417120721):14–24; M(20260512105729):6–11; ddl/12_cron_jobs.sql:3 | Crons com ref/header errado; inventário remoto + execução única no canônico. |
| G03, G04, G22, G23, G37 | AINDA REPRODUZÍVEL | forecast-snapshot-cron:8; revops-snapshot-builder:20; requireCronSecret e nenhum schedule correspondente em migrations | Versionar workers/jobs; verificar drenagem e histórico sem duplicatas. Quantidade histórica não é inventário remoto. |
| G05 | NÃO VERIFICADO NO RUNTIME | registrar_pedido_erp sem integração comprovada; PR108 corrige consulta de rodízio, não ingestão ERP | Provar compra real alterando elegibilidade; não concluir customer_purchases vazia sem SQL. |
| G06 | NÃO VERIFICADO NO RUNTIME | M(20260723150429):22–113 service_only; M(20261011224000):15–28 restaura companies com owner | Revisar grants por tabela/coluna/RLS; dois proprietários e anon. Não reabrir grants globalmente. |
| G07, G35, MDDL-2, HP2-1, SCR-1 | AINDA REPRODUZÍVEL | T:66190/66343 tipa RPCs sem DDL correspondente; vw_singu_data_health fora de migrations; Preview falhou | Baseline canônico + objetos/ACLs versionados; replay vazio e paridade. Scripts avulsos não substituem ledger. |
| G08 | RESOLVIDO NO CÓDIGO | T:60950 contém Functions; package.json:14 typecheck real | Falta gate automático de drift e prova de replay, não regenerar cegamente. |
| G09 | AINDA REPRODUZÍVEL | useEmailCampaigns.ts:85–140 só materializa pending, deliveryConfirmed=false | Sem envio comprovado; provedor/worker e aceite real antes de sent. Simulação antiga foi retirada. |
| G10, G18 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | send-sms-campaign:27/74; useWhatsAppData:14 | Twilio/WhatsApp adiados; opt-out/produção de KPIs exigidos antes de ativar. |
| G11 | NÃO VERIFICADO NO RUNTIME | M(20260721000071):75–379 referencia tabelas fora do DDL local | Confirmar contratos e necessidade; executar funções escolhidas em clone, ou retirar promessa. |
| G12 | AINDA REPRODUZÍVEL | sequence-processor:359; nurturing-runner:145; nenhum CREATE das duas RPCs em migrations | RPCs atômicas versionadas; contadores sob concorrência. |
| G13 | AINDA REPRODUZÍVEL | incoming-webhook:316 e process-webhook-dlq:16 mapeiam note→notes; nenhum CREATE notes | Mapear destino válido/rejeitar configuração; replay sem falso sucesso. |
| G14, G26, G33, G36 | NÃO VERIFICADO NO RUNTIME | external-data allowlist; definições/legados listados em G:542/554/561/564 | Triar uso indireto, público e jobs antes de DROP; chamadas reais/substituição comprovadas. |
| G15 | OBSOLETO/DUPLICADO | Modelo legado versus rodízio por ondas, src/types/rodizio.ts | Decisão de lead avulso separada; não excluir dados sem inventário. |
| G16, G17, G19, G20 | NÃO VERIFICADO NO RUNTIME | useTriggerAnalytics:13–25; useDISCConversionMetrics:18; useRFMSegmentConfig:13; useMarketingInsights:109 | Confirmar produtores/dados; escritor local ausente≠tabela vazia. |
| G21 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | call_logs lida em useUnifiedHistory:125, sem integração de telefonia comprovada | Escolher origem/consentimento antes de prometer análise de chamadas. |
| G24 | AINDA REPRODUZÍVEL | M(20260721000055):25–26 move MVs externas; refresh_daily_kpis sem schedule local | Versionar MV e refresh; dados novos refletidos no KPI. |
| G25, MEB-4 | AINDA REPRODUZÍVEL | M(20260711152812):64–75 cria janela móvel; ddl/11_partitions até 2026-12 | Job periódico; testar virada anual. Data final dinâmica depende da aplicação, não sempre dezembro. |
| G27 | AINDA REPRODUZÍVEL | M(20261005230000):158/183/229 define funções sem vínculos correspondentes; enqueue_crm_reprocess idem | Inventariar pg_trigger e versionar vínculos; DML em replay gera efeitos uma vez. |
| G28 | AINDA REPRODUZÍVEL | M(20260509184703):10–23 trigger recorrente vazio | Regra anual/leap-day com teste, ou remover promessa. |
| G29, ADR-004-2 | NÃO VERIFICADO NO RUNTIME | M(20260721000044):1–18 placeholder HIBP | Configuração Auth remota e teste de senha comprometida; SELECT 1 não habilita HIBP. |
| G30, ADR-015-2 | AINDA REPRODUZÍVEL | M(20260723112943):94–110 auditoria incompatível/EXCEPTION | Dry-run, backup, teste de purge+auditoria e política aprovada. |
| G31 | AINDA REPRODUZÍVEL | RLS:30–58/68–80; CI só executa tests/rls | Expandir rodízio/retenção/filas; gate sem SKIP e em clone. Contagens antigas não são cobertura atual. |
| G34 | AINDA REPRODUZÍVEL | M(20260723150429):33 v2 service_only; uso useRecommendationAudit:25 | DDL/RPC/RLS versionados; usuário dono lê auditoria sem exposição cruzada. |
| G38, ADR-017-2 | AINDA REPRODUZÍVEL | useConnectionAnomalies:73 tem invocação manual; detector:54 withAuth; sem schedule/rota de logs | “Sem chamador” absoluto é antigo; ligar rota/agendamento e observar anomalia persistida. |

### CI, deploy e experiência operacional

| IDs | Estado | Evidência | Falta / aceite |
|---|---|---|---|
| H-01, ADR-010G-2 | RESOLVIDO NO CÓDIGO | CI:70 + package.json:14 usa -p app/node | Confirmar erro proposital bloqueia; strict permanece pendente. |
| H-02 | AINDA REPRODUZÍVEL | API protection 404, rulesets [] nesta revisão | Impedir push/merge sem checks/review; não basta CONTRIBUTING. |
| H-03 | NÃO VERIFICADO NO RUNTIME | vercel.json build não declara dependência de Actions | Conferir Deployment Checks no projeto; deploy rejeitado com CI vermelho. |
| H-04 | AINDA REPRODUZÍVEL | Preview do snapshot: versões remotas ausentes localmente | Reconciliação de ledger + replay; preview verde de PR108/109 não prova main migrada. |
| H-05, RB-1 | AINDA REPRODUZÍVEL | Nenhum workflow functions deploy; deploy-all.sh manual; config.toml:1 antigo | Pipeline pós-CI, inventário verify_jwt e paridade de publicação. |
| H-06, ADR-019-4 | AINDA REPRODUZÍVEL | monitoring-lint.yml:22–23 sem --entrypoint promtool | Validador rejeita regra inválida e passa regra válida. |
| H-07 | AINDA REPRODUZÍVEL | lighthouserc.json:13–23 só warn/storage público | Budgets bloqueantes em páginas relevantes, relatório privado. |
| H-08 | AINDA REPRODUZÍVEL | dependabot.yml:1–31 sem commit-message; CI:26 commitlint | Título de atualização válido e testes executados, não só merge permitido. |
| H-09 | AINDA REPRODUZÍVEL | CI:26 título interpolado; sem permissions/concurrency/timeout no CI | Env segura e mínimos privilégios; título inerte. DRW já tem permissions/timeout. |
| H-10 | AINDA REPRODUZÍVEL | eslint.config.js:12 somente ts/tsx | Regras JS/mjs/cjs efetivas; falha sintética detectada. |
| H-11, ADR-022-1 | AINDA REPRODUZÍVEL | check-backend-linter-baseline.mjs:17–23 aceita stdin vazio; ausente CI | Entrada obrigatória/catálogo canônico; drift bloqueia. |
| H-12 | AINDA REPRODUZÍVEL | vitest.config.ts:5–26 sem thresholds | Ratchet inicial medido, regressão de domínio crítico bloqueada. |
| H-13 | NÃO VERIFICADO NO RUNTIME | CI:18 Node20; documentação diz Vercel24 | Confirmar versão atual do host e fixar versão comum. |
| H-14, HF-1, HP2-2, HP3-1 | NÃO VERIFICADO NO RUNTIME | PLANEJADO §0:37 credenciais retiradas, rotação não comprovada | Usuário confirma revogação/rotação; consultar scanning sem expor valores. |
| H-15 | NÃO VERIFICADO NO RUNTIME | Dependabot configurado, majors ignorados; CI:84 audit high+ prod | API de alerts/updates e triagem; não repetir disabled histórico como fato atual. |
| H-16 | AINDA REPRODUZÍVEL | .github/workflows sem SAST | Análise JS/TS bloqueia fixture vulnerável; nunca bypass de política. |
| H-18, H-19 | AINDA REPRODUZÍVEL | e2e/support/auth.ts:10–15 exige E2E_ALLOW_WRITES; CI:95–102 não define; RLS remoto | Projeto isolado; criar contato/mover deal/concluir tarefa sem SKIP. |
| H-20 | NÃO VERIFICADO NO RUNTIME | Suítes espelho/grep descritas em H:78–110 | Revisão por teste e mutation/bug injection; quantidade antiga não certifica casos atuais. |
| H-21, LT-1 | NÃO VERIFICADO NO RUNTIME | tests/load/*.js; workflow sem k6; sem load-results | Executar carga somente staging com RPS/p95/erros registrados. |
| H-22, SCR-3 | AINDA REPRODUZÍVEL | scripts/check-edge-cors.test.mjs fora do include Vitest/CI | node --test no gate; falha do guard detectada. |
| H-23 | AINDA REPRODUZÍVEL | supabase/tests/get_contact_sidebar_by_phone.sql fora de RLS:46 | Integrar runner; dono/terceiro e trigger legado testados. |
| H-24, SCR-4, ADR-019-1 | AINDA REPRODUZÍVEL | CI:67/135 só dois guards; verify/tests/run-all.sh não chamado | Cenários locais + full-audit agendado read-only; artefatos sem PII. |
| H-25 | AINDA REPRODUZÍVEL | teste a11y de componentes; Lighthouse accessibility warn | Axe em jornadas/rotas; violação crítica bloqueia. |
| H-26 | NÃO VERIFICADO NO RUNTIME | gap-modules-smoke.spec.ts asserções de renderização | Validar pergunta/resposta e conteúdo LP; render não prova negócio. |
| H-27 | AINDA REPRODUZÍVEL | check-rls-baseline.mjs:35–46/57/69 só avisa rede/auth ausente | Erro HTTP/rede/credencial falha; baseline inclui domínios críticos. |
| H-28 | AINDA REPRODUZÍVEL | RLS:68–80 SKIP vira warning | SKIP obrigatório reprova, inclusive fixture sem objeto. |
| H-29 | NÃO VERIFICADO NO RUNTIME | Vercel canônico confirmado pelo pai; docs mantêm Lovable | Conferir tráfego/redirect/desligamento do host antigo. |
| H-30, H-31, MEF-1 | AINDA REPRODUZÍVEL | public/_headers antigo; supabase/config.toml:1 hjhth… | Alinhar config/canonical/header ao host; verificar destino antes de deploy. |
| H-32 | AINDA REPRODUZÍVEL | useIPValidation:16 ipapi.co versus CSP de index/vercel | Permissão/proxy deliberado e requisição sem violação CSP. |
| H-34 | NÃO VERIFICADO NO RUNTIME | package.json mantém deps de teste em dependencies | Conferir classificador transitivo/audit antes de mover; instalar sem dev. |
| H-35, ADR-019-2, ADR-019-3 | NÃO VERIFICADO NO RUNTIME | alertmanager.yml:12–44 ordem maintenance/receivers placeholders; sem scrape config | Provisionamento externo não inspecionado; alerta real recebido e silence funciona. |
| H-36, ADR-019-5, ADR-019-6 | AINDA REPRODUZÍVEL | db-guards.yml runbook_url lovable/repo; scripts/monitoring regras fora do lint | Unificar lint/runbooks/exporters; alerta abre link correto. |
| H-37, RB-6, MEF-3 | AINDA REPRODUZÍVEL | system-health-snapshot/cleanup não constam migrations; system-health escreve sob demanda | Agendar, distinguir sem amostra de 100%; seis jobs AI Gateway em M(20261006140000):903–914 não substituem heartbeat. |
| H-38, DR-3, MMR-4 | NÃO VERIFICADO NO RUNTIME | Scripts sintéticos sem workflow agendado; config uptime externo não consultada | Prova externa de detecção/entrega, não inferir monitor inexistente. |
| H-39, ADR-010G-1 | AINDA REPRODUZÍVEL | useWebVitals:35–55 sessionStorage/limiar; ErrorLogs filtros severidade/texto | Agregação/filtro por fonte; métrica real com amostras. |
| H-40, H-41 | AINDA REPRODUZÍVEL | file: três PNG são ASCII base64; mask-icon.svg ausente | PNG binários válidos/Safari asset; instalar PWA. |
| H-42 | AINDA REPRODUZÍVEL | send-push-notification:44–51 declara aes128gcm mas envia JSON puro | Existe handler em public/sw-push.js:6; corrigir VAPID/criptografia/registro, receber push real. |
| H-43 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | vite.config:64 sem cache runtime | Definir escopo offline/PII antes de persistência; não prometer offline-first. |
| H-44 | AINDA REPRODUZÍVEL | vite.config:35/38–54 sem lang/maskable dedicado | Manifest pt-BR/ícones/orientação aprovados. |
| H-45 | AINDA REPRODUZÍVEL | .env.example:11–18 omite APP_VERSION; errorReporting:101/117 tem fallback/publishable | ANON_KEY obsoleto; documentar versão e provar ingestão. |
| H-46, MEF-2 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | preflight-secrets.sh:16–19 só literais index; templates incompletos | Não solicitar Evolution/Bitrix adiados; completar preflight antes de ativar cada canal. |
| H-48 | AINDA REPRODUZÍVEL | apply-all.js:5 lê env, continua ferramenta avulsa fora CI | Inventariar uso/arquivar; credencial removida, rotação H-14. |
| H-49 | RESOLVIDO NO CÓDIGO | tmp_view_check.js:1–4 agora ESM/env, sem token embutido | Validar necessidade/arquivar; revogação histórica H-14. |
| H-50, PERF-1 | AINDA REPRODUZÍVEL | run_explain_analyze.py:11 admite simulação; artefatos congelados | Substituir conclusões por EXPLAIN real; não decidir índice por doc simulada. |
| H-51, SCR-2 | AINDA REPRODUZÍVEL | scripts/lint-providers.cjs ausente CI/package scripts | Integrar guard e injetar ordem inválida. |
| H-52 | AINDA REPRODUZÍVEL | graphify-out e types.ts.lovable.bak versionados | Política de artefatos; preservar grafo útil, eliminar churn deliberadamente. |
| H-54, SEC-1, SEC-3 | AINDA REPRODUZÍVEL | docs/SECURITY:12/54/79–80; strict false; exceptions cron/webhook/public | Corrigir promessas; JWT não é universal, typecheck já não é no-op. |
| H-55, BS-7 | RESOLVIDO NO CÓDIGO | DRW:29–30/66–107 snapshot restore, hash/contagens | Só manual/PR; DD-2 cobre recorrência. Não afirma restore completo/PITR. |
| H-56 | NÃO VERIFICADO NO RUNTIME | diag-db ausente main; histórico Actions citado no anexo | Conferir workflow ativo pela API antes de desabilitar; não usar como prova SQL. |
| H-57 | AINDA REPRODUZÍVEL | .dependency-cruiser.cjs no-orphans warn | Triagem/ratchet; não dropar consumidores externos. |
| H-58 | NÃO VERIFICADO NO RUNTIME | CI:104–110 retém relatório 30d; Playwright trace/vídeo | Inspecionar mascaramento/acesso dos artefatos sem expor PII; reter mínimo necessário. |

### ADRs, migração e recuperação: complementos sem duplicação

| IDs | Estado | Evidência | Falta / aceite |
|---|---|---|---|
| ADR-003-1, ADR-005-1, ADR-005-3 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | externalData breaker único; Lovable/terceiros deliberadamente adiados | Não pedir chaves; antes de ativar, breaker/402/credenciais no canônico. |
| ADR-004-1 | NÃO VERIFICADO NO RUNTIME | Auth usa broker Lovable; provider remoto não consultado nesta rodada | Login Google no backend canônico com callback correto. |
| ADR-004-3, SEC-2 | NÃO VERIFICADO NO RUNTIME | Baseline histórico; allowlist signup adicionada segundo pai | Medir signup/usuário sem role em suppliers/carriers/permissions; histórico≠atual. |
| ADR-004-4 | AINDA REPRODUZÍVEL | MFAEnrollmentBanner sem montagem no layout | Montar convite; teste de exibição/não duplicação. |
| ADR-005-2 | AINDA REPRODUZÍVEL | aiGatewayLogger sem importadores; fetch-utils telemetria real | Unificar/remover módulo/instrução morta; evento registrado. |
| ADR-006-1 | OBSOLETO/DUPLICADO | Policy uid prefix versus canais sufixo, hoje postgres_changes | Documento deve distinguir broadcast/presence; testar antes de canal privado. |
| ADR-007-1 | RESOLVIDO NO CÓDIGO | _shared/auth.ts:73/86–88 aceita Vercel e preview | OPTIONS publicado ainda precisa paridade; não repetir CORS antigo. |
| ADR-007-2 | NÃO VERIFICADO NO RUNTIME | Guard CORS/allowlist e endpoints excepcionais | Inventário OPTIONS/ADR das exceções; não inferir publicação do repo. |
| ADR-008-1, ADR-008-2 | AINDA REPRODUZÍVEL | eslint sem no-console; logger.structured sem chamadas | Regra/ponto real de emissão; contexto sensível não vaza. |
| ADR-008-3, RB-5 | NÃO VERIFICADO NO RUNTIME | tracing parcial; headers variam entre funções | Correlação front→edge→log por request-id em funções críticas publicadas. |
| ADR-009-1 | NÃO VERIFICADO NO RUNTIME | Limiter parcial; funções cron têm segredo e funções públicas variam | Inventariar endpoints expostos/custo e provar 429; SMS/integrações seguem adiados. |
| ADR-009-2, RB-3, DR-4 | OBSOLETO/DUPLICADO | _shared/rate-limit janela fixa; externalData breaker 30s | Atualizar valores/documentação; não implementar sliding window só por texto antigo. |
| ADR-010Z-1 | NÃO VERIFICADO NO RUNTIME | Validadores distribuídos; webhooks heterogêneos | Payload inválido rejeitado sem escrita; conferir contratos no domínio responsável. |
| ADR-012-1 | AINDA REPRODUZÍVEL | package.json version 0.0.0; CHANGELOG Unreleased | Release vinculado a SHA/deploy; tags remotas não reconferidas. |
| ADR-013-1 | NÃO VERIFICADO NO RUNTIME | M(20260420120250):25–31 fallback público determinístico | Confirmar GUC sem revelar chave; remover fallback/recriptografar com plano seguro se usado. |
| ADR-013-2 | AINDA REPRODUZÍVEL | health-aggregate:132–180 sem consumidor UI; SystemHealthWidget usa system-health | Fundir/consumir; degradação de conexão aparece. |
| ADR-013-3, ADR-014-2 | AINDA REPRODUZÍVEL | AdminConexoes:44 link; AppRoutes sem rota AdminConexoesLogs | Rota admin lazy válida, logs/DLQ acessíveis. |
| ADR-014-1 | AINDA REPRODUZÍVEL | useWebhookDlq:44/59 sem segredo; process-webhook-dlq:27 exige cron | Admin JWT escopado + job secreto; retry idempotente/dono correto. |
| ADR-014-3 | NÃO VERIFICADO NO RUNTIME | success_rate sob demanda, sem evidência de SLO histórico | Amostragem/alerta real em janela definida. |
| ADR-015-1 | AINDA REPRODUZÍVEL | M(20260723112943):39–66 não cobre audit_log/quotas | Política aprovada por domínio; retenção testada com backup. |
| ADR-017-1 | AINDA REPRODUZÍVEL | Nenhum mapping_drift em src/functions | Decidir/implementar evento e notificação de drift comprovável. |
| ADR-018-2, DR-5, RB-2 | AINDA REPRODUZÍVEL | useFeatureFlag:15 único uso é definição; RUNBOOK:36/391 usa provider inexistente | Kill switch real checado no backend/cache-only; desligamento sem deploy demonstrado. |
| ADR-018-3 | NÃO VERIFICADO NO RUNTIME | M(20261005230000):6–7 version; writes de companies mudaram para composto atômico | Todos os caminhos/edição de tags: usuário concorrente recebe conflito, não sobrescreve. |
| ADR-019-7, RB-8 | AINDA REPRODUZÍVEL | M(20261006140000) instrumenta observabilidade; query_telemetry só leitura | Instrumentar RPCs de negócio, latência/409/5xx com correlação. |
| ADR-020-1 | AINDA REPRODUZÍVEL | eslint.config sem require-description | Supressão sem motivo bloqueada; revisar exceções. |
| MEB-1, MEB-6, MMR-1, MPR-1 | NÃO VERIFICADO NO RUNTIME | Checklists/artefatos históricos não comprovam CDC/LGPD/reset | Arquivar execução/paridade/RPO/manifesto/métricas, sem fabricar sucesso retroativo. |
| MEB-2, MMR-3 | AINDA REPRODUZÍVEL | ai_cost_budget/backpressure ausentes migrations | Teto/backpressure e teste de pausa sob excesso; IA segue sem chave. |
| MEB-3, BS-1, BS-2, BS-3, BS-4, BS-5, BS-6 | NÃO VERIFICADO NO RUNTIME | Workflows sem backup diário externo; scripts Storage sem schedule | Conferir backup/PITR/bucket reais; cópia imutável, idade/alerta, restore Storage/secrets e failover medidos. |
| MEB-5 | AINDA REPRODUZÍVEL | Executive Brief:14–15 versus DR:9–10 e backup-strategy:7–8 | Uma meta RPO/RTO aprovada e ensaio que a meça. |
| MMR-2 | NÃO VERIFICADO NO RUNTIME | dual-write-proxy no repo com DUAL_WRITE_SECRET | Verificar uso/publicação antes de retirar superfície de bake. |
| MMR-5, RB-12, HX-1 | AINDA REPRODUZÍVEL | Runbooks Lovable versus Vercel; rotas inexistentes | Atualizar cutover/hotfix/status/preview; exercício por operador. |
| MPT-1, RB-10 | NÃO VERIFICADO NO RUNTIME | Template existe, diretório postmortems ausente | Registro dos incidentes reais; pode existir fora do repo. |
| HP3-2 | OBSOLETO/DUPLICADO | bitrix24-proxy/evolution-proxy antigos não existem | Inventário atual/exceções; não reparar endpoints inexistentes. |
| DR-1 | NÃO VERIFICADO NO RUNTIME | Runbook aponta Lovable; plano/PITR não consultados | Provar backup/PITR canônico e procedimento correto. |
| DR-2 | AINDA REPRODUZÍVEL | edge_function_logs não criada no DDL | Coletar 5xx real por logs/drain e alertar. |
| DR-6, DD-1, DD-2, DD-3, CH-1 | NÃO VERIFICADO NO RUNTIME | docs/dr-drills sem evidências mensais; DRW:3–11 sem schedule | Game day/restore recorrente em clone; RTO medido, timeline/artefatos; Q2 narrativo não certifica. |
| DR-7, RB-9 | AINDA REPRODUZÍVEL | Links on-call/template incompletos; checklist sem datas | Escala/canal e trilha de auditoria verificáveis. |
| BEC-1 | NÃO VERIFICADO NO RUNTIME | backup-encryption-check:28–45 valida decrypt/list, não KMS/Object Lock | Controles do bucket pela API; rotina sem backup cifrado não certifica criptografia. |
| RB-4 | OBSOLETO/DUPLICADO | system-health devolve 503 quando não healthy | Documentar semântica; monitor distingue degradado/queda. |
| RB-7 | AINDA REPRODUZÍVEL | RUNBOOK query health_check_history inexistente no DDL | Consulta correta sobre snapshots validada em clone. |
| RB-11 | NÃO VERIFICADO NO RUNTIME | Checklist de capacity sem coleta remota verificada | Medir pool/cold-start/volume/custo e ensaiar alerta. |
| SEC-4 | OBSOLETO/DUPLICADO | CI:84 só high+ prod, não “zero CVEs” universal | Redigir escopo exato e triar dependências. |
| SEC-5 | AINDA REPRODUZÍVEL | docs/SECURITY:64–73 sem contato definido | Canal responsável operável e política encontrável. |
| SKR-1, SKR-2 | AINDA REPRODUZÍVEL | rotate-jwt.sh:21–45 só timestamps; audit_log.action CHECK DML | Rotação canônica real e sinal em logs Auth; nunca chamar stub de rotação executada. |

## Limites finais

Sem consulta a secrets/SQL remoto/Vercel admin/backups/Auth/jobs/logs. LOVABLE_API_KEY, Evolution/WhatsApp, Bitrix, ElevenLabs, Firecrawl e Twilio adiados. Credenciais removidas≠revogadas. Cobertura integral: **232 IDs**, incluindo **112 C2** (resumo antigo diz 111). Contagens históricas/parser≠produção.
