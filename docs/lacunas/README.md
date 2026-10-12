# Anexos — Planejado × Executado (2026-10-11)

Evidência completa (`arquivo:linha`) do levantamento consolidado em [`../../PLANEJADO_NAO_EXECUTADO.md`](../../PLANEJADO_NAO_EXECUTADO.md).

Base: `main` @ `e616c20` (fotografia de 11/10/2026). `main` avançou para `36dfc19` durante a auditoria; o que mudou de status depois da base está na **§0 do documento consolidado** e prevalece sobre estes anexos (ex.: CORS da Vercel e `types.ts` já resolvidos; token removido dos arquivos). Auditoria estática, com checagens de runtime somente leitura (API do GitHub, `OPTIONS` nas Edge Functions, `GET /auth/v1/settings`, API da Vercel). Sem acesso SQL ao banco de produção: o que depende dele está marcado **NÃO VERIFICADO**.

| Anexo | Fatia | Escopo |
|---|---|---|
| [A_docs_raiz_e_memoria_lovable.md](A_docs_raiz_e_memoria_lovable.md) | A | Documentos da raiz, `.lovable/plan.md`, 98 memórias Lovable, `.devin/`, `.windsurf/` |
| [B1_reverificacao_estado_01_04.md](B1_reverificacao_estado_01_04.md) | B1 | `docs/estado/01–04` (Core CRM, IA, Marketing, RevOps), linha a linha |
| [B2_reverificacao_estado_05_10.md](B2_reverificacao_estado_05_10.md) | B2 | `ESTADO_ATUAL.md` + `docs/estado/05–12` + status de agendamento de cada Edge Function de cron |
| [C1_docs_produto_ux_qa.md](C1_docs_produto_ux_qa.md) | C1 | Estratégia de produto/UX, QA, TECH_DEBT, `docs/auditoria/`, dicionários de dados |
| [C2_adrs_migracao_dr_operacao.md](C2_adrs_migracao_dr_operacao.md) | C2 | ADRs 001–022, migração, hardening, DR, runbooks, `monitoring/`, `scripts/` |
| [D_ui_rotas_componentes.md](D_ui_rotas_componentes.md) | D | Rotas, navegação, placeholders, handlers falsos, componentes órfãos, feature flags, fluxos públicos |
| [E_contratos_front_backend.md](E_contratos_front_backend.md) | E | Tabelas, RPCs, colunas e Edge Functions que o front chama × o que existe |
| [F_edge_functions.md](F_edge_functions.md) | F | Inventário das 108 Edge Functions + padrões sistêmicos |
| [G_banco_de_dados.md](G_banco_de_dados.md) | G | Schema das 447 migrations, consumo, funções sem chamador, `pg_cron`, filas, testes SQL, sistema de origem |
| [H_ci_testes_deploy_infra.md](H_ci_testes_deploy_infra.md) | H | CI, testes, deploy, PWA, variáveis de ambiente, observabilidade, scripts |

**Como ler:** cada anexo tem legenda própria, tabela de lacunas com status, evidência, o que falta, impacto e esforço (P/M/G), resumo numérico e top 10. As fatias se sobrepõem por desenho; a visão deduplicada (causas-raiz e catálogo por módulo) está no documento consolidado.

**Segredos:** credenciais encontradas no repositório aparecem apenas com prefixo redigido (ex.: `sbp_5bf0…`).
