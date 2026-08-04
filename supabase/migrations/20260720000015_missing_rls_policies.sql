-- Migration: Add missing RLS policies for 11 business tables queried from the frontend
--
-- These tables have RLS ENABLED but zero policies, meaning all client-side queries
-- (using the anon/user JWT) silently return 0 rows. They are correctly accessible
-- from edge functions (service role bypasses RLS), but the frontend direct queries
-- are blocked. This migration adds owner-scoped policies so the frontend works
-- correctly while maintaining row-level isolation between users.

-- 1. favorite_templates
CREATE POLICY "Users manage own favorite_templates"
  ON public.favorite_templates FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. intent_scores
CREATE POLICY "Users view own intent_scores"
  ON public.intent_scores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own intent_scores"
  ON public.intent_scores FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own intent_scores"
  ON public.intent_scores FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own intent_scores"
  ON public.intent_scores FOR DELETE
  USING (user_id = auth.uid());

-- 3. intent_signals
CREATE POLICY "Users view own intent_signals"
  ON public.intent_signals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own intent_signals"
  ON public.intent_signals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own intent_signals"
  ON public.intent_signals FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own intent_signals"
  ON public.intent_signals FOR DELETE
  USING (user_id = auth.uid());

-- 4. battle_cards
CREATE POLICY "Users manage own battle_cards"
  ON public.battle_cards FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. competitors
CREATE POLICY "Users manage own competitors"
  ON public.competitors FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. rfm_metrics
CREATE POLICY "Users view own rfm_metrics"
  ON public.rfm_metrics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own rfm_metrics"
  ON public.rfm_metrics FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own rfm_metrics"
  ON public.rfm_metrics FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own rfm_metrics"
  ON public.rfm_metrics FOR DELETE
  USING (user_id = auth.uid());

-- 7. rfm_history
CREATE POLICY "Users view own rfm_history"
  ON public.rfm_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own rfm_history"
  ON public.rfm_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- rfm_history is append-only from the engine; no UPDATE/DELETE for users

-- 8. win_loss_records
CREATE POLICY "Users manage own win_loss_records"
  ON public.win_loss_records FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 9. win_loss_reasons
CREATE POLICY "Users manage own win_loss_reasons"
  ON public.win_loss_reasons FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 10. sequence_enrollments
CREATE POLICY "Users view own sequence_enrollments"
  ON public.sequence_enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own sequence_enrollments"
  ON public.sequence_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own sequence_enrollments"
  ON public.sequence_enrollments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own sequence_enrollments"
  ON public.sequence_enrollments FOR DELETE
  USING (user_id = auth.uid());

-- 11. sms_campaign_recipients (no direct user_id — owned via sms_campaigns)
CREATE POLICY "Users view own campaign recipients"
  ON public.sms_campaign_recipients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sms_campaigns sc
      WHERE sc.id = sms_campaign_recipients.campaign_id
        AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert own campaign recipients"
  ON public.sms_campaign_recipients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sms_campaigns sc
      WHERE sc.id = sms_campaign_recipients.campaign_id
        AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own campaign recipients"
  ON public.sms_campaign_recipients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sms_campaigns sc
      WHERE sc.id = sms_campaign_recipients.campaign_id
        AND sc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own campaign recipients"
  ON public.sms_campaign_recipients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sms_campaigns sc
      WHERE sc.id = sms_campaign_recipients.campaign_id
        AND sc.user_id = auth.uid()
    )
  );
