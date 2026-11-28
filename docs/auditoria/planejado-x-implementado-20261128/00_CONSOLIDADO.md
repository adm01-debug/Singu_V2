# Planejado × Implementado — auditoria exaustiva (28/11/2026)

> **Base:** `main` @ `e77396e` (26/11/2026, após a PR #382).
> **Banco de produção:** snapshot `origin/contexto:docs/contexto/supabase/`, gerado em 28/11/2026 16:13 UTC no projeto `pgxfvjmuubtbowutlide`.
> **Método:** leitura estática do código atual, com cada item conferido no HEAD (`arquivo:linha`, `grep` ou linha do snapshot do banco). O status escrito nos documentos antigos não foi copiado: tudo foi reverificado. Os pontos mais graves também foram conferidos à mão por amostragem.
> **Não executado:** build, typecheck, lint e testes (o ambiente da auditoria não tinha `node_modules`), além de chamadas reais às edge functions. O snapshot não lista as edges publicadas nem a configuração de Auth ("Management API desabilitada"). Tudo o que depende disso está marcado como ❔.
> **Substitui** `PLANEJADO_NAO_EXECUTADO.md` (12/10) e `docs/lacunas/MATRIZ_RECONCILIADA_20261012*.md`, que ficam como histórico.

## 1. Números

| Recorte | Anexo | Planejado | ✅ Implementado | 🟨 Parcial | ❌ Não implementado | ❔ Não verificável |
|---|---|---:|---:|---:|---:|---:|
| Núcleo do CRM | [01](01_core_crm.md) | 178 | 115 | 51 | 2 | 10 |
| IA, comportamental e voz | [02](02_ia_comportamental.md) | 123 | 89 | 26 | 3 | 5 |
| Marketing, automação e integrações | [03](03_marketing_integracoes.md) | 98 | 36 | 40 | 14 | 8 |
| Vendas, RevOps e CS | [04](04_vendas_revops.md) | 101 | 53 | 32 | 10 | 6 |
| Segurança, admin, LGPD, observabilidade e DR | [05](05_seguranca_admin_dr.md) | 107 | 53 | 35 | 9 | 10 |
| Plataforma: banco, edges, CI e testes | [06](06_plataforma.md) | 69 | 27 | 21 | 15 | 6 |
| UX e promessas de documentos | [07](07_ux_docs.md) | 164 | 42 | 63 | 31 | 28 |
| **Total** | | **840** | **415 (49%)** | **268 (32%)** | **84 (10%)** | **73 (9%)** |

Há **425 itens pendentes** (🟨 + ❌ + ❔). Cada um está listado, com fonte, evidência e o que falta, nas tabelas dos anexos (IDs `CORE-`, `IA-`, `MKT-`, `REV-`, `SEG-`, `PLT-`, `UX-`).

Alguns itens aparecem em mais de um anexo porque cada recorte avalia um risco diferente do mesmo ponto:
- `UX-002` = `REV-017` (rota `/eventos` sem proteção).
- `PLT-019` = `SEG-017` (views SECURITY DEFINER).
- `MKT-049` = `REV-038` = `UX-007` (dashboards embeddable).
- `SEG-005` = `UX-008` (SSO).
- `PLT-008` = `UX-027` (limite de 400 linhas).

**Legenda:**
- 🟨 **Parcial:** existe só parte do item. Exemplos: tabela sem tela, tela sem backend, edge sem chamador ou sem cron, dado fictício, contrato front × banco quebrado ou só documentação.
- ❔ **Não verificável:** depende de runtime, de um secret ou de um painel externo.

## 2. Leitura para decisão: as causas que explicam a maior parte dos pendentes

1. **O proxy `external-data` força o filtro `user_id` em relações que não têm essa coluna.**
   - Evidência: `supabase/functions/external-data/index.ts:324-326`.
   - Em produção, 24 relações liberadas não têm `user_id`, e 22 delas alimentam telas do CRM.
   - Efeito: a Ficha 360 fica sem interações e as abas Comercial, Comportamental e Dados do contato dão erro (`CORE-001`, `CORE-003`, `CORE-010`, `CORE-011`).
   - Ressalva: pressupõe que a edge publicada é igual ao HEAD, o que não foi verificado (`CORE-063`).
2. **Há tabelas que as telas leem, mas que nada grava.**
   - Tabelas: `purchase_history`, `customer_purchases`, `eq_analysis_history`, `hidden_objections`, `client_values`, `decision_criteria`, `disc_conversion_metrics`, `contact_time_analysis` e `neuro_behavioral_history`. Todas têm 0 linhas em produção.
   - Efeito: RFM, ofertas, EQ, objeções ocultas e a ativação de carteira rodam sem dado (`IA-002` a `IA-011`, `REV-001`).
3. **Os canais de saída não entregam nada.**
   - O motor de regras de `/automacoes` não executa nada (`MKT-041`).
   - O nurturing não avança de etapa (`MKT-001`).
   - O SMS falha no insert (`MKT-002`).
   - Não há disparo de campanha de e-mail (`MKT-042`).
   - O webhook de WhatsApp responde 403 a tudo, porque `whatsapp_instances` está vazia e nenhuma tela a preenche (`MKT-003`, `MKT-014`).
4. **Há contratos quebrados entre o front e o banco real.**
   - `metaprogram_analysis` tem 6 das 12 colunas pedidas (`IA-001`; conferido: `src/hooks/useMetaprogramAnalysis.ts:136` × snapshot).
   - Há 4 buckets de storage que não existem: `interaction-attachments`, `interaction-audios`, `contact-avatars` e `company-logos` (`CORE-005` a `CORE-008`).
   - `complete_task` tem duas assinaturas em produção, então a chamada fica ambígua (`CORE-002`).
   - A tabela `alerts` recusa os tipos que os produtores gravam (`CORE-004`).
   - A importação e a exportação de empresas usam colunas que não existem (`CORE-009`, `CORE-017`).
5. **O banco e o Git estão divergentes, e não há esteira.**
   - O check "Supabase Preview" falha (`PLT-002`).
   - 370 migrations do repositório não estão no ledger de produção, incluindo as duas de 27/11 da PR #382 (`PLT-016`).
   - A `main` está sem proteção (`PLT-001`).
   - Não há homologação: E2E e testes de RLS rodam contra produção (`PLT-003`).
6. **O acesso tem brechas.**
   - Quem não tem papel passa por qualquer guarda de permissão: `src/components/auth/RequirePermission.tsx:21` (é intencional, como "acesso legado", mas na prática libera tudo) (`SEG-010`).
   - 11 views SECURITY DEFINER furam a RLS (`SEG-017`).
   - A rota `/eventos` abre sem login nem MFA: `src/app/AppRoutes.tsx:177` (`UX-002`).
   - A tela de auditoria do admin mostra só as ações do próprio admin (`SEG-011`).
   - O SSRF em `lead-score-threshold-runner` não usa `safeFetch` (`SEG-016`).
7. **O DR e a LGPD só existem no papel.**
   - Não existe job de retenção (`SEG-001`).
   - Não há backup fora do provedor (`SEG-002`).
   - O Alertmanager está com `REPLACE_ME` (`SEG-003`).
   - O restore drill não é periódico (`PLT-012`).
8. **A UX tem números inventados e atalhos mortos.**
   - Há valores fixos em tela: "94.2%" e "+2% vs ontem" (`UX-005`, `UX-006`; conferido em `src/components/dashboard/DashboardStatsGrid.tsx:62`).
   - 52 telas autenticadas abrem fora do layout padrão (`UX-001`).
   - Trabalho não salvo se perde (`UX-032`, `UX-033`).
   - A command bar e os atalhos não fazem nada (`UX-003`, `UX-004`, `UX-034`).

## 3. Os 25 pendentes mais graves (por impacto no negócio)

| # | ID | Pendência | Status |
|---:|---|---|---|
| 1 | CORE-001 | A Ficha 360 não mostra interações (filtro `user_id` em view sem a coluna) | 🟨 |
| 2 | CORE-002 | Concluir tarefa: chamada ambígua a `complete_task` (2 assinaturas em produção) | 🟨 |
| 3 | CORE-003/010/011 | As abas Comercial, Comportamental e Dados do contato dão erro | 🟨 |
| 4 | CORE-005–008 | Anexos, áudio, avatar e logo apontam para buckets inexistentes | 🟨 |
| 5 | CORE-004 | Alertas gerais rejeitados pelo CHECK de `alerts` não chegam ao sino | 🟨 |
| 6 | MKT-041 | O motor de automações não executa nenhuma das 59 regras gravadas | ❌ |
| 7 | MKT-001 | O nurturing repete a mesma etapa a cada 15 min | 🟨 |
| 8 | MKT-003/014 | WhatsApp: a entrada responde 403 e o envio pelo CRM não existe | 🟨 |
| 9 | MKT-042 | Não existe disparo de campanha de e-mail | ❌ |
| 10 | MKT-002 | A campanha de SMS falha no insert (campos obrigatórios ausentes) | 🟨 |
| 11 | IA-001 | O perfil de metaprogramas pede colunas que não existem | 🟨 |
| 12 | IA-002–011 | Sete tabelas comportamentais e o histórico de compras não têm produtor | 🟨 |
| 13 | IA-009/019 | As filas comportamentais e o detector de anomalias não estão agendados | 🟨 |
| 14 | REV-001 | A ativação de carteira roda sem compras do ERP (`registrar_pedido_erp` sem chamador) | 🟨 |
| 15 | REV-002 | Comissões: tabelas e 7 RPCs existem, mas não há tela | 🟨 |
| 16 | REV-003 | Propostas são só leitura (criar, enviar e responder sem chamador) | 🟨 |
| 17 | REV-004/005 | Win/Loss não é capturado no Kanban e o topo do funil MQL está vazio | 🟨 |
| 18 | REV-006/007 | Metas e territórios escondem erros; qualquer usuário edita qualquer território | 🟨 |
| 19 | SEG-010 | O RBAC libera tudo para quem não tem papel | 🟨 |
| 20 | SEG-017 / PLT-019 | 11 views SECURITY DEFINER legíveis por qualquer usuário logado | 🟨 |
| 21 | UX-002 / REV-017 | `/eventos` sem `<Protected>` | ❌ |
| 22 | SEG-001 | Não há retenção LGPD (função e cron ausentes em produção) | ❌ |
| 23 | SEG-002/003 | Não há backup externo nem alerta real (Alertmanager com `REPLACE_ME`) | ❌ |
| 24 | PLT-001/002/016 | `main` sem proteção, Preview vermelho e 370 migrations fora do ledger | ❌ / 🟨 |
| 25 | UX-001 | 52 telas autenticadas sem sidebar, Ctrl+K e notificações | ❌ |

## 4. Tudo o que não foi implementado (❌, 84 itens)

Os 268 itens 🟨 e os 73 itens ❔ estão listados um a um nos anexos.

**Núcleo do CRM e IA**
- `CORE-052` Dashboard: "Top empresas".
- `CORE-053` Card de intenção no contato.
- `IA-027` Self-healing por schema drift (ADR-017).
- `IA-028` Analytics de comandos de voz.
- `IA-029` Score de maestria em PNL.

**Marketing e integrações**
- `MKT-041` Motor de regras de `/automacoes`.
- `MKT-042` Disparo de campanha de e-mail, com abertura, clique e agendamento.
- `MKT-043` Lead de landing page virando contato.
- `MKT-044` Formulário público que cria contato e inscreve no nurturing.
- `MKT-045` Saída para o Bitrix24.
- `MKT-046` Cadências CRM (`crm_cadence_rules`).
- `MKT-047` Envio de NPS/CSAT pelo canal escolhido.
- `MKT-048` SMS com segmento, agendamento e opt-out.
- `MKT-049` Dashboards embeddable.
- `MKT-050` Telefonia/VoIP.
- `MKT-051` Retry e circuit breaker nas integrações de saída.
- `MKT-052` Alertas no Slack e no PagerDuty.
- `MKT-053` Proxycurl e Gemini.
- `MKT-054` Pipeline de e-mail do Google Workspace para `email_logs`.

**Vendas e RevOps**
- `REV-008` Otimização de território por IA.
- `REV-034` Exportar e Atualizar em `/analytics`.
- `REV-035` Ação recomendada na predição de churn.
- `REV-036` "Avançar" e "Ver lista completa" em Próximos passos.
- `REV-037` Distribuição imediata de lead avulso.
- `REV-038` Dashboards embeddable.
- `REV-039` Benchmark do setor.
- `REV-040` Pipelines configuráveis.
- `REV-041` Intervalo de datas personalizado em analytics.
- `REV-042` Comparativo anual real.

**Segurança e DR**
- `SEG-001` Retenção LGPD.
- `SEG-002` Backup externo cifrado.
- `SEG-003` Alerting com Prometheus e Alertmanager.
- `SEG-004` Política de senha forte (hoje `min(6)`).
- `SEG-005` SSO SAML/OIDC.
- `SEG-006` Flag `external_data_fallback`.
- `SEG-007` Verificação semanal da criptografia do backup.
- `SEG-008` Observabilidade de backup.
- `SEG-009` Game days trimestrais.

**Plataforma**
- `PLT-001` Proteção da `main`.
- `PLT-002` Esteira de migrations com o Preview verde.
- `PLT-003` Homologação.
- `PLT-004` Piso de cobertura.
- `PLT-005` Linter de banco no CI.
- `PLT-006` SAST e secret scanning.
- `PLT-007` Partição mensal do `audit_log`.
- `PLT-008` Regra de máximo de 400 linhas (107 arquivos acima).
- `PLT-009` Supressões com motivo (84 de 246 sem motivo).
- `PLT-010` Check de drift do `types.ts`.
- `PLT-011` ESLint em JS/MJS/CJS.
- `PLT-012` Restore drill recorrente.
- `PLT-013` Permissões mínimas, concurrency e timeout no CI.
- `PLT-014` Lockfile único.
- `PLT-015` Tabelas documentadas que não existem.

**UX e documentos**
- **Layout e navegação:**
  - `UX-001` Shell compartilhado em todas as telas.
  - `UX-002` Toda rota protegida.
  - `UX-003` Command bar abrindo os formulários.
  - `UX-004` "Perguntar ao CRM".
- **Métricas e dashboards:**
  - `UX-005` e `UX-006` Métricas sem número inventado.
  - `UX-007` Dashboards embeddable.
  - `UX-014` Exportar gráfico.
  - `UX-019` Métricas de UX.
  - `UX-031` BI com drag & drop.
- **Funcionalidades de produto:**
  - `UX-008` SSO.
  - `UX-009` Simulador de negociação.
  - `UX-010` ProgressToast.
  - `UX-011` Mega menu de recentes e favoritos.
  - `UX-012` Badges de pendência na sidebar.
  - `UX-013` Quick-add pela sidebar.
- **Busca e filtros:**
  - `UX-015` e `UX-016` Filtros e presets salvos.
  - `UX-017` Sugestões na busca.
  - `UX-018` Analytics de busca.
- **Mídia, sons e tutoriais:**
  - `UX-020` `srcset` e LQIP.
  - `UX-021` Sons de notificação.
  - `UX-022` Vídeos tutoriais.
- **Documentos que afirmam o que não existe:**
  - `UX-023` a `UX-025` ONBOARDING desatualizado (porta, `test:watch`, "4.470+ testes", Dashboard).
  - `UX-026` Diagrama ER.
  - `UX-027` Limite de 400 linhas.
  - `UX-028` a `UX-030` Afirmações falsas em COMPLETE_SYSTEM_ANALYSIS e QA_ANALYSIS_REPORT.

## 5. Já resolvidos (não reabrir)

Cada anexo tem uma seção 3 com a evidência do que os documentos antigos davam como faltando e hoje está no código. Os principais:
- **CI e plataforma:**
  - `strict` e `strictNullChecks` ligados.
  - Padrão CR4 (`.catch()` em consulta) zerado.
  - Guarda de cron (CR1) e agendamentos (CR2).
  - CORS da Vercel.
  - `types.ts` canônico.
  - Zero imports `esm.sh`.
  - RLS em 431 de 431 tabelas `public`.
  - `search_path` em 120 de 120 funções DEFINER.
  - `deno check` no CI.
- **Acesso e segurança:**
  - RBAC ligado em rotas, menu, mobile e Ctrl+K.
  - Lockout de MFA (A9).
  - `evolution-api` restrita a admin.
  - "Esqueci minha senha".
  - Observability com rota e dados reais.
  - `errorReporting` com a chave certa.
- **Dados e telas:**
  - `Math.random` removido de EQ, deal velocity e objeções.
  - MarketingHub e inteligência social sem dado fictício.
  - Painéis órfãos montados (#361, #362).
  - Tabelas `_dormant` reativadas (#382).
  - Telas novas de RevOps (#363–#380).

## 6. Limites desta auditoria (NÃO VERIFICADO)

- **Edges publicadas:** não foi verificado se cada edge publicada é igual ao código do HEAD (o snapshot não lista edges).
- **Crons:** `succeeded` no `cron-runs` só prova que a chamada HTTP foi enfileirada, não que a edge respondeu 200 (`MKT-058`).
- **Secrets e provedores externos:** chaves de OpenRouter, Resend, Evolution, ElevenLabs, Firecrawl e Twilio, e a igualdade entre `singu_cron_secret` no Vault e o `CRON_SECRET` das edges.
- **Auth em produção:** configuração de signup, HIBP, Google e MFA.
- **Volume de dados:** as contagens de linhas são estimativas (`reltuples`).
- **Inventário:** `inventario/estado/rotas.json`, `edges.json` e `banco.json` estão desatualizados (faltam 14 rotas). Esta auditoria usou `src/app/AppRoutes.tsx` e o snapshot de 28/11.
