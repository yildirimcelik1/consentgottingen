import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const STUDIO_NAME = 'Consent Bielefeld Tattoo & Piercing';
const STUDIO_ADDRESS = 'Bahnhofstraße 22, 33602 Bielefeld';

interface GDPRPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GDPRPolicyDialog({ open, onOpenChange }: GDPRPolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0" aria-describedby="gdpr-desc">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl font-bold text-center">DATENSCHUTZERKLÄRUNG (DSGVO)</DialogTitle>
          <DialogDescription id="gdpr-desc" className="text-center text-sm text-muted-foreground">
            {STUDIO_NAME} — {STUDIO_ADDRESS}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] px-6 pb-6">
          <div className="space-y-5 text-sm text-muted-foreground">

            <Section title="1. Verantwortlicher">
              <p>
                Verantwortlicher im Sinne der DSGVO ist {STUDIO_NAME}, {STUDIO_ADDRESS}.
              </p>
            </Section>

            <Section title="2. Erhebung und Verarbeitung personenbezogener Daten">
              <p>
                Im Rahmen des Einverständnisbogens erheben wir folgende personenbezogene Daten:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Vor- und Nachname</li>
                <li>E-Mail-Adresse</li>
                <li>Telefonnummer</li>
                <li>Anschrift (Land, Stadt, Postleitzahl)</li>
                <li>Geburtsdatum und Geschlecht</li>
                <li>Gesundheitsbezogene Angaben (Allergien, Erkrankungen)</li>
                <li>Unterschrift des Kunden / Erziehungsberechtigten</li>
              </ul>
            </Section>

            <Section title="3. Zweck der Datenverarbeitung">
              <p>
                Die Daten werden ausschließlich zum Zweck der Durchführung und Dokumentation der gewünschten Dienstleistung (Tätowierung / Piercing) sowie zur Erfüllung gesetzlicher Aufbewahrungspflichten verarbeitet.
              </p>
            </Section>

            <Section title="4. Rechtsgrundlage">
              <p>
                Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO sowie zur Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO.
              </p>
            </Section>

            <Section title="5. Speicherdauer">
              <p>
                Ihre Daten werden für die Dauer der gesetzlichen Aufbewahrungsfristen gespeichert und anschließend sicher gelöscht.
              </p>
            </Section>

            <Section title="6. Ihre Rechte">
              <p>Sie haben jederzeit das Recht auf:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
                <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
                <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
                <li>Widerruf Ihrer Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
              </ul>
            </Section>

            <Section title="7. Weitergabe an Dritte">
              <p>
                Eine Weitergabe Ihrer Daten an Dritte erfolgt nicht, es sei denn, es besteht eine gesetzliche Verpflichtung.
              </p>
            </Section>

            <Section title="8. Kontakt">
              <p>
                Bei Fragen zum Datenschutz wenden Sie sich bitte an: {STUDIO_NAME}, {STUDIO_ADDRESS}.
              </p>
            </Section>

            <div className="flex justify-center pt-4">
              <Button onClick={() => onOpenChange(false)} className="px-8">
                Ich habe die Datenschutzerklärung gelesen
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full inline-block" />
        {title}
      </h3>
      <div className="pl-3">{children}</div>
    </div>
  );
}
