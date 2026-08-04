import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingDown, 
  UserX, 
  Clock,
  ArrowRight,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useChurnPrediction } from '@/hooks/useChurnPrediction';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface ChurnPredictionPanelProps {
  compact?: boolean;
  maxItems?: number;
}

export function ChurnPredictionPanel({ compact = false, maxItems = 5 }: ChurnPredictionPanelProps) {
  const { 
    atRiskContacts, 
    criticalCount, 
    highRiskCount, 
    averageRiskScore,
    loading 
  } = useChurnPrediction();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayedContacts = atRiskContacts.slice(0, maxItems);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return <UserX className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <TrendingDown className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('reunião') || action.includes('agendar')) return <Calendar className="h-3 w-3" />;
    if (action.includes('ligar') || action.includes('Ligar')) return <Phone className="h-3 w-3" />;
    return <Mail className="h-3 w-3" />;
  };

  return (
    <Card className={cn(!compact && "col-span-full")}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <CardTitle className="text-lg font-semibold">
            Previsão de Churn
          </CardTitle>
        </div>
        {!compact && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Crítico: {criticalCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-muted-foreground">Alto: {highRiskCount}</span>
            </div>
            <div className="text-muted-foreground">
              Score médio: <span className="font-medium text-foreground">{averageRiskScore}%</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {displayedContacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum cliente em risco</p>
            <p className="text-sm">Seus relacionamentos estão saudáveis!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedContacts.map((contact, index) => (
              <motion.div
                key={contact.contactId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Link 
                        to={`/contatos/${contact.contactId}`}
                        className="font-medium text-foreground hover:text-primary transition-colors truncate"
                      >
                        {contact.contactName}
                      </Link>
                      <Badge className={cn("text-xs", getRiskColor(contact.riskLevel))}>
                        {getRiskIcon(contact.riskLevel)}
                        <span className="ml-1">
                          {contact.riskLevel === 'critical' ? 'Crítico' :
                           contact.riskLevel === 'high' ? 'Alto' : 'Médio'}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {contact.daysSinceContact} dias sem contato
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        Tendência: {
                          contact.interactionTrend === 'decreasing' ? 'Queda' :
                          contact.interactionTrend === 'increasing' ? 'Alta' :
                          contact.interactionTrend === 'stable' ? 'Estável' : 'N/A'
                        }
                      </div>
                    </div>

                    {!compact && contact.factors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {contact.factors.slice(0, 3).map((factor, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {factor.factor}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        {getActionIcon(contact.recommendedAction)}
                        <span className="ml-1">{contact.recommendedAction}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {contact.riskScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Risco
                      </div>
                    </div>
                    <Progress 
                      value={contact.riskScore} 
                      className="w-20 h-2"
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            {atRiskContacts.length > maxItems && (
              <div className="text-center pt-2">
                <Link to="/insights">
                  <Button variant="ghost" size="sm" className="text-primary">
                    Ver todos ({atRiskContacts.length})
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
