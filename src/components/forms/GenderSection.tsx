import { Label } from '@/components/ui/label';

interface GenderSectionProps {
  value: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Männlich' },
  { value: 'female', label: 'Weiblich' },
  { value: 'other', label: 'Sonstiges' },
];

export function GenderSection({ value, onChange, disabled }: GenderSectionProps) {
  return (
    <div className="space-y-3">
      <Label>Geschlecht <span className="text-destructive">*</span></Label>
      <div className="flex flex-wrap gap-2">
        {GENDER_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 shadow-sm ${
              value === option.value
                ? 'border-primary bg-primary text-primary-foreground shadow-md'
                : 'border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary/5'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
