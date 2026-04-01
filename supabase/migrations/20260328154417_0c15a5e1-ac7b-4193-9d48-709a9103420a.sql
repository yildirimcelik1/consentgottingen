CREATE TABLE public.appointment_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  deposit_amount text,
  linked_form_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.appointment_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with drafts"
  ON public.appointment_drafts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Designers can manage own drafts"
  ON public.appointment_drafts FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());