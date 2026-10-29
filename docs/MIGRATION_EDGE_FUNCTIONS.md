# Migração das Edge Functions — Runbook

> Reprovisiona as **108 Edge Functions** no novo projeto Supabase (destino BYO),
> incluindo secrets, verificação pós-deploy e auditoria dos cron jobs.

Todos os comandos rodam a partir da **raiz do repositório**.

---

## 1. Pré-requisitos

- Supabase CLI instalado (`supabase --version`).
- Login: `supabase login` (usa o Personal Access Token do usuário).
- `project-ref` do **novo** projeto (`DEST_REF`) e do **antigo** (`OLD_REF`,
  apenas para auditar cron jobs).
- DDL e dados já migrados (ver `MIGRATION_DDL.md` e `MIGRATION_DATA.md`).

```bash
export DEST_REF="xxxxxxxxxxxxxxxxxxxx"   # novo projeto
export OLD_REF="hjhthvzwtvwgdrochcam"    # projeto antigo (opcional)
```

---

## 2. Preparar `secrets.env`

```bash
cp scripts/migration/functions/secrets.template.env \
   scripts/migration/functions/secrets.env
```

Abra `secrets.env` e preencha os valores. Categorias:

| Categoria | Como obter |
|-----------|------------|
| **App-owned** (`CRON_SECRET`) | Gere: `openssl rand -hex 32` |
| **Lovable AI** (`LOVABLE_API_KEY`) | Painel Lovable |
| **Terceiros** | Painel do provedor (ElevenLabs, Firecrawl, Twilio, Evolution, EnrichLayer, n8n) |
| **Bridge** (`EXTERNAL_SUPABASE_*`) | Só se `external-data` continuar lendo o Supabase antigo durante o cutover |

> **Não** preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
> `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_DB_URL` — são reservadas e
> injetadas automaticamente pelo Supabase.

O arquivo `secrets.env` está no `.gitignore`; **nunca** commite valores reais.

---

## 3. Ajustar `supabase/config.toml`

O arquivo é auto-gerado com o `project_id` antigo. **Antes do primeiro deploy**,
substitua manualmente pelo `DEST_REF`:

```toml
project_id = "SEU_DEST_REF_AQUI"
```

Nenhum bloco `[functions.*]` precisa ser adicionado — o default
(`verify_jwt = false`) já atende, e a validação de JWT é feita **no código**
de cada função quando necessário.

---

## 4. Aplicar secrets no destino

```bash
cd scripts/migration/functions
chmod +x *.sh

./set-secrets.sh --dry-run      # revisa o que seria enviado
./set-secrets.sh                # aplica
```

Saída esperada: linhas `+ NOME` para cada secret enviado, `~ pulando` para
vazios/reservados e `Concluído.` ao final.

---

## 5. Deploy das 108 funções

```bash
./deploy-all.sh
```

- Sequencial, com `sleep 1s` entre funções para não estourar rate limit.
- Log detalhado em `scripts/migration/functions/deploy.log`.
- Ao final imprime `OK=X FALHA=Y`.

**Se algo falhar**, retome do ponto:

```bash
./deploy-all.sh --from <nome-que-falhou>
./deploy-all.sh --only <nome>     # redeploy pontual
```

---

## 6. Verificação

Cada health check tem prazo finito de 75s: até duas consultas de 30s no fluxo
de email (incluindo fallback), mais 15s de margem. Timeout continua sendo falha.

Os quatro endpoints exigem um JWT de usuário válido do **destino**, além da chave
anônima desse mesmo projeto. O PAT usado pela CLI e a chave `service_role` não
substituem essa sessão. Prepare o ambiente na raiz do repositório com a conta de
teste já cadastrada no destino (`TEST_EMAIL`/`TEST_PASSWORD` no arquivo local de
migração; não versionar valores reais):

```bash
cd "$(git rev-parse --show-toplevel)"
set -a
source scripts/migration/.env
set +a
export DEST_REF="${DEST_REF:-$NEW_REF}"
export SUPABASE_ANON_KEY="$DEST_ANON_KEY"
HEALTH_JWT="$(node --input-type=module -e '
  const { DEST_REF, SUPABASE_ANON_KEY, TEST_EMAIL, TEST_PASSWORD } = process.env;
  if (!DEST_REF || !SUPABASE_ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error("Preencha destino, chave anônima e credenciais de teste locais");
  }
  const response = await fetch(`https://${DEST_REF}.supabase.co/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || typeof body?.access_token !== "string" || !body.access_token.trim()) {
    throw new Error(`Autenticação de teste não confirmada (HTTP ${response.status})`);
  }
  process.stdout.write(body.access_token);
')" && export HEALTH_JWT
```

Se o login falhar, pare e corrija o acesso antes de verificar. Não imprima o JWT
nem execute esses comandos com `set -x`. A sessão expira; repita o login quando
necessário. Os valores reservados são preparados somente no shell local, não em
`secrets.env` nem por `supabase secrets set`.

```bash
./scripts/migration/functions/verify-deploy.sh --project-ref "$DEST_REF" --old-ref "${OLD_REF:-}"
```

- Diff `local vs remoto` (funções faltando ou órfãs).
- GET autenticado nos endpoints de health (`health`, `system-health`,
  `voice-ai-health`, `email-pipeline-health`): HTTP 200 com JSON `status: "healthy"`.
  HTTP 401/403, falhas de rede, JSON inválido e demais estados impedem a aprovação.
- `email-pipeline-health` mede atividade recente: sem email na última hora retorna
  `degraded`, e após 24 horas ou sem histórico retorna `offline`. O gate mantém
  esses estados como pendentes; acesso ao endpoint não comprova entrega de email.
- Imprime **SQL de auditoria** para achar cron jobs que ainda apontam
  para o `OLD_REF` no banco de destino.

### 6.1 Cron jobs

Os agendamentos vivem em `pg_cron` e já foram criados pelo
`12_cron_jobs.sql` durante a migração do DDL. Rode no banco de destino:

```sql
-- Achar jobs apontando para o projeto antigo
SELECT jobid, jobname, command
  FROM cron.job
 WHERE command ILIKE '%<OLD_REF>.supabase.co%';

-- Reescrever para o novo project-ref
SELECT cron.alter_job(
         jobid,
         command := REPLACE(command, '<OLD_REF>', '<DEST_REF>')
       )
  FROM cron.job
 WHERE command ILIKE '%<OLD_REF>%';
```

O SQL exato (com refs preenchidos) é impresso pelo `verify-deploy.sh`.

---

## 7. Smoke tests manuais

Após publicar o app apontando para o novo Supabase:

1. **WhatsApp Import**: subir 1 JSON pequeno em `/whatsapp-import` e verificar
   que a linha aparece em `whatsapp_messages`.
2. **Perfil comportamental**: abrir 1 contato com histórico e clicar em
   *Regenerar* — deve chamar `generate-behavioral-profile` e popular
   `contact_analytical_profiles`.
3. **Notificação**: acionar `smart-notify` (ex.: criar uma tarefa vencida) e
   confirmar o toast/sino.
4. **Cron**: aguardar 5 min e checar `system_health_snapshots` recebendo
   heartbeat do watchdog.

---

## 8. Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| `deploy` retorna 401 | CLI não logado ou ref errado | `supabase login` e confira `DEST_REF` |
| `deploy` retorna 413 / bundle > 5MB | Deps não usadas ou payload embutido | Enxugar imports da função |
| Health `/health` = 500 | Secret faltando | Rode `./set-secrets.sh --dry-run` e compare |
| `external-data` quebra | `EXTERNAL_*` não configurado | Preencher no `secrets.env` ou desativar a função |
| Cron não dispara | URL antiga no `cron.job` | Rodar o `SELECT cron.alter_job(...)` acima |
| `403 emails_disabled` | Emails Lovable desativados | Reativar Emails no painel do backend |

---

## 9. Rollback

Enquanto o app publicado ainda apontar para o Supabase antigo, o novo é
"stand-by". Reverter = republicar o app com as env vars antigas
(`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` do projeto original).
As funções no novo Supabase permanecem deployadas sem efeito colateral.

---

## Fora de escopo deste runbook

- Migração de schema e dados → `docs/MIGRATION_DDL.md`, `docs/MIGRATION_DATA.md`.
- Reset de senhas dos usuários migrados → `docs/MIGRATION_PASSWORD_RESET.md`.
- Alterar código das functions — este processo é reprovisionamento **1:1**.
## Ver também

- [Master Runbook](./MIGRATION_MASTER_RUNBOOK.md) — orquestra todas as fases
- [DDL](./MIGRATION_DDL.md) · [Data](./MIGRATION_DATA.md) · [Edge Functions](./MIGRATION_EDGE_FUNCTIONS.md) · [Storage](./MIGRATION_STORAGE.md) · [Password Reset](./MIGRATION_PASSWORD_RESET.md)
