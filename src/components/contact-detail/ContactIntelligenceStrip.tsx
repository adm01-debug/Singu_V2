import { Brain, Target, MessageSquare, Shield, Bell, Calendar, FlaskConical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ContactView360 } from '@/hooks/useContactView360';

export function ContactIntelligenceStrip({ view360 }: { view360: ContactView360 }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {view360.disc_primary && (
        <Badge variant="outline" className="text-[10px] gap-1">
          <Brain className="h-3 w-3" />
          DISC: {view360.disc_primary}{view360.disc_secondary ? `/${view360.disc_secondary}` : ''}
          {view360.disc_confidence ? ` (${view360.disc_confidence}%)` : ''}
        </Badge>
      )}
      {view360.eq_score != null && (
        <Badge variant="outline" className="text-[10px] gap-1">
          <Target className="h-3 w-3" />
          EQ: {view360.eq_score}{view360.eq_level ? ` (${view360.eq_level})` : ''}
        </Badge>
      )}
      {view360.interaction_count != null && view360.interaction_count > 0 && (
        <Badge variant="outline" className="text-[10px] gap-1">
          <MessageSquare className="h-3 w-3" />
          {view360.interaction_count} interações
        </Badge>
      )}
      {view360.open_objections != null && view360.open_objections > 0 && (
        <Badge variant="outline" className="text-[10px] gap-1 border-warning text-warning">
          <Shield className="h-3 w-3" />
          {view360.open_objections} objeções abertas
        </Badge>
      )}
      {view360.pending_health_alerts != null && view360.pending_health_alerts > 0 && (
        <Badge variant="outline" className="text-[10px] gap-1 border-destructive text-destructive">
          <Bell className="h-3 w-3" />
          {view360.pending_health_alerts} alertas
        </Badge>
      )}
      {view360.cadence_days != null && (
        <Badge variant="outline" className="text-[10px] gap-1">
          <Calendar className="h-3 w-3" />
          Cadência: {view360.cadence_days}d
        </Badge>
      )}
      <Badge variant="secondary" className="text-[10px] gap-1 bg-purple-500/10 text-purple-600 border-purple-200">
        <FlaskConical className="h-3 w-3" />
        Neuromarketing: Límbico Dominante
      </Badge>
    </div>
  );
}
