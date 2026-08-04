import { useMemo, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Territory } from '@/hooks/useTerritories';

/** Approximate center coords and scale for each UF on a 600x700 viewBox */
const UF_PATHS: Record<string, { cx: number; cy: number; path: string }> = {
  AC: { cx: 95, cy: 370, path: 'M70,355 L120,355 120,385 70,385Z' },
  AM: { cx: 175, cy: 290, path: 'M110,240 L240,240 240,340 110,340Z' },
  RR: { cx: 175, cy: 200, path: 'M150,170 L200,170 200,230 150,230Z' },
  AP: { cx: 280, cy: 210, path: 'M260,180 L300,180 300,240 260,240Z' },
  PA: { cx: 290, cy: 300, path: 'M245,250 L340,250 340,350 245,350Z' },
  MA: { cx: 360, cy: 310, path: 'M340,280 L380,280 380,340 340,340Z' },
  TO: { cx: 335, cy: 385, path: 'M315,355 L355,355 355,415 315,415Z' },
  RO: { cx: 140, cy: 395, path: 'M115,375 L165,375 165,415 115,415Z' },
  MT: { cx: 225, cy: 405, path: 'M170,370 L280,370 280,440 170,440Z' },
  PI: { cx: 385, cy: 350, path: 'M370,320 L400,320 400,380 370,380Z' },
  CE: { cx: 420, cy: 310, path: 'M405,290 L440,290 440,335 405,335Z' },
  RN: { cx: 445, cy: 315, path: 'M435,305 L460,305 460,328 435,328Z' },
  PB: { cx: 450, cy: 335, path: 'M435,328 L465,328 465,345 435,345Z' },
  PE: { cx: 445, cy: 352, path: 'M420,345 L470,345 470,362 420,362Z' },
  AL: { cx: 455, cy: 370, path: 'M445,362 L470,362 470,380 445,380Z' },
  SE: { cx: 450, cy: 385, path: 'M440,378 L465,378 465,395 440,395Z' },
  BA: { cx: 400, cy: 420, path: 'M365,385 L440,385 440,465 365,465Z' },
  GO: { cx: 325, cy: 445, path: 'M295,425 L355,425 355,470 295,470Z' },
  DF: { cx: 340, cy: 438, path: 'M333,432 L347,432 347,445 333,445Z' },
  MS: { cx: 250, cy: 475, path: 'M220,450 L280,450 280,510 220,510Z' },
  MG: { cx: 385, cy: 485, path: 'M340,465 L430,465 430,510 340,510Z' },
  ES: { cx: 430, cy: 500, path: 'M420,485 L450,485 450,520 420,520Z' },
  RJ: { cx: 415, cy: 525, path: 'M395,515 L440,515 440,540 395,540Z' },
  SP: { cx: 345, cy: 525, path: 'M305,510 L390,510 390,545 305,545Z' },
  PR: { cx: 310, cy: 555, path: 'M275,545 L345,545 345,572 275,572Z' },
  SC: { cx: 315, cy: 580, path: 'M285,572 L345,572 345,595 285,595Z' },
  RS: { cx: 300, cy: 615, path: 'M260,595 L340,595 340,650 260,650Z' },
};

const TERRITORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(210 80% 55%)',
  'hsl(150 60% 45%)',
  'hsl(30 80% 55%)',
  'hsl(280 60% 55%)',
  'hsl(0 70% 55%)',
  'hsl(180 60% 45%)',
  'hsl(60 70% 45%)',
];

interface TerritoryMapProps {
  territories: Territory[];
  onTerritoryClick?: (territory: Territory) => void;
}

export function TerritoryMap({ territories, onTerritoryClick }: TerritoryMapProps) {
  const [hoveredUF, setHoveredUF] = useState<string | null>(null);

  /** Map each UF to its territory + color */
  const ufAssignment = useMemo(() => {
    const map: Record<string, { territory: Territory; color: string }> = {};
    territories.forEach((t, i) => {
      const states = t.state?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
      const color = TERRITORY_COLORS[i % TERRITORY_COLORS.length];
      states.forEach(uf => {
        map[uf] = { territory: t, color };
      });
    });
    return map;
  }, [territories]);

  return (
    <div className="w-full overflow-hidden rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Mapa de Territórios</h3>
      <svg viewBox="50 160 440 520" className="w-full max-w-md mx-auto" role="img" aria-label="Mapa do Brasil por territórios">
        {Object.entries(UF_PATHS).map(([uf, { path, cx, cy }]) => {
          const assignment = ufAssignment[uf];
          const isHovered = hoveredUF === uf;

          return (
            <Tooltip key={uf}>
              <TooltipTrigger asChild>
                <g
                  onMouseEnter={() => setHoveredUF(uf)}
                  onMouseLeave={() => setHoveredUF(null)}
                  onClick={() => assignment && onTerritoryClick?.(assignment.territory)}
                  className={assignment ? 'cursor-pointer' : 'cursor-default'}
                >
                  <path
                    d={path}
                    fill={assignment ? assignment.color : 'hsl(var(--muted))'}
                    stroke="hsl(var(--border))"
                    strokeWidth={isHovered ? 2 : 0.8}
                    opacity={isHovered ? 1 : 0.8}
                    className="transition-all duration-150"
                  />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-foreground text-[8px] font-medium pointer-events-none select-none"
                  >
                    {uf}
                  </text>
                </g>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-semibold">{uf}</p>
                {assignment ? (
                  <p className="text-muted-foreground">{assignment.territory.name}</p>
                ) : (
                  <p className="text-muted-foreground">Sem território</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </svg>
    </div>
  );
}
