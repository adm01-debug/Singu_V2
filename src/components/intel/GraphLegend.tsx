interface LegendItem {
  label: string;
  color: string;
  count?: number;
}

interface GraphLegendProps {
  items: LegendItem[];
  title?: string;
}

/**
 * Legenda flutuante para o NetworkVisualization. Mostra cores por tipo + contagem.
 */
export const GraphLegend = ({ items, title = 'LEGENDA' }: GraphLegendProps) => {
  return (
    <div
      className="absolute top-2 right-2 z-10 intel-card px-2.5 py-1.5 backdrop-blur bg-[hsl(var(--intel-bg)/0.85)] pointer-events-none"
      role="note"
      aria-label="Legenda do grafo"
    >
      <div className="intel-eyebrow mb-1">{title}</div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 intel-mono text-[10px]">
            <span
              className="h-2 w-2 rounded-sm shrink-0"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="text-foreground">{item.label}</span>
            {typeof item.count === 'number' && (
              <span className="text-muted-foreground ml-auto">{item.count}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
