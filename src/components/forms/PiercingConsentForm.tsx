import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SignaturePad } from '@/components/SignaturePad';
import { DateOfBirthSelect } from './DateOfBirthSelect';
import { AddressSection } from './AddressSection';
import { PhoneInput } from './PhoneInput';
import { ReferralSourceSection } from './ReferralSourceSection';
import { GenderSection } from './GenderSection';
import { ParentConsentSection } from './ParentConsentSection';
import { PIERCING_TYPES } from './formConstants';
import { Loader2, Save, ExternalLink, Shield, CheckCircle2 } from 'lucide-react';
import { ConsentDeclarationDialog } from './ConsentDeclarationDialog';
import { GDPRPolicyDialog } from './GDPRPolicyDialog';

export interface PiercingFormData {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  postal_code: string | null;
  date_of_birth: string | null;
  gender: string | null;
  body_area: string | null;
  body_area_other: string;
  referral_source: string | null;
  referral_source_other: string;
  parent_name: string;
  parent_signature: string | null;
  accepted_terms: boolean;
  gdpr_email_consent: boolean;
  client_signature: string | null;
}

interface PiercingConsentFormProps {
  initialData?: Partial<PiercingFormData>;
  onSave: (data: PiercingFormData) => Promise<void>;
  saving: boolean;
  isReadOnly?: boolean;
}

function calculateAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function PiercingConsentForm({
  initialData,
  onSave,
  saving,
  isReadOnly = false,
}: PiercingConsentFormProps) {
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [gdprDialogOpen, setGdprDialogOpen] = useState(false);
  const [form, setForm] = useState<PiercingFormData>({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || null,
    phone: initialData?.phone || null,
    country: initialData?.country || 'Deutschland',
    city: initialData?.city || 'Bielefeld',
    postal_code: initialData?.postal_code || null,
    date_of_birth: initialData?.date_of_birth || null,
    gender: initialData?.gender || null,
    body_area: initialData?.body_area || null,
    body_area_other: '',
    referral_source: initialData?.referral_source || null,
    referral_source_other: initialData?.referral_source_other || '',
    parent_name: initialData?.parent_name || '',
    parent_signature: initialData?.parent_signature || null,
    accepted_terms: initialData?.accepted_terms ?? true,
    gdpr_email_consent: initialData?.gdpr_email_consent ?? false,
    client_signature: initialData?.client_signature || null,
  });

  const update = <K extends keyof PiercingFormData>(key: K, val: PiercingFormData[K]) => {
    if (isReadOnly) return;
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const age = useMemo(() => form.date_of_birth ? calculateAge(form.date_of_birth) : null, [form.date_of_birth]);
  const isMinor = age !== null && age < 18;

  const piercingType = PIERCING_TYPES.includes(form.body_area as any)
    ? form.body_area
    : form.body_area && form.body_area !== ''
      ? 'Other'
      : null;

  return (
    <div className="space-y-6">
      {/* Client Info */}
      <Card>
        <CardHeader><CardTitle>Kundeninformationen</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Vorname <span className="text-destructive">*</span></Label>
              <Input
                value={form.first_name}
                onChange={e => update('first_name', e.target.value)}
                disabled={isReadOnly}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label>Nachname <span className="text-destructive">*</span></Label>
              <Input
                value={form.last_name}
                onChange={e => update('last_name', e.target.value)}
                disabled={isReadOnly}
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>E-Mail-Adresse <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={form.email || ''}
                onChange={e => update('email', e.target.value || null)}
                disabled={isReadOnly}
                placeholder="email@example.com"
              />
            </div>
            <PhoneInput
              value={form.phone}
              onChange={v => update('phone', v)}
              disabled={isReadOnly}
            />
          </div>
          <AddressSection
            country={form.country}
            city={form.city}
            postalCode={form.postal_code}
            onCountryChange={v => update('country', v)}
            onCityChange={v => update('city', v)}
            onPostalCodeChange={v => update('postal_code', v)}
            disabled={isReadOnly}
          />
          <DateOfBirthSelect
            value={form.date_of_birth}
            onChange={v => update('date_of_birth', v)}
            disabled={isReadOnly}
          />
          {age !== null && (
            <p className="text-sm text-muted-foreground">
              Alter: {age} Jahre
              {isMinor && <span className="text-primary font-medium ml-2">(Einwilligung der Erziehungsberechtigten erforderlich)</span>}
            </p>
          )}
          <GenderSection
            value={form.gender}
            onChange={v => update('gender', v)}
            disabled={isReadOnly}
          />
        </CardContent>
      </Card>

      {/* Parent Consent */}
      {isMinor && (
        <ParentConsentSection
          parentName={form.parent_name}
          parentSignature={form.parent_signature}
          onParentNameChange={v => update('parent_name', v)}
          onParentSignatureChange={v => update('parent_signature', v)}
          disabled={isReadOnly}
        />
      )}

      {/* Piercing Details */}
      <Card>
        <CardHeader><CardTitle>Piercing-Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Piercing-Art <span className="text-destructive">*</span></Label>
            <Select
              value={piercingType || ''}
              onValueChange={v => {
                if (v === 'Other') {
                  update('body_area', form.body_area_other || '');
                } else {
                  update('body_area', v);
                  update('body_area_other', '');
                }
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger><SelectValue placeholder="Piercing-Art auswählen" /></SelectTrigger>
              <SelectContent>
                {PIERCING_TYPES.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {piercingType === 'Other' && (
              <Input
                className="mt-2"
                value={form.body_area_other || (form.body_area && !PIERCING_TYPES.includes(form.body_area as any) ? form.body_area : '')}
                onChange={e => {
                  update('body_area_other', e.target.value);
                  update('body_area', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Bitte Piercing-Art angeben..."
              />
            )}
          </div>

          <ReferralSourceSection
            value={form.referral_source}
            otherValue={form.referral_source_other}
            onChange={v => update('referral_source', v)}
            onOtherChange={v => update('referral_source_other', v)}
            disabled={isReadOnly}
          />
        </CardContent>
      </Card>

      {/* Consent */}
      <Card>
        <CardHeader><CardTitle>Einwilligungsbestätigung</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="gap-2 border-border bg-white shadow-sm hover:bg-primary/5" type="button" onClick={() => setConsentDialogOpen(true)}>
              <ExternalLink className="h-4 w-4" /> Einverständnisbogen lesen
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-border bg-white shadow-sm hover:bg-primary/5" type="button" onClick={() => setGdprDialogOpen(true)}>
              <Shield className="h-4 w-4" /> DSGVO-Richtlinie lesen
            </Button>
          </div>
          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  form.accepted_terms
                    ? 'border-primary bg-primary'
                    : 'border-input bg-background'
                }`}
                onClick={() => !isReadOnly && update('accepted_terms', !form.accepted_terms)}
              >
                {form.accepted_terms && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
              </div>
              <div>
                <Label className="cursor-pointer font-medium" onClick={() => !isReadOnly && update('accepted_terms', !form.accepted_terms)}>
                  Ich habe den Einverständnisbogen gelesen und verstanden. <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Ich habe alle Punkte gelesen und akzeptiere die Risiken der Anwendung.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConsentDeclarationDialog
        open={consentDialogOpen}
        onOpenChange={setConsentDialogOpen}
        type="piercing"
        onAccept={() => update('accepted_terms', true)}
      />

      {/* Signature */}
      <Card>
        <CardHeader><CardTitle>Unterschrift</CardTitle></CardHeader>
        <CardContent>
          <SignaturePad
            value={form.client_signature}
            onChange={v => update('client_signature', v)}
            disabled={isReadOnly}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex gap-3 justify-end pb-8">
          <Button onClick={() => onSave(form)} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" /> Speichern
          </Button>
        </div>
      )}
      <ConsentDeclarationDialog open={consentDialogOpen} onOpenChange={setConsentDialogOpen} type="piercing" onAccept={() => update('accepted_terms', true)} />
      <GDPRPolicyDialog open={gdprDialogOpen} onOpenChange={setGdprDialogOpen} />
    </div>
  );
}
