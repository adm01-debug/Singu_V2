# Reconciliação do histórico de pesquisas

A tabela `csat_surveys` é compartilhada por CSAT, NPS e CES. A interface antiga
de NPS não informava a modalidade e gravava respostas em `score`. Notas de 1 a 5
podem pertencer tanto a CSAT quanto a NPS; não é seguro identificar a modalidade
pela nota, pelo canal ou pela data de envio.

## Pré-condição da primeira aplicação

A migration `20261011150000_restore_canonical_contracts.sql` interrompe a
aplicação antes de alterar o schema quando há pesquisas históricas e sua
reconciliação ainda não foi confirmada. Isso vale também para tabelas que já
tenham `survey_type` com default `csat`: o default antigo não comprova a origem
de um registro. Bases vazias e reaplicações do contrato completo são permitidas.

Antes de liberar uma base com histórico, o responsável deve identificar cada
modalidade a partir dos registros do processo que originou a pesquisa. Não
reclassifique todas as pesquisas como NPS ou CSAT em lote sem essa evidência.

1. Faça backup e registre a correspondência verificada entre ID e modalidade.
2. Abra uma única transação administrativa. Se faltarem `survey_type`,
   `nps_score` ou `ces_score`, adicione essas colunas sem defaults ou backfill.
3. Preencha `survey_type` de cada registro conforme a correspondência verificada.
   Para NPS legado, copie a resposta confirmada de `score` para `nps_score`;
   mantenha o valor original em `score` para rastreabilidade. Para CES, reconcilie
   `ces_score`. Não invente notas para pesquisas pendentes.
4. Confirme que não há modalidades ausentes e que pesquisas respondidas possuem
   nota na coluna correspondente: CSAT 1–5, NPS 0–10 ou CES 1–7.
5. Somente após essa conferência, execute dentro da mesma transação:

   ```sql
   SET LOCAL singu.legacy_survey_types_confirmed = 'true';
   ```

6. Execute a migration e valide os totais por modalidade antes do commit.
   A confirmação é restrita à transação; não configure essa variável de forma
   permanente nem a use para contornar um histórico ainda desconhecido.

O novo contrato exige modalidade não nula, conserva a classificação existente e
exige nota ao marcar uma pesquisa como respondida. Os consumidores CSAT e NPS
consultam apenas a própria modalidade e usam colunas diferentes para suas notas.

## Banco canônico

Em 11/10/2026, a consulta direta ao projeto `pgxfvjmuubtbowutlide` mostrou zero
pesquisas. Nesse estado não há histórico a reclassificar; a verificação continua
na migration para impedir perda silenciosa em outra base populada ou caso
surjam registros antes da aplicação.
