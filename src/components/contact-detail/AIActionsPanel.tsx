import { useState, useCallback } from 'react';
import { Wand2, Gift, Target, Globe, Linkedin, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEdgeFunctionActions } from '@/hooks/useEdgeFunctionActions';

interface Props {
  contactId: string;
  contactName: string;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  currentScore?: number;
  currentSentiment?: string;
}


export function AIActionsPanel({ contactId, contactName, linkedinUrl, websiteUrl, currentScore = 0, currentSentiment = 'neutral' }: Props) {
  const {
    loading,
    generateOfferSuggestions,
    suggestNextAction,
    scrapeProfile,
    analyzeSocialBehavior,
    detectSocialEvents,
    enrichLinkedIn,
    firecrawlScrape,
  } = useEdgeFunctionActions();

  const [nextAction, setNextAction] = useState<{ action?: string; suggestion?: string } | null>(null);
  const [scrapeUrl, setScrapeUrl] = useState('');

  const handleSuggestNextAction = useCallback(async () => {
    const result = await suggestNextAction(contactId);
    if (result) setNextAction(result);
  }, [contactId, suggestNextAction]);

  const actions = [
    {
      key: 'offer-suggestions',
      label: 'Gerar Sugestões de Oferta',
      icon: Gift,
      color: 'text-success',
      onClick: () => generateOfferSuggestions(contactId),
      loading: loading['generate-offer-suggestions'],
    },
    {
      key: 'next-action',
      label: 'Sugerir Próxima Ação',
      icon: Target,
      color: 'text-primary',
      onClick: handleSuggestNextAction,
      loading: loading['suggest-next-action'],
    },
    {
      key: 'social-behavior',
      label: 'Analisar Comportamento Social',
      icon: TrendingUp,
      color: 'text-info',
      onClick: () => analyzeSocialBehavior(contactId),
      loading: loading['social-behavior-analyzer'],
    },
    {
      key: 'social-events',
      label: 'Detectar Eventos Sociais',
      icon: TrendingUp,
      color: 'text-warning',
      onClick: () => detectSocialEvents(contactId),
      loading: loading['social-events-detector'],
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wand2 className="h-4 w-4 text-primary" />
          Ações de IA — {contactName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {actions.map(action => (
            <Button
              key={action.key}
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-xs h-9"
              onClick={action.onClick}
              disabled={action.loading}
            >
              {action.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <action.icon className={`h-3.5 w-3.5 ${action.color}`} />}
              {action.label}
            </Button>
          ))}
        </div>

        {/* LinkedIn enrichment */}
        {linkedinUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs h-9"
            onClick={() => enrichLinkedIn(contactId, linkedinUrl)}
            disabled={loading['enrichlayer-linkedin']}
          >
            {loading['enrichlayer-linkedin'] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Linkedin className="h-3.5 w-3.5 text-info" />}
            Enriquecer via LinkedIn
          </Button>
        )}

        {/* Website scrape */}
        {websiteUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs h-9"
            onClick={() => firecrawlScrape(websiteUrl, contactId, 'contact')}
            disabled={loading['firecrawl-scrape']}
          >
            {loading['firecrawl-scrape'] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5 text-accent" />}
            Coletar Dados do Site
          </Button>
        )}

        {/* Custom URL scrape */}
        <div className="flex gap-1.5">
          <Input
            placeholder="URL do perfil social..."
            value={scrapeUrl}
            onChange={e => setScrapeUrl(e.target.value)}
            className="text-xs h-8"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onClick={() => { scrapeProfile(contactId, scrapeUrl); setScrapeUrl(''); }}
            disabled={!scrapeUrl || loading['social-profile-scraper']}
          >
            {loading['social-profile-scraper'] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
          </Button>
        </div>

        {/* Next action result */}
        {nextAction && (
          <div className="rounded-lg border bg-primary/5 p-2.5 text-sm">
            <p className="font-medium text-foreground text-xs">🎯 Próxima Ação Recomendada</p>
            <p className="text-xs text-muted-foreground mt-1">
              {nextAction.action || nextAction.suggestion || JSON.stringify(nextAction)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
