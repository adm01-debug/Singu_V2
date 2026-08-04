import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Eye, Bell, Target, AlertTriangle, TrendingUp, TrendingDown, Minus,
  ChevronRight, Shield, Zap, UserCheck, UserX, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StakeholderData } from '@/hooks/useStakeholderAnalysis';

const QUADRANT_CONFIG = {
  manage_closely: { label: 'Gerenciar de Perto', icon: Crown, color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/30', description: 'Alto poder e alto interesse - stakeholders críticos' },
  keep_satisfied: { label: 'Manter Satisfeito', icon: Shield, color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30', description: 'Alto poder, baixo interesse - evite frustrar' },
  keep_informed: { label: 'Manter Informado', icon: Bell, color: 'text-info', bgColor: 'bg-info/10', borderColor: 'border-info/30', description: 'Baixo poder, alto interesse - bons aliados' },
  monitor: { label: 'Monitorar', icon: Eye, color: 'text-muted-foreground', bgColor: 'bg-muted/50', borderColor: 'border-muted', description: 'Baixo poder e baixo interesse - verificar periodicamente' },
};

const RISK_COLORS = {
  low: 'bg-success/10 text-success border-success/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  high: 'bg-destructive/10 text-destructive border-destructive/30',
};

const SUPPORT_CONFIG = {
  champion: { icon: UserCheck, color: 'text-success', label: 'Champion' },
  supporter: { icon: TrendingUp, color: 'text-success', label: 'Apoiador' },
  neutral: { icon: Minus, color: 'text-muted-foreground', label: 'Neutro' },
  skeptic: { icon: TrendingDown, color: 'text-warning', label: 'Cético' },
  blocker: { icon: UserX, color: 'text-destructive', label: 'Bloqueador' },
};

function getSupportType(support: number): keyof typeof SUPPORT_CONFIG {
  if (support >= 4) return 'champion';
  if (support >= 1) return 'supporter';
  if (support >= -1) return 'neutral';
  if (support >= -3) return 'skeptic';
  return 'blocker';
}

const safeInitial = (value: unknown, fallback = '?') => String(value ?? fallback).charAt(0);

export function MetricBar({ value, max = 10, label, color }: { value: number; max?: number; label: string; color: string }) {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  );
}

export function StakeholderCard({ stakeholder, onClick }: { stakeholder: StakeholderData; onClick: () => void }) {
  const { contact, metrics, quadrant, riskLevel } = stakeholder;
  const config = QUADRANT_CONFIG[quadrant];
  const supportType = getSupportType(metrics.support);
  const supportConfig = SUPPORT_CONFIG[supportType];
  const SupportIcon = supportConfig.icon;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={onClick}>
      <Card className={`${config.bgColor} ${config.borderColor} border-2 transition-all hover:shadow-md`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 border-2 border-background">
              <AvatarImage src={contact.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">{safeInitial(contact.first_name)}{safeInitial(contact.last_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-sm truncate">{contact.first_name} {contact.last_name}</h4>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${RISK_COLORS[riskLevel]}`}>{riskLevel === 'high' ? 'Alto Risco' : riskLevel === 'medium' ? 'Médio' : 'Baixo'}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{contact.role_title}</p>
              <div className="flex items-center gap-2 mt-2">
                <TooltipProvider><Tooltip><TooltipTrigger asChild><div className={`flex items-center gap-0.5 ${supportConfig.color}`}><SupportIcon className="w-3.5 h-3.5" /><span className="text-xs font-medium">{supportConfig.label}</span></div></TooltipTrigger><TooltipContent><p>Nível de suporte: {metrics.support > 0 ? '+' : ''}{metrics.support}</p></TooltipContent></Tooltip></TooltipProvider>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Zap className="w-3 h-3" /><span>P:{metrics.power}</span><span>I:{metrics.interest}</span><span>In:{metrics.influence}</span></div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PowerInterestGrid({ stakeholders, onSelect }: { stakeholders: StakeholderData[]; onSelect: (s: StakeholderData) => void }) {
  const quadrants = useMemo(() => {
    const grouped: Record<string, StakeholderData[]> = { manage_closely: [], keep_satisfied: [], keep_informed: [], monitor: [] };
    stakeholders.forEach(s => { grouped[s.quadrant].push(s); });
    return grouped;
  }, [stakeholders]);

  const renderQuadrant = (key: keyof typeof QUADRANT_CONFIG, bgClass: string) => {
    const config = QUADRANT_CONFIG[key];
    const Icon = config.icon;
    return (
      <div className={`p-3 rounded-lg ${config.bgColor} ${config.borderColor} border min-h-[180px]`}>
        <div className="flex items-center gap-1.5 mb-2">
          <Icon className={`w-4 h-4 ${config.color}`} /><span className="text-xs font-medium">{config.label}</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">{quadrants[key].length}</Badge>
        </div>
        <div className="space-y-1.5">
          {quadrants[key].slice(0, 3).map(s => (
            <motion.button key={s.contact.id} className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-background/50 transition-colors text-left" onClick={() => onSelect(s)} whileHover={{ x: 2 }}>
              <Avatar className="w-6 h-6"><AvatarFallback className={`text-[10px] ${bgClass}`}>{safeInitial(s.contact.first_name)}{safeInitial(s.contact.last_name)}</AvatarFallback></Avatar>
              <span className="text-xs truncate">{s.contact.first_name}</span>
              {key === 'manage_closely' && s.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 text-destructive ml-auto" />}
            </motion.button>
          ))}
          {quadrants[key].length > 3 && <p className="text-[10px] text-muted-foreground text-center">+{quadrants[key].length - 3} mais</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2 relative">
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium whitespace-nowrap">PODER →</div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs text-muted-foreground font-medium">INTERESSE →</div>
      {renderQuadrant('keep_satisfied', 'bg-warning/20')}
      {renderQuadrant('manage_closely', 'bg-primary/20')}
      {renderQuadrant('monitor', 'bg-muted')}
      {renderQuadrant('keep_informed', 'bg-info/20')}
    </div>
  );
}

export function StakeholderDetail({ stakeholder, onClose }: { stakeholder: StakeholderData; onClose: () => void }) {
  const { contact, metrics, quadrant, strategyRecommendation, riskLevel } = stakeholder;
  const config = QUADRANT_CONFIG[quadrant];
  const QuadrantIcon = config.icon;
  const supportType = getSupportType(metrics.support);
  const supportConfig = SUPPORT_CONFIG[supportType];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 bg-background z-10 overflow-auto">
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={onClose} className="mb-3"><X className="w-4 h-4 mr-1" />Fechar</Button>
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16 border-2 border-primary/20"><AvatarImage src={contact.avatar_url || undefined} /><AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">{safeInitial(contact.first_name)}{safeInitial(contact.last_name)}</AvatarFallback></Avatar>
          <div>
            <h3 className="font-bold text-lg">{contact.first_name} {contact.last_name}</h3>
            <p className="text-muted-foreground text-sm">{contact.role_title}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor}`}><QuadrantIcon className="w-3 h-3 mr-1" />{config.label}</Badge>
              <Badge variant="outline" className={RISK_COLORS[riskLevel]}>{riskLevel === 'high' ? 'Alto Risco' : riskLevel === 'medium' ? 'Risco Médio' : 'Baixo Risco'}</Badge>
            </div>
          </div>
        </div>
        <Card className="mb-4"><CardHeader className="pb-2"><CardTitle className="text-sm">Métricas de Stakeholder</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <MetricBar value={metrics.power} label="Poder" color="bg-primary" />
            <MetricBar value={metrics.interest} label="Interesse" color="bg-info" />
            <MetricBar value={metrics.influence} label="Influência" color="bg-warning" />
            <MetricBar value={metrics.engagement} label="Engajamento" color="bg-success" />
            <div className="pt-2 border-t"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Posição</span><div className={`flex items-center gap-1 ${supportConfig.color}`}>{supportConfig.label}<span className="text-xs">({metrics.support > 0 ? '+' : ''}{metrics.support})</span></div></div></div>
          </CardContent>
        </Card>
        <Card className="mb-4"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Estratégia Recomendada</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{strategyRecommendation}</p></CardContent></Card>
        <Link to={`/contatos/${contact.id}`}><Button className="w-full">Ver Perfil Completo<ChevronRight className="w-4 h-4 ml-2" /></Button></Link>
      </div>
    </motion.div>
  );
}
