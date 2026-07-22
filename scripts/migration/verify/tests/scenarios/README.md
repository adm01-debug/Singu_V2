# Cenários

Convenção: `NN-slug.sh` (`NN` = número da matriz em `docs/AUDIT_VALIDATION_23_10.md`).

Inclui o subset mínimo que reproduz os 5 falsos-negativos da Rodada 23
(`01`, `04`, `11`, `14`, `17`) e 2 dos 6 gaps corrigidos na Rodada 24
(`21`, `24`). Os cenários restantes seguem o mesmo contrato e são
adicionados incrementalmente.

```
./run-all.sh --only 04,11,14,17,21,24
```