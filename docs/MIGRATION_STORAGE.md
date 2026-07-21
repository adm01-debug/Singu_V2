# Migração de Storage — Runbook (Supabase → Supabase)

Complementa `MIGRATION_DDL.md`, `MIGRATION_DATA.md` e `MIGRATION_EDGE_FUNCTIONS.md`.
Cobre a replicação de **buckets + objetos** do Supabase Storage da ORIGEM para o DESTINO.

## Escopo

Buckets esperados (validação mínima):

| Bucket | Público | Consumido em |
|---|---|---|
| `company-logos` | ✅ | migration `20260404124138` |
| `contact-avatars` | ✅ | migration `20260412172243` |
| `documents` | ❌ | `useDocuments.ts`, `useDealRooms.ts` |
| `interaction-audios` | ❌ | migration `20260511185221` |
| `interaction-attachments` | ❌ | migration `20260511185221` |
| `whatsapp-audio` | ❌ | `useWhatsAppImport.ts` |

O script descobre buckets em tempo de execução — buckets novos entram automaticamente.

## Pré-requisitos

- **Deno 1.44+** (`deno --version`).
- `SERVICE_ROLE_KEY` de **ambos** os projetos (Dashboard → Settings → API).
- Rede com saída para `*.supabase.co`.
- DDL do destino já aplicado (`MIGRATION_DDL.md`). Os `INSERT INTO storage.buckets` das migrations criam registros; ainda assim rodamos `create-buckets` para reconciliar `public`, `file_size_limit` e `allowed_mime_types`.
- Policies de `storage.objects` já criadas pelo DDL/migrations (não replicamos aqui).

## Setup

```bash
cd scripts/migration/storage
cp env.example .env
$EDITOR .env    # preencha SRC_* e DEST_*
```

`.env` está no `.gitignore` da pasta.

## Pipeline

```
list-buckets  →  create-buckets  →  copy-objects  →  verify-counts
  (inspeção)     (idempotente)    (worker principal)    (paridade)
```

### Execução completa

```bash
./run.sh
```

### Passo a passo

```bash
./run.sh --step list      # inspeção: contagem e bytes por bucket
./run.sh --step create    # cria/atualiza buckets no destino
./run.sh --step copy      # copia objetos (o mais demorado)
./run.sh --step verify    # confere contagem + amostra 20 objetos/bucket
```

### Flags úteis

```bash
./run.sh --only documents        # restringe a um bucket
./run.sh --dry-run               # não escreve no destino
./run.sh --step copy --only documents --dry-run
```

Variáveis do `.env` podem ser sobrescritas via ambiente
(ex.: `CONCURRENCY=16 ./run.sh --step copy`).

## Como o `copy-objects` opera

1. `POST /storage/v1/object/list/{bucket}` paginado (1000/pg), recursivo em "pastas".
2. `HEAD` no destino: se `Content-Length` já bate com o `metadata.size` da origem, o objeto é **SKIP** — economiza banda em reruns.
3. `GET .../authenticated/{bucket}/{key}` na origem → stream.
4. Objetos ≤ `STREAM_TMPFILE_THRESHOLD` (50 MiB default) sobem em buffer; acima disso caem em tmpfile para permitir retry idempotente.
5. `POST /storage/v1/object/{bucket}/{key}` no destino com `x-upsert: true`, preservando `Content-Type` e `Cache-Control`.
6. Retries exponenciais (500 ms → 30 s) em 429/5xx.
7. Log em `storage-copy.log` (JSONL: `bucket, key, bytes, status, ms, error?`).

## Estimativa

~50 arquivos/s por worker em objetos pequenos (< 1 MiB). Ajuste `CONCURRENCY` (default 8) conforme aparecerem 429. Bandwidth = gargalo em buckets pesados.

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| `401 Unauthorized` | `SERVICE_ROLE_KEY` errada | Copiar do Dashboard; confirmar SRC vs DEST |
| `413 Payload Too Large` | Objeto excede `file_size_limit` do bucket destino | Rodar `create-buckets` para propagar limite da origem |
| Muitos `429` | Rate limit do Storage | Reduzir `CONCURRENCY` para 4 ou 2 |
| `404` na origem em objeto listado | Objeto apagado durante a janela | Ignorar; `verify-counts` acusa se relevante |
| App quebra após cutover em URLs assinadas antigas | JWT do projeto antigo não vale no novo | Regerar via `createSignedUrl` (comportamento dos hooks `useWhatsAppImport`/`useDocuments`) |

## Rollback

Enquanto o app apontar para o Supabase antigo, o destino fica ocioso. Para recomeçar do zero:

```bash
for b in company-logos contact-avatars documents interaction-audios interaction-attachments whatsapp-audio; do
  curl -X DELETE \
    -H "apikey: $DEST_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $DEST_SERVICE_ROLE_KEY" \
    "$DEST_SUPABASE_URL/storage/v1/bucket/$b?force=true"
done
```

`?force=true` remove objetos junto do bucket.

## Segurança

- `SERVICE_ROLE_KEY` só em `.env` local — nunca commitado.
- Nenhum código de aplicação roda como service_role; estes scripts são ferramenta de janela de manutenção operada por humano.
- Logs redigem tokens JWT com heurística `eyJ…`.

## Fora do escopo

- **Policies de `storage.objects`** — criadas pelas migrations no DDL.
- **Reassinatura de URLs no banco** — regeradas sob demanda pelos hooks.
- **Storage do Lovable Cloud** — projeto usa Supabase gerenciado; N/A.

## Checklist de cutover

- [ ] `.env` preenchido com chaves ORIGEM e DESTINO.
- [ ] `./run.sh --step list` executado (confirma buckets + volumes).
- [ ] `./run.sh --step create` sem falhas.
- [ ] `./run.sh --step copy` concluído; `storage-copy.log` sem `status: fail` residual.
- [ ] `./run.sh --step verify` verde (exit 0).
- [ ] Frontend apontado para novo `VITE_SUPABASE_URL`.
- [ ] Teste manual: upload de logo, upload de doc, envio de áudio WhatsApp.
