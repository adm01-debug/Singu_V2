# Suíte de exposição RLS (etapa 84 do plano banco-único)

Mede **quantas linhas cada perfil enxerga** em cada tabela, via PostgREST — o mesmo caminho do front,
não SQL direto. Compara com `rls-baseline.json` e falha se alguma tabela passar a expor **mais** linhas.

É a rede de segurança que faltava para mexer nas policies. As etapas 22 (consolidar policies duplicadas),
23 (`roles={public}` → `{authenticated}`) e 58–64 (RLS por carteira) tocam centenas de policies de uma vez;
sem isso, afrouxar uma por engano passa despercebido até alguém ver dado alheio.

## Rodar

```sh
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_ANON_KEY=<anon key> \
node scripts/rls-matrix/check-rls-baseline.mjs
```

Com o perfil de usuário logado (recomendado — é onde estão os números que importam):

```sh
TEST_USER_JWT=<jwt de um usuário sem role e sem carteira> node scripts/rls-matrix/check-rls-baseline.mjs
```

Reduziu exposição de propósito? Fixe o novo patamar **no mesmo PR**:

```sh
node scripts/rls-matrix/check-rls-baseline.mjs --update
```

## Como ler o baseline

- `-1` = sem grant (a role nem chega na tabela). É o estado mais fechado.
- `0` = tem grant, RLS filtrou tudo. Parece igual a `-1` na prática, mas é frágil: basta
  afrouxar uma policy para virar N. Por isso o script distingue os dois.
- `N` = linhas visíveis (o contador satura em 1001).

## Estado medido em 2026-09-24 (antes da Fase 3)

Um usuário **logado, sem nenhuma linha em `user_roles` e sem carteira** enxerga:

| tabela | linhas |
|---|---|
| `customers` | 1001+ (a base inteira, ~48k) |
| `contact_phones` | 1001+ |
| `company_phones` | 1001+ |
| `suppliers` | 754 (todos) |
| `carriers` | 114 (todas) |
| `companies` / `contacts` | 0 — escondidas pelo `auth.uid() = user_id` com 53.842 `user_id` nulos |

**Critério de sucesso da Fase 3:** depois das etapas 58–64, esse mesmo perfil deve dar `0` em
`customers`, `contact_phones` e `company_phones`, e ver apenas `liberado_comercial` em
`suppliers`/`carriers`. O `--update` registra isso e o baseline passa a proteger o novo patamar.
