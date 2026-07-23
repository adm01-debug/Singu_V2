import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Twitter, Instagram, Sparkles, RefreshCw, ExternalLink, Globe } from 'lucide-react';
import { useContactRelationalData } from '@/hooks/useContactRelationalData';
import { useEnrichSocialProfiles } from '@/hooks/useEnrichSocialProfiles';

const ICONS: Record<string, typeof Globe> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
};

const LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  instagram: 'Instagram',
};

interface Props {
  contactId: string;
}

export function SocialEnrichmentCard({ contactId }: Props) {
  const { data } = useContactRelationalData(contactId);
  const socials = data?.socials ?? [];
  const { targets, enrich, isEnriching } = useEnrichSocialProfiles(contactId, socials);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Enriquecimento Social
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {targets.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Cadastre URLs de LinkedIn, X/Twitter ou Instagram na aba <strong>Dados</strong> para
            enriquecer o perfil com headline, publicações recentes e sinais de mudança de cargo.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {targets.map((t) => {
                const Icon = ICONS[t.platform] ?? Globe;
                return (
                  <Badge key={t.url} variant="secondary" className="gap-1.5 text-[11px]">
                    <Icon className="h-3 w-3" />
                    {LABELS[t.platform] ?? t.platform}
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 opacity-60 hover:opacity-100"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </Badge>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Buscamos perfil básico, headline, últimas publicações e sinais de mudança de cargo.
              LinkedIn recebe camada extra via EnrichLayer.
            </p>
            <Button
              size="sm"
              onClick={enrich}
              disabled={isEnriching}
              className="w-full sm:w-auto"
            >
              {isEnriching ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Sincronizando…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Enriquecer {targets.length} perfil{targets.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}