# Reauditoria de implementação — 2026-10-02

## Veredito

Esta rodada removeu falhas críticas e tornou os gates locais reproduzíveis, mas
**não certifica o sistema como 10/10 nem como pronto em produção**. Produção,
banco remoto, backups, configuração do Supabase, secrets, migrations aplicadas,
tráfego real e branch protection não foram alterados nem validados nesta rodada.

## Controles comprovados localmente

| Controle | Evidência reproduzida |
| --- | --- |
| TypeScript | `npx tsc --noEmit` sem erros |
| ESLint | `npx eslint . --max-warnings=0` sem erros ou warnings |
| Testes unitários | 79 arquivos e 5.544 testes aprovados |
| Coverage executável | provider V8 instalado; relatório gerado |
| Coverage global atual | 9,16% statements/lines; não atende uma meta de 70% |
| Testes Deno compartilhados | 26 testes aprovados |
| Edge imports | nenhum import `esm.sh` |
| CORS Edge | nenhum wildcard fora da allowlist |
| Build | build Vite de produção aprovado |
| Bundle | scanner encontrou os chunks recursivamente e aprovou os budgets |
| Dependências de produção | nenhuma vulnerabilidade `high`; restam `moderate` com upgrades breaking |

## Melhorias entregues

- autenticação de service role exige o segredo exato; claims JWT não concedem
  privilégio administrativo;
- testes cobrem service role, JWT forjado e JWT expirado;
- `migrate-helper` e sua configuração foram removidos;
- `external-data` deriva o tenant autenticado nas operações sensíveis;
- `dual-write-proxy` exige segredo, operação/tabela permitida e payload limitado;
- webhook exige HMAC sobre corpo bruto, timestamp e chave de idempotência;
- replay é diferenciado de falha de persistência;
- deploy de Edge Functions deixou de usar `--no-verify-jwt` globalmente;
- secrets do conector Evolution/Bitrix deixaram de existir no código;
- health checks retornam `unavailable`/HTTP 503 quando faltam dependências;
- falhas de observabilidade deixaram de ser convertidas em zero saudável;
- métricas aleatórias, scores PNL fixos e renovação contratual inventada foram
  removidos ou apresentados como indisponíveis;
- consultas de analytics e snapshots ganharam paginação completa, com teste para
  volumes acima do limite padrão de 1.000 linhas do PostgREST;
- CI passou a falhar quando faltam secrets dos gates RLS/E2E, em vez de pular os
  controles silenciosamente;
- lint global sem warnings passou a funcionar como ratchet de manutenibilidade;
- documentos históricos de “10/10” receberam aviso explícito de não vigência.

## Cenários adversariais cobertos

1. JWT com claim `service_role`, mas sem o segredo real: rejeitado.
2. JWT expirado: rejeitado.
3. Corpo de webhook alterado após assinatura: rejeitado.
4. Chave de idempotência alterada: rejeitada.
5. Replay com conflito único: HTTP 409.
6. Falha de armazenamento do nonce: HTTP 500, sem falso replay.
7. Mais de 1.000 registros em agregação: paginação continua até a página final.
8. Dependência obrigatória ausente em health check: estado indisponível, não saudável.
9. Nenhum bundle JavaScript gerado: checker falha, em vez de aprovar conjunto vazio.
10. Secrets de RLS/E2E ausentes na CI: pipeline falha explicitamente.

## Pendências externas e riscos residuais

- Revogar e rotacionar todas as credenciais Evolution/Bitrix anteriormente
  versionadas. Remover o literal do código não invalida a credencial exposta.
- Aplicar e validar a migration de hardening do webhook no banco correto.
- Executar a cadeia completa de migrations em banco vazio e registrar o resultado.
- Executar a matriz RLS contra o banco remoto com usuários A, B e administrador.
- Executar E2E em ambiente autorizado com credenciais de teste.
- Confirmar MFA, HIBP, backups, restore testado, retenção e branch protection nas
  plataformas remotas.
- Auditar RPCs externos cujo schema não está presente nas migrations locais.
- Elevar coverage por domínio. O relatório atual inclui grande volume de código
  sem testes e não sustenta alegação de cobertura ampla.
- Tratar vulnerabilidades `moderate` remanescentes de Vitest e React Router em
  upgrades breaking separados, com regressão completa.
- Reduzir chunks acima de 600 kB; o budget configurado ainda os aceita.

## Critério honesto para 10/10

Uma nota máxima exige, no mínimo, todos os gates locais e remotos verdes, coverage
compatível com o risco dos fluxos críticos, migrations replayáveis em banco vazio,
RLS adversarial aprovado, restore comprovado, secrets rotacionados, E2E aprovado,
deploy observado com tráfego real e ausência de achados críticos/altos. Esses
requisitos não estão todos comprovados nesta rodada.
