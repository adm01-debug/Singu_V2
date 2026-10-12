# Matriz de execução reconciliada — Singu V2

## Escopo e evidência

Reconciliação de `docs/auditoria/` e `docs/lacunas/`, baseada no commit `a2b73c7dee837f19aa756e6afe385eba837b5d54`. As cinco revisões abaixo preservam os IDs históricos, evidências e critérios de aceite. São diagnósticos de código; nenhuma delas, isoladamente, comprova publicação, isolamento no banco remoto ou entrega de mensagens.

`RESOLVIDO NO CÓDIGO` não significa validado em produção. Para encerrar um item operacional são necessárias evidências de CI, merge, deploy, ledger quando houver DDL, e execução autenticada. Ausência de DDL local não demonstra ausência do objeto remoto. As alegações históricas permanecem nos documentos de origem; esta matriz registra a reavaliação e a próxima ação.

## Atualização após as revisões — 12/10/2026

| Item | Evidência posterior | Estado de entrega | Próxima ação |
|---|---|---|---|
| Rodízio e emails duplicados | [PR 108](https://github.com/adm01-debug/Singu_V2/pull/108) mergeado em `1c213a112ae29646fc2ce571d3dc55272ab7a712`; deploy de produção READY para esse commit; migration `20261012120000` aplicada; provas pós-aplicação com dois proprietários reais, índice único, admin preexistente e rollback passaram | MERGEADO, PUBLICADO E VALIDADO NO BANCO; CI do `main` ainda em execução | Confirmar CI e validar fluxo autenticado na interface; ingestão ERP não comprovada |
| Auditoria identificada e agregada, E-C01 | [PR 109](https://github.com/adm01-debug/Singu_V2/pull/109) mergeado em `a8f50e53027b37512d46c6f3daa2575798ec9f9e`; deploy de produção READY; migration `20261012123000` aplicada; fixture pós-aplicação confirmou eventos atuais/legados, propriedade e rollback | MERGEADO, PUBLICADO E VALIDADO NO BANCO; leitura/exclusão na interface pendentes | Retestar leitura/exclusão autenticadas; não reabrir o achado de `contact_id` |
| Ledger canônico | Versões `20261012120000` e `20261012123000` registradas em ordem, com SQL completo igual aos arquivos da `main`; 661 versões remotas, das quais 595 sem arquivo local correspondente | NOVAS MIGRATIONS APLICADAS; REPLAY HISTÓRICO AINDA DIVERGENTE | Recuperar e testar o SQL histórico preservado no ledger em ambiente isolado; não fazer `repair` para mascarar a divergência |
| Integrações externas | Usuário optou por seguir sem chaves de IA, WhatsApp/Evolution, Bitrix, ElevenLabs, Firecrawl e Twilio | DECISÃO DE PRODUTO/INTEGRAÇÃO ADIADA | Corrigir contratos e estados honestos; manter entrega/IA reais fora das funcionalidades operacionais declaradas |
| Revisões automáticas adicionais | Codex atingiu limite; Greptile/ECC não executaram a análise dos heads novos por limites de plano | NÃO VERIFICADO NO RUNTIME | Conservar revisão local e gates obrigatórios; não interpretar comentário de limite como aprovação ou achado técnico |

## Ordem de execução

1. Concluir o CI do `main` e reconciliar o histórico de migrations para recuperar o Preview; manter as provas permanentes dos PRs 108/109.
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

## Matrizes por área

- [Segurança e documentos raiz](MATRIZ_RECONCILIADA_20261012_SEGURANCA.md)
- [UX, navegação e acessibilidade](MATRIZ_RECONCILIADA_20261012_UX.md)
- [Contratos frontend/backend](MATRIZ_RECONCILIADA_20261012_CONTRATOS.md)
- [Edge Functions](MATRIZ_RECONCILIADA_20261012_EDGE.md)
- [Banco, migrations, CI e operação](MATRIZ_RECONCILIADA_20261012_BANCO_CI.md)
