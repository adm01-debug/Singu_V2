# Linha de base do estado real — Singu_V2

> Documento de fundação da auditoria. Tudo que for medido a partir daqui
> compara contra ESTA linha. Fonte: `inventario/estado/` (gerado semanalmente
> pelo workflow `inventario-estado-semanal`). Medição de referência:
> **2026-11-13T11:20:33Z** (`banco.json`), dados de rotas/edges do mesmo ciclo.

## Banco (produção / preview do main)

| Métrica | Valor |
| --- | --- |
| Tabelas `public` | 406 |
| Policies de RLS | 1477 |
| Tabelas **sem** RLS | 0 |
| Triggers `public` | 435 |
| Views `public` | 139 |
| Funções `public` | 1382 |
| Crons ativos | 40 |
| Postgres | 17.6 |
| Tamanho | ~3,15 GB |
| Migrations no repo | ver `supabase/migrations/` (base restaurada pela #267) |

## Front

| Métrica | Valor |
| --- | --- |
| Rotas (urls) | 114 (12 públicas, 1 autenticada, 77 protegidas, 24 admin) |
| Itens menu sidebar | 33 |
| Itens menu mobile | 12 |
| Hooks distintos | 528 |
| Problemas de rota | 1 |

### Problema de rota conhecido

| tipo | arquivo | detalhe |
| --- | --- | --- |
| pagina_sem_rota | `src/pages/admin/Observability.tsx` | arquivo em `src/pages/` que nenhuma rota usa (candidato a código morto) |

## Edge functions

| Métrica | Valor |
| --- | --- |
| Total | 109 |
| Sem chamador no repo | 14 |

### Edges sem chamador no repo (candidatas a código morto / documentação)

```txt
attribution-calculator
audit-analytics
auto-rebatch-behavioral
bitrix24-webhook
conversation-coaching-digest
crm-automation-monitor
detect-new-device
enrich-contacts
evolution-bitrix-connector
health-aggregate
mcp-server
sequence-track
submit-signature
win-loss-record-deal
```

Nenhuma delas é cron ativo (40 jobs auditados no mesmo ciclo) → não há
consumidor por agendamento; se também não houver chamador externo (webhook,
bitrix, etc.) estão operacionalmente mortas.

## Regras de negócio — fonte

- `docs/contexto/regras/` (gerado automaticamente; não possui `manual/` —
  nenhuma regra humana registrada até 2026-11-13).

## Pendências registradas nesta rodada

1. **Persistência de insights de IA** — GAP FECHADO na #288 (edge
   `generate-insights` passou a gravar na tabela `insights`; antes só retornava
   o JSON ao front e perdia no refresh). Validar em produção.
2. **Baseline idempotente do preview** — #287 aberta (DDL, regra 8) para
   destravar o Supabase Preview pós-restauração das 607 migrations.
3. **15 edges órfãs** — auditar chamadores externos (webhooks/crons) antes de
   remover ou documentar como mortas.
4. **Alerts dependabot (2 moderados, dev-deps)** — minimatch (via
   glob/eslint-plugin-sonarjs) e postcss-selector-parser (via
   @tailwindcss/typography). Fix exige major-bump de build-time; sem impacto
   em runtime.
5. **`src/pages/admin/Observability.tsx`** — página sem rota (código morto ou
   rota faltante).