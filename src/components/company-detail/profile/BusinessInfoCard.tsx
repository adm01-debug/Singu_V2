import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, DollarSign, Target, Shield, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Tables } from '@/integrations/supabase/types';

type Company = Tables<'companies'>;

interface BusinessInfoCardProps {
  company: Company;
}

export function BusinessInfoCard({ company }: BusinessInfoCardProps) {
  const c = company as Record<string, unknown>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            Informações do Negócio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {company.financial_health && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-success" />
                Saúde Financeira
              </span>
              <Badge variant="outline" className="text-xs capitalize">{company.financial_health}</Badge>
            </div>
          )}
          {c.ramo_atividade && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ramo</span>
              <span className="text-sm truncate max-w-[150px] text-right">{String(c.ramo_atividade)}</span>
            </div>
          )}
          {c.nicho_cliente && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nicho</span>
              <Badge variant="outline" className="text-xs">{String(c.nicho_cliente)}</Badge>
            </div>
          )}
          {c.grupo_economico && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Grupo Econômico</span>
              <span className="text-sm">{String(c.grupo_economico)}</span>
            </div>
          )}
          {c.tipo_cooperativa && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tipo Cooperativa</span>
              <Badge variant="outline" className="text-xs">{String(c.tipo_cooperativa)}</Badge>
            </div>
          )}
          {c.is_matriz !== null && c.is_matriz !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tipo</span>
              <Badge variant="outline" className="text-xs">{c.is_matriz ? 'Matriz' : 'Filial'}</Badge>
            </div>
          )}
          {company.employee_count && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Funcionários</span>
              <Badge variant="outline">{company.employee_count}</Badge>
            </div>
          )}
          {company.annual_revenue && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Faturamento</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {company.annual_revenue}
              </Badge>
            </div>
          )}
          {company.challenges && company.challenges.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                <Target className="w-3 h-3" />
                Desafios
              </span>
              <div className="flex flex-wrap gap-1.5">
                {company.challenges.map((challenge, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{challenge}</Badge>
                ))}
              </div>
            </div>
          )}
          {company.competitors && company.competitors.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                <Shield className="w-3 h-3" />
                Concorrentes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {company.competitors.map((competitor, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">{competitor}</Badge>
                ))}
              </div>
            </div>
          )}
          {company.notes && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
