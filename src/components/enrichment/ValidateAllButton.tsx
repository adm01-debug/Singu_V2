import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEmailVerifier, usePhoneValidator } from '@/hooks/useEnrichmentSuite';
import { useContactRelationalData } from '@/hooks/useContactRelationalData';

interface Props {
  contactId: string;
  fallbackEmail?: string | null;
  fallbackPhone?: string | null;
}

export function ValidateAllButton({ contactId, fallbackEmail, fallbackPhone }: Props) {
  const { data } = useContactRelationalData(contactId);
  const emailVerifier = useEmailVerifier();
  const phoneValidator = usePhoneValidator();
  const [running, setRunning] = useState(false);

  const handleValidateAll = async () => {
    const emails = data?.emails?.map((e) => e.email).filter(Boolean) ?? [];
    const phones = data?.phones?.map((p) => p.numero_e164 || p.numero).filter(Boolean) ?? [];

    if (emails.length === 0 && fallbackEmail) emails.push(fallbackEmail);
    if (phones.length === 0 && fallbackPhone) phones.push(fallbackPhone);

    if (emails.length === 0 && phones.length === 0) {
      toast.info('Nenhum email ou telefone para validar');
      return;
    }

    setRunning(true);
    const tasks: Promise<unknown>[] = [];
    for (const email of emails) tasks.push(emailVerifier.mutateAsync({ email, contactId }));
    for (const phone of phones) tasks.push(phoneValidator.mutateAsync({ phone, defaultCountry: 'BR', contactId }));

    const results = await Promise.allSettled(tasks);
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    setRunning(false);

    const failSuffix = fail > 0 ? ` · ${fail} falhas` : '';
    toast.success(`Validação concluída: ${ok} ok${failSuffix}`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleValidateAll} disabled={running} className="gap-2">
      {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
      Validar tudo
    </Button>
  );
}
