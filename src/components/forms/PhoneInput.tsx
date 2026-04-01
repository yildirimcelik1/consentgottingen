import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PHONE_CODES = [
  { code: '+49', label: 'DE (+49)' },
  { code: '+90', label: 'TR (+90)' },
  { code: '+43', label: 'AT (+43)' },
  { code: '+41', label: 'CH (+41)' },
  { code: '+31', label: 'NL (+31)' },
  { code: '+32', label: 'BE (+32)' },
  { code: '+33', label: 'FR (+33)' },
  { code: '+39', label: 'IT (+39)' },
  { code: '+34', label: 'ES (+34)' },
  { code: '+48', label: 'PL (+48)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+1', label: 'US (+1)' },
] as const;

interface PhoneInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, disabled }: PhoneInputProps) {
  // Parse stored value like "+49 176 xxxxxxxx" into code and number
  const parsed = parsePhone(value);

  function parsePhone(val: string | null): { code: string; number: string } {
    if (!val) return { code: '+49', number: '' };
    for (const pc of PHONE_CODES) {
      if (val.startsWith(pc.code + ' ') || val.startsWith(pc.code)) {
        const num = val.slice(pc.code.length).trim();
        return { code: pc.code, number: num };
      }
    }
    return { code: '+49', number: val };
  }

  const handleCodeChange = (code: string) => {
    const combined = parsed.number ? `${code} ${parsed.number}` : null;
    onChange(combined);
  };

  const handleNumberChange = (num: string) => {
    const cleaned = num.replace(/[^\d\s]/g, '');
    const combined = cleaned ? `${parsed.code} ${cleaned}` : null;
    onChange(combined);
  };

  return (
    <div className="space-y-2">
      <Label>Telefonnummer <span className="text-destructive">*</span></Label>
      <div className="flex gap-2">
        <Select value={parsed.code} onValueChange={handleCodeChange} disabled={disabled}>
          <SelectTrigger className="w-[140px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHONE_CODES.map(pc => (
              <SelectItem key={pc.code} value={pc.code}>{pc.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={parsed.number}
          onChange={e => handleNumberChange(e.target.value)}
          disabled={disabled}
          placeholder="176 xxxxxxxx"
          className="flex-1"
        />
      </div>
    </div>
  );
}
