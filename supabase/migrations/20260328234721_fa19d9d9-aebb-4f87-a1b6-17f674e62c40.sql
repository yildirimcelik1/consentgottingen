
CREATE OR REPLACE VIEW public.all_approved_forms AS
-- Regular approved consent forms (non-Vormerkung)
SELECT
  cf.id,
  cf.id AS form_id,
  cf.first_name,
  cf.last_name,
  cf.email,
  cf.phone,
  cf.date_of_birth,
  cf.gender,
  cf.consent_type,
  cf.body_area,
  cf.procedure_description,
  cf.price AS total_price,
  cf.deposit_amount,
  NULL::text AS rest_amount,
  cf.assigned_artist_id,
  COALESCE(p.full_name, '') AS artist_name,
  cf.created_by,
  cf.approved_at,
  cf.created_at,
  'regular'::text AS source
FROM consent_forms cf
LEFT JOIN profiles p ON p.id = cf.assigned_artist_id
WHERE cf.status = 'approved'
  AND cf.id NOT IN (SELECT form_id FROM completed_appointments)

UNION ALL

-- Completed appointments (Vormerkung flow)
SELECT
  ca.id,
  ca.form_id,
  ca.first_name,
  ca.last_name,
  ca.email,
  ca.phone,
  ca.date_of_birth,
  ca.gender,
  ca.consent_type,
  ca.body_area,
  ca.procedure_description,
  ca.total_price,
  ca.deposit_amount,
  ca.rest_amount,
  ca.assigned_artist_id,
  ca.artist_name,
  ca.created_by,
  ca.approved_at,
  ca.created_at,
  'vormerkung'::text AS source
FROM completed_appointments ca;
