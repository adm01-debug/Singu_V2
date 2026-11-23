import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Star, Activity, Compass } from 'lucide-react';
import type { ContactPersonality } from '@/hooks/useContactBehavior';
import { BIG_FIVE_TRAITS, getBigFiveDescription } from '@/types/big-five';
import type { BigFiveTrait } from '@/types/big-five';
import { MBTI_TYPES, getMBTITypeFromPreferences } from '@/types/mbti';
import type { MBTIType } from '@/types/mbti';
import { ENNEAGRAM_TYPES, getEnneagramTriad } from '@/types/enneagram';
import type { EnneagramType } from '@/types/enneagram';

interface Props {
  personality: ContactPersonality;
}

const BIG_FIVE_FIELDS: { trait: BigFiveTrait; key: string }[] = [
  { trait: 'O', key: 'big_five_openness' },
  { trait: 'C', key: 'big_five_conscientiousness' },
  { trait: 'E', key: 'big_five_extraversion' },
  { trait: 'A', key: 'big_five_agreeableness' },
  { trait: 'N', key: 'big_five_neuroticism' },
];

const value = (personality: ContactPersonality, key: string): number => {
  const raw = (personality as Record<string, unknown>)[key];
  return typeof raw === 'number' ? raw : 0;
};

const dichotomyToPreference = (raw: number): number => {
  const score = raw || 0;
  return Math.round((score - 50) * 2);
};

export function PersonalityFrameworkInsights({ personality }: Props) {
  const bigFive = useMemo(() => {
    const scores = {
      openness: value(personality, 'big_five_openness'),
      conscientiousness: value(personality, 'big_five_conscientiousness'),
      extraversion: value(personality, 'big_five_extraversion'),
      agreeableness: value(personality, 'big_five_agreeableness'),
      neuroticism: value(personality, 'big_five_neuroticism'),
    };
    const filled = Object.values(scores).some((v) => v > 0);
    return { scores, filled, description: filled ? getBigFiveDescription(scores) : '' };
  }, [personality]);

  const mbti = useMemo(() => {
    const stored = (personality.mbti_type ?? '').trim().toUpperCase() as MBTIType;
    if (stored && MBTI_TYPES[stored]) return MBTI_TYPES[stored];
    const hasScores =
      personality.mbti_e_i_score !== null && personality.mbti_e_i_score !== undefined;
    if (!hasScores) return null;
    const derived = getMBTITypeFromPreferences({
      EI: dichotomyToPreference(value(personality, 'mbti_e_i_score')),
      SN: dichotomyToPreference(value(personality, 'mbti_s_n_score')),
      TF: dichotomyToPreference(value(personality, 'mbti_t_f_score')),
      JP: dichotomyToPreference(value(personality, 'mbti_j_p_score')),
    });
    return MBTI_TYPES[derived] ?? null;
  }, [personality]);

  const enneagram = useMemo(() => {
    const type = personality.enneagram_type;
    if (typeof type !== 'number' || !ENNEAGRAM_TYPES[type as EnneagramType]) return null;
    return ENNEAGRAM_TYPES[type as EnneagramType];
  }, [personality]);

  if (!bigFive.filled && !mbti && !enneagram) return null;

  return (
    <div className="space-y-6">
      {bigFive.filled && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Leitura do Big Five
            </CardTitle>
            <CardDescription className="text-[10px]">{bigFive.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {BIG_FIVE_FIELDS.map(({ trait, key }) => {
              const info = BIG_FIVE_TRAITS[trait];
              const score = value(personality, key);
              const high = score >= 60;
              const low = score > 0 && score <= 40;
              const tips = high ? info.salesTipsHigh : low ? info.salesTipsLow : [];
              return (
                <div key={trait} className={`rounded-lg border p-3 ${info.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span>{info.icon}</span>
                      <span className="text-[11px] font-bold">{info.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">{score}%</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                    {high ? info.highDescription : low ? info.lowDescription : info.description}
                  </p>
                  {tips.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {tips.slice(0, 3).map((tip) => (
                        <li key={tip} className="text-[10px] text-muted-foreground flex gap-1">
                          <span className="text-primary">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {mbti && (
        <Card className="border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              Leitura do MBTI — {mbti.type} · {mbti.nickname}
            </CardTitle>
            <CardDescription className="text-[10px]">{mbti.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Como comunicar</p>
                <p className="text-[11px] leading-relaxed">{mbti.communicationStyle}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Como decide</p>
                <p className="text-[11px] leading-relaxed">{mbti.decisionStyle}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mbti.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="text-[10px]">{keyword}</Badge>
              ))}
            </div>
            <ul className="space-y-0.5">
              {mbti.salesTips.slice(0, 4).map((tip) => (
                <li key={tip} className="text-[10px] text-muted-foreground flex gap-1">
                  <span className="text-accent">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {enneagram && (
        <Card className="border-warning/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              Leitura do Eneagrama — {enneagram.nickname}
              {personality.enneagram_wing ? ` (asa ${personality.enneagram_wing})` : ''}
            </CardTitle>
            <CardDescription className="text-[10px]">{enneagram.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Desejo central</p>
                <p className="text-[11px] leading-relaxed">{enneagram.coreDesire}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Medo central</p>
                <p className="text-[11px] leading-relaxed">{enneagram.coreFear}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                <Compass className="h-3 w-3 mr-1" />
                Triade {getEnneagramTriad(enneagram.type)}
              </Badge>
              <Badge variant="outline" className="text-[10px]">Crescimento: tipo {enneagram.growthDirection}</Badge>
              <Badge variant="outline" className="text-[10px]">Estresse: tipo {enneagram.stressDirection}</Badge>
            </div>
            <ul className="space-y-0.5">
              {enneagram.salesTips.slice(0, 4).map((tip) => (
                <li key={tip} className="text-[10px] text-muted-foreground flex gap-1">
                  <span className="text-warning">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}