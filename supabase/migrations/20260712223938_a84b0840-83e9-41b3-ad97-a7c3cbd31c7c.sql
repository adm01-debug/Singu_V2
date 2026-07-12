
CREATE POLICY "Admins insert regen queue"
ON public.behavioral_profile_regen_queue
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update regen queue"
ON public.behavioral_profile_regen_queue
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
