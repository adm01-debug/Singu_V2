# Load Testing — k6

Suite de testes de carga para Edge Functions críticas usando [k6](https://k6.io).

## Setup

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k && sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update && sudo apt install k6
```

## Variáveis de ambiente

| Var | Descrição |
|-----|-----------|
| `SUPABASE_URL` | URL do projeto (ex: `https://xxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Anon key |
| `USER_JWT` | JWT de usuário autenticado para testes |
| `WEBHOOK_TOKEN` | Token do webhook a testar |

## Execução

```bash
export SUPABASE_URL=https://...
export SUPABASE_ANON_KEY=eyJ...
export USER_JWT=eyJ...
export WEBHOOK_TOKEN=...

# Teste individual
k6 run tests/load/external-data.js
k6 run tests/load/ask-crm.js
k6 run tests/load/incoming-webhook.js

# Com output JSON para análise
k6 run --out json=results.json tests/load/external-data.js
```

## Cenários

| Script | Cenário | Limites (SLO) |
|--------|---------|---------------|
| `external-data.js` | Listagem `companies` (50 itens) | p95 < 2s, error rate < 1% |
| `ask-crm.js` | Pergunta IA aleatória | p95 < 5s, error rate < 5% |
| `incoming-webhook.js` | POST de webhook | p95 < 1.5s, error rate < 2% |

## Interpretação de resultados

- **`http_req_duration`** — latência total
- **`http_req_failed`** — taxa de falhas (≠ 2xx)
- **`vus`** — virtual users ativos
- **Threshold ❌** — falhou SLO definido nas options

## Boas práticas

1. **Não rodar em produção** sem coordenação prévia
2. Rodar em janela de baixo tráfego ou ambiente staging
3. Monitorar `edge_function_logs` durante o teste
4. Documentar resultado em `docs/load-results/YYYY-MM-DD.md`
