
CREATE TABLE public.form_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.consent_forms(id) ON DELETE CASCADE,
  consent_type public.consent_type NOT NULL,
  assigned_artist_id uuid NOT NULL,
  artist_name text NOT NULL DEFAULT '',
  price text,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.form_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assignments"
  ON public.form_assignments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Designers can insert assignments"
  ON public.form_assignments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Admins can do everything with assignments"
  ON public.form_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
