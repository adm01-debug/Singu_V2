# Backup Encryption Verification

Checklist trimestral para confirmar backups do S3:

1. **KMS Key rotation** habilitada (rotate anual automático).
2. **Object Lock** em modo Governance com retention >= RTO * 2 (mínimo 30 dias).
3. **Bucket versioning** habilitado.
4. **MFA Delete** habilitado.
5. **Cross-region replication** para região secundária.

## Script de verificação

```bash
BUCKET="lovable-backups-prod"
aws s3api get-bucket-encryption --bucket "$BUCKET"
KMS_ID=$(aws s3api get-bucket-encryption --bucket "$BUCKET" | jq -r '.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.KMSMasterKeyID')
aws kms get-key-rotation-status --key-id "$KMS_ID"
aws s3api get-object-lock-configuration --bucket "$BUCKET"
aws s3api get-bucket-versioning --bucket "$BUCKET"
aws s3api get-bucket-replication --bucket "$BUCKET"
```

Todos devem retornar `Enabled` / `true`. Falha dispara P1 e trava próximo release.

## Frequência

- **Trimestral**: execução manual.
- **Semanal**: CI cron alerta se algum bit flippar.