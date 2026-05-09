import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Star, Activity, Shield, TrendingUp } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useContactBehavior } from '@/hooks/useContactBehavior';

interface Props {
  contactId: string;
}

export function PersonalityExecutiveSummary({ contactId }: Props) {
  const { personality, isLoading } = useContactBehavior(contactId);

  if (isLoading || !personality) return null;

  const bigFiveData = [
    { subject: 'Abertura', A: personality.big_five_openness || 0, fullMark: 100 },
    { subject: 'Conscienc.', A: personality.big_five_conscientiousness || 0, fullMark: 100 },
    { subject: 'Extrover.', A: personality.big_five_extraversion || 0, fullMark: 100 },
    { subject: 'Amabilid.', A: personality.big_five_agreeableness || 0, fullMark: 100 },
    { subject: 'Neurotic.', A: personality.big_five_neuroticism || 0, fullMark: 100 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* MBTI Highlight */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
            <Brain className="h-3 w-3 text-primary" />
            MBTI Dominante
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col items-center justify-center min-h-[100px]">
          <span className="text-4xl font-black text-primary tracking-tighter">
            {personality.mbti_type || '????'}
          </span>
          <Badge variant="outline" className="mt-2 text-[10px]">
            Confiança: {personality.big_five_confidence || 0}%
          </Badge>
        </CardContent>
      </Card>

      {/* Enneagram Highlight */}
      <Card className="bg-warning/5 border-warning/20">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
            <Star className="h-3 w-3 text-warning" />
            Eneagrama
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col items-center justify-center min-h-[100px]">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-warning">
              {personality.enneagram_type || '?'}
            </span>
            {personality.enneagram_wing && (
              <span className="text-lg font-bold text-warning/70">w{personality.enneagram_wing}</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Tipo de Personalidade</p>
        </CardContent>
      </Card>

      {/* Big Five Chart */}
      <Card className="lg:col-span-2 overflow-hidden">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-success" />
            Big Five Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={bigFiveData}>
              <PolarGrid strokeOpacity={0.1} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8 }} />
              <Radar
                name="Personality"
                dataKey="A"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
