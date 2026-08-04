---
name: Secret Rotation Management
description: Sistema de monitoramento e rotação de secrets com geração segura, auditoria e alertas de idade em /admin/secrets-management.
type: feature
---
- Tabela `secret_rotation_log` com RLS admin-only, imutável (sem UPDATE)
- `src/lib/secretRotation.ts`: generateSecureSecret (crypto.getRandomValues, min 32 chars), hashForAudit (SHA-256 truncado), getSecretHealth
- `src/hooks/useSecretRotation.ts`: CRUD de logs, KNOWN_SECRETS list, getLastRotation/getHistory
- Página `/admin/secrets-management`: cards por secret com badge de saúde (verde <30d, amarelo <90d, vermelho >90d)
- Dialog de rotação: gera novo secret, copia para clipboard, registra hash de auditoria
- Dialog de histórico: timeline de rotações passadas com hash e motivo
- Rotação real deve ser feita manualmente em Lovable Cloud → Secrets
