import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle2, Target, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AccountChurnRisk } from '@/hooks/useAccountChurnPrediction';
import { getRiskColor, getRiskBgColor, getRiskBadgeColor, getRiskLabel, getStakeholderIcon } from './ChurnHelpers';

interface ChurnSingleAccountViewProps {
  account: AccountChurnRisk;
}

export function ChurnSingleAccountView({ account }: ChurnSingleAccountViewProps) {
  return (
    <Card className={cn("border", getRiskBgColor(account.riskLevel))}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn("h-5 w-5", getRiskColor(account.riskLevel))} />
            <CardTitle className="text-lg">Risco de Churn da Conta</CardTitle>
          </div>
          <Badge className={cn(getRiskBadgeColor(account.riskLevel))}>{getRiskLabel(account.riskLevel)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-2">
              <span className={cn("text-4xl font-bold", getRiskColor(account.riskLevel))}>{account.riskScore}%</span>
              <span className="text-muted-foreground text-sm">risco de churn</span>
            </div>
            <Progress value={account.riskScore} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1">Confiança: {account.confidenceLevel}%</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-success/10">
            <div className="text-2xl font-bold text-success">{account.championCount}</div>
            <div className="text-xs text-muted-foreground">Champions</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-muted-foreground">{account.neutralCount}</div>
            <div className="text-xs text-muted-foreground">Neutros</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <div className="text-2xl font-bold text-destructive">{account.blockerCount}</div>
            <div className="text-xs text-muted-foreground">Bloqueadores</div>
          </div>
        </div>

        {account.riskFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2"><AlertCircle className="h-4 w-4 text-warning" />Fatores de Risco</h4>
            <div className="space-y-2">
              {account.riskFactors.map((factor, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <span>{factor.icon}</span>
                    <div><p className="text-sm font-medium">{factor.factor}</p><p className="text-xs text-muted-foreground">{factor.description}</p></div>
                  </div>
                  <Badge variant="outline" className="text-xs">+{factor.impact}%</Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Ações Recomendadas</h4>
          <ul className="space-y-1">
            {account.recommendedActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span>{action}</span></li>
            ))}
          </ul>
        </div>

        {account.contacts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" />Stakeholders ({account.contacts.length})</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {account.contacts.map((contact) => (
                <Link key={contact.contactId} to={`/contatos/${contact.contactId}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span>{getStakeholderIcon(contact.stakeholderType)}</span>
                    <div><p className="text-sm font-medium">{contact.contactName}</p>{contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}</div>
                  </div>
                  {contact.recentAlertCount > 0 && <Badge variant="destructive" className="text-xs">{contact.recentAlertCount} alertas</Badge>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
