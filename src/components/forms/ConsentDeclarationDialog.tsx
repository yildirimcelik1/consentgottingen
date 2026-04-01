import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const STUDIO_NAME = 'Consent Bielefeld Tattoo & Piercing';
const STUDIO_ADDRESS_LINE1 = 'Bahnhofstraße 22, 33602';
const STUDIO_CITY = 'Bielefeld';

interface ConsentDeclarationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'tattoo' | 'piercing';
  onAccept: () => void;
}

export function ConsentDeclarationDialog({
  open,
  onOpenChange,
  type,
  onAccept,
}: ConsentDeclarationDialogProps) {
  const isTattoo = type === 'tattoo';

  const title = isTattoo ? 'TATTOO CONSENT FORM' : 'PIERCING EINVERSTÄNDNISERKLÄRUNG';

  const procedureWord = isTattoo ? 'Tätowieren' : 'Piercen';
  const artistWord = isTattoo ? 'Tätowierer' : 'Artist';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0" aria-describedby="consent-desc">
        <DialogHeader className="sr-only"><DialogTitle>{title}</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-[85vh] p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              <p className="font-semibold text-sm mt-4">{STUDIO_NAME}</p>
              <p className="text-muted-foreground text-sm">{STUDIO_ADDRESS_LINE1}</p>
              <p className="text-muted-foreground text-sm">{STUDIO_CITY}</p>
            </div>

            {/* KUNDENERKLÄRUNG */}
            <Section title="KUNDENERKLÄRUNG">
              <BulletItem>
                Ich habe die Information "Informationen für den Kunden zum Einverständnisbogen" zur Kenntnis genommen.
              </BulletItem>
              <BulletItem>
                Ich wurde über die möglichen Risiken und Komplikationen im Zusammenhang mit dem {procedureWord} informiert und habe die Informationen verstanden.
              </BulletItem>
              <BulletItem>
                Ich stehe derzeit nicht unter dem Einfluss von Alkohol, Drogen oder anderen Substanzen, die mein Erleben, meinen freien Willen oder mein Urteilsvermögen beeinträchtigen könnten.
              </BulletItem>
              <BulletItem>
                Die Nachpflege wurde mir klar erklärt und ich verstehe, welche Maßnahmen ich ergreifen und welche Vorsichtsmaßnahmen ich treffen muss. Ich habe meine Kopie der Nachpflegeanleitung erhalten.
              </BulletItem>
              {isTattoo ? (
                <>
                  <BulletItem>
                    Ich erkläre mich damit einverstanden, dass die im Ink-Pass beschriebene Tätowierung von dem genannten Tätowierer durchgeführt wird.
                  </BulletItem>
                  <BulletItem>
                    Ich bestätige, dass der Tätowierer diesen Einverständnisbogen zu den Unterlagen nehmen darf.
                  </BulletItem>
                  <BulletItem>
                    <span className="text-primary font-semibold">ACHTUNG:</span> Tätowierungen an Händen, Fingern, Innenseiten der Lippen und Füßen können nach der Heilung verblassen. Die Haut in diesen Bereichen ist dicker und Reibung ausgesetzt, daher besteht ein höheres Risiko für Nachbesserungen.
                  </BulletItem>
                </>
              ) : (
                <>
                  <BulletItem>
                    Ich erkläre mich damit einverstanden, dass die beschriebene Piercing-Maßnahme von dem genannten Artist durchgeführt wird.
                  </BulletItem>
                  <BulletItem>
                    Ich bestätige, dass der Artist diesen Einverständnisbogen zu den Unterlagen nehmen darf.
                  </BulletItem>
                </>
              )}
              <BulletItem>
                Ich bestätige, dass ich die oben genannten Informationen und Erklärungen nach bestem Wissen und Gewissen abgegeben habe und dass diese korrekt sind.
              </BulletItem>
            </Section>

            {/* ERKLÄRUNG DES ARTISTS/TÄTOWIERERS */}
            <Section title={isTattoo ? 'ERKLÄRUNG DES TÄTOWIERERS' : 'ERKLÄRUNG DES ARTISTS'}>
              <BulletItem>
                Ich bestätige, dass das {procedureWord} unter hygienischen Bedingungen mit geeigneten sterilen Instrumenten und sicheren Techniken gemäß {isTattoo ? 'EN 17169 und den entsprechenden nationalen Anforderungen' : 'den Standardanforderungen'} erfolgt.
              </BulletItem>
              <BulletItem>
                Ich bestätige, dass dem Kunden eine Kopie dieses unterzeichneten Einverständnisbogens ausgehändigt wurde und der Kunde angewiesen wurde, die Informationen aufzubewahren.
              </BulletItem>
            </Section>

            {/* EINWILLIGUNG ZU BILDAUFNAHMEN */}
            <Section title="EINWILLIGUNG ZU BILDAUFNAHMEN">
              <p className="text-sm text-muted-foreground italic">
                Ich erlaube, dass alle meine im Studio aufgenommenen Bilder in den sozialen Medien geteilt werden.
              </p>
            </Section>

            {/* INFORMATIONSBENACHRICHTIGUNGEN */}
            <Section title="INFORMATIONSBENACHRICHTIGUNGEN">
              <p className="text-sm text-muted-foreground">
                Ich erkläre mich damit einverstanden, Informationsmitteilungen und Marketingkampagnen vom Studio zu erhalten.
              </p>
            </Section>

            {/* Accept Button */}
            <div className="flex justify-center pt-2 pb-2">
              <Button
                onClick={() => {
                  onAccept();
                  onOpenChange(false);
                }}
                className="px-8"
              >
                Ich habe alles gelesen und verstanden
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
    <div className="space-y-3">
      <h3 className="font-bold text-sm uppercase flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full inline-block" />
        {title}
      </h3>
      <div className="space-y-3 pl-1">{children}</div>
    </div>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm text-muted-foreground">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
