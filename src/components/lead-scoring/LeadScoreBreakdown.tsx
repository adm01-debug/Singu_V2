import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { LeadScoreRow } from '@/hooks/useLeadScoring';

interface Props {
  score: LeadScoreRow;
}

function LeadScoreBreakdownInner({ score }: Props) {
  const data = [
    { dim: 'Fit', value: Number(score.fit_score) },
    { dim: 'Engajamento', value: Number(score.engagement_score) },
    { dim: 'Intent', value: Number(score.intent_score) },
    { dim: 'Relação', value: Number(score.relationship_score) },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Breakdown por dimensão</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="dim" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
            <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export const LeadScoreBreakdown = memo(LeadScoreBreakdownInner);
