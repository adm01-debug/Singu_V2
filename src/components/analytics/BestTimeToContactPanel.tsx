import { motion } from 'framer-motion';
import { Clock, Calendar, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useBestTimeToContact } from '@/hooks/useBestTimeToContact';
import { cn } from '@/lib/utils';

interface BestTimeToContactPanelProps {
  contactId?: string;
  compact?: boolean;
}

export function BestTimeToContactPanel({ contactId, compact = false }: BestTimeToContactPanelProps) {
  const { analysis, globalPatterns, loading } = useBestTimeToContact(contactId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis && !globalPatterns) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Melhor Horário para Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Dados insuficientes</p>
            <p className="text-sm">Registre mais interações para análise</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {contactId ? 'Melhor Horário para Este Contato' : 'Padrões de Horário Global'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pattern Overview */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  {analysis.overallPattern}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {analysis.recommendation}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Best Days */}
        {analysis && analysis.bestDays.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Melhores Dias
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {analysis.bestDays.map((day, index) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-3 rounded-lg text-center border",
                    index === 0 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-secondary/50 border-border"
                  )}
                >
                  <div className="text-sm font-medium text-foreground">
                    {day.day}
                  </div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {day.score}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    taxa positiva
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Best Hours */}
        {analysis && analysis.bestHours.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Melhores Horários
            </h4>
            <div className="space-y-2">
              {analysis.bestHours.map((hour, index) => (
                <motion.div
                  key={hour.hour}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <Badge 
                    variant={index === 0 ? "default" : "outline"}
                    className="w-16 justify-center"
                  >
                    {hour.hour}
                  </Badge>
                  <Progress value={hour.score} className="flex-1 h-2" />
                  <span className="text-sm font-medium w-12 text-right">
                    {hour.score}%
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Best Time Slots */}
        {!compact && analysis && analysis.bestTimeSlots.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top 5 Horários Específicos
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {analysis.bestTimeSlots.slice(0, 4).map((slot, index) => (
                <motion.div
                  key={`${slot.dayOfWeek}-${slot.hour}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {slot.dayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {slot.hourLabel}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {slot.interactionCount === 1 ? '1 interação' : `${slot.interactionCount} interações`}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Positivas:</span>
                    <Progress 
                      value={slot.positiveRate * 100} 
                      className="flex-1 h-1.5" 
                    />
                    <span className="text-xs font-medium">
                      {Math.round(slot.positiveRate * 100)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Global Patterns */}
        {!compact && globalPatterns && !contactId && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground mb-1">
                  Pico de Atividade
                </div>
                <div className="text-lg font-bold text-foreground">
                  {globalPatterns.peakActivityHour}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground mb-1">
                  Dia Mais Ativo
                </div>
                <div className="text-lg font-bold text-foreground">
                  {globalPatterns.peakActivityDay}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <div className="text-xs text-muted-foreground mb-1">
                  Horário Ideal
                </div>
                <div className="text-lg font-bold text-primary">
                  {globalPatterns.optimalContactHour}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
