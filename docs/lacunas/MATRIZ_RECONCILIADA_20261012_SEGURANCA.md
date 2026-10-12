# Segurança e documentos raiz

[Voltar ao índice da matriz reconciliada](MATRIZ_RECONCILIADA_20261012.md)


**Origem:** docs/auditoria/01_ACHADOS_SEGURANCA.md; docs/lacunas/A_docs_raiz_e_memoria_lovable.md.

## Reconciliação — segurança e documentos raiz

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
| SEC-2 | RESOLVIDO NO CÓDIGO | F/external-data:184–195,455–475,495–534,602–655: RLS nas leituras/RPC e ownership nas mutações | Confirmar RLS no remoto | Dois usuários reais não cruzam dados ou identidade |
| SEC-2b | AINDA REPRODUZÍVEL | F/external-data:504,531 encaminha selectedColumns sem validar relações embutidas | Aplicar whitelist também às relações de select | Relação fora da whitelist recusada antes da consulta |
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
| PLAN-04 | AINDA REPRODUZÍVEL | `package.json:14`; `.github/workflows/ci.yml:70` chama tsc, mas `.lovable/plan.md:16` declara tsgo e tsconfig.app.json permanece permissivo | Alinhar documentação e nível de checagem | Plano corresponde ao gate e suas limitações |
| IDX-01; CL-05 | AINDA REPRODUZÍVEL | `.lovable/memory/index.md:5`; H/useWinLoss.ts:479; `tsconfig.app.json` permissivo | Conciliar regras e exceções | Docs não afirmam zero any/400 linhas universal |
| IDX-02 | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | `.lovable/memory/index.md:9`; `ARCHITECTURE.md:125–126` proíbem módulos | Não construir; decidir buscas IA residuais de produtos | Inventário distingue leitura ERP de módulo novo |
| MEM-F01 | AINDA REPRODUZÍVEL | C/admin/AdminQuickActions.tsx:36–38 somente recarrega | Limpeza real ou rótulo honesto | Cache-alvo eliminado, não só reload |
| MEM-F02 | AINDA REPRODUZÍVEL | C/admin/AdminQuickActions.tsx:65–88 executa três pings | Renomear diagnóstico ou ligar testes | Não anunciar suíte completa por três checks |
| MEM-F03 | AINDA REPRODUZÍVEL | `src/pages/AdminDashboard.tsx:148–152,193–196` reutiliza dbStatus para WhatsApp, Email e Voice AI | Derivar cada integração de seu check real | Banco saudável não implica integração saudável |
| MEM-F04 | AINDA REPRODUZÍVEL | F/audit-analytics existe; busca src sem consumidor | Ligar agregação ou corrigir doc | UI consulta agregados reais, não só amostra local |
| MEM-F05 | NÃO VERIFICADO NO RUNTIME | F/cs-health-recalc:7 exige cron; promessa A:129 | Agenda/alertas | Recalcular em horário comprovado e alertar queda |
| MEM-F06 | AINDA REPRODUZÍVEL | H/useEmailCampaigns.ts:85–145 agora mantém pending e declara deliveryConfirmed:false | Produtor de entrega | Só enviado após confirmação; erro nunca simula envio |
| MEM-F07 | AINDA REPRODUZÍVEL | H/useApplyFoundEmail.ts:46–58 insere email, sem enqueue explícito; score vira verified | Confirmar trigger remoto/validação | Candidato entra na fila; score não equivale a entrega válida |
| MEM-F08 | AINDA REPRODUZÍVEL | C/admin/EmailPipelineStatus.tsx:30 definido, sem import consumidor | Montar widget ou retirar promessa | Dashboard renderiza dados reais |
| MEM-F10 | NÃO VERIFICADO NO RUNTIME | F/forecast-snapshot-cron:8 exige cron | Agenda/publicação | Snapshot diário recente, sem duplicação |
| MEM-F11 | AINDA REPRODUZÍVEL | H/useForecasting.ts:119–136; sem consumidor de useClosePeriod | Ação navegável | Fechar período grava estado e data |
| MEM-F12 | AINDA REPRODUZÍVEL | C/intelligence/GraphTab.tsx:45–55,215–255 anuncia BFS; busca sem algoritmo | Calcular caminho ou retirar BFS | Caminho usa arestas reais; desconectado não inventa conexão |
| MEM-F13; MEM-F16 | AINDA REPRODUZÍVEL | C/intent/IntentSignalCard e C/lead-scoring/LeadScoreCard definidos sem consumidores | Montar widgets previstos; não confundir outro LeadScoreCard | Contato/empresa exibem sinais e score servidor |
| MEM-F14 | AINDA REPRODUZÍVEL | C/lead-routing/LeadRoutingModule.tsx:62–73 remove redistribuição por inatividade sem equivalente; QuickDistributeWidget:31–44 oferece Rodízio DRY_RUN genérico | Repor redistribuição após N dias; atualizar referência à EF removida | Regra de inatividade seleciona e redistribui somente leads elegíveis |
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
