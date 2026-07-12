
CREATE POLICY "Admins read all insight feedback"
ON public.behavioral_insight_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
