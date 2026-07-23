import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Sparkles, MessageSquareQuote } from 'lucide-react';
import { EvidenceDrillDownSheet, type EvidenceContext } from '@/components/contacts/EvidenceDrillDownSheet';
import type { InterestBucket } from '@/hooks/useCompanyProfileAnalytics';

interface Props {
  interests: InterestBucket[];
  contactIdForEvidence: string | null;
}

const KIND_META: Record<InterestBucket['kind'], { label: string; icon: typeof Heart; evidenceKind: 'preference' | 'hobby' | 'tone' | null }> = {
  preference: { label: 'Preferência', icon: Sparkles, evidenceKind: 'preference' },
  hobby: { label: 'Hobby', icon: Heart, evidenceKind: 'hobby' },
  topic: { label: 'Tópico recorrente', icon: MessageSquareQuote, evidenceKind: null },
};

export function InterestsCloud({ interests, contactIdForEvidence }: Props) {
  const [ctx, setCtx] = useState<EvidenceContext | null>(null);

  if (!Array.isArray(interests) || interests.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Interesses e Preferências</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum interesse detectado ainda. Registre mais interações para que a IA gere insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...interests.map((i) => i.count), 1);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interesses e Preferências</CardTitle>
          <p className="text-xs text-muted-foreground">
            Top {interests.length} temas mais frequentes entre os contatos desta empresa
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => {
              const meta = KIND_META[interest.kind];
              const Icon = meta.icon;
              const weight = interest.count / maxCount;
              const size = weight > 0.7 ? 'text-base' : weight > 0.4 ? 'text-sm' : 'text-xs';
              const canDrill = meta.evidenceKind !== null && (contactIdForEvidence || interest.contactIds.length === 1);
              return (
                <Badge
                  key={`${interest.kind}-${interest.label}`}
                  variant="secondary"
                  className={`${size} gap-1.5 py-1.5 px-3 ${canDrill ? 'cursor-pointer hover:bg-primary/10 transition-colors' : ''}`}
                  onClick={
                    canDrill
                      ? () => setCtx({ kind: meta.evidenceKind!, label: interest.label })
                      : undefined
                  }
                  role={canDrill ? 'button' : undefined}
                  tabIndex={canDrill ? 0 : undefined}
                  onKeyDown={
                    canDrill
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setCtx({ kind: meta.evidenceKind!, label: interest.label });
                          }
                        }
                      : undefined
                  }
                  aria-label={`${meta.label}: ${interest.label} (${interest.count} menções)`}
                >
                  <Icon className="w-3 h-3" />
                  {interest.label}
                  <span className="text-muted-foreground ml-1">·{interest.count}</span>
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <EvidenceDrillDownSheet
        contactId={contactIdForEvidence ?? ''}
        context={ctx}
        onOpenChange={(open) => !open && setCtx(null)}
      />
    </>
  );
}