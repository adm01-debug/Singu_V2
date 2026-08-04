import { motion } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NetworkNode, QUADRANT_COLORS, getQuadrantLabel, getQuadrantIcon, getSupportLabel, getSupportIcon } from './NetworkHelpers';

interface SelectedNodePanelProps {
  node: NetworkNode;
  onClose: () => void;
}

export function SelectedNodePanel({ node, onClose }: SelectedNodePanelProps) {
  const QuadrantIcon = getQuadrantIcon(node.quadrant);
  const SupportIcon = getSupportIcon(node.support);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-3 right-3 w-64 bg-background/95 backdrop-blur-sm rounded-lg shadow-sm border p-3"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <OptimizedAvatar
            src={node.avatar}
            alt={node.name}
            fallback={node.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            size="sm"
            className="w-10 h-10 border-2"
          />
          <div>
            <h4 className="font-semibold text-sm">{node.name}</h4>
            {node.role && <p className="text-xs text-muted-foreground truncate">{node.role}</p>}
          </div>
        </div>
        <Button size="icon" variant="ghost" aria-label="Fechar" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px]" style={{ borderColor: QUADRANT_COLORS[node.quadrant as keyof typeof QUADRANT_COLORS], color: QUADRANT_COLORS[node.quadrant as keyof typeof QUADRANT_COLORS] }}>
            <QuadrantIcon className="w-3 h-3 mr-1" />{getQuadrantLabel(node.quadrant)}
          </Badge>
          <Badge variant="outline" className="text-[10px]" style={{ borderColor: node.color, color: node.color }}>
            <SupportIcon className="w-3 h-3 mr-1" />{getSupportLabel(node.support)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Poder:</span><span className="font-medium">{node.power}/10</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Interesse:</span><span className="font-medium">{node.interest}/10</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Influência:</span><span className="font-medium">{node.influence}/10</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Engajamento:</span><span className="font-medium">{node.engagement}/10</span></div>
        </div>

        {node.riskLevel !== 'low' && (
          <Badge variant="outline" className={cn('text-[10px] w-full justify-center',
            node.riskLevel === 'high' ? 'border-destructive/50 text-destructive bg-destructive/10' : 'border-warning/50 text-warning bg-warning/10'
          )}>
            {node.riskLevel === 'high' ? 'Alto Risco' : 'Risco Médio'}
          </Badge>
        )}
      </div>

      <Link to={`/contatos/${node.id}`}>
        <Button variant="outline" size="sm" className="w-full text-xs">
          <ExternalLink className="w-3 h-3 mr-1" />Ver Perfil
        </Button>
      </Link>
    </motion.div>
  );
}
