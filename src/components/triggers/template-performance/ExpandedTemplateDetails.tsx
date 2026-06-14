import { motion } from 'framer-motion';
import { TrendingDown, Minus, Target, Users, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DISCProfile } from '@/types';

interface TemplateDetailData {
  successCount: number;
  neutralCount: number;
  failureCount: number;
  lastUsed: string | null;
  totalUsages: number;
  discPerformance: Record<DISCProfile, { usages: number; successRate: number }>;
  templateText: string;
}

const discLabels: Record<DISCProfile, string> = {
  D: 'Dominante', I: 'Influente', S: 'Estável', C: 'Analítico',
};

const discColors: Record<DISCProfile, string> = {
  D: 'bg-destructive text-destructive border-destructive',
  I: 'bg-warning text-warning border-warning',
  S: 'bg-success text-success border-success',
  C: 'bg-info text-info border-info',
};

function formatDate(date: string | null) {
  if (!date) return 'Nunca usado';
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function ExpandedTemplateDetails({ data }: { data: TemplateDetailData }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="p-4 bg-muted/20 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 text-success mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Sucesso</span>
            </div>
            <p className="text-xl font-bold">{data.successCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 text-warning mb-1">
              <Minus className="w-4 h-4" />
              <span className="text-xs font-medium">Neutro</span>
            </div>
            <p className="text-xl font-bold">{data.neutralCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium">Falha</span>
            </div>
            <p className="text-xl font-bold">{data.failureCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Último Uso</span>
            </div>
            <p className="text-sm font-medium">{formatDate(data.lastUsed)}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Performance por Perfil DISC
          </p>
          <div className="flex flex-wrap gap-2">
            {(['D', 'I', 'S', 'C'] as DISCProfile[]).map(disc => (
              <Badge key={disc} variant="outline" className={cn('gap-1.5', discColors[disc])}>
                <span className="font-bold">{disc}</span>
                <span className="text-xs">{discLabels[disc]}</span>
                {data.totalUsages > 0 && (
                  <span className="ml-1 text-xs opacity-70">{data.discPerformance[disc].successRate.toFixed(0)}%</span>
                )}
              </Badge>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-background border">
          <p className="text-xs text-muted-foreground mb-1">Prévia:</p>
          <p className="text-sm line-clamp-2">{data.templateText}</p>
        </div>
      </div>
    </motion.div>
  );
}
