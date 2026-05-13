# 🚨 Procedimento de Hotfix

Este documento descreve o fluxo para correções críticas em produção.

## Quando usar
- Falha total do sistema (SLA P0).
- Vulnerabilidade de segurança explorada.
- Perda de integridade de dados.

## Fluxo
1. **Branch**: Criar branch \`hotfix/<slug>\` a partir da \`main\`.
2. **Review**: Aprovação acelerada por pelo menos 1 Arquiteto ou Tech Lead (SLA 1h).
3. **QA**: Validar na preview Lovable Cloud.
4. **Merge**: Squash merge para \`main\`.
5. **Post-mortem**: Obrigatório em até 48h após o incidente.
