import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
}

interface FiscalDataCardProps {
  data: Record<string, unknown>;
}

export function FiscalDataCard({ data }: FiscalDataCardProps) {
  const c = data;
  if (!c.cnpj && !c.razao_social && !c.situacao_rf && !c.natureza_juridica_desc && !c.capital_social) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Dados Fiscais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {c.cnpj && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CNPJ</span>
              <span className="text-sm font-mono">{formatCnpj(String(c.cnpj))}</span>
            </div>
          )}
          {c.razao_social && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm text-muted-foreground flex-shrink-0">Razão Social</span>
              <span className="text-sm text-right">{String(c.razao_social)}</span>
            </div>
          )}
          {c.situacao_rf && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Situação RF</span>
              <Badge variant={c.situacao_rf === 'ATIVA' ? 'default' : 'destructive'} className="text-xs">
                {String(c.situacao_rf)}
              </Badge>
            </div>
          )}
          {c.natureza_juridica_desc && (
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm text-muted-foreground flex-shrink-0">Nat. Jurídica</span>
              <span className="text-sm text-right">{String(c.natureza_juridica_desc)}</span>
            </div>
          )}
          {c.porte_rf && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Porte</span>
              <Badge variant="outline" className="text-xs">{String(c.porte_rf)}</Badge>
            </div>
          )}
          {c.capital_social && Number(c.capital_social) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Capital Social</span>
              <span className="text-sm font-medium">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(c.capital_social))}
              </span>
            </div>
          )}
          {c.data_fundacao && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fundação</span>
              <span className="text-sm">{String(c.data_fundacao)}</span>
            </div>
          )}
          {c.inscricao_estadual && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">IE</span>
              <span className="text-sm font-mono">{String(c.inscricao_estadual)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
