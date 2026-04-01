
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'designer');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'designer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create consent_type enum
CREATE TYPE public.consent_type AS ENUM ('tattoo', 'piercing');

-- Create form_status enum
CREATE TYPE public.form_status AS ENUM ('draft', 'approved');

-- Create consent_forms table
CREATE TABLE public.consent_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  status form_status NOT NULL DEFAULT 'draft',
  consent_type consent_type NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  date_of_birth TEXT,
  email TEXT,
  phone TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  government_id_type TEXT,
  government_id_number TEXT,
  has_allergies BOOLEAN NOT NULL DEFAULT false,
  allergies_details TEXT,
  has_medical_conditions BOOLEAN NOT NULL DEFAULT false,
  medical_conditions_details TEXT,
  takes_medication BOOLEAN NOT NULL DEFAULT false,
  medication_details TEXT,
  pregnant_or_breastfeeding BOOLEAN,
  has_skin_condition BOOLEAN,
  skin_condition_details TEXT,
  blood_disorder BOOLEAN,
  blood_disorder_details TEXT,
  diabetes BOOLEAN,
  heart_condition BOOLEAN,
  epilepsy BOOLEAN,
  hepatitis BOOLEAN,
  hiv BOOLEAN,
  fainting_history BOOLEAN,
  under_influence BOOLEAN,
  other_health_notes TEXT,
  procedure_description TEXT,
  body_area TEXT,
  reference_notes TEXT,
  designer_notes TEXT,
  internal_notes TEXT,
  accepted_terms BOOLEAN NOT NULL DEFAULT false,
  accepted_aftercare BOOLEAN NOT NULL DEFAULT false,
  photo_consent BOOLEAN,
  client_signature TEXT,
  signature_date TEXT,
  pdf_url TEXT,
  document_generated_at TIMESTAMPTZ,
  price TEXT,
  assigned_artist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER consent_forms_updated_at
  BEFORE UPDATE ON public.consent_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;

-- Profiles RLS: users can read all profiles, update own
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles RLS: only admins can manage
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Consent forms RLS
CREATE POLICY "Admins can do everything with forms"
  ON public.consent_forms FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Designers can view all forms"
  ON public.consent_forms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Designers can insert forms"
  ON public.consent_forms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Designers can update own draft forms"
  ON public.consent_forms FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND status = 'draft');
