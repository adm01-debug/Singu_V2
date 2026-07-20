import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContactRelationalData, useRelativeMutations, useCadenceMutation, usePreferencesMutation } from '@/hooks/useContactRelationalData';
import { useExternalRelationalMutations } from '@/hooks/useExternalRelationalMutations';
import type { Contact } from '@/hooks/useContactDetail';

import { DataSummaryStrip } from './data-tab/DataSummaryStrip';
import { PhonesCard } from './data-tab/PhonesCard';
import { EmailsCard } from './data-tab/EmailsCard';
import { AddressesCard } from './data-tab/AddressesCard';
import { SocialsCard } from './data-tab/SocialsCard';
import { RelativesCard } from './data-tab/RelativesCard';
import { CadencePreferencesCard } from './data-tab/CadencePreferencesCard';
import { TimeHeatmapCard } from './data-tab/TimeHeatmapCard';
import { SocialMediaExternalCard } from './data-tab/SocialMediaExternalCard';
import { ContactEnrichedCard } from './data-tab/ContactEnrichedCard';
import { ExtraDataCard, BitrixIntegrationCard } from './data-tab/ExtraDataCards';
import { ConsentAuditCard } from './data-tab/ConsentAuditCard';

interface Props {
  contact: Contact;
}

export function ContactDataTab({ contact }: Props) {
   const { data, isLoading, error, refetch } = useContactRelationalData(contact.id);
   const { addRelative, updateRelative, deleteRelative } = useRelativeMutations(contact.id);
  const phoneMutations = useExternalRelationalMutations(contact.id, 'contact_phones', 'Telefone');
  const emailMutations = useExternalRelationalMutations(contact.id, 'contact_emails', 'Email');
  const addressMutations = useExternalRelationalMutations(contact.id, 'contact_addresses', 'Endereço');
  const socialMutations = useExternalRelationalMutations(contact.id, 'contact_social_media', 'Rede social');
  const cadenceMutation = useCadenceMutation(contact.id);
  const preferencesMutation = usePreferencesMutation(contact.id);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
      .then(() => { setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); })
      .catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3"><div className="h-4 w-24 bg-muted rounded" /></CardHeader>
            <CardContent><div className="h-20 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <div>
            <p className="text-sm font-medium text-foreground">Erro ao carregar dados relacionais</p>
            <p className="text-xs text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Tente novamente em alguns instantes'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { phones, emails, addresses, socials, relatives, cadence, preferences, commPreferences, timeAnalysis } = data;

  return (
    <div>
      <DataSummaryStrip counts={{
        phones: phones.length,
        emails: emails.length,
        addresses: addresses.length,
        socials: socials.length,
        relatives: relatives.length,
        hasTime: timeAnalysis.length > 0,
      }} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PhonesCard
          phones={phones}
          contactId={contact.id}
          copiedField={copiedField}
          onCopy={copyToClipboard}
          onAdd={(d) => phoneMutations.add.mutate(d)}
          onDelete={(id) => phoneMutations.remove.mutate(id)}
        />
        <EmailsCard
          emails={emails}
          contactId={contact.id}
          contactFirstName={contact.first_name ?? undefined}
          contactLastName={contact.last_name ?? undefined}
          contactDomain={contact.email?.split('@')[1] ?? undefined}
          copiedField={copiedField}
          onCopy={copyToClipboard}
          onAdd={(d) => emailMutations.add.mutate(d)}
          onDelete={(id) => emailMutations.remove.mutate(id)}
        />
        <AddressesCard
          addresses={addresses}
          onAdd={(d) => addressMutations.add.mutate(d)}
          onDelete={(id) => addressMutations.remove.mutate(id)}
        />
        <SocialsCard
          socials={socials}
          copiedField={copiedField}
          onCopy={copyToClipboard}
          onAdd={(d) => socialMutations.add.mutate(d)}
          onDelete={(id) => socialMutations.remove.mutate(id)}
        />
         <RelativesCard
           relatives={relatives}
           contactId={contact.id}
           onAdd={(d) => addRelative.mutate(d as Parameters<typeof addRelative.mutate>[0])}
           onUpdate={(id, updates) => updateRelative.mutate({ id, updates })}
           onDelete={(id) => deleteRelative.mutate(id)}
         />
        <CadencePreferencesCard
          cadence={cadence}
          preferences={preferences}
          commPreferences={commPreferences}
          contactId={contact.id}
          onSaveCadence={(d) => cadenceMutation.mutate(d as Parameters<typeof cadenceMutation.mutate>[0])}
          onSavePreferences={(d) => preferencesMutation.mutate(d as Parameters<typeof preferencesMutation.mutate>[0])}
        />
        <TimeHeatmapCard data={timeAnalysis} />
        <SocialMediaExternalCard contactId={contact.id} />
        <ContactEnrichedCard contactId={contact.id} />
        <ExtraDataCard contact={contact} />
        <BitrixIntegrationCard contact={contact} />
        <ConsentAuditCard contactId={contact.id} />
      </div>
    </div>
  );
}
