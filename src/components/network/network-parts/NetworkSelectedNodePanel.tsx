import { motion } from 'framer-motion';
import { X, ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { cn } from '@/lib/utils';
import { GraphNode } from '@/hooks/useNetworkGraph';

interface NetworkSelectedNodePanelProps {
  selectedNode: GraphNode;
  onClose: () => void;
  onNavigate: (node: GraphNode) => void;
}

export function NetworkSelectedNodePanel({ selectedNode, onClose, onNavigate }: NetworkSelectedNodePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 w-72 bg-background/95 backdrop-blur-sm rounded-lg shadow-sm border p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <OptimizedAvatar
            src={selectedNode.avatar}
            alt={selectedNode.name}
            fallback={selectedNode.name.substring(0, 2).toUpperCase()}
            size="md"
            className={cn(selectedNode.type === 'company' ? 'ring-2 ring-primary/50' : 'ring-2 ring-info/50')}
          />
          <div>
            <h4 className="font-semibold text-foreground">{selectedNode.name}</h4>
            <Badge variant="outline" className="text-xs">{selectedNode.type === 'company' ? 'Empresa' : 'Contato'}</Badge>
          </div>
        </div>
        <Button size="icon" variant="ghost" aria-label="Fechar" className="h-6 w-6" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="space-y-2 mb-4">
        {selectedNode.role && <p className="text-sm text-muted-foreground"><span className="font-medium">Função:</span> {selectedNode.role}</p>}
        {selectedNode.industry && <p className="text-sm text-muted-foreground"><span className="font-medium">Setor:</span> {selectedNode.industry}</p>}
        {selectedNode.relationshipScore !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Score:</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', selectedNode.relationshipScore >= 70 ? 'bg-success' : selectedNode.relationshipScore >= 40 ? 'bg-warning' : 'bg-destructive')}
                style={{ width: `${selectedNode.relationshipScore}%` }}
              />
            </div>
            <span className="text-sm font-bold">{selectedNode.relationshipScore}%</span>
          </div>
        )}
        {selectedNode.interactionCount !== undefined && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {selectedNode.interactionCount === 1 ? '1 interação' : `${selectedNode.interactionCount} interações`}
          </p>
        )}
      </div>

      <Button className="w-full" size="sm" onClick={() => onNavigate(selectedNode)}>
        <ExternalLink className="w-4 h-4 mr-2" /> Ver Detalhes
      </Button>
    </motion.div>
  );
}
