
CREATE TABLE public.completed_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL,
  consent_type public.consent_type NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  date_of_birth text,
  gender text,
  body_area text,
  procedure_description text,
  assigned_artist_id uuid,
  artist_name text NOT NULL DEFAULT '',
  deposit_amount text,
  total_price text,
  rest_amount text,
  approved_at timestamptz DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.completed_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with completed_appointments"
  ON public.completed_appointments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Designers can manage own completed_appointments"
  ON public.completed_appointments FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
