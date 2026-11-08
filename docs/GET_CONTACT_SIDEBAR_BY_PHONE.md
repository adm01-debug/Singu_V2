# RPC `get_contact_sidebar_by_phone(p_phone text)`

Migration: `supabase/migrations/20261002154500_get_contact_sidebar_by_phone.sql` · Teste: `supabase/tests/get_contact_sidebar_by_phone.sql`

## Consumidor

Painel lateral "Detalhes do Contato" do **Zapp Web V2** (repo `adm01-debug/Zapp_Web_V2`), via a edge `crm-integration` (`action=contactLookup`, `lookup='sidebar'`). Uma chamada por contato aberto, cache de 10 min no front. Plano completo: `docs/design/PLANO_SIDEBAR_CONTATO_3_SECOES_100_ETAPAS_2026-10-02.md` naquele repo.

## Contrato

Retorna `jsonb`. Sem contato resolvido: `{"found": false}` — sem eco do telefone.

```jsonc
{
  "found": true,
  "contact_id": "uuid",
  "professional": {
    "whatsapp":          { "numero_e164", "numero", "phone_type" } | null,
    "email_corporativo": { "email", "is_verified" } | null,
    "empresa":           { "id", "nome", "logo_url" } | null,   // nome = nome_fantasia ?? nome_crm ?? razao_social
    "departamento":      string | null,
    "cargo":             string | null                           // cargo ?? role_title
  },
  "personal": {
    "social": [ { "plataforma": "instagram|linkedin|facebook|x", "handle", "url" } ],  // 1 por plataforma, is_active
    "data_nascimento": "YYYY-MM-DD" | null                                            // data_nascimento ?? birthday
  },
  "singu_profile": {
    "disc":             { "primary", "blend", "confidence", "notes" } | null,
    "vak":              { "primary", "visual", "auditory", "kinesthetic" } | null,
    "big_five":         { "openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism", "confidence" } | null,
    "mbti":             { "type", "e_i", "s_n", "t_f", "j_p" } | null,
    "enneagram":        { "type", "wing", "scores" } | null,
    "temperament":      { "primary", "secondary", "notes" } | null,
    "metaprograms":     { "toward", "away_from", "internal", "external", "options", "procedures", "proactive", "reactive", "global", "detail", "notes" } | null,
    "fears_motivation": { "main_fear", "motivation_primary", "current_pressure", "professional_goals" } | null,
    "decision":         { "speed", "criteria", "needs_approval", "approver_name" } | null,
    "budget":           { "authority", "decision_role", "decision_power" } | null,
    "influencers":      [ { "contact_id", "name", "cargo" } ],                          // máx. 5
    "rapport":          { "pacing_speed", "voice_tone_preferred", "mirroring_technique", "preferred_triggers", "emotional_anchors", "resistance_triggers", "notes", "channel_scores": { "visual", "auditory", "kinesthetic", "digital" } } | null,
    "objection_scripts":[ { "objection_type", "script_content", "neurological_bias", "effectiveness_score" } ],  // máx. 10, por eficácia
    "assessed_at":      "timestamptz" | null   // max(updated_at) das tabelas de perfil
  }
}
```

## Fontes

| Bloco | Tabela(s) | Fallback |
|---|---|---|
| Resolução do contato | `contact_phones` (`numero_normalizado`/`numero_e164`/`numero`, com e sem DDI 55) | `contacts.phone` / `contacts.whatsapp` normalizados |
| whatsapp / email | `contact_phones` (`is_whatsapp`), `contact_emails` (`email_type='corporativo'`) | — |
| empresa | `companies` via `contacts.company_id` | — |
| redes / nascimento | `contact_social_media` (`is_active`), `contacts` | — |
| perfil (disc, vak, big_five, mbti, enneagram, temperament, metaprograms, fears, decision, budget, influencers, rapport, objections) | `contact_behavior`, `contact_personality`, `contact_metaprograms`, `contact_rapport_strategy`, `contact_objection_scripts`, `contact_decision_making`, `contact_influence` | `contacts.behavior` (jsonb) para disc/vak/temperament/decision/budget |

### Ausência honesta nos campos de decisão

O cadastro legado gravou `decisionCriteria=[]`, `needsApproval=false` e
`decisionPower=5` como template em milhares de contatos. Esses defaults isolados
não são uma avaliação e não criam os blocos `decision`/`budget`. Um `false` ou
um poder `5` continua válido quando acompanhado por outro sinal preenchido
(velocidade, critério, aprovador, papel ou autoridade). A precedência é:

1. tabelas dedicadas `contact_decision_making`/`contact_influence`;
2. colunas de `contact_behavior`;
3. `contacts.behavior` em JSON.

Contato `deleted_at` não responde; `is_duplicate` resolve para `duplicate_of` (1 hop).

## Segurança

- `STABLE`, `SECURITY DEFINER`, `SET search_path = public`.
- `REVOKE ALL` de `PUBLIC`/`anon`/`authenticated`; `GRANT EXECUTE` só para `service_role`.
- Sem CPF, endereço, notas internas, `family_info`, `hobbies` ou `assigned_by_id` no payload.
- Limites: 5 influenciadores, 10 scripts de objeção, 1 rede por plataforma.

## Como aplicar

DDL em produção via pipeline do projeto (não aplicar a partir de branch aberto). Teste manual:

```bash
psql "$DATABASE_URL" -f supabase/tests/get_contact_sidebar_by_phone.sql   # roda com ROLLBACK
```

## Verificação em produção — 03/10/2026

- Migration registrada no ledger como `20261003145227_get_contact_sidebar_by_phone`.
- Teste SQL completo executado com `ROLLBACK`, sem resíduos e sem falhas.
- 60 chamadas sobre três contatos reais: p95 **8,29 ms**, média **5,46 ms** e máximo **31,43 ms**.
- Maior payload medido: **1.050 bytes**; as 60 respostas retornaram `found=true`.
- Metadados conferidos: `STABLE`, `SECURITY DEFINER`, `search_path=public`, sem `EXECUTE` para `anon`/`authenticated` e com `EXECUTE` para `service_role`.
- Advisors de segurança e desempenho não associaram nenhum novo achado a esta função; os avisos retornados pertencem a objetos preexistentes do projeto.
