import { ShieldCheck, Shield, ShieldAlert, TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';

export function getRiskColor(level: string) {
  switch (level) {
    case 'critical': return 'text-destructive';
    case 'high': return 'text-warning';
    case 'medium': return 'text-warning';
    default: return 'text-success';
  }
}

export function getRiskBgColor(level: string) {
  switch (level) {
    case 'critical': return 'bg-destructive/10 border-destructive/30';
    case 'high': return 'bg-warning/10 border-warning/30';
    case 'medium': return 'bg-warning/10 border-warning/30';
    default: return 'bg-success/10 border-success/30';
  }
}

export function getRiskBadgeColor(level: string) {
  switch (level) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high': return 'bg-warning text-warning-foreground';
    case 'medium': return 'bg-warning text-warning-foreground';
    default: return 'bg-success text-success-foreground';
  }
}

export function getRiskLabel(level: string) {
  switch (level) {
    case 'critical': return 'Crítico';
    case 'high': return 'Alto';
    case 'medium': return 'Médio';
    default: return 'Baixo';
  }
}

export function getHealthIcon(score: number) {
  if (score >= 70) return <ShieldCheck className="h-5 w-5 text-success" />;
  if (score >= 40) return <Shield className="h-5 w-5 text-warning" />;
  return <ShieldAlert className="h-5 w-5 text-destructive" />;
}

export function getTrendIcon(trend: string) {
  switch (trend) {
    case 'improving': return <TrendingUp className="h-4 w-4 text-success" />;
    case 'declining': return <TrendingDown className="h-4 w-4 text-warning" />;
    case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default: return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

export function getStakeholderIcon(type: string) {
  switch (type) {
    case 'champion': return '🌟';
    case 'supporter': return '👍';
    case 'neutral': return '😐';
    case 'blocker': return '🚫';
    default: return '❓';
  }
}
