import { Share2, Linkedin, Instagram, Facebook, Twitter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useContactSocialMediaView } from '@/hooks/useContactSocialMediaView';
import { safehref } from '@/lib/utils';

interface Props {
  contactId: string;
}

const SOCIAL_CONFIG = [
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, urlKey: 'linkedin_url', handleKey: 'linkedin_handle', color: 'text-[#0077B5]' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, urlKey: 'instagram_url', handleKey: 'instagram_handle', color: 'text-[#E4405F]' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, urlKey: 'facebook_url', handleKey: 'facebook_handle', color: 'text-[#1877F2]' },
  { key: 'x', label: 'X', icon: Twitter, urlKey: 'x_url', handleKey: 'x_handle', color: 'text-foreground' },
] as const;

export function SocialMediaExternalCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useContactSocialMediaView(contactId);
  const icon = <Share2 className="h-4 w-4 text-info" />;

  const hasSocials = data && (data.total_redes_cadastradas ?? 0) > 0;

  return (
    <ExternalDataCard
      title="Redes Sociais (Externo)"
      icon={icon}
      isLoading={isLoading}
      error={error}
      hasData={!!hasSocials}
      emptyMessage="Nenhuma rede social cadastrada no banco externo"
      onRetry={refetch}
    >
      {data && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {icon}
                Redes Sociais (Externo)
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {data.total_redes_cadastradas} redes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SOCIAL_CONFIG.map(({ key, label, icon: Icon, urlKey, handleKey, color }) => {
              const url = data[urlKey as keyof typeof data] as string | null;
              const handle = data[handleKey as keyof typeof data] as string | null;
              if (!url && !handle) return null;

              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-muted-foreground">{label}:</span>
                  {url ? (
                    <a href={safehref(url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {handle || url}
                    </a>
                  ) : (
                    <span className="text-foreground">{handle}</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </ExternalDataCard>
  );
}
