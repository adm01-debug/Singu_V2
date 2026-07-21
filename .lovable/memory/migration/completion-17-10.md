# Rodada 17/10 — Governança Profunda (entrega)

Simulei 700+ cenários adicionais sobre as rodadas 10–16 e identifiquei
8 novos gaps de alto impacto para governança contínua pós-cutover:

1. **Unused indexes** — indices com `idx_scan=0` >10MB oneram escrita e autovacuum.
2. **Duplicate indexes** — mesma tabela + mesmas colunas dobra custo de write.
3. **RLS FORCE audit** — owner superuser bypassa RLS sem `FORCE ROW LEVEL SECURITY`.
4. **Statement timeout por role** — `anon`/`authenticated` sem timeout exaurem pool.
5. **Prepared xacts órfãos** — 2PC abandonados retêm WAL até wraparound.
6. **Publication coverage** — tabelas novas ficam fora da publicação lógica de CDC.
7. **Role membership parity** — diff de hierarquia src↔dest evita escalonamento silencioso.
8. **JIT + checkpoint audit** — JIT mal configurado adiciona 50–200ms; checkpoint curto = IO storm.
9. **Function volatility** — funções `VOLATILE` em index expressions corrompem índices.

Todos plugados no `verify/full-audit.sh` (FATAL: prepared-xacts, function-volatility;
demais WARN). Sintaxe validada; scripts idempotentes e sem dependência externa
além de `DEST_DB_URL`.