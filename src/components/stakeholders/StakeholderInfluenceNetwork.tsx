import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { StakeholderData } from '@/hooks/useStakeholderAnalysis';
import { NetworkNode, NetworkLink, QUADRANT_COLORS, SUPPORT_COLORS, getSupportType } from './stakeholder-network/NetworkHelpers';
import { SelectedNodePanel } from './stakeholder-network/SelectedNodePanel';

interface StakeholderInfluenceNetworkProps { stakeholders: StakeholderData[]; height?: number; className?: string; }

export function StakeholderInfluenceNetwork({ stakeholders, height = 400, className }: StakeholderInfluenceNetworkProps) {
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height });
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    const updateDimensions = () => { if (containerRef.current) { const { width } = containerRef.current.getBoundingClientRect(); setDimensions({ width, height }); } };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  const networkData = useMemo(() => {
    const nodes: NetworkNode[] = stakeholders.map(s => ({
      id: s.contact.id, name: `${s.contact.first_name} ${s.contact.last_name}`,
      val: 8 + s.metrics.influence * 1.5, color: SUPPORT_COLORS[getSupportType(s.metrics.support)],
      quadrant: s.quadrant, power: s.metrics.power, interest: s.metrics.interest,
      influence: s.metrics.influence, support: s.metrics.support, engagement: s.metrics.engagement,
      riskLevel: s.riskLevel, avatar: s.contact.avatar_url || undefined, role: s.contact.role_title || undefined,
    }));
    const links: NetworkLink[] = [];
    for (let i = 0; i < stakeholders.length; i++) {
      for (let j = i + 1; j < stakeholders.length; j++) {
        const s1 = stakeholders[i], s2 = stakeholders[j];
        const sameQuadrant = s1.quadrant === s2.quadrant ? 2 : 0;
        const influenceDiff = Math.abs(s1.metrics.influence - s2.metrics.influence);
        const supportDiff = Math.abs(s1.metrics.support - s2.metrics.support);
        if (s1.metrics.influence >= 7 && s2.metrics.influence >= 7)
          links.push({ source: s1.contact.id, target: s2.contact.id, value: 3, type: 'influence', strength: (s1.metrics.influence + s2.metrics.influence) / 2 });
        else if (sameQuadrant && influenceDiff <= 3)
          links.push({ source: s1.contact.id, target: s2.contact.id, value: 1.5, type: 'collaboration', strength: sameQuadrant + (10 - influenceDiff) / 5 });
        else if ((getSupportType(s1.metrics.support) === 'champion' && getSupportType(s2.metrics.support) === 'blocker') || (getSupportType(s1.metrics.support) === 'blocker' && getSupportType(s2.metrics.support) === 'champion'))
          links.push({ source: s1.contact.id, target: s2.contact.id, value: 2, type: 'conflict', strength: supportDiff });
        else if (s1.metrics.power >= 7 && s2.metrics.interest >= 7)
          links.push({ source: s1.contact.id, target: s2.contact.id, value: 1, type: 'influence', strength: (s1.metrics.power + s2.metrics.interest) / 4 });
        else if (s2.metrics.power >= 7 && s1.metrics.interest >= 7)
          links.push({ source: s2.contact.id, target: s1.contact.id, value: 1, type: 'influence', strength: (s2.metrics.power + s1.metrics.interest) / 4 });
      }
    }
    return { nodes, links };
  }, [stakeholders]);

  const handleNodeClick = useCallback((node: NetworkNode) => {
    setSelectedNode(node);
    if (graphRef.current) { graphRef.current.centerAt(node.x, node.y, 500); graphRef.current.zoom(2.5, 500); }
  }, []);

  const handleNodeHover = useCallback((node: NetworkNode | null) => {
    setHoveredNode(node);
    if (containerRef.current) containerRef.current.style.cursor = node ? 'pointer' : 'default';
  }, []);

  const nodeCanvasObject = useCallback((node: NetworkNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name.split(' ')[0];
    const fontSize = Math.max(10 / globalScale, 3);
    const nodeRadius = node.val;
    ctx.beginPath(); ctx.arc(node.x!, node.y!, nodeRadius + 3, 0, 2 * Math.PI);
    ctx.strokeStyle = QUADRANT_COLORS[node.quadrant as keyof typeof QUADRANT_COLORS] || '#94a3b8';
    ctx.lineWidth = 2 / globalScale; ctx.stroke();
    ctx.beginPath(); ctx.arc(node.x!, node.y!, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = node.color; ctx.fill();
    if (selectedNode?.id === node.id || hoveredNode?.id === node.id) {
      ctx.beginPath(); ctx.arc(node.x!, node.y!, nodeRadius + 8, 0, 2 * Math.PI);
      ctx.strokeStyle = `${node.color}60`; ctx.lineWidth = 4 / globalScale; ctx.stroke();
    }
    const influenceRadius = (node.influence / 10) * nodeRadius * 0.6;
    ctx.beginPath(); ctx.arc(node.x!, node.y!, influenceRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.fill();
    ctx.font = `${fontSize}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const textWidth = ctx.measureText(label).width; const padding = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(node.x! - textWidth / 2 - padding, node.y! + nodeRadius + 2, textWidth + padding * 2, fontSize + padding * 2);
    ctx.fillStyle = '#1e293b'; ctx.fillText(label, node.x!, node.y! + nodeRadius + 4);
  }, [selectedNode, hoveredNode]);

  const linkColor = useCallback((link: NetworkLink) => {
    if (link.type === 'influence') return '#3b82f680';
    if (link.type === 'collaboration') return '#22c55e60';
    if (link.type === 'conflict') return '#ef444460';
    return '#94a3b840';
  }, []);

  if (stakeholders.length === 0) return <div className={cn('flex items-center justify-center h-64 text-muted-foreground', className)}><p>Nenhum stakeholder para visualizar</p></div>;

  return (
    <div className={cn('relative', className)}>
      <div ref={containerRef} className="w-full bg-gradient-to-br from-muted/30 to-muted/50 dark:from-muted/10 dark:to-muted/20 rounded-lg overflow-hidden" style={{ height: `${height}px` }}>
        <ForceGraph2D ref={graphRef} graphData={networkData} width={dimensions.width} height={dimensions.height} nodeLabel=""
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node, color, ctx) => { ctx.beginPath(); ctx.arc(node.x!, node.y!, node.val as number, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill(); }}
          linkColor={linkColor as () => string} linkWidth={(link) => (link as NetworkLink).value}
          linkDirectionalParticles={2} linkDirectionalParticleWidth={2} linkDirectionalParticleSpeed={0.008}
          onNodeClick={(node) => handleNodeClick(node as NetworkNode)} onNodeHover={(node) => handleNodeHover(node as NetworkNode | null)}
          cooldownTime={2000} d3VelocityDecay={0.4} enableNodeDrag enableZoomInteraction enablePanInteraction />
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        {[{ icon: ZoomIn, action: () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300), tip: 'Zoom In' },
          { icon: ZoomOut, action: () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300), tip: 'Zoom Out' },
          { icon: Maximize2, action: () => graphRef.current?.centerAt(0, 0, 500), tip: 'Centralizar' }
        ].map(({ icon: Icon, action, tip }) => (
          <TooltipProvider key={tip}><Tooltip><TooltipTrigger asChild><Button size="icon" variant="secondary" onClick={action} aria-label={tip} className="h-8 w-8 shadow-md"><Icon className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="left">{tip}</TooltipContent></Tooltip></TooltipProvider>
        ))}
      </div>

      <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm p-2 rounded-lg shadow-md border text-xs">
        <p className="font-medium mb-1.5 text-muted-foreground">Legenda</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[{ color: '#22c55e', label: 'Champion' }, { color: '#84cc16', label: 'Apoiador' }, { color: '#94a3b8', label: 'Neutro' }, { color: '#f97316', label: 'Cético' }, { color: '#ef4444', label: 'Bloqueador' }].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} /><span>{label}</span></div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t space-y-1">
          {[{ color: '#3b82f680', label: 'Influência' }, { color: '#22c55e60', label: 'Colaboração' }, { color: '#ef444460', label: 'Conflito' }].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5"><div className="w-6 h-0.5" style={{ backgroundColor: color }} /><span>{label}</span></div>
          ))}
        </div>
      </div>

      <AnimatePresence>{selectedNode && <SelectedNodePanel node={selectedNode} onClose={() => setSelectedNode(null)} />}</AnimatePresence>
    </div>
  );
}
