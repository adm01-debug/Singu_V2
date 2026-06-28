import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronDown, ChevronUp, Palette, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { DISCProfile } from '@/types';
import { MENTAL_TRIGGERS } from '@/types/triggers';
import { TemplateProfileMetrics, DISC_CONFIG } from './types';

export function TemplateByProfileView({ templateMetrics }: { templateMetrics: TemplateProfileMetrics[] }) {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  if (templateMetrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground/70 mb-4" />
        <p className="text-sm text-muted-foreground">Nenhum dado de template encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templateMetrics.map((tm) => {
        const trigger = MENTAL_TRIGGERS[tm.triggerType as keyof typeof MENTAL_TRIGGERS];
        const isExpanded = expandedTemplate === tm.templateId;

        return (
          <motion.div key={tm.templateId} layout className="border rounded-lg overflow-hidden">
            <div className="p-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedTemplate(isExpanded ? null : tm.templateId)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{trigger?.icon}</span>
                  <div>
                    <p className="font-medium text-sm truncate max-w-[200px]">{tm.templateTitle}</p>
                    <p className="text-xs text-muted-foreground">{trigger?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {tm.bestProfile && (
                    <Badge className={cn('text-xs', DISC_CONFIG[tm.bestProfile].bgColor, DISC_CONFIG[tm.bestProfile].color)}>
                      Melhor: {tm.bestProfile}
                    </Badge>
                  )}
                  <div className="text-right">
                    <p className={cn('font-semibold', tm.overallSuccessRate >= 70 ? 'text-success' : tm.overallSuccessRate >= 40 ? 'text-warning' : 'text-muted-foreground')}>
                      {tm.overallSuccessRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">{tm.totalUsages} usos</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 border-t bg-muted/20">
                    <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Performance por Perfil DISC
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      {(['D', 'I', 'S', 'C'] as DISCProfile[]).map((profile) => {
                        const data = tm.byProfile[profile];
                        const config = DISC_CONFIG[profile];
                        const isBest = tm.bestProfile === profile;
                        const isWorst = tm.worstProfile === profile;

                        return (
                          <div key={profile} className={cn('p-3 rounded-lg border', config.bgColor, isBest && 'ring-2 ring-success', isWorst && data.usages > 0 && 'ring-2 ring-destructive')}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={cn('font-bold text-lg', config.color)}>{profile}</span>
                                <span className="text-xs text-muted-foreground">{config.label}</span>
                              </div>
                              {isBest && <Badge variant="outline" className="text-xs border-success text-success">Melhor</Badge>}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Usos</span>
                                <span className="font-medium">{data.usages}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sucesso</span>
                                <span className={cn('font-medium', data.successRate >= 70 ? 'text-success' : data.successRate >= 40 ? 'text-warning' : 'text-destructive')}>
                                  {data.usages > 0 ? `${data.successRate.toFixed(0)}%` : '-'}
                                </span>
                              </div>
                              {data.avgRating > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Avaliação</span>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-warning fill-warning" />
                                    <span className="font-medium">{data.avgRating.toFixed(1)}</span>
                                  </div>
                                </div>
                              )}
                              {data.usages > 0 && <Progress value={data.successRate} className="h-1.5 mt-1" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
