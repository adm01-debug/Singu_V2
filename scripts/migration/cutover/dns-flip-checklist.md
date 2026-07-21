# DNS Flip — Checklist da Janela de Cutover

> Aplica-se apenas quando o app usa domínio custom (não `*.lovable.app`).

## Pré-flip (T-24h)

- [ ] Reduzir TTL do registro A/CNAME para **300s** (ou o mínimo do provedor) 24h antes.
- [ ] Verificar TTL efetivo: `dig +short <dominio> | head` e `dig <dominio> | grep -i ttl`.
- [ ] Confirmar que Lovable Cloud (destino) tem o domínio custom configurado e SSL provisionado.
- [ ] Documentar valores atuais dos registros (backup).

## Flip (T-0)

- [ ] Freeze origem: `./cutover/freeze-origin.sh`
- [ ] Migrar dados finais (delta).
- [ ] Atualizar `.env` do projeto Lovable com URL e chaves do destino.
- [ ] Republicar app (Lovable → Publish).
- [ ] Atualizar A/CNAME para apontar ao destino:
  - A `@` → `185.158.133.1`
  - A `www` → `185.158.133.1`
  - (ou CNAME conforme provedor)
- [ ] Aguardar propagação: `./verify/dns-propagation.sh <dominio> <ip_esperado>`
- [ ] Rodar smoke tests: `deno run --allow-env --allow-net cutover/smoke-tests.ts`

## Pós-flip (T+1h)

- [ ] Restaurar TTL para 3600s+ após 1h estável.
- [ ] Rodar `monitoring/post-cutover-watch.sh` por 24h.
- [ ] Enviar comunicação aos usuários sobre reset de senha.
- [ ] Monitorar métricas via `/admin/error-budget`.

## Rollback DNS (se necessário)

- [ ] Reverter A/CNAME para IPs antigos (salvos no pré-flip).
- [ ] Rodar `freeze-state/<ts>/UNFREEZE.md` para reabrir origem.
- [ ] Comunicar equipe: origem reativada, destino descartado.