import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company } from '@/hooks/useCompanies';

interface CompanyGroup {
  name: string;
  companies: Company[];
}

/**
 * Groups companies by grupo_economico. Companies without a group go into "Sem grupo".
 * Only creates groups when there are 2+ companies in a group.
 */
export function useCompanyGroups(companies: Company[]): {
  groups: CompanyGroup[];
  hasGroups: boolean;
} {
  return useMemo(() => {
    const map = new Map<string, Company[]>();
    const ungrouped: Company[] = [];

    for (const c of companies) {
      const group = c.grupo_economico?.trim();
      if (group) {
        if (!map.has(group)) map.set(group, []);
        map.get(group)!.push(c);
      } else {
        ungrouped.push(c);
      }
    }

    const groups: CompanyGroup[] = [];

    // Only show groups that have 2+ companies
    for (const [name, items] of map) {
      if (items.length >= 2) {
        groups.push({ name, companies: items });
      } else {
        ungrouped.push(...items);
      }
    }

    // Sort groups by size descending
    groups.sort((a, b) => b.companies.length - a.companies.length);

    if (ungrouped.length > 0) {
      groups.push({ name: '', companies: ungrouped });
    }

    return { groups, hasGroups: groups.some(g => g.name !== '') };
  }, [companies]);
}

interface GroupHeaderProps {
  name: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function GroupHeader({ name, count, isExpanded, onToggle }: GroupHeaderProps) {
  if (!name) return null;

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-muted/20 border border-border/20 hover:bg-muted/30 transition-colors',
        'text-sm text-muted-foreground'
      )}
    >
      {isExpanded ? (
        <ChevronDown className="w-4 h-4 shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 shrink-0" />
      )}
      <Network className="w-3.5 h-3.5 text-primary/60 shrink-0" />
      <span className="font-medium text-foreground/80">{name}</span>
      <span className="text-[11px] text-muted-foreground/70 tabular-nums">
        ({count} {count === 1 ? 'empresa' : 'empresas'})
      </span>
    </button>
  );
}

export function useGroupExpansion(groups: CompanyGroup[]) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const isExpanded = (name: string) => !collapsed.has(name);

  return { toggle, isExpanded };
}
