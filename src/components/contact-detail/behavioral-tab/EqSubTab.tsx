import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EqData {
  overall_score?: number;
  overall_level?: string;
  profile_summary?: string;
  pillar_scores?: Record<string, number>;
  strengths?: string[];
  areas_for_growth?: string[];
  sales_implications?: Record<string, unknown>;
}

interface Props {
  eqAnalysis: EqData | null;
}

export function EqSubTab({ eqAnalysis }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-primary" />
          Inteligência Emocional
        </CardTitle>
      </CardHeader>
      <CardContent>
        {eqAnalysis ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/20">
                <span className="text-2xl font-bold text-primary">{eqAnalysis.overall_score}</span>
              </div>
              <div>
                <p className="font-medium text-foreground capitalize">{eqAnalysis.overall_level}</p>
                {eqAnalysis.profile_summary && (
                  <p className="text-xs text-muted-foreground mt-1">{eqAnalysis.profile_summary}</p>
                )}
              </div>
            </div>
            {eqAnalysis.pillar_scores && typeof eqAnalysis.pillar_scores === 'object' && (
              <div className="space-y-2">
                {Object.entries(eqAnalysis.pillar_scores as Record<string, number>).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-32 text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <Progress value={val} className="h-2 flex-1" />
                    <span className="w-8 text-right text-xs">{val}</span>
                  </div>
                ))}
              </div>
            )}
            {eqAnalysis.strengths && eqAnalysis.strengths.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Forças</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {eqAnalysis.strengths.map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {eqAnalysis.areas_for_growth && eqAnalysis.areas_for_growth.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Áreas de Crescimento</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {eqAnalysis.areas_for_growth.map((a: string) => (
                    <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Análise EQ ainda não realizada</p>
        )}
      </CardContent>
    </Card>
  );
}
