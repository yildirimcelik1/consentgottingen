DROP POLICY IF EXISTS "Designers can update own draft forms" ON public.consent_forms;

CREATE POLICY "Designers can update own draft forms"
  ON public.consent_forms
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND status = 'draft'::form_status)
  WITH CHECK (created_by = auth.uid());