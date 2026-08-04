import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { METAPROGRAM_LABELS } from '@/types/metaprograms';
import type { ReactNode } from 'react';

interface MetaprogramRadioGroupProps {
  icon: ReactNode;
  label: string;
  metaprogramKey: keyof typeof METAPROGRAM_LABELS;
  value: string | null;
  options: string[];
  onChange: (value: string) => void;
}

export function MetaprogramRadioGroup({ icon, label, metaprogramKey, value, options, onChange }: MetaprogramRadioGroupProps) {
  const labels = METAPROGRAM_LABELS[metaprogramKey] as Record<string, { name: string; icon: string; color: string }>;

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </Label>
      <RadioGroup
        value={value || ''}
        onValueChange={onChange}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => (
          <Label
            key={option}
            className={cn(
              'px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all',
              value === option ? labels[option]?.color : 'border-border hover:border-primary/50'
            )}
          >
            <RadioGroupItem value={option} className="sr-only" />
            {labels[option]?.icon} {labels[option]?.name}
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
