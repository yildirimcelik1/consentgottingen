INSERT INTO storage.buckets (id, name, public)
VALUES ('consent-pdfs', 'consent-pdfs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can read consent PDFs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'consent-pdfs');

CREATE POLICY "Authenticated users can upload consent PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'consent-pdfs');

CREATE POLICY "Authenticated users can update consent PDFs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'consent-pdfs');