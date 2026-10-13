# Inscrições e reservas de email

## Inscrição

Todos os escritores de `sequence_enrollments`, incluindo `service_role`, passam
pelo mesmo trigger: proprietário, contato vivo, sequência ativa, capacidade e
atraso inicial. O retry preserva a inscrição e sua data original.

O worker de lead score usa `enroll_lead_score_contact`. Inscrição, histórico de
sucesso e contador da automação são uma transação. Uma falha individual não
confirma sucesso nem impede as outras automações do lote.

## Envio e arquivamento

`reserve_sequence_email_send` trava e revalida o contato e a inscrição antes da
chamada externa. A reserva contém etapa, progresso, token e chave de idempotência.
Dois processadores não reservam o mesmo contato simultaneamente.

Se o arquivamento vence a disputa, a inscrição é pausada e o envio não adquire
reserva. Se a reserva vence, arquivar, transferir ou excluir o contato retorna
`55000`: aguarde a confirmação e tente novamente. Retomar ou mesclar uma inscrição
com reserva pendente também é bloqueado.
Pausar ou arquivar a sequência com um envio reservado retorna `55000`;
confirme o envio antes de mudar o status.

A chamada HTTP ao provedor não faz parte da transação PostgreSQL.

## Confirmação e falhas

- Um `messageId` confirmado passa por `complete_sequence_email_delivery`.
  Recibo, evento e progresso são gravados juntos. O trigger encerra a reserva
  na mesma transação; perder a resposta HTTP desse commit não deixa o contato
  bloqueado por uma reserva já confirmada.
- Rollback da confirmação restaura a reserva. O worker só libera explicitamente
  depois da persistência ou quando o gateway comprova que a função de email
  não existe (`404` com `code = NOT_FOUND`), antes de alcançar um provedor.
- Se a resposta da própria reserva se perder, o worker não envia, não pausa a
  inscrição e não libera o token desconhecido. A próxima tentativa identifica
  uma reserva já existente; confira-a na consulta abaixo antes de retomar.
- Resposta sem identificador, falha HTTP incerta ou falha de persistência após
  envio mantém a reserva e suspende a inscrição. A passagem do tempo não comprova
  que o provedor deixou de processar a solicitação; não existe expiração automática.
- `authenticated` não cria nem remove reservas. As operações internas exigem
  `service_role`, e a liberação explícita exige o token correspondente.

## Diagnóstico e reconciliação

No SQL Editor administrativo do projeto canônico, esta consulta apenas lê:

```sql
SELECT r.enrollment_id, r.contact_id, r.user_id, r.step_id, r.current_step,
       r.step_order, r.idempotency_key, r.created_at,
       e.status, e.paused_reason, e.next_action_at
FROM public.sequence_email_reservations r
JOIN public.sequence_enrollments e ON e.id = r.enrollment_id
ORDER BY r.created_at;
```

Para um resultado incerto, consulte o provedor pela `idempotency_key`. Não remova
a reserva nem retome a inscrição enquanto uma solicitação ainda puder concluir.
Um envio confirmado deve ser reconciliado pelo serviço com o identificador real,
os dados originais de rastreamento e a próxima ação correta. Um não envio precisa
de evidência definitiva antes de `release_sequence_email_send` e da retomada.
Nunca fabrique um `messageId` para desbloquear o contato.

O projeto canônico está sem provedor transacional configurado. As provas de
envio usam simulações; as provas SQL usam rollback. Configurar um provedor e
demonstrar uma entrega real permanece uma etapa separada.

## Validação e rollback

`tests/rls/sequence_write_fences.sql` cobre duas contas, permissões, capacidade,
retry, pausa, arquivamento, confirmação e rollback. O gate aplica migrations pendentes
sob advisory lock e desfaz todas as alterações ao final.

Para retirar as proteções, suspenda os workers, reconcilie todas as reservas e
retire seus consumidores antes do rollback comentado na migration
`20261013033433_sequence_write_fences.sql`. Não remova a tabela com envios incertos.
