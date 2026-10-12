# Banco, migrations, CI e operação

[Voltar ao índice da matriz reconciliada](MATRIZ_RECONCILIADA_20261012.md)


**Origem:** docs/auditoria/04_ACHADOS_BANCO.md; docs/auditoria/05_ACHADOS_TESTES_BUILD_DOCS.md; docs/lacunas/G_banco_de_dados.md; docs/lacunas/H_ci_testes_deploy_infra.md; docs/lacunas/C2_adrs_migracao_dr_operacao.md.

## Reconciliação banco/CI — Singu V2

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
| BD-2 | AINDA REPRODUZÍVEL | M(20260720000023):95–132 cria social_insights/RLS; H/useSocialInsights.ts:48–86 consulta campos ausentes nessa migration e retorna dados fictícios no catch | Alinhar contrato e produtor; remover fallback fictício; distinguir ausência de dados e erro na consulta autenticada. |
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
