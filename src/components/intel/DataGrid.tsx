import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  mono?: boolean;
  width?: string;
  render?: (row: T) => ReactNode;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T, event?: React.MouseEvent) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataGrid<T extends Record<string, unknown>>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyMessage = 'NO_DATA',
  className,
}: DataGridProps<T>) {
  if (rows.length === 0) {
    return (
      <div className={cn('intel-card p-6 text-center', className)}>
        <span className="intel-mono text-xs text-muted-foreground">
          ── {emptyMessage} ──
        </span>
      </div>
    );
  }

  return (
    <div className={cn('intel-card overflow-x-auto', className)}>
      <table className="w-full text-xs">
        <thead className="bg-muted/40 border-b border-border sticky top-0">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-3 py-2 intel-eyebrow font-medium"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={getRowKey(row)}
              onClick={(e) => onRowClick?.(row, e)}
              className={cn(
                'border-b border-border/50 transition-colors',
                idx % 2 === 1 && 'bg-muted/10',
                onRowClick && 'cursor-pointer hover:bg-[hsl(var(--intel-accent)/0.08)]'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-3 py-2 align-middle',
                    col.mono && 'intel-mono text-foreground'
                  )}
                >
                  {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
