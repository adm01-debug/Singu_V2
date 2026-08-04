import { useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Users, Building2, User, Star, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNetworkGraph, GraphNode, GraphLink } from '@/hooks/useNetworkGraph';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MorphingNumber } from '@/components/micro-interactions/MorphingNumber';
import { NetworkSelectedNodePanel } from './network-parts/NetworkSelectedNodePanel';

interface NetworkVisualizationProps { className?: string; height?: number; }

export const NetworkVisualization = ({ className, height = 600 }: NetworkVisualizationProps) => {
  const navigate = useNavigate();
  const graphRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [filters, setFilters] = useState({ showContacts: true, showCompanies: true, showYou: true });

  const { graphData, loading, error, selectedNode, setSelectedNode, stats, refetch } = useNetworkGraph();

  useEffect(() => {
    const updateDimensions = () => { if (containerRef.current) { const { width } = containerRef.current.getBoundingClientRect(); setDimensions({ width, height }); } };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  const filteredData = {
    nodes: graphData.nodes.filter(node => {
      if (node.type === 'contact' && !filters.showContacts) return false;
      if (node.type === 'company' && !filters.showCompanies) return false;
      if (node.type === 'you' && !filters.showYou) return false;
      return true;
    }),
    links: graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
      const sourceNode = graphData.nodes.find(n => n.id === sourceId);
      const targetNode = graphData.nodes.find(n => n.id === targetId);
      if (!sourceNode || !targetNode) return false;
      if (sourceNode.type === 'contact' && !filters.showContacts) return false;
      if (targetNode.type === 'contact' && !filters.showContacts) return false;
      if (sourceNode.type === 'company' && !filters.showCompanies) return false;
      if (targetNode.type === 'company' && !filters.showCompanies) return false;
      return true;
    }),
  };

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    if (graphRef.current) { graphRef.current.centerAt(node.x, node.y, 500); graphRef.current.zoom(2, 500); }
  }, [setSelectedNode]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    if (containerRef.current) containerRef.current.style.cursor = node ? 'pointer' : 'default';
  }, []);

  const handleNavigateToEntity = useCallback((node: GraphNode) => {
    if (node.type === 'contact') navigate(`/contatos/${node.id.replace('contact-', '')}`);
    else if (node.type === 'company') navigate(`/empresas/${node.id.replace('company-', '')}`);
  }, [navigate]);

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
  const handleCenter = () => graphRef.current?.centerAt(0, 0, 500);

  const nodeCanvasObject = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = Math.max(12 / globalScale, 3);
    const nodeRadius = node.val;

    ctx.beginPath();
    ctx.arc(node.x!, node.y!, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();

    if (selectedNode?.id === node.id || hoveredNode?.id === node.id) {
      ctx.strokeStyle = node.color; ctx.lineWidth = 3 / globalScale; ctx.stroke();
      ctx.beginPath(); ctx.arc(node.x!, node.y!, nodeRadius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = `${node.color}40`; ctx.lineWidth = 4 / globalScale; ctx.stroke();
    }

    ctx.beginPath(); ctx.fillStyle = 'white';
    if (node.type === 'company') { const iconSize = nodeRadius * 0.6; ctx.fillRect(node.x! - iconSize / 2, node.y! - iconSize / 2, iconSize, iconSize); }
    else if (node.type === 'you') { ctx.arc(node.x!, node.y!, nodeRadius * 0.4, 0, 2 * Math.PI); ctx.fill(); }
    else { ctx.arc(node.x!, node.y!, nodeRadius * 0.5, 0, 2 * Math.PI); ctx.fill(); }

    ctx.font = `${fontSize}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const textWidth = ctx.measureText(label).width;
    const padding = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(node.x! - textWidth / 2 - padding, node.y! + nodeRadius + 2, textWidth + padding * 2, fontSize + padding * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillText(label, node.x!, node.y! + nodeRadius + 4);
  }, [selectedNode, hoveredNode]);

  const linkColor = (link: GraphLink) => {
    if (link.type === 'works_at') return '#3b82f680';
    if (link.type === 'interacted') return '#3b82f680';
    return '#94a3b840';
  };

  if (loading) return (
    <Card className={cn('', className)}>
      <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Network Visualization</CardTitle></CardHeader>
      <CardContent><div className="space-y-4"><Skeleton className="w-full h-[400px] rounded-lg" /><div className="flex gap-4"><Skeleton className="h-20 flex-1" /><Skeleton className="h-20 flex-1" /><Skeleton className="h-20 flex-1" /></div></div></CardContent>
    </Card>
  );

  if (error) return (
    <Card className={cn('', className)}>
      <CardContent className="p-8 text-center"><p className="text-destructive mb-4">Erro ao carregar visualização: {error}</p><Button onClick={() => refetch()}>Tentar novamente</Button></CardContent>
    </Card>
  );

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Mapa de Relacionamentos</CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" />Filtros</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem checked={filters.showContacts} onCheckedChange={(c) => setFilters(f => ({ ...f, showContacts: c }))}><User className="w-4 h-4 mr-2" />Contatos</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={filters.showCompanies} onCheckedChange={(c) => setFilters(f => ({ ...f, showCompanies: c }))}><Building2 className="w-4 h-4 mr-2" />Empresas</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={filters.showYou} onCheckedChange={(c) => setFilters(f => ({ ...f, showYou: c }))}><Star className="w-4 h-4 mr-2" />Você</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Atualizar" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>Atualizar</TooltipContent></Tooltip></TooltipProvider>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { value: stats.totalNodes, label: 'Nós', cls: 'bg-info/10', textCls: 'text-info' },
            { value: stats.totalLinks, label: 'Conexões', cls: 'bg-primary/10', textCls: 'text-primary' },
            { value: stats.avgConnections, label: 'Média Conexões', cls: 'bg-success/10', textCls: 'text-success' },
            { value: stats.clusters, label: 'Clusters', cls: 'bg-warning/10', textCls: 'text-warning' },
          ].map(s => (
            <motion.div key={s.label} className={`p-3 rounded-lg ${s.cls} text-center`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <MorphingNumber value={s.value} className={`text-2xl font-bold ${s.textCls}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        <div ref={containerRef} className="w-full bg-gradient-to-br from-muted/50 to-muted rounded-b-lg overflow-hidden" style={{ height: `${height}px` }}>
          <ForceGraph2D
            ref={graphRef} graphData={filteredData} width={dimensions.width} height={dimensions.height}
            nodeLabel="" nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node, color, ctx) => { ctx.beginPath(); ctx.arc(node.x!, node.y!, node.val as number, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill(); }}
            linkColor={linkColor} linkWidth={(link) => (link as GraphLink).value}
            linkDirectionalParticles={2} linkDirectionalParticleWidth={2} linkDirectionalParticleSpeed={0.005}
            onNodeClick={(node) => handleNodeClick(node as GraphNode)} onNodeHover={(node) => handleNodeHover(node as GraphNode | null)}
            cooldownTime={2000} d3VelocityDecay={0.3} enableNodeDrag enableZoomInteraction enablePanInteraction
          />
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          {[{ icon: ZoomIn, fn: handleZoomIn, label: 'Zoom In' }, { icon: ZoomOut, fn: handleZoomOut, label: 'Zoom Out' }, { icon: Maximize2, fn: handleCenter, label: 'Centralizar' }].map(z => (
            <TooltipProvider key={z.label}><Tooltip><TooltipTrigger asChild><Button size="icon" variant="secondary" onClick={z.fn} aria-label={z.label} className="shadow-sm"><z.icon className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="left">{z.label}</TooltipContent></Tooltip></TooltipProvider>
          ))}
        </div>

        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-sm border">
          <p className="text-xs font-medium mb-2 text-muted-foreground">Legenda</p>
          <div className="space-y-1.5">
            {[{ color: 'bg-info', label: 'Você' }, { color: 'bg-primary', label: 'Empresas' }, { color: 'bg-success', label: 'Score Alto' }, { color: 'bg-warning', label: 'Score Médio' }, { color: 'bg-destructive', label: 'Score Baixo' }].map(l => (
              <div key={l.label} className="flex items-center gap-2 text-xs"><div className={`w-3 h-3 rounded-full ${l.color}`} /><span>{l.label}</span></div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selectedNode && selectedNode.type !== 'you' && (
            <NetworkSelectedNodePanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} onNavigate={handleNavigateToEntity} />
          )}
        </AnimatePresence>
      </CardContent>

      {stats.topInfluencers.length > 0 && (
        <div className="p-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-warning" />Principais Influenciadores</h4>
          <div className="flex flex-wrap gap-2">
            {stats.topInfluencers.map((influencer, index) => (
              <Badge key={influencer.id} variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => { const node = graphData.nodes.find(n => n.id === influencer.id); if (node) handleNodeClick(node); }}>
                <span className="mr-1">#{index + 1}</span>{influencer.name}<span className="ml-1 text-muted-foreground">({influencer.connections})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
