# Cenários

Convenção: `NN-slug.sh`. Os números até `26` seguem a matriz de
`docs/AUDIT_VALIDATION_23_10.md`; de `30` em diante há um cenário por guard/script, na ordem
descrita em `../README.md` (seção Cobertura). O contrato de cada arquivo (variáveis e funções
que o `run-all.sh` lê) também está lá.

Subset que reproduz os 5 falsos-negativos da Rodada 23 e os gaps da Rodada 24:

```
./run-all.sh --only 01,04,11,14,17,21,24
```

Regras para um cenário novo:

- nunca altere configuração de cluster no modo existente; o que exigir isso declara
  `CLUSTER=endurecido` (sandbox Docker descartável) ou um `requires()`;
- objetos de cluster (slots, roles, subscriptions) levam `$SCN_ID` no nome e são removidos em
  `cleanup_scenario()`; tabelas e extensões morrem com o banco do cenário;
- encadeie o preparo com `|| return 1` — `setup` que falha reprova o cenário;
- guard novo precisa dos dois lados (`DOIS_LADOS=1`), senão o cenário `00` reprova.
