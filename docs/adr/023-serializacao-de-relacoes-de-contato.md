# ADR 023: Serialização de relações e transferência de contato

**Estado:** regra aprovada; implementação proposta neste PR, sem aplicação em produção.

## Contexto

Uma verificação de propriedade anterior à escrita não protege a janela entre
consulta e mutação. A transferência pode terminar nesse intervalo e permitir
que o antigo proprietário ainda grave uma relação usando `service_role`.

## Decisão

- O trigger `guard_contact_relation_write()` adquire `FOR UPDATE` no contato e
  revalida proprietário e arquivamento após a espera. A transferência usa o
  mesmo lock da linha: quem o adquirir primeiro define a ordem das operações.
- No reparenting direto, OLD e NEW são bloqueados por UUID crescente. O proxy
  continua recusando a troca de pai. Transações com várias operações ainda podem
  sofrer deadlock; o banco reverte a transação e o proxy retorna conflito 409.
- O trigger é `SECURITY DEFINER`, com `search_path` vazio e referências
  qualificadas, para revalidar inclusive pais que deixaram de ser visíveis ao
  ator. Sua execução direta é revogada de todos os papéis de cliente.
- O serviço é reconhecido pelo papel SQL efetivo, não por uma claim isolada.
  Administração legítima exige AAL2; a cascata do DELETE do pai é preservada.
- Mutações não-service usam o JWT do chamador. Sem cliente JWT compatível, falham
  com 503, sem fallback privilegiado. Esta decisão complementa a ADR 002.

## Consequências e validação

A espera pode atrasar uma edição ou transferência concorrente. Se a transferência
vencer, a edição do antigo dono é recusada sem gravação parcial. Se a edição
vencer, a transferência aguarda sua conclusão. `UPDATE_WITH_VERSION` conserva
`CONCURRENT_EDIT`, e DELETE só declara sucesso após confirmar uma linha afetada.

O runner em `tests/rls/contact-relation-concurrency.mjs` exige banco local
descartável `aut03_*` e confirmação explícita de isolamento. As duas ordens,
rollback, leituras do novo dono e ausência de acesso do antigo foram simuladas
em PostgreSQL; o proxy também foi exercitado com PostgREST local real.
Os contratos JWT e de erros entram no CI. Isso não comprova publicação remota,
reconstrução integral do banco ou inventário canônico de `SECURITY DEFINER`.

Aplicação e eventual reversão exigem migrations revisadas separadamente;
nenhuma policy ou ACL de tabela é ampliada por esta mudança.
