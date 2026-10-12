import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackButton } from './BackButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BreadcrumbSegment {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  /** Back button destination. If omitted, uses navigation stack. */
  backTo?: string;
  backFallback?: string;
  /** Back button label. Defaults to parent breadcrumb label or "Voltar". */
  backLabel?: string;
  /** Breadcrumb segments (excluding current page). */
  breadcrumbs?: BreadcrumbSegment[];
  /** Current page title shown as last breadcrumb. */
  title: string;
  /** Actions rendered on the right side. */
  actions?: ReactNode;
  /** Back button variant */
  backVariant?: 'default' | 'ghost' | 'overlay';
  /** Additional classes */
  className?: string;
}

/**
 * Unified page header — single source of truth for navigation:
 * - Smart back button (left) with internal navigation stack
 * - Breadcrumb trail: full on desktop, collapsed on mobile
 * - Action buttons (right)
 * - Contextual aria-labels for accessibility
 */
export function PageHeader({
  backTo,
  backFallback,
  backLabel,
  breadcrumbs = [],
  title,
  actions,
  backVariant = 'ghost',
  className,
}: PageHeaderProps) {
  const resolvedBackLabel = backLabel || (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Voltar');

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      {/* Left: Back + Breadcrumbs */}
      <nav aria-label="Navegação de contexto" className="hidden md:flex items-center gap-1 min-w-0">
        <BackButton
          to={backTo}
          fallback={backFallback}
          label={resolvedBackLabel}
          variant={backVariant}
          showLabelOnMobile={breadcrumbs.length === 0}
        />

        {/* Desktop breadcrumbs — full trail */}
        {breadcrumbs.length > 0 && (
          <ol className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((segment, index) => (
              <li key={segment.path || index} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                {segment.path ? (
                  <Link
                    to={segment.path}
                    className="hover:text-foreground transition-colors truncate max-w-[200px]"
                  >
                    {segment.label}
                  </Link>
                ) : (
                  <span className="truncate max-w-[200px]">{segment.label}</span>
                )}
              </li>
            ))}
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" aria-hidden="true" />
              <span className="font-medium text-foreground truncate max-w-[250px]" aria-current="page">
                {title}
              </span>
            </li>
          </ol>
        )}

        {/* Mobile breadcrumbs — collapsed with dropdown for intermediate segments */}
        {breadcrumbs.length > 0 && (
          <div className="sm:hidden flex items-center gap-1 text-sm min-w-0">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" aria-hidden="true" />
            
            {breadcrumbs.length > 1 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex items-center justify-center h-6 w-6 rounded hover:bg-muted transition-colors"
                    aria-label="Mostrar navegação completa"
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {breadcrumbs.map((segment, index) => (
                      <DropdownMenuItem key={segment.path || index} asChild={!!segment.path}>
                        {segment.path ? (
                          <Link to={segment.path}>{segment.label}</Link>
                        ) : (
                          <span>{segment.label}</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" aria-hidden="true" />
              </>
            )}

            <span className="font-medium text-foreground truncate max-w-[180px]" aria-current="page">
              {title}
            </span>
          </div>
        )}
      </nav>

      {/* Right: Actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
