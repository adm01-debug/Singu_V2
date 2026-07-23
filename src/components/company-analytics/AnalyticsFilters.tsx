import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AnalyticsContact } from '@/hooks/useCompanyProfileAnalytics';

interface Props {
  days: 30 | 90 | 180;
  onDaysChange: (d: 30 | 90 | 180) => void;
  contactId: string | null;
  onContactChange: (id: string | null) => void;
  contacts: AnalyticsContact[];
}

export function AnalyticsFilters({ days, onDaysChange, contactId, onContactChange, contacts }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select value={String(days)} onValueChange={(v) => onDaysChange(Number(v) as 30 | 90 | 180)}>
        <SelectTrigger className="w-full sm:w-40" aria-label="Período">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="90">Últimos 90 dias</SelectItem>
          <SelectItem value="180">Últimos 180 dias</SelectItem>
        </SelectContent>
      </Select>

      <Select value={contactId ?? '__all__'} onValueChange={(v) => onContactChange(v === '__all__' ? null : v)}>
        <SelectTrigger className="w-full sm:w-64" aria-label="Contato">
          <SelectValue placeholder="Contato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos os contatos ({contacts.length})</SelectItem>
          {contacts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}