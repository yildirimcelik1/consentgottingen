import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STUDIO_NAME = "Consent Bielefeld Tattoo & Piercing";
const STUDIO_ADDRESS = "Bahnhofstraße 22, 33602 Bielefeld, Deutschland";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { formId } = await req.json();
    if (!formId) {
      return new Response(JSON.stringify({ error: "formId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the form data
    const { data: form, error: formError } = await supabase
      .from("consent_forms")
      .select("*")
      .eq("id", formId)
      .single();

    if (formError || !form) {
      return new Response(JSON.stringify({ error: "Form not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch assignment data
    const { data: assignment } = await supabase
      .from("form_assignments")
      .select("*")
      .eq("form_id", formId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Generate PDF content as HTML → then we'll convert
    const pdfHtml = generatePdfHtml(form, assignment);

    // Use a simple approach: generate PDF via jsPDF-like text content
    // We'll create a well-structured HTML that can be stored and rendered
    const pdfContent = generateTextPdf(form, assignment);

    // Upload as a text-based PDF representation
    const fileName = `${form.consent_type}_${form.first_name}_${form.last_name}_${new Date().toISOString().split("T")[0]}.html`;
    const filePath = `${formId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("consent-pdfs")
      .upload(filePath, new Blob([pdfHtml], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      return new Response(JSON.stringify({ error: "Upload failed: " + uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("consent-pdfs")
      .getPublicUrl(filePath);

    // Update the consent form with the PDF URL
    await supabase
      .from("consent_forms")
      .update({
        pdf_url: urlData.publicUrl,
        document_generated_at: new Date().toISOString(),
      })
      .eq("id", formId);

    return new Response(
      JSON.stringify({ success: true, url: urlData.publicUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generatePdfHtml(form: any, assignment: any): string {
  const isTattoo = form.consent_type === "tattoo";
  const title = isTattoo ? "TATTOO EINVERSTÄNDNISBOGEN" : "PIERCING EINVERSTÄNDNISBOGEN";
  const procedureWord = isTattoo ? "Tätowieren" : "Piercen";
  const artistWord = isTattoo ? "Tätowierer" : "Artist";

  const formDate = form.approved_at
    ? new Date(form.approved_at).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });

  const dob = form.date_of_birth || "—";
  const gender = form.gender === "male" ? "Männlich" : form.gender === "female" ? "Weiblich" : form.gender === "other" ? "Sonstiges" : "—";

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.5; background: #fff; }
  .page { max-width: 210mm; margin: 0 auto; padding: 20mm; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #c8956c; padding-bottom: 20px; }
  .header h1 { font-size: 22px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
  .header .studio { font-size: 13px; font-weight: 600; color: #c8956c; }
  .header .address { font-size: 11px; color: #666; margin-top: 4px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e0e0e0; color: #c8956c; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .info-item { display: flex; gap: 8px; padding: 4px 0; }
  .info-label { font-weight: 600; min-width: 130px; color: #555; }
  .info-value { color: #1a1a1a; }
  .consent-list { list-style: none; padding: 0; }
  .consent-list li { padding: 6px 0; padding-left: 16px; position: relative; }
  .consent-list li::before { content: "•"; position: absolute; left: 0; color: #c8956c; font-weight: bold; }
  .signature-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .sig-block { text-align: center; }
  .sig-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 8px; font-size: 10px; color: #666; }
  .sig-image { max-width: 200px; max-height: 80px; margin: 0 auto; display: block; }
  .warning { background: #fff8f0; border-left: 3px solid #c8956c; padding: 10px 14px; margin: 12px 0; font-size: 10px; }
  .warning strong { color: #c8956c; }
  .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 9px; color: #999; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
  .badge-approved { background: #e8f5e9; color: #2e7d32; }
  .badge-draft { background: #fff3e0; color: #e65100; }
  @media print { body { background: white; } .page { padding: 0; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>${title}</h1>
    <div class="studio">${STUDIO_NAME}</div>
    <div class="address">${STUDIO_ADDRESS}</div>
  </div>

  <div class="section">
    <div class="section-title">Kundeninformationen</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Vorname:</span><span class="info-value">${form.first_name || "—"}</span></div>
      <div class="info-item"><span class="info-label">Nachname:</span><span class="info-value">${form.last_name || "—"}</span></div>
      <div class="info-item"><span class="info-label">E-Mail:</span><span class="info-value">${form.email || "—"}</span></div>
      <div class="info-item"><span class="info-label">Telefon:</span><span class="info-value">${form.phone || "—"}</span></div>
      <div class="info-item"><span class="info-label">Land:</span><span class="info-value">${form.country || "—"}</span></div>
      <div class="info-item"><span class="info-label">Stadt:</span><span class="info-value">${form.city || "—"}</span></div>
      <div class="info-item"><span class="info-label">Postleitzahl:</span><span class="info-value">${form.postal_code || "—"}</span></div>
      <div class="info-item"><span class="info-label">Geburtsdatum:</span><span class="info-value">${dob}</span></div>
      <div class="info-item"><span class="info-label">Geschlecht:</span><span class="info-value">${gender}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${isTattoo ? "Tattoo-Details" : "Piercing-Details"}</div>
    <div class="info-grid">
      ${isTattoo ? `<div class="info-item"><span class="info-label">Beschreibung:</span><span class="info-value">${form.procedure_description || "—"}</span></div>` : ""}
      <div class="info-item"><span class="info-label">${isTattoo ? "Platzierung" : "Piercing-Bereich"}:</span><span class="info-value">${form.body_area || "—"}</span></div>
      ${assignment ? `
      <div class="info-item"><span class="info-label">Artist:</span><span class="info-value">${assignment.artist_name || "—"}</span></div>
      <div class="info-item"><span class="info-label">Preis:</span><span class="info-value">${assignment.price ? "€" + assignment.price : "—"}</span></div>
      ` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Kundenerklärung</div>
    <ul class="consent-list">
      <li>Ich habe die Information "Informationen für den Kunden zum Einverständnisbogen" zur Kenntnis genommen.</li>
      <li>Ich wurde über die möglichen Risiken und Komplikationen im Zusammenhang mit dem ${procedureWord} informiert und habe die Informationen verstanden.</li>
      <li>Ich stehe derzeit nicht unter dem Einfluss von Alkohol, Drogen oder anderen Substanzen, die mein Erleben, meinen freien Willen oder mein Urteilsvermögen beeinträchtigen könnten.</li>
      <li>Die Nachpflege wurde mir klar erklärt und ich verstehe, welche Maßnahmen ich ergreifen und welche Vorsichtsmaßnahmen ich treffen muss.</li>
      <li>Ich erkläre mich damit einverstanden, dass die beschriebene Maßnahme von dem genannten ${artistWord} durchgeführt wird.</li>
      <li>Ich bestätige, dass der ${artistWord} diesen Einverständnisbogen zu den Unterlagen nehmen darf.</li>
      <li>Ich bestätige, dass ich die oben genannten Informationen und Erklärungen nach bestem Wissen und Gewissen abgegeben habe und dass diese korrekt sind.</li>
    </ul>
    ${isTattoo ? `
    <div class="warning">
      <strong>ACHTUNG:</strong> Tätowierungen an Händen, Fingern, Innenseiten der Lippen und Füßen können nach der Heilung verblassen. Die Haut in diesen Bereichen ist dicker und Reibung ausgesetzt, daher besteht ein höheres Risiko für Nachbesserungen.
    </div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">Einwilligung zu Bildaufnahmen</div>
    <p>Ich erlaube, dass alle meine im Studio aufgenommenen Bilder in den sozialen Medien geteilt werden.</p>
  </div>

  <div class="section">
    <div class="section-title">Unterschrift</div>
    <div class="signature-section">
      <div class="sig-block">
        ${form.client_signature ? `<img class="sig-image" src="${form.client_signature}" alt="Kundenunterschrift" />` : ""}
        <div class="sig-line">Kundenunterschrift</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Datum: ${formDate}</div>
      </div>
    </div>
  </div>

  <div class="section" style="margin-top: 20px;">
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Status:</span>
        <span class="info-value"><span class="badge ${form.status === "approved" ? "badge-approved" : "badge-draft"}">${form.status === "approved" ? "Genehmigt" : "Entwurf"}</span></span>
      </div>
      <div class="info-item">
        <span class="info-label">Erstellt am:</span>
        <span class="info-value">${new Date(form.created_at).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    ${STUDIO_NAME} — ${STUDIO_ADDRESS}<br/>
    Dieses Dokument wurde digital erstellt und ist ohne Unterschrift gültig.
  </div>
</div>
</body>
</html>`;
}

function generateTextPdf(_form: any, _assignment: any): string {
  return "";
}
