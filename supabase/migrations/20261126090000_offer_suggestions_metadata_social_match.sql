-- Fecha a lacuna da feature "Evidencia do match social nas ofertas".
--
-- Estado real medido em 2026-11-26 no banco do Singu (pgxfvjmuubtbowutlide):
--   social_behavior_analysis com keywords = 118 contatos (produzidos pelo cron
--   sync-social-interests, mergeado em #359), mas social_insights = 0 linhas.
--
-- O motor (supabase/functions/generate-offer-suggestions/index.ts) ja montava um
-- objeto `metadata` {sources, keywords, social_insight_ids} para gravar a
-- evidencia que sustentou cada oferta. A coluna NAO existia em
-- public.offer_suggestions. Consequencia: o PostgREST recusa o insert inteiro
-- quando o payload traz coluna inexistente, o erro era apenas logado
-- (`console.error('Error inserting suggestions')`) e a resposta ainda devolvia
-- `suggestionsGenerated: N`. Ou seja: perda silenciosa de todas as sugestoes
-- daquele lote, com a API afirmando sucesso.
--
-- Hoje o caminho nao disparava porque social_insights estava vazio; a falha era
-- latente e passaria a morder na primeira analise social com insight casado.
--
-- Esta migration adiciona a coluna de evidencia. A UI (OfferSuggestionsElite ->
-- SocialMatchPanel/SocialMatchDetails) passa a exibir as fontes e as palavras
-- -chave que geraram a oferta, em vez do aviso "evidencias indisponiveis".

ALTER TABLE public.offer_suggestions
  ADD COLUMN IF NOT EXISTS metadata jsonb;

COMMENT ON COLUMN public.offer_suggestions.metadata IS
  'Evidencia do match que sustentou a oferta: {sources: string[], keywords: string[], social_insight_ids: uuid[]}. Preenchida por generate-offer-suggestions.';