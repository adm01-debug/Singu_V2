
CREATE POLICY "Admins read all regen queue"
ON public.behavioral_profile_regen_queue
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
