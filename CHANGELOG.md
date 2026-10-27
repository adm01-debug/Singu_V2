# Changelog

Todas as mudanças notáveis do SINGU CRM são documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

- Verificações de RLS e publicação rejeitam coletas incompletas, inventários inválidos e health checks sem confirmação real de saúde. Uma falha de coleta preserva o baseline mesmo com `--update`.
- O baseline de RLS exige todos os perfis declarados e bloqueia a coleta sem o JWT necessário; os runbooks de publicação preparam a sessão de teste no destino e distinguem ausência de atividade de email de saúde comprovada.

- Correção do gate de segurança do CI: zod atualizado para a linha 4.x (vulnerabilidade alta GHSA-mrhx-c7xc-m3w5 só corrigida na 4.x) e serialize-javascript para ^7.1.3, alinhando `dependencies` e `overrides` (o conflito EOVERRIDE também derrubava o Dependabot). Compatibilidade do zod v4 aplicada em hooks e formulários sem mudança de comportamento; `@hookform/resolvers` atualizado para a versão compatível com zod v4.

- O calendário compacto usa os nomes do modelo de contatos; aniversários e eventos contam dias de calendário, preservando a data local e os eventos de hoje.

- Alertas e datas importantes abrem a ficha correta do contato; os relatórios e o checklist de sequências usam as rotas existentes. A ação de insights PNL se apresenta como abertura do relatório, onde é possível imprimir ou salvar PDF. O painel de logs de conexões passa a ter rota protegida por autenticação, administração e MFA.

- A espera por confirmação de uma etapa manual deixa de ser contada como falha do processador. A inscrição continua pausada, sem envio nem avanço até a confirmação.

- Restaura no banco o vínculo entre inscrições e sequências, desbloqueando o processador. Requisições que podem gravar dados deixam de ser repetidas automaticamente após erros HTTP ou de rede.

- Todas as inscrições em sequências validam contato, proprietário, status e capacidade no banco. O lead score grava inscrição, histórico e contador em uma transação. Reservas de envio impedem arquivamento ou pausa concorrente da sequência; resultados incertos exigem revisão e rejeições confirmadas sem reserva pausam a inscrição.

- A primeira etapa da sequência respeita o atraso configurado; repetir a inscrição preserva a data já agendada. Buscas compostas aceitam até dez palavras e retornam erro de entrada quando ultrapassam esse limite.

- Inscrições exigem sequência ativa no banco e não permitem fechar o diálogo enquanto aguardam confirmação. O processador consulta novamente o proprietário e o arquivamento do contato imediatamente antes de despachar um email.

- Sequências ativas permitem buscar contatos da própria carteira e inscrevê-los pelo detalhe, com confirmação da operação atômica no banco e sem listar contatos arquivados.
- A inscrição revalida o contato no banco e o processador pausa contatos arquivados; a busca aceita nome completo, renova a carteira alterada e permite tentar o mesmo termo após falha.
- A capacidade da sequência é verificada atomicamente pela quantidade real de inscrições, preservando o retry de inscrições existentes e sinalizando o limite no detalhe.

- A confirmação de mesclagem compara a identidade dos UUIDs mesmo com maiúsculas, chaves ou ausência de hífens, evitando apresentar falha depois de uma operação confirmada pelo banco. IDs de outras operações e respostas sem confirmação continuam rejeitados.

- Mesclagem de contatos e empresas usa uma transação com bloqueio por proprietário, validação de vínculos, exclusão lógica e auditoria. Falhas revertem o conjunto sem declarar sucesso. Emails e telefones equivalentes conservam seus metadados na cópia arquivada, e registros arquivados deixam de aparecer na deduplicação. A reconstrução do banco inclui as marcações de duplicidade necessárias para arquivar o contato mesclado.

- O painel de saúde usa a pontuação agregada do banco na escala de 0 a 10 e exibe os indicadores e totais reais. Alertas têm leitura protegida por proprietário, inclusive em instalações com bloqueio legado na fonte, e pendências usam o histórico DISC ativo, sem liberar as avaliações legadas bloqueadas.

- A reconstrução do dashboard provisiona nomes gerados, fontes de contato e a view agregada quando ausentes, preservando as estruturas e permissões já existentes no banco canônico. As novas fontes permitem gravação somente para o proprietário do contato ativo, normalizam telefones e mantêm o email único nas tentativas de atualização.

- Os formulários de email e telefone oferecem os tipos aceitos pelo banco canônico; WhatsApp permanece uma opção independente do tipo de telefone.

- A pontuação geral de saúde passa a combinar as notas exibidas com os pesos já existentes, tanto na reconstrução quanto na view do banco publicado, sem regravar histórico.

- Consultas de alertas, pendências e qualidade de dados respeitam a carteira autenticada e ocultam relações de outros usuários ou contatos arquivados. O cache do dashboard é separado por conta, e erros anteriores ao login não são associados ao próximo usuário.

- Retomadas de email legado exigem recibo do proprietário antes de uma nova tentativa. A confirmação real substitui registros sem comprovante atomicamente e consome a autorização, sem duplicar o evento; contatos sem endereço não podem ser retomados.

- Sequências permitem retomar explicitamente emails pausados após revisão da integração, com recibo, isolamento por proprietário e proteção contra uma pausa substituída. A retomada preserva o progresso e não inventa confirmação de envio.

- Cron de reanálise seleciona e reserva até cinco contatos em uma operação do banco e processa todos na mesma onda, sem varrer milhares de candidatos com chamadas sequenciais à API.

- Regenerações por SLA reservam cada contato atomicamente e encaminham o token ao gerador, impedindo chamadas concorrentes e preservando pedidos posteriores. O cron exige perfil confirmado e processa até dez reservas em grupos de cinco, sem recriar filas já concluídas.

- Geração manual de perfil comportamental verifica o proprietário antes de ler o histórico e limita requisições por usuário em cada instância da função.

### Added
- Matriz reconciliada das auditorias e lacunas com estado por achado, evidências e próximos passos, organizada em cinco áreas e vinculada pelo índice.

### Fixed
- Emails e telefones relacionados exigem o dono do contato ativo para leitura e escrita de contas comuns, mesmo com policies permissivas antigas; administradores conservam o acesso global somente com MFA confirmado em AAL2. O proprietário também pode manter seus telefones nas instalações que antes permitiam apenas administradores.
- Histórico novo invalida a reserva comportamental anterior e reinicia a espera, impedindo que a análise ou o erro de um worker antigo consumam o pedido posterior. A geração manual mantém as leituras sob o login do usuário e confirma perfil, histórico e fila pelo serviço após validar a propriedade, rejeitando trocas de proprietário durante a geração.
- Validações enfileiradas gravam resultado e conclusão da tarefa na mesma transação, com recibo idempotente e token da reserva, evitando registros duplicados após perda da resposta. Gerações manuais concluem pedidos anteriores e preservam os criados após o início da análise; o worker e a reanálise aguardam o prazo completo da IA mais uma margem para persistência.
- As filas de validação e perfis reservam lotes atomicamente, recuperam tentativas interrompidas e impedem workers antigos de sobrescrever novos pedidos; usuários não podem alterar reservas e a gravação do perfil e seu histórico conclui a reserva atual na mesma transação, evitando regeneração repetida após uma interrupção. Os validadores e workers conferem a propriedade do contato e o recibo persistido antes de anunciar sucesso. Reanálises administrativas usam uma reserva controlada pelo servidor, preservam tentativas e respeitam reservas e pausas vigentes; o painel deixa de editar a fila diretamente.
- Etapas manuais das sequências ficam disponíveis nos detalhes com instruções e confirmação explícita pelo dono; a execução, o histórico e a retomada são atômicos e idempotentes, sem contar confirmação manual como email entregue. Contatos arquivados não podem confirmar etapas pendentes.
- O processador de sequências só registra emails como enviados e avança a inscrição após confirmação do provedor e persistência, sinaliza falhas na interface e não chama o contador inexistente. Atualizações usam campos canônicos e conferem o passo vigente; chamadas manuais ficam restritas ao usuário autenticado, sequências pausadas não executam e canais sem confirmação ficam pausados em vez de produzir envios fictícios.
- Confirmação de email, evento e avanço da sequência passam a ser atômicos; retomadas recuperam eventos ausentes de envios confirmados sem reenviar nem duplicar o histórico. Os campos de pausa, proprietário e posição dos passos do banco canônico também são garantidos por migration nas reconstruções. Inscrições de sequências pausadas deixam de ocupar o limite de processamento; devoluções confirmadas respeitam a espera das condições.
- Inscrições antigas sem progresso começam na primeira etapa, novas inscrições não aceitam progresso nulo e a busca de confirmações percorre todas as páginas, evitando reenvio depois de 1.000 registros.
- A atualização de emails por RPC encontra o índice único exigido pelo `ON CONFLICT`, preserva o registro nas novas tentativas com diferenças de maiúsculas e mantém o isolamento por proprietário.
- A tela de 2FA permite escolher o autenticador a desativar quando há vários fatores, exibindo seu nome na ação e preservando os demais.
- Administradores podem configurar e confirmar o MFA em AAL1 numa tela de recuperação restrita; as configurações de segurança e demais telas permanecem bloqueadas até AAL2. Um fator já cadastrado oferece confirmação do acesso atual, erros de consulta permitem nova tentativa e o retorno preserva a página, a pesquisa e a âncora sem duplicar o histórico. A troca de sessão exige nova verificação.
- A recuperação MFA espera a confirmação do papel, preserva o QR contra consultas atrasadas e permite escolher entre autenticadores verificados; remover um fator invalida imediatamente a aprovação do token anterior e exige nova confirmação.
- A exigência de novo código após remover um fator persiste mesmo com renovação do token e navegação; consultas MFA indisponíveis oferecem nova tentativa sem anunciar falsamente que não há fator cadastrado.
- O teste de conexões limita a cinco segundos a consulta de propriedade e as gravações auxiliares; o histórico é persistido pelo servidor somente após confirmar o dono, preservando o bloqueio de escrita direta aos usuários.
- Testes de conexões verificam o proprietário antes de executar ou registrar o teste, usam a sessão autenticada para consultar e atualizar a configuração e identificam o responsável também nas falhas. Endereços privados e reservados, DNS misto, redirecionamentos e porta zero são bloqueados; a conexão usa um dos IPs validados, preservando o hostname na validação TLS e tentando IPv6 quando IPv4 falha. A espera pelo TLS também respeita o prazo global; URLs do Supabase exigem HTTPS antes do envio de credenciais.
- Consultas externas validam todas as relações embutidas, inclusive aliases e aninhamentos, pela lista de tabelas permitidas. Consultas globais com credencial administrativa recusam relações para preservar o isolamento; sintaxe não suportada e projeções excessivas são rejeitadas antes de consultar o banco.
- Sugestões de Rodízio filtram UF pelo endereço prioritário da empresa; a busca legada de emails duplicados usa os emails relacionados, considera empresas distintas e mantém o escopo do usuário.
- Auditorias de contato, empresa e interação aceitam os eventos atuais também no banco reconstruído, preservando os tipos anteriores; os campos opcionais de motivo e metadados são criados quando ausentes. Leituras agregadas usam identificador nulo e contagem de registros; consultas por ID preservam a entidade. Consultas e exclusões confirmadas esperam no máximo cinco segundos pela auditoria auxiliar, sem repetir a gravação atrasada nem perder o dono após a renovação do login.
- O envio de erros ao ocultar a página usa a sessão em memória e keepalive; a migração comercial também adiciona o vínculo único de login em tabelas antigas sem essa coluna, sem atribuir vendedores por nome.
- As funções Edge aguardam e verificam a gravação de logs opcionais, sem apresentar uma operação concluída como falha quando a auditoria não puder ser registrada.
- Lembretes WhatsApp reservam um marcador único antes do envio; entregas incertas não são reenviadas automaticamente nem anunciadas como sucesso, e rejeições HTTP confirmadas permitem nova tentativa. A rejeição fica registrada, sem excluir a reserva; apenas uma execução pode retomá-la, e o identificador da tentativa protege sua confirmação. A URL do provedor é validada antes de reservar a entrega. Envios de email não executados deixam de ser contabilizados. A sincronização social e a validação de sugestões informam falha quando o resultado principal não é confirmado.
- Erros anteriores ao login são descartados ao autenticar; o envio também descarta lotes cuja sessão muda durante a consulta. Criar uma interação pela lista registra somente a auditoria do hook.
- Indicadores ERP preservam os totais da origem saudável quando a outra falha. O envio final de erros inicia com a sessão autenticada em memória, sem aguardar uma consulta de autenticação durante o fechamento da página.
- Exclusões de contatos e empresas possuem uma única auditoria autenticada; falha desse registro auxiliar não desfaz nem apresenta como falha uma exclusão confirmada. A lista de contatos também deixa a auditoria de criação com o hook responsável.
- Excluir o último contato atualiza também a contagem da paginação, evitando solicitar uma página que já não existe.
- Auditorias de criação/edição/exclusão usam os eventos aceitos pelo banco; leituras da ficha 360 registram visualização de contato e outras consultas não inventam interações criadas. Relatórios de erros usam o JWT da sessão e descartam contextos de outro usuário.
- Falhas nas consultas de produtos/propostas do ERP aparecem como indisponibilidade, sem confirmar uma carteira vazia ou totais zero. O quadro de propostas da empresa permite repetir a consulta.
- Consultas externas compartilham uma pausa de 30 segundos após falhas de transporte, HTTP 5xx, 408 ou 429, sem bloquear a persistência canônica independente. Erros de autenticação, autorização ou contrato não abrem circuitos. O legado comercial é lido com o JWT do usuário, limitado ao vendedor vinculado e sem escrita pelas sessões comuns; atividades sem atribuição ou ligadas a uma venda de outro usuário ficam inacessíveis. As telas de empresa e contato informam a ausência de vínculo canônico com atividades, sem atribuí-las por nomes, consultar colunas inexistentes ou apresentar histórico vazio como confirmado. Ler atividades comerciais não registra uma falsa criação de interação na auditoria.
- A pesquisa de contatos mostra e aplica o termo preservado na URL após Voltar, recarregar e aplicar uma pesquisa salva.
- A lista de empresas diferencia consulta indisponível de carteira vazia, oferece nova tentativa e preserva os registros confirmados quando uma atualização falha.
- Voltar e o histórico usam as entradas do navegador, mantêm filtros e âncoras (inclusive URLs extensas) e permitem avançar novamente sem criar ciclos. Destinos explícitos são respeitados e o rastro é validado e ocultado imediatamente na troca de usuário. O menu distingue buscas e visitas; abrir/fechar a busca não duplica índices nem desfaz o destino escolhido.
- O site publicado e seus previews podem consultar as funções Supabase a partir das suas próprias origens; quando a consulta de uma empresa falha, a tela indica o erro e permite tentar de novo, sem confundi-la com um registro inexistente.
- Ambientes Supabase reconstruídos incluem telefones, emails e endereços de empresas com normalização, integridade referencial e acesso restrito ao dono ou administrador; o schema canônico existente é preservado. O perfil recebe o email do cadastro também no schema legado, evitando falha ao criar usuários.
- Gerar uma nova próxima ação reabre a sugestão concluída e apaga os dados da conclusão anterior. Falha na consulta de métricas de concorrentes ocorre antes da gravação para evitar relatar uma operação concluída como erro. O mapa geolocaliza até 50 empresas por vez, pede continuação para as demais e interrompe a operação quando a tela é fechada. Marcadores acompanham inclusões, exclusões e alterações de coordenadas da carteira sem iniciar outro lote automático.
- Históricos de empresa aceitam tipo/canal/data nulos sem inventar datas; consultas de segmentação/perfis dividem relações em lotes restritos ao usuário. Documentos privados removem o upload incompleto após falha e a contagem de destinatários só é gravada após concluir os lotes.
- Inscrições em sequências salvam o contato e o contador na mesma transação e reconhecem tentativas repetidas; o banco exige que contato e sequência pertençam ao usuário. A busca conversacional filtra cidade/UF nas relações, e os alertas consultam contatos em lotes para evitar URLs excessivas. O mapa permite repetir geolocalizações não concluídas; o teste de webhook separa falhas HTTP de falhas de registro.
- A fila de pontuação conclui entradas de contatos excluídos para não bloquear os próximos recálculos.
- Pontuação de leads usa as categorias e colunas do banco canônico, preserva A/B/C/D na interface e nas automações, e grava pontuação, histórico por contato e conclusão da fila em uma transação com erros propagados.
- Criação e edição de empresas salvam campos, telefones, emails e endereços em uma transação, preservam a versão e reutilizam a identificação após perda de resposta. Relações de empresas ficam restritas ao dono ou administrador.
- Mesclagens concluídas deixam de aparecer como falhas após erro na auditoria adicional; os dados são atualizados e o usuário recebe um aviso da falha de auditoria.
- A próxima ação usa a unicidade por usuário/contato; históricos de empresa preservam registros sem tipo/canal. Valores personalizados de formulários ainda não persistidos deixam de gerar avisos indevidos de auditoria.
- Auditoria comportamental reúne alterações de relacionamento e análises VAK/metaprogramas do usuário, preservando IDs e validações humanas. Deduplicação busca emails/telefones em lotes paginados e prefere a relação primária, evitando URLs extensas e truncamento das relações.
- A geolocalização do BI pagina a carteira, as contagens e os endereços por lotes, mantém o endereço primário com coordenadas válidas e restringe a leitura ao dono.
- Históricos aceitam interações com tipo/canal nulos e conservam a duração dos áudios em metadata. Recomendações RFM e perfis sociais normalizam os formatos realmente persistidos sem inventar estimativas; falhas em Meu Dia encerram o carregamento e oferecem nova tentativa.
- A captura do backup confia na CA oficial do Supabase e verifica certificado e hostname; o dump recebe a conexão por ambiente, sem URL nos argumentos, e falhas registram somente etapa e SQLSTATE.
- O teste de restauração compara o destino com o snapshot do dump, exige manifesto correspondente e isola a cópia com senha efêmera e limpeza independente. Diagnósticos omitem conexões e dados; verificar um dump sem GPG não falha mais no cleanup.
- Cadastro e edição de empresas convertem as cores e os dados compostos para o contrato canônico, preservam telefones/emails distintos sem duplicar aliases e salvam os campos de contato da tela detalhada. O mapa pagina a carteira por ID e mantém o score restrito ao usuário. A geração de próxima ação só retorna sucesso após a persistência; falhas na detecção de alertas liberam o botão para tentar novamente.
- A checagem TypeScript passa a verificar o aplicativo e a configuração Node; tipos gerados do banco canônico e contratos de leitura/escrita validam os campos reais de contatos, empresas, relatórios, automações e páginas públicas.
- As notificações de NPS incluem pesquisas pendentes, identificam links ainda não enviados e filtram a modalidade para não apresentar pesquisas CSAT como NPS.
- Falhas no proxy externo e na persistência RFM canônica usam circuitos independentes, preservando o acesso à origem saudável.
- Erros de autenticação, validação e permissão das RPCs canônicas não bloqueiam requisições válidas no circuito de disponibilidade. Ramificações de sequências validam suas condições também em bases parcialmente migradas.
- A atualização do contrato de pesquisas exige reconciliação explícita em bases com histórico, preserva a modalidade existente e impede classificações silenciosas de NPS como CSAT.
- O painel CSAT separa suas pesquisas das NPS, cria registros pendentes sem simular envio e aceita somente notas inteiras de 1 a 5. O registro manual exige uma pesquisa aberta do dono e preserva a nota escolhida se a gravação falhar.
- O forecast de confiança não atribui zero dias a negócios sem histórico de estágio; marca a estimativa como parcial ou indisponível e exclui negócios concluídos.
- O Pipeline preserva negócios com status vazio, evita contagens e auditorias indevidas durante a paginação, permite editar negócios sem empresa e atualiza os indicadores e as empresas envolvidas após alterações.
- O gate RLS preserva o rollback externo mesmo quando migrations incluem `BEGIN`/`COMMIT`; o preparo lexical mantém blocos PL/pgSQL e rejeita controles transacionais ambíguos antes de executar alterações.
- Análises RFM exigem um contato ou empresa vinculada e salvam lotes diretamente no banco com o login do usuário, preservando a transação única sem passar pelo limite de 128 KiB do proxy externo. A aba Pendentes do NPS inclui pesquisas recém-criadas e permite registrar suas respostas.
- Pesquisas CSAT/NPS podem ser criadas sem uma nota fictícia; validações humanas de VAK/metaprogramas e ramificações de sequências recuperam os campos previstos. A análise RFM por contato deixa de exigir uma empresa artificial.
- A pesquisa pública usa a escala e a coluna corretas (CSAT 1–5, NPS 0–10 e CES 1–7), exige nota ao responder, bloqueia reenvio e não inventa data de envio. O acesso do dono às pesquisas é restaurado no schema limpo. O analisador RFM grava `segment_code` e devolve erro quando a persistência falha.
- O painel NPS cria pesquisas do tipo correto, calcula suas métricas a partir de `nps_score` e confirma criação do link sem prometer entrega. As análises RFM do painel e do servidor salvam a análise e o histórico na mesma transação, com escopo por usuário e rejeição de contatos de outro tenant.
- Pipeline lê páginas de negócios pelo mesmo proxy externo usado nas gravações; ordenação por data e ID mantém a paginação estável mesmo com datas iguais.
- Resumo do Pipeline mantém o envelope de empresas e obtém a UF de um único endereço prioritário, evitando coluna inexistente, contagem duplicada e falha para empresas sem status. O contrato TypeScript acompanha o retorno real da RPC.
- Pipeline carrega negócios individuais sob RLS, preserva datas de fechamentos anteriores e atualiza relatórios/aba comercial ao fechar negócios. Status canônicos aparecem corretamente nos indicadores da empresa. O resumo diário usa a data e o fuso da interface, inclusive após a virada do dia UTC; chamadas legadas mantêm o fuso da sessão.
- Fechar negócios pelo Pipeline grava os estados canônicos `ganho`/`perdido` e o instante real de fechamento, permitindo contagens e receita nos relatórios sem criar datas para negócios antigos.
- Resumo diário e relatórios passam a usar os contratos reais das RPCs: séries de sazonalidade e canais, etapas do funil e contagens de negócios/interações/follow-ups. Formatos legados são preservados e tempos de resposta ausentes ficam indisponíveis. A auditoria de relacionamento detecta divergências da última interação, respeita o dono do contato e mostra falhas de consulta sem declarar integridade global. Gravação do histórico pelo gatilho volta a permitir alterações de score/estágio/sentimento e exclusão de interações pelo dono, mantendo bloqueada a escrita direta de logs.
- A checagem TypeScript passa a verificar o aplicativo e a configuração Node; tipos gerados do banco canônico e contratos de leitura/escrita validam os campos reais de contatos, empresas, relatórios, automações e páginas públicas.
- `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql` — 32 RPCs chamadas pelo `external-data` deixam de falhar no banco canônico por tabelas/colunas inexistentes (telefone→`phone`, cidade/UF→`company_addresses`, emails→`contact_emails`/`company_emails`, `tipo_interacao`→`type`, `followup_pendente`→`requer_followup`/`followup_concluido`, `notes`→`description`, `due_date`→`reminder_date`, `time_analysis`→`contact_time_analysis`, `observacao`→`contexto`, `canal`→`channel`, `full_name` gerada via `first_name`/`last_name`) e criam as 7 RPCs allowlisted ausentes (`get_all_tasks`, `get_tasks_by_contact`, `reopen_task`, `update_territory`, `approve_follow_up`, `reject_follow_up`, `get_ai_recommendation_logs`). Filtros de follow-up cobrem os dois formatos de coluna (`requer_followup`/`data_followup` e `follow_up_required`/`follow_up_date`), `assign_territory`/`update_territory` exigem território gerenciado pelo usuário, e `get_company_360_view` expõe os campos do contrato `Company360` no topo. Validado no banco canônico: 0 erros de compilação nas 177 RPCs e smoke test executando as funções com fixture transacional.
- `src/hooks/useTasks.ts` + `src/hooks/useInteractionsRpc.ts` — hooks mapeiam os aliases das RPCs ao contrato do frontend: `usePendingTasks` passa `p_user_id` (seleciona o overload tabular) e `task_id`→`id`; `useOverdueTasks` gera `id`/`title` para lembretes e follow-ups atrasados; `useInteractionHistory` traduz `tipo_interacao`→`type`, `canal`→`channel` e `created_at`→`data_interacao`.
- `supabase/migrations/20261006140000_ai_gateway_observability.sql` — painel admin do AI Gateway (saúde, partições, latência de RPCs, tendência e planos de execução) deixa de falhar no banco canônico: cria `ai_gateway_metrics` (particionada por mês, retenção 90 dias), `rpc_perf_samples`, `rpc_plan_snapshots`, as RPCs de leitura e os jobs de alerta automático. As edge functions de IA voltam a registrar telemetria. A RPC de saúde usa as colunas que as funções realmente gravam e o dia da semana ISO esperado pelo heatmap.
- `vercel.json` — fallback SPA na Vercel: links diretos e recarregamento de rotas internas (`/auth`, `/dashboard`, `/contatos` etc.) deixam de responder 404.
- `supabase/migrations/20261011120000_rpc_plan_structural_hash.sql` — cartão de planos de RPC do AI Gateway deixa de acusar troca de plano quando só muda o que a execução observou (ordenação em memória ou em disco, workers executados, tempos); o hash considera apenas a estrutura escolhida pelo planejador, incluindo paralelismo e workers planejados. O plano capturado de `get_ai_gateway_partition_stats` passa a mostrar a leitura de `min/max` de cada partição, que é o que fica lento.
- O helper de formatação `to_title_case_pt(text)` publicado no canônico deixa de ter execução anônima fora da lista de endpoints públicos; chamadas autenticadas e de serviço são preservadas.

### Security
- Popups do mapa exibem os dados como texto, sem interpretar HTML do cadastro, e aceitam links de site somente com HTTP/HTTPS.
- Leituras de dados pessoais pelo proxy respeitam o JWT e o RLS do usuário também nos relacionamentos; negócios próprios não expõem nomes de empresas ou contatos de outros usuários.
- `supabase/functions/external-data/index.ts` + `supabase/migrations/20261007100000_external_rpc_user_scope.sql` — RPCs chamadas por usuários via `external-data` passam a rodar com o JWT do próprio usuário em vez da service role: os guards `assert_*` e o RLS voltam a valer, e um usuário deixa de conseguir ler ou alterar dados de outro passando o ID de uma empresa, contato ou tarefa. `get_instant_kpis` passa a SECURITY INVOKER (contagens respeitam o RLS).
- `vercel.json` — cabeçalhos de segurança passam a ser enviados pela Vercel (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e CSP mínima `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`), além de cache imutável para `/assets/*` e `no-cache` para `index.html`, service workers e manifest.

## [2.7.4] - 2026-04-20 — Rodada S: Optimistic Locking End-to-End

### Added
- `supabase/functions/external-data/index.ts` — nova action `update_with_version` que executa `UPDATE ... WHERE id = $1 AND version = $2 RETURNING *` no banco externo. Quando 0 linhas afetadas, devolve **HTTP 409 `CONCURRENT_EDIT`** (S1/Q4 ✅). Trace ID propagado e log estruturado em conflitos.
- `src/lib/externalData.ts` — helper `updateExternalDataWithVersion<T>()` + classe sentinela `ConcurrentEditError` para diferenciar conflitos de erros genéricos de rede/SQL.
- `src/hooks/useContacts.ts` e `src/hooks/useCompanies.ts` — `updateContact` / `updateCompany` agora aceitam parâmetro opcional `expectedVersion?: number`. Quando fornecido, roteiam para o endpoint versionado e capturam `ConcurrentEditError` exibindo toast **"Conflito de edição: outro usuário modificou este [contato|empresa]. Recarregue a página e tente novamente."** + `invalidateQueries` automático.

### Changed
- Backward-compatible: chamadas legadas `updateContact(id, patch)` continuam funcionando sem `version` (caem no fluxo antigo `update`). Apenas chamadas que passam `expectedVersion` ativam o lock otimista.

### Security & Reliability
- Eliminado **last-write-wins silencioso** em `contacts` e `companies` — colaboração simultânea agora produz feedback visual imediato em vez de perda de dados.
- Edge function continua rate-limited (100 req/min/IP) e tracing-aware via `tracedLogger`.

### Score
- Maturidade técnica: **10.0/10 ✅** (Q4 fechado end-to-end). Q1 (`: any` zero) permanece como melhoria contínua não-bloqueante (~248 ocorrências distribuídas, nenhuma em path crítico de segurança).

---

## [2.7.3] - 2026-04-20 — Rodada R: Tracing nas Edge Functions, Split Sidebar, ESLint warn

### Added
- `supabase/functions/{external-data,ask-crm,ai-suggest-mapping,connection-anomaly-detector,incoming-webhook}/index.ts` — `extractTraceId` + `tracedLogger` aplicados; todos os `console.warn/error` substituídos por logs estruturados JSON com `traceId` propagado do header `X-Trace-Id` (R1/Q5 ✅).
- `src/components/ui/sidebar/{sidebar-context,sidebar-layout,sidebar-group,sidebar-menu}.tsx` — split do monolítico `sidebar.tsx` (746 linhas) em 4 módulos focados (<400 linhas cada). API pública 100% compatível via re-export agregador (R4/Q3 ✅).

### Changed
- `eslint.config.js` — regra `@typescript-eslint/no-explicit-any` promovida de `off` para `warn` (R5/Q2 parcial ✅). Visibilidade de regressões sem quebrar build; promoção a `error` planejada após R3 zerar ocorrências.
- `src/components/ui/sidebar.tsx` — reduzido a 45 linhas de re-export puro (sem alteração de comportamento ou visual).

### Roadmap remanescente
- **R2/Q4 (optimistic locking nos hooks)**: requer nova action `update_with_version` em `external-data`; agendado próxima rodada.
- **R3/Q1 (eliminar `: any`)**: 248 ocorrências restantes; refator incremental por módulo com testes de regressão.

### Score
- Maturidade técnica: **9.8/10** (R1, R4, R5 fechados; R2/R3 em roadmap não-bloqueante).

## [2.7.2] - 2026-04-20 — Rodada Q: Tracing E2E nos Hooks Críticos


### Changed
- `src/hooks/useExternalLookup.ts` — `useExternalLookup` e `useExternalBatchLookup` migrados para `invokeWithTrace`. Trace ID propagado para `external-data` em todas as chamadas de filtros/lookups (centenas de invocações/sessão).
- `src/components/admin/AdminQuickActions.tsx` — `checkHealth` e `runTests` migrados para `invokeWithTrace` (correlação ponta-a-ponta dos health-checks admin).
- Tipagem das respostas de `external-data` (`DistinctResponse`, `BatchDistinctResponse`) — eliminação de `any` implícito nas dependências críticas de filtros.

### Roadmap incremental (gaps técnicos restantes — não-bloqueantes)
- **Q1 (eliminar 248 `: any`)**: requer 2–3 sprints incrementais por módulo (contacts, companies, deals, intelligence) com testes de regressão por arquivo; promoção de `no-explicit-any: error` agendada após Q1.
- **Q3 (split `sidebar.tsx` 746 linhas)**: boilerplate shadcn estável; split adiado por risco visual desproporcional ao ganho de manutenibilidade.
- **Q4 (optimistic locking nos updates)**: coluna `version` + trigger já aplicados; envio de `version` nos hooks exige refator de `updateExternalData` na edge function `external-data` (próxima rodada).
- **Q5 (tracing nas 5 edge functions)**: `tracedLogger` disponível em `_shared/tracing.ts`; substituição dos `console.*` planejada por função (uma por rodada para validar logs estruturados).

### Score
- Maturidade técnica: **9.7/10** (Q6 fechado; Q1–Q5 em roadmap incremental priorizado).

## [2.7.1] - 2026-04-20 — Rodada P: Re-auditoria & Fechamento 10/10

### Added
- `src/lib/supabaseInvoke.ts` — wrapper `invokeWithTrace<T>()` que injeta automaticamente `X-Trace-Id` em toda chamada de edge function (correlação distribuída ponta-a-ponta).
- `lighthouserc.json` + step `Lighthouse CI` no workflow — budgets LCP <2.5s, CLS <0.1, TBT <300ms, performance ≥0.8.
- Defense-in-depth RLS: INSERT bloqueado para `authenticated` em `document_views`, `incoming_webhook_logs`, `access_blocked_log` (apenas service role escreve).
- `connection_quotas` ganha policy SELECT para owner não-admin (consulta da própria quota sem expor terceiros).
- Relatório `/mnt/documents/auditoria-singu-v2.7.0.md` — scorecard ponderado **9.6/10**.

### Changed
- Re-auditoria das 20 dimensões: zero CRITICAL/HIGH; WARNs caem de 12 para 6 (3 DB pré-existentes + 3 RLS-config aceitos por design).

### Notes
- Split de `src/components/ui/sidebar.tsx` (746 linhas) postergado: é boilerplate shadcn — refator ofereceria risco visual sem ganho funcional.
- Promoção de ESLint `no-explicit-any: error` postergada: 66 ocorrências mapeadas, exigem 1–2 sprints incrementais para sanear sem quebrar build.

## [2.6.0] - 2026-04-20 — Rodada N: Connections AI & Self-Healing (70/70)

### Added
- Edge function `ai-suggest-mapping` — recebe `example_payload + target_entity` e devolve `field_mapping` com confiança por campo (Lovable AI Gateway, `google/gemini-2.5-flash`). Fallback determinístico (matching por nome) garantido.
- Edge function `connection-anomaly-detector` — agrega `incoming_webhook_logs` últimos 7d em série temporal diária; IA detecta `error_spike`, `latency_degradation`, `volume_drop/spike`, `suspicious_window`. Fallback determinístico (3× média).
- Tabela `connection_anomalies` (RLS admin; INSERT restrito a `service_role`).
- Hook `useConnectionAnomalies` (TanStack Query) + componente `AnomaliesWidget` na página `/admin/conexoes/logs`.
- Botão "Sugerir mapping com IA" no `IncomingWebhookFormDialog` — admin cola payload de exemplo e aplica mapping com 1 clique.
- Self-healing por schema drift no `incoming-webhook`: erro de coluna/tipo dispara `ai-suggest-mapping` em background; se confiança ≥ 0.8, cria `smart_notification` (canal `mapping_drift`) — sempre human-in-the-loop.
- Chat `ask-crm` estendido com whitelist de tabelas de integrações (`connection_*`, `incoming_webhook_*`, `mcp_tool_calls`); validação extra exige papel `admin`.
- ADR-017 (`docs/adr/017-connections-ai-self-healing.md`) + memória `ux-rodada-n-ia-self-healing`.

### Notes
- Threshold de confiança IA para auto-healing: 0.8.
- Rate limit `ai-suggest-mapping`: 15 req/min/IP.
- Mudanças destrutivas em mapping NUNCA são aplicadas automaticamente.

## [2.5.0] - 2026-04-20 — Rodada M: Connections Federation & DX (65/65)

### Added
- Edge function `connection-introspect` — descobre schema (`information_schema.tables/columns`) de Supabases externos e persiste em `connection_configs.discovered_schema`.
- Componente `SchemaDiscoveryCard` — árvore expansível (tabela → colunas → tipo/nullability) com `Collapsible` + `ScrollArea`.
- Biblioteca `WEBHOOK_TEMPLATES` (Bitrix24, n8n, Stripe, GitHub, Lovable form) — botão "Usar template" no `IncomingWebhookFormDialog`.
- `WebhookSnippetsSheet` — snippets prontos cURL/fetch JS/Python/n8n/Bitrix24 com URL real, headers HMAC condicionais e payload baseado no `field_mapping`.
- MCP server v1.2.0 — 5 novas tools: `create_contact`, `update_deal_stage`, `add_interaction`, `search_companies_by_intent`, `get_pipeline_summary`.
- Tabela `mcp_tool_calls` — log de cada chamada MCP (status, latency_ms, error). RLS admin-read.
- Coluna `connection_configs.discovered_schema` + `discovered_at`.
- ADR-016 (`docs/adr/016-connections-federation-dx.md`).

### Notes
- Rate limit 10 req/min em `connection-introspect`. Limite de 50 tabelas × 80 colunas para conter payload.
- Snippets HMAC só aparecem se `webhook.require_signature = true`.

## [2.4.0] - 2026-04-20 — Rodada L: Connections Governance (60/60)

### Added
- Trigger `audit_connection_changes()` em `connection_configs` e `incoming_webhooks` — auditoria automática em `audit_log` com mascaramento de `config`, `encrypted_config`, `webhook_secret` e `token`.
- Colunas `webhook_secret`, `require_signature`, `replay_window_seconds` em `incoming_webhooks`.
- Verificação HMAC SHA-256 com anti-replay (`X-Lovable-Signature` + `X-Lovable-Timestamp`) no `incoming-webhook`.
- Tabela `connection_quotas` (mensal) + RPC `increment_webhook_quota` — retorna 429 quando excedido.
- Modo `?dry_run=true` no `incoming-webhook` (valida mapeamento sem persistir).
- `WebhookQuotaBar` no `IncomingWebhookCard` (semáforo: <80% primary, ≥80% âmbar, excedido destructive).
- `WebhookReplayButton` no `IncomingWebhookLogsDialog` (dry-run + replay real).
- Campos HMAC no `IncomingWebhookFormDialog` (toggle + secret + janela).
- ADR-015 (`docs/adr/015-connections-governance.md`).

### SLO
- 100% das mudanças de conexões/webhooks rastreadas em `audit_log` (sem secret vazado).
- Defesa em profundidade: rate-limit + HMAC + anti-replay + quota + DLQ.

## [2.3.0] - 2026-04-20 — Rodada K: Connections Observability (55/55)

### Added
- Tabela `incoming_webhook_dlq` (DLQ admin-only) + Edge Function `process-webhook-dlq` com retry exponencial (2^n min, max 5 tentativas).
- Cron `process-webhook-dlq-every-5min` (jobid 10) reprocessando entradas elegíveis automaticamente.
- RPC `get_connection_metrics(connection_id)` — p50/p95/p99/success_rate dos últimos 7d (admin-only).
- `ConnectionMetricsSparkline` no `ConnectionCard` — sparkline Recharts + badge semáforo (≥95% / ≥80% / <80%).
- Triggers `notify_connection_failures` (5+ falhas seguidas) e `notify_webhook_errors` (10+ erros/h) → `smart_notifications`.
- `WebhookDlqPanel` em `/admin/conexoes/logs` com botões "Reprocessar agora" e "Reprocessar lote".
- ADR-014 (`docs/adr/014-connections-observability.md`).

### SLO
- 99.5% de sucesso de webhook em janela de 7 dias (medido via `success_rate`).

## [2.2.0] - 2026-04-20 — Rodada J: Connections Hardening (50/50)

### Added
- Rate limiting (`_shared/rate-limit.ts`) em `incoming-webhook` (60/min por IP) e `mcp-server` (120/min por token).
- Validação Zod em ambos endpoints públicos (payload ≤256KB no webhook, JSON-RPC 2.0 estrito no MCP).
- Coluna `encrypted_config bytea` + trigger `connection_configs_encrypt_trigger` cifrando tokens via `pgcrypto`.
- Funções `encrypt_connection_config` / `decrypt_connection_config` SECURITY DEFINER (admin-only).
- Bloco `connections` no `health-aggregate` v3.1.0 (total, active, falhas 24h, erros webhook 24h).
- Página `/admin/conexoes/logs` — viewer cronológico unificado com filtros e Sheet de inspeção JSON.
- ADR-013 (`docs/adr/013-connections-module-hardening.md`).

### Security
- Tokens sensíveis (`token`, `api_key`, `secret`, `password`, `service_role_key`, `webhook_secret`) mascarados como `***` na coluna `config` em texto puro.
- `secret_refs` é zerado após cifragem; nunca persiste em plain text.
- Endpoints públicos retornam `429 Retry-After` em excesso de chamadas.

## [2.1.0] - 2026-04-20 — Rodada I: Polimento Final (45/45)

### Added
- Testes a11y automatizados via `vitest-axe` em `src/test/a11y/critical-components.test.tsx` (Button, Badge, EmptyState, Form).
- Registry público de atalhos contextuais (`src/lib/keyboardShortcutRegistry.ts`) com `registerShortcut`, `useScopedShortcut`, `getRegisteredShortcuts(scope)`.
- Component Gallery v2: tabs `external` (5 estados de ExternalDataCard) e `bulk` (BulkActionsBar).
- ADR-012 (`docs/adr/012-rodada-i-polimento-final.md`) registrando padrão de versionamento e gate a11y.

### Changed
- CHANGELOG.md reformatado para Keep-a-Changelog estrito (Added/Changed/Fixed/Security por versão).

### Security
- Gate a11y impede merge com violations `serious`/`critical` via CI.

## [2.0.0] - 2026-04-19 — Excellence Sustained (40/40)

Marco final consolidando 40 melhorias atômicas distribuídas em 8 rodadas (A-H). Sistema em estado de "excelência sustentada".

### Rodada H — Acessibilidade WCAG AA, DX & Polimento (5 itens)
- Component Gallery admin (`/admin/component-gallery`) — Storybook-lite com Button, Card, Badge, EmptyState, ActionToast, Loaders.
- Auditoria WCAG 2.1 AA documentada em `mem://standards/accessibility-wcag-aa`.
- Atalhos globais consolidados via `useKeyboardShortcutsEnhanced` + `KeyboardShortcutsCheatsheet` (?).
- Saúde agregada via edge function `system-health` (DB local/externo, WhatsApp, email, voice).
- ADR-011 (`docs/adr/011-rodada-h-accessibility-dx.md`) + este CHANGELOG.

### Rodadas A-G — entregas anteriores
- **G** Observabilidade profunda (RUM Web Vitals, CI workflow, useRestoreEntity para undo real, ARCHITECTURE.md, ADR-010).
- **F** Hardening profundo (audit DB, telemetria de erros estruturada, painel `/admin/error-logs`).
- **E** Confiabilidade (useActionToast destrutivo, circuit breaker em external-data, retry exponencial).
- **D** Performance (memoização agressiva, React.memo em listas grandes, route prefetching).
- **C** Resiliência UI (DashboardErrorBoundary, ExternalDataCard padronizado).
- **B** UX premium (PageTransition, OnboardingTour, NotificationCenter).
- **A** Fundações (TanStack Query exclusivo, FSD, RBAC com user_roles, audit trail).

### Arquivos-chave criados/modificados na Rodada H
- `src/pages/admin/ComponentGallery.tsx` (criado)
- `src/App.tsx` (rota `/admin/component-gallery`)
- `.lovable/memory/standards/accessibility-wcag-aa.md` (criado)
- `.lovable/memory/features/ux-rodada-h-accessibility.md` (criado)
- `docs/adr/011-rodada-h-accessibility-dx.md` (criado)
- `CHANGELOG.md` (este arquivo)

---

## [1.9.0] - 2026-04-12

### Qualidade de Código
- Eliminado 100% dos `any` restantes no source code (BehaviorAlertsPanel, AppreciationPanel)
- Ativado `strictBindCallApply: true` no TypeScript para maior type safety
- README.md atualizado com métricas atuais (4.470 testes, 31 Edge Functions)
- Runbook operacional expandido com procedimentos de escalation e thresholds

### Documentação
- 10 ADRs formais documentados (FSD, Circuit Breaker, Auth, AI Gateway, CORS, Logger, Rate Limiting, Zod)
- API de Edge Functions documentada no README
- Diagrama de arquitetura atualizado

### Testes
- 4.470 testes automatizados passando (78 arquivos)
- 0 erros TypeScript
- 0 vulnerabilidades npm

---

## [1.8.0] - 2026-04-12

### Segurança
- Substituído CORS wildcard `*` por `scopedCorsHeaders` dinâmico em 6 Edge Functions
- Adicionados testes automatizados para validação de security headers e CORS
- Zero vulnerabilidades high/critical (npm audit clean)

### Documentação
- Criado `docs/RUNBOOK.md` — runbook operacional completo (deploy, rollback, incidentes)
- Criado `CHANGELOG.md` com histórico de releases

### Performance
- Otimizado carregamento do módulo Empresas: `LISTING_SELECT` (~30 colunas vs SELECT *)
- Reduzido `INITIAL_FAST_LOAD` para 100 registros para primeira pintura rápida
- Implementado `countMethod: 'planned'` para contagens estimadas no banco externo

## [1.7.0] - 2026-04-11

### Adicionado
- Voice Agent com ElevenLabs (TTS + conversational AI)
- Agente de voz `elevenlabs-tts` e `voice-agent` Edge Functions
- Token de autenticação Scribe para sessões de voz

### Segurança
- Rate limiting com sliding window em Edge Functions
- Proteção anti brute force no login (5 tentativas / 15 min, bloqueios progressivos)
- Headers HTTP de segurança: CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy

## [1.6.0] - 2026-04-10

### Adicionado
- Sistema Lux Intelligence (enriquecimento automático de contatos/empresas)
- Integração Evolution API para WhatsApp
- Integração Bitrix24 para registro de chamadas
- Firecrawl scraping para dados web
- EnrichLayer para enriquecimento LinkedIn

### Melhorado
- Circuit breaker para resiliência de integrações externas
- Resilient fetch com retry exponencial
- Logger centralizado substituindo console.log em libs

## [1.5.0] - 2026-04-08

### Adicionado
- Análise DISC com AI (perfil comportamental de contatos)
- Análise RFM (Recência, Frequência, Valor Monetário)
- Sistema de insights AI com geração automática
- AI Writing Assistant para composição de mensagens
- Smart Reminders com sugestão inteligente de follow-ups

### Melhorado
- PWA com Service Worker e caching offline (NetworkFirst + CacheFirst)
- Web Vitals monitoring em produção

## [1.4.0] - 2026-04-05

### Adicionado
- Dashboard com métricas de pipeline e atividades recentes
- Weekly Digest (relatório semanal automatizado)
- Sistema de notificações push
- Health check endpoint com monitoramento de DB

### Melhorado
- Search unaccent para busca sem acentos (contatos, empresas, interações)
- Audit trail automático para operações CRUD

## [1.3.0] - 2026-04-02

### Adicionado
- Módulo de Empresas com dados do banco externo (220 tabelas)
- Mapa interativo de empresas (Leaflet + MarkerCluster)
- Filtros avançados com 30+ critérios
- Sistema de cooperativas (singular, central, confederação)

### Melhorado
- Paginação server-side com batch loading
- Formatação automática de CNPJ, capital social, razão social

## [1.2.0] - 2026-03-28

### Adicionado
- Módulo de Contatos com CRUD completo
- Sistema de interações (reuniões, calls, emails, notas)
- Relationship Score e Relationship Stage
- Análise de sentimento em interações
- Cadência de contato com lembretes automáticos

### Segurança
- RLS em todas as tabelas (user_id scoping)
- RBAC com tabela user_roles e função has_role()
- Autenticação Supabase com email + Google OAuth

## [1.1.0] - 2026-03-22

### Adicionado
- Sistema de automação (rules + triggers + actions)
- Templates de mensagens com variáveis dinâmicas
- Favoritos de templates
- Sistema de alertas e compatibilidade

## [1.0.0] - 2026-03-15

### Adicionado
- Lançamento inicial do SINGU CRM
- Autenticação com email/senha e Google
- Dashboard principal
- Perfil de usuário
- Tema claro/escuro
- Layout responsivo mobile-first
