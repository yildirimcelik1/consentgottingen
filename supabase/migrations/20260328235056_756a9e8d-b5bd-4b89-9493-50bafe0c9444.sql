
CREATE TABLE public.all_completed_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  date_of_birth text,
  gender text,
  consent_type consent_type NOT NULL,
  body_area text,
  procedure_description text,
  deposit_amount text,
  rest_amount text,
  total_price text,
  assigned_artist_id uuid,
  artist_name text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'regular',
  created_by uuid,
  approved_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.all_completed_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with all_completed_forms"
  ON public.all_completed_forms FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Designers can manage own all_completed_forms"
  ON public.all_completed_forms FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
