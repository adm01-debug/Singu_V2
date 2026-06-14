import { Info, Globe, Hash, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SocialMatchDetails } from './SocialMatchDetails';

interface Props {
  contactId: string;
  offerName: string;
  metadata: {
    sources?: string[];
    keywords?: string[];
    social_insight_ids?: string[];
  };
}

export function SocialMatchPanel({ contactId, offerName, metadata }: Props) {
  if (!metadata || (!metadata.sources && !metadata.keywords)) return null;

  return (
    <div className="mt-3 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 uppercase">
          <Globe className="h-3 w-3" />
          Atributos de Social Match
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3 w-3 text-indigo-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-[10px]">Fontes e palavras-chave detectadas em redes sociais que impulsionaram esta sugestão.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-2">
        {metadata.sources && metadata.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {metadata.sources.map((source, i) => (
              <Badge key={i} variant="outline" className="bg-white/80 text-[9px] h-4 py-0 border-indigo-200 text-indigo-600 gap-1">
                <ExternalLink className="h-2 w-2" />
                {source}
              </Badge>
            ))}
          </div>
        )}

        {metadata.keywords && metadata.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {metadata.keywords.map((kw, i) => (
              <Badge key={i} variant="secondary" className="bg-indigo-100 text-indigo-700 text-[9px] h-4 py-0 px-1.5 border-none">
                <Hash className="h-2 w-2 mr-0.5" />
                {kw}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <SocialMatchDetails contactId={contactId} metadata={metadata} offerName={offerName} />
    </div>
  );
}
