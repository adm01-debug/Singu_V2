import { Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BiasData {
  dominant_biases?: string[];
  vulnerabilities?: string[];
  resistances?: string[];
  profile_summary?: string;
  category_distribution?: Record<string, number>;
  sales_strategies?: Record<string, unknown>;
}

interface Props {
  biases: BiasData | null;
}

export function BiasesSubTab({ biases }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-warning" />
          Vieses Cognitivos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {biases ? (
          <div className="space-y-3">
            {biases.dominant_biases && biases.dominant_biases.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Vieses Dominantes</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {biases.dominant_biases.map((b: string) => (
                    <Badge key={b} className="text-xs">{b}</Badge>
                  ))}
                </div>
              </div>
            )}
            {biases.vulnerabilities && biases.vulnerabilities.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Vulnerabilidades</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {biases.vulnerabilities.map((v: string) => (
                    <Badge key={v} variant="outline" className="text-xs text-accent">{v}</Badge>
                  ))}
                </div>
              </div>
            )}
            {biases.resistances && biases.resistances.length > 0 && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Resistências</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {biases.resistances.map((r: string) => (
                    <Badge key={r} variant="outline" className="text-xs text-success">{r}</Badge>
                  ))}
                </div>
              </div>
            )}
            {biases.category_distribution && typeof biases.category_distribution === 'object' && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Distribuição por Categoria</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(biases.category_distribution).map(([cat, val]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="w-28 text-xs text-muted-foreground capitalize">{cat.replace(/_/g, ' ')}</span>
                      <Progress value={Number(val)} className="h-1.5 flex-1" />
                      <span className="w-6 text-right text-[10px]">{Number(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {biases.profile_summary && (
              <p className="text-sm text-foreground">{biases.profile_summary}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Análise de vieses cognitivos ainda não realizada</p>
        )}
      </CardContent>
    </Card>
  );
}
