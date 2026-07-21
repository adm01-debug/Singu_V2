# Signing Key Rotation Runbook

> Rotação segura de chaves JWT (HS256 → ES256 ou ES256 → nova ES256) com **zero logout
> em massa** e janela dual-key de 24h.

## Quando rotacionar

- Rotação preventiva anual.
- Comprometimento suspeito de chave.
- Migração HS256 → ES256 (obrigatório para MCP OAuth).
- Após saída de engenheiro com acesso privilegiado ao projeto.

## Princípios

1. **Overlap obrigatório de 24h** entre chave nova e antiga.
2. **Novas emissões** usam chave nova; **verificações** aceitam ambas durante grace.
3. **Zero interrupção**: refresh tokens válidos re-emitem transparente com a nova chave.
4. **Auditoria**: cada estágio grava timestamp em `.rotate-state.*`.

## Fluxo (T = timeline)

```text
T+0h    prepare   → cria standby key
T+24h   activate  → promove standby → current (novos JWTs)
T+48h   retire    → remove chave antiga (após grace period)
```

### 1. Prepare (T+0h)

```bash
./scripts/migration/auth/rotate-jwt.sh prepare
```

Depois, no Lovable, execute a tool `supabase--migrate_signing_keys` (ou via MCP)
para materializar a standby ES256. Confirme via JWKS:

```bash
curl -s "$DEST_SUPABASE_URL/auth/v1/jwks" | jq '.keys | length'   # esperado ≥ 2
```

### 2. Activate (T+24h)

```bash
./scripts/migration/auth/rotate-jwt.sh activate
```

A partir daqui, todas as **novas emissões** usam a nova chave. Verifique um login
fresco e inspecione o header do JWT — `kid` deve ser o novo.

### 3. Grace period (T+24h → T+48h)

Monitore:

- `SELECT COUNT(*) FROM audit_log WHERE action='auth.token.verify_failed' AND created_at > now() - interval '1 hour'` — deve permanecer ~0.
- Painel `/admin/error-budget` — sem spike em erros 401/403.
- Reset de senha e refresh token funcionando.

**Se `verify_failed` subir > 1%/h**: pare, investigue, considere reversão (basta não
executar `retire` — chave antiga volta a ser suficiente).

### 4. Retire (T+48h)

```bash
./scripts/migration/auth/rotate-jwt.sh retire
```

O script bloqueia se menos de 24h passaram desde `activate`.

## Rollback

- **Antes de retire**: só não executar `retire`; chave antiga continua válida indefinidamente.
- **Depois de retire**: emergência — usuários com JWT antigo re-autenticam via refresh
  (que já usa chave nova). Se refresh também expirou, re-login.

## Referências

- Tool: `supabase--migrate_signing_keys` (idempotente).
- Script: `scripts/migration/auth/rotate-jwt.sh`.
- Runbook de emergência: `docs/HOTFIX_PROCEDURE.md`.